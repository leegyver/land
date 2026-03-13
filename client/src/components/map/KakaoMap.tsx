
import { useEffect, useRef, useState } from 'react';
import { Property } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

interface KakaoMapProps {
  zoom?: number;
  properties?: Property[];
  singleProperty?: Property;
}

const KakaoMap = ({ zoom = 8, properties: externalProperties, singleProperty }: KakaoMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 데이터 가져오기 (props가 없을 경우 대비)
  const { data: fetchedProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !singleProperty && !externalProperties
  });

  const properties = singleProperty ? [singleProperty] : (externalProperties || fetchedProperties || []);

  // 1. 지도 인스턴스 초기화 (최초 1회)
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    let isMounted = true;

    const initMap = () => {
      if (!isMounted || !mapContainer.current || mapInstance.current) return;

      console.log("KakaoMap: 엔진 초기화");
      const options = {
        center: new window.kakao.maps.LatLng(37.7466, 126.4881),
        level: zoom,
        draggable: true,
        scrollwheel: true
      };

      try {
        const map = new window.kakao.maps.Map(mapContainer.current, options);
        mapInstance.current = map;
        setIsMapLoaded(true);

        setTimeout(() => {
          if (map && isMounted) {
            map.relayout();
            map.setCenter(options.center);
          }
        }, 100);
      } catch (err) {
        console.error("KakaoMap: 생성 실패, 재시도", err);
        setTimeout(initMap, 500);
      }
    };

    const loadKakao = () => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(initMap);
      } else {
        setTimeout(loadKakao, 100);
      }
    };

    loadKakao();

    return () => {
      isMounted = false;
    };
  }, []); // 마운트 시 최초 1회만 실행

  // 2. 마커 렌더링 로직 (데이터 변경 시)
  useEffect(() => {
    const map = mapInstance.current;
    if (!isMapLoaded || !map || !properties) return;

    // 기존 마커 클린업
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];

    console.log(`KakaoMap: ${properties.length}개 마커 렌더링`);

    const geocoder = new window.kakao.maps.services.Geocoder();
    const bounds = new window.kakao.maps.LatLngBounds();
    let isMounted = true;
    let processedCount = 0;

    if (properties.length === 0) return;

    properties.forEach((prop) => {
      const addMarker = (coords: any) => {
        if (!isMounted || !mapInstance.current) return;

        console.log(`KakaoMap: 마커 추가됨 [${prop.id}]`, coords);
        const marker = new window.kakao.maps.Marker({
          map: map,
          position: coords,
          title: prop.title,
          clickable: true
        });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          if (isMounted) setSelectedProperty(prop);
        });

        markers.current.push(marker);
        bounds.extend(coords);

        processedCount++;
        if (processedCount === properties.length && !bounds.isEmpty()) {
          if (singleProperty) {
            console.log("KakaoMap: SingleProperty 센터 지정", coords);
            map.setCenter(coords);
          } else {
            console.log("KakaoMap: Bounds 지정");
            map.setBounds(bounds);
          }
        }
      };

      if (prop.latitude && prop.longitude) {
        addMarker(new window.kakao.maps.LatLng(prop.latitude, prop.longitude));
      } else {
        const district = prop.district || "";
        const detailAddress = prop.address || "";

        // 강화군이 누락된 경우 보정 (인천광역시 강화군 ... 형식으로)
        let normalizedDistrict = district;
        if (!district.includes("강화") && !district.includes("서울")) {
          normalizedDistrict = `인천광역시 강화군 ${district}`;
        } else if (district.includes("강화") && !district.includes("인천")) {
          normalizedDistrict = `인천광역시 ${district}`;
        }

        const query = `${normalizedDistrict} ${detailAddress}`.trim().replace(/\s+/g, ' ');
        console.log(`KakaoMap: 주소 검색 시도 [${prop.id}] -> ${query}`);

        if (query.length > 2) {
          geocoder.addressSearch(query, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK && isMounted) {
              console.log(`KakaoMap: 주소 검색 성공 [${prop.id}]`);
              addMarker(new window.kakao.maps.LatLng(result[0].y, result[0].x));
            } else {
              console.warn(`KakaoMap: 주소 검색 실패 [${prop.id}] status: ${status}, query: ${query}`);
              processedCount++;
              // 검색 실패해도 singleProperty면 기본 강화군 위치라도 보여줌 (이미 center로 설정되어있음)
            }
          });
        } else {
          processedCount++;
        }
      }
    });

    return () => {
      isMounted = false;
      markers.current.forEach(m => m.setMap(null));
    };
  }, [isMapLoaded, properties, zoom, singleProperty]);

  const [useSkyview, setUseSkyview] = useState(false);
  useEffect(() => {
    if (mapInstance.current && window.kakao) {
      if (useSkyview) {
        mapInstance.current.addOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
      } else {
        mapInstance.current.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
      }
    }
  }, [useSkyview, isMapLoaded]);

  // Handle Geolocation
  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const map = mapInstance.current;
        if (map) {
          const locPosition = new window.kakao.maps.LatLng(latitude, longitude);
          map.setCenter(locPosition);
          map.setLevel(5);

          new window.kakao.maps.Marker({
            map: map,
            position: locPosition,
            title: "내 위치"
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
      }
    );
  };

  return (
    <div
      className="relative w-full h-full bg-slate-100"
      data-no-swipe="true"
      style={{ touchAction: 'manipulation' }}
    >
      <div ref={mapContainer} className="w-full h-full" />

      {/* 로딩 오버레이 */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
          <span className="text-slate-500 text-sm font-medium">지도를 불러오고 있습니다...</span>
        </div>
      )}

      {/* Map Controls */}
      {isMapLoaded && (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Zoom Controls */}
          <div className="flex flex-col rounded shadow-md border overflow-hidden">
            <button
              onClick={() => {
                if (mapInstance.current) {
                  mapInstance.current.setLevel(mapInstance.current.getLevel() - 1, { animate: true });
                }
              }}
              className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center bg-white text-slate-800 hover:bg-slate-100 border-b transition-colors font-bold text-xl md:text-lg"
              title="확대"
            >
              +
            </button>
            <button
              onClick={() => {
                if (mapInstance.current) {
                  mapInstance.current.setLevel(mapInstance.current.getLevel() + 1, { animate: true });
                }
              }}
              className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center bg-white text-slate-800 hover:bg-slate-100 transition-colors font-bold text-xl md:text-lg"
              title="축소"
            >
              -
            </button>
          </div>

          <button
            onClick={() => setUseSkyview(!useSkyview)}
            className={`px-3 py-2 text-xs font-bold rounded shadow-md border bg-white text-gray-700 hover:bg-gray-100 transition-colors ${useSkyview ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent' : ''}`}
          >
            스카이뷰
          </button>
          <button
            onClick={handleFindNearMe}
            className="px-3 py-2 text-xs font-bold rounded shadow-md border bg-white text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1"
          >
            📍 내 위치
          </button>
        </div>
      )}

      {!singleProperty && selectedProperty && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-xl z-20 w-72 border border-slate-200 animate-in fade-in slide-in-from-top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-2 text-slate-400 hover:text-black p-1"
            onClick={() => setSelectedProperty(null)}
          >
            ✕
          </button>

          {selectedProperty.imageUrl && (
            <div className="h-32 mb-3 rounded-md overflow-hidden bg-gray-100">
              <img
                src={selectedProperty.imageUrl}
                alt={selectedProperty.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h4 className="font-bold text-lg mb-1 truncate text-slate-900 pr-6">{selectedProperty.title}</h4>
          <p className="text-slate-500 text-xs mb-3 truncate">{selectedProperty.address}</p>

          <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 mb-3">
            <span className="text-primary font-bold text-base">
              {typeof selectedProperty.price === 'string' ? selectedProperty.price : selectedProperty.price?.toLocaleString() + '만원'}
            </span>
            <a
              href={`/properties/${selectedProperty.id}`}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              상세보기 &gt;
            </a>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 py-1.5 text-xs border border-green-500 text-green-600 hover:bg-green-50 rounded bg-white font-bold"
              onClick={() => window.open(`https://map.naver.com/v5/search/${encodeURIComponent(selectedProperty.address)}`, '_blank')}
            >
              네이버 지도
            </button>
            <button
              className="flex-1 py-1.5 text-xs border border-yellow-400 text-yellow-700 hover:bg-yellow-50 rounded bg-white font-bold"
              onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(selectedProperty.address)}`, '_blank')}
            >
              카카오맵
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KakaoMap;