
import { useEffect, useRef, useState } from 'react';
import { Property } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { buildGeocodeQuery } from '@/lib/map-utils';

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

  const properties = singleProperty ? [singleProperty] : (Array.isArray(externalProperties) ? externalProperties : (Array.isArray(fetchedProperties) ? fetchedProperties : []));

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

    const propsToProcess = Array.isArray(properties) ? properties : [];
    if (propsToProcess.length === 0) return;

    propsToProcess.forEach((prop) => {
      const addMarker = (coords: any) => {
        if (!isMounted || !mapInstance.current) return;

        console.log(`KakaoMap: 마커 추가됨 [${prop.id}]`, coords.getLat(), coords.getLng());
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
        if (processedCount === propsToProcess.length && !bounds.isEmpty()) {
          if (singleProperty) {
            console.log("KakaoMap: SingleProperty 센터 지정", coords.getLat(), coords.getLng());
            // 지도가 안정화된 후 이동하도록 지연 실행 보강
            setTimeout(() => {
              if (map && isMounted) {
                map.setCenter(coords);
                map.setLevel(zoom || 5);
                map.relayout();
              }
            }, 100);
          } else {
            console.log("KakaoMap: Bounds 지정");
            map.setBounds(bounds);
          }
        }
      };

      // 좌표값을 숫자로 확실히 변환
      const lat = Number(prop.latitude);
      const lng = Number(prop.longitude);

      if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        // 좌표가 있으면 정확하게 그 위치에 핀 표시
        console.log(`KakaoMap: 좌표 사용 [${prop.id}] lat=${lat}, lng=${lng}`);
        addMarker(new window.kakao.maps.LatLng(lat, lng));
      } else {
        // 좌표가 없으면 주소 기반으로 지오코딩
        const mapAddr = (prop as any).mapAddress || "";
        const district = prop.district || "";
        const address = prop.address || "";

        const cleanQuery = buildGeocodeQuery(district, address, mapAddr);
        console.log(`KakaoMap: 주소 검색 시도 [${prop.id}] -> 정제 검색어: "${cleanQuery}"`);

        // 1단계: 정제된 주소로 Geocoder 주소 검색
        if (cleanQuery.length > 2) {
          geocoder.addressSearch(cleanQuery, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK && isMounted && result && result.length > 0) {
              console.log(`KakaoMap: 정제 주소 검색 성공 [${prop.id}]`);
              addMarker(new window.kakao.maps.LatLng(result[0].y, result[0].x));
            } else {
              // 2단계: Places 키워드 검색 폴백 (지번/지명 복합 검색 지원)
              try {
                const places = new window.kakao.maps.services.Places();
                places.keywordSearch(cleanQuery, (pResult: any, pStatus: any) => {
                  if (pStatus === window.kakao.maps.services.Status.OK && isMounted && pResult && pResult.length > 0) {
                    console.log(`KakaoMap: Places 키워드 검색 성공 [${prop.id}]`);
                    addMarker(new window.kakao.maps.LatLng(pResult[0].y, pResult[0].x));
                  } else {
                    // 3단계: 읍/면/리 단위 추출 검색 폴백
                    const areaMatch = cleanQuery.match(/(?:인천(?:광역시)?\s*)?(?:강화군\s*)?([가-힣]+[읍면동])(?:\s+([가-힣]+리))?/);
                    if (areaMatch) {
                      const fallbackQuery = `인천 강화군 ${areaMatch[1]} ${areaMatch[2] || ''}`.trim();
                      console.log(`KakaoMap: 지역 단위 3차 검색 [${prop.id}] -> ${fallbackQuery}`);
                      geocoder.addressSearch(fallbackQuery, (fResult: any, fStatus: any) => {
                        if (fStatus === window.kakao.maps.services.Status.OK && isMounted && fResult && fResult.length > 0) {
                          addMarker(new window.kakao.maps.LatLng(fResult[0].y, fResult[0].x));
                        } else {
                          console.warn(`KakaoMap: 최종 위치 검색 실패 [${prop.id}] query: ${cleanQuery}`);
                          processedCount++;
                        }
                      });
                    } else {
                      console.warn(`KakaoMap: 위치 검색 불가 [${prop.id}] query: ${cleanQuery}`);
                      processedCount++;
                    }
                  }
                });
              } catch (err) {
                console.warn(`KakaoMap: Places 검색 예외 [${prop.id}]`, err);
                processedCount++;
              }
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

          <h4 className="font-bold text-lg mb-2 truncate text-slate-900 pr-6 mt-2">{selectedProperty.title}</h4>

          <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 mb-3">
            <span className="text-primary font-bold text-base">
              {selectedProperty.price}{!selectedProperty.price.includes('만원') && '만원'}
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