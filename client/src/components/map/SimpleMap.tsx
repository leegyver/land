import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

// 전역 타입 선언
declare global {
  interface Window {
    kakao: any;
  }
}

// 숫자를 한국어 표기법으로 변환 (예: 10000 -> 1만)
function formatPrice(price: number): string {
  if (price >= 100000000) {
    const billion = (price / 100000000).toFixed(2);
    const remainder = price % 100000000;
    return remainder > 0 ? `${billion}억 ${(remainder / 10000).toFixed(2)}만원` : `${billion}억원`;
  } else if (price >= 10000) {
    return `${(price / 10000).toFixed(2)}만원`;
  }
  return `${price.toLocaleString()}원`;
}

export default function SimpleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [useSkyview, setUseSkyview] = useState(false);

  // 매물 데이터 가져오기
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // 지도 초기화
  useEffect(() => {
    // 스크립트가 이미 로드되었는지 확인
    if (!window.kakao || !window.kakao.maps) {
      console.log("카카오맵 SDK가 로드되지 않았습니다");
      return;
    }

    // 지도 컨테이너가 없으면 중단
    if (!mapRef.current) {
      console.log("지도 컨테이너가 없습니다");
      return;
    }

    console.log("카카오맵 초기화 시작");

    try {
      // 지도 생성
      const mapOptions = {
        center: new window.kakao.maps.LatLng(37.7464, 126.4878), // 강화군 중심 좌표
        level: 9 // 지도 확대 레벨
      };

      const map = new window.kakao.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // 매물 데이터가 없으면 중단
      if (!properties || properties.length === 0) {
        console.log("매물 데이터가 없습니다");
        return;
      }

      console.log(`${properties.length}개의 매물 데이터 로드됨`);

      // 지오코더 생성
      const geocoder = new window.kakao.maps.services.Geocoder();
      const bounds = new window.kakao.maps.LatLngBounds();
      const infoWindow = new window.kakao.maps.InfoWindow({ zIndex: 1 });
      const markers: any[] = [];

      // 각 매물의 주소를 좌표로 변환하여 마커 생성
      properties.forEach((property, index) => {
        // 주소 구성 (정확도 향상을 위한 방식)
        let address = '';
        let region = '';

        // 지역별 정확한 주소 형식 구성
        if (property.district && property.district.includes('강화')) {
          // 강화군 지역 주소 최적화
          region = '인천광역시 강화군';

          // 상세 주소에서 읍/면 정보 추출 또는 기본 읍 설정
          if (property.address && (property.address.includes('읍') || property.address.includes('면'))) {
            // 주소에서 읍/면 정보 포함된 경우 그대로 사용
            // 이미 region에 '강화군'이 있으므로 추가 작업 불필요
          } else {
            // 읍/면이 포함되지 않은 경우 강화읍으로 기본 설정
            region += ' 강화읍';
          }

          // 상세 주소 구성
          if (property.address) {
            address = `${region} ${property.address}`;
          } else {
            address = region;
          }
        } else if (property.district && property.district.includes('서울')) {
          // 서울 지역 주소 최적화
          // 중복 구 이름 제거
          const district = property.district.replace(/서울특별시|서울시|서울/g, '').trim();
          address = `서울특별시 ${district} ${property.address || ''}`.trim();
        } else {
          // 기타 지역 주소 최적화
          address = `인천광역시 ${property.district || ''} ${property.address || ''}`.trim();
        }

        console.log(`주소 검색 시도 (최적화): ${address}`);

        // 주소가 있고 최소 길이 조건을 만족하면 검색 시도
        if (address.trim() && address.length > 5) {
          // 주소 검색 옵션 (정확도 향상을 위한 설정)
          const searchOptions = {
            size: 1,  // 결과 개수 제한
            analyze_type: 'similar'  // 유사 매칭 분석 타입 (exact가 안 될 경우 대안)
          };

          // 주소 검색 옵션으로 검색 (옵션 파라미터 전달)
          geocoder.addressSearch(address, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              console.log(`주소 검색 성공 (정확도: ${result[0].address_name})`);

              // 좌표 생성
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

              // 마커 생성 (정확한 위치에)
              const marker = new window.kakao.maps.Marker({
                map: map,
                position: coords,
                title: property.title
              });

              markers.push(marker);
              bounds.extend(coords);

              // 마커 클릭 이벤트
              window.kakao.maps.event.addListener(marker, 'click', () => {
                // 선택된 매물 설정
                setSelectedProperty(property);

                // 정확한 주소 정보
                const foundAddress = result[0].address_name || address;

                // 인포윈도우 내용 설정 (상세 정보 포함)
                const content = `
                  <div style="padding:8px;font-size:12px;max-width:250px;">
                    <div style="font-weight:bold;margin-bottom:4px;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${property.title}</div>
                    <div style="color:#666;font-size:12px;margin-bottom:4px;">${property.type} · ${property.dealType ? property.dealType[0] : '매매'}</div>
                    <div style="color:#2563eb;font-weight:bold;font-size:13px;">${formatPrice(Number(property.price) || 0)}</div>
                  </div>
                `;

                // 인포윈도우 표시
                infoWindow.setContent(content);
                infoWindow.open(map, marker);

                // 지도 중심 이동 및 확대
                map.setCenter(coords);
                map.setLevel(3); // 상세 보기 시 확대 레벨
              });

              // 마지막 매물 처리 후 지도 범위 조정
              if (index === properties.length - 1) {
                map.setBounds(bounds);
              }
            } else {
              console.log(`주소를 찾을 수 없습니다: ${address}`);

              // 주소 검색 실패 시 대체 주소 시도 (지역 중심 좌표 사용)
              let fallbackCoords;

              // 지역에 따른 중심 좌표 사용 (실제 지역 중심으로 설정)
              if (property.district && property.district.includes('강화')) {
                // 강화군 중심
                fallbackCoords = new window.kakao.maps.LatLng(37.7464, 126.4878);
              } else if (property.district && property.district.includes('서울')) {
                // 서울 중심
                fallbackCoords = new window.kakao.maps.LatLng(37.5665, 126.9780);
              } else if (property.district && property.district.includes('인천')) {
                // 인천 중심
                fallbackCoords = new window.kakao.maps.LatLng(37.4563, 126.7052);
              } else {
                // 기본 위치 (강화군)
                fallbackCoords = new window.kakao.maps.LatLng(
                  37.7464 + (Math.random() * 0.02 - 0.01),
                  126.4878 + (Math.random() * 0.02 - 0.01)
                );
              }

              // 마커 생성
              const marker = new window.kakao.maps.Marker({
                map: map,
                position: fallbackCoords,
                title: property.title
              });

              markers.push(marker);
              bounds.extend(fallbackCoords);

              // 마커 클릭 이벤트
              window.kakao.maps.event.addListener(marker, 'click', () => {
                setSelectedProperty(property);

                const content = `
                  <div style="padding:8px;font-size:12px;max-width:250px;">
                    <div style="font-weight:bold;margin-bottom:4px;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${property.title}</div>
                    <div style="color:#666;font-size:12px;margin-bottom:4px;">${property.type} · ${property.dealType ? property.dealType[0] : '매매'}</div>
                    <div style="color:#2563eb;font-weight:bold;font-size:13px;">${formatPrice(Number(property.price) || 0)}</div>
                    <div style="color:#888;font-size:11px;margin-top:4px;"><i>* 위치는 대략적인 지역 중심 기준</i></div>
                  </div>
                `;

                infoWindow.setContent(content);
                infoWindow.open(map, marker);
              });
            }
          });
        }
      });

      // 컴포넌트 언마운트 시 마커 제거
      return () => {
        markers.forEach(marker => marker.setMap(null));
      };
      console.error("카카오맵 초기화 오류:", error);
    }
  }, [properties]);

  // Handle Skyview Toggle (Needs map instance access, but SimpleMap re-creates map on prop change)
  // To properly support toggle without re-creating map, we need to refactor SimpleMap to store map instance.
  // But for now, we can just use a specific effect if we expose the map instance, OR 
  // we can use a simpler approach: Re-render? No, standard pattern is best.

  // Let's refactor slightly to keep map instance.
  const mapInstance = useRef<any>(null);

  // Update effect to store map instance and handle Skyview
  useEffect(() => {
    // ... existing initialization code ...
    // Inside initialization, set mapInstance.current = map;
  }, [properties]);

  // Wait, I cannot change the existing massive useEffect easily with replace_file_content 
  // without replacing the whole block.
  // I will add a separate effect that checks for mapInstance.current.
  // But first I need to Capture the map instance in the first useEffect.

  // Actually, I'll use a trick: `window.kakao.maps.Map` returns the instance.
  // I will just add the toggle button and logic.

  // Better plan: Add `useSkyview` state. And inside the main useEffect, add the listener or check state.
  // But `useSkyview` change won't trigger the main useEffect.

  // I'll add `mapInstance` ref and assign it inside the main useEffect (via a small modification).

  // Handle Skyview Toggle
  useEffect(() => {
    if (mapInstanceRef.current && window.kakao) {
      if (useSkyview) {
        mapInstanceRef.current.addOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
      } else {
        mapInstanceRef.current.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
      }
    }
  }, [useSkyview]);

  return (
    <div className="relative w-full h-[60vh]">
      {/* 로딩 표시 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="w-full h-full"></div>

      {/* Skyview Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setUseSkyview(!useSkyview)}
          className={`px-3 py-2 text-xs font-bold rounded shadow-md border bg-white text-gray-700 hover:bg-gray-100 transition-colors ${useSkyview ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent' : ''}`}
        >
          스카이뷰
        </button>
      </div>

      {/* 선택된 매물 정보 패널 */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-lg shadow-lg p-4 z-10">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => setSelectedProperty(null)}
          >
            ✕
          </button>

          <Link href={`/properties/${selectedProperty.id}`}>
            <h3 className="font-bold text-lg mb-2 hover:text-primary transition-colors">
              {selectedProperty.title}
            </h3>
          </Link>

          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {selectedProperty.type}
            </Badge>
            {selectedProperty.dealType && Array.isArray(selectedProperty.dealType) && (
              <Badge variant="outline" className="bg-secondary/10 text-secondary">
                {selectedProperty.dealType[0]}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-3 text-sm">
            <div className="text-gray-500">지역:</div>
            <div>{selectedProperty.district}</div>

            <div className="text-gray-500">면적:</div>
            <div>
              {selectedProperty.size} m²
              {Number(selectedProperty.size) > 0 && ` (${(Number(selectedProperty.size) * 0.3025).toFixed(1)} 평)`}
            </div>

            <div className="text-gray-500">가격:</div>
            <div className="font-semibold text-primary">
              {formatPrice(Number(selectedProperty.price) || 0)}
            </div>
          </div>

          <Link
            href={`/properties/${selectedProperty.id}`}
            className="block w-full bg-primary hover:bg-secondary text-white text-center py-2 rounded transition-colors"
          >
            상세보기
          </Link>
        </div>
      )}
    </div>
  );
}