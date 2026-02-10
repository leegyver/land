
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
            map.setCenter(coords);
          } else {
            map.setBounds(bounds);
          }
        }
      };

      if (prop.latitude && prop.longitude) {
        addMarker(new window.kakao.maps.LatLng(prop.latitude, prop.longitude));
      } else {
        const district = prop.district || "";
        const detailAddress = prop.address || "";
        const query = `${district.includes("강화") || district.includes("서울") ? district : "인천광역시 " + district} ${detailAddress}`.trim().replace(/\s+/g, ' ');

        if (query.length > 2) {
          geocoder.addressSearch(query, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK && isMounted) {
              addMarker(new window.kakao.maps.LatLng(result[0].y, result[0].x));
            } else {
              processedCount++;
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
      setSelectedProperty(null);
    };
  }, [isMapLoaded, properties, zoom, singleProperty]);

  return (
    <div
      className="relative w-full h-full bg-slate-100"
      data-no-swipe="true"
      style={{ touchAction: 'none' }}
    >
      <div ref={mapContainer} className="w-full h-full" />

      {/* 로딩 오버레이 */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
          <span className="text-slate-500 text-sm font-medium">지도를 불러오고 있습니다...</span>
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
          <h4 className="font-bold text-lg mb-1 truncate text-slate-900 pr-6">{selectedProperty.title}</h4>
          <p className="text-slate-500 text-xs mb-3 truncate">{selectedProperty.address}</p>
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
            <span className="text-primary font-bold text-base">
              {selectedProperty.price}
            </span>
            <a
              href={`/properties/${selectedProperty.id}`}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              상세보기 &gt;
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default KakaoMap;