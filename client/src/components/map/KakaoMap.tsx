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
    return `${Math.floor(price / 100000000)}억 ${price % 100000000 > 0 ? Math.floor((price % 100000000) / 10000) + '만' : ''}원`;
  } else if (price >= 10000) {
    return `${Math.floor(price / 10000)}만원`;
  }
  return `${price.toLocaleString()}원`;
}

interface KakaoMapProps {
  singleProperty?: Property;
  zoom?: number;
}

export default function KakaoMap({ singleProperty, zoom = 3 }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // 매물 데이터 가져오기 - 단일 매물이 제공되지 않았을 때만 실행
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !singleProperty // 단일 매물이 제공되면 이 쿼리는 실행되지 않음
  });

  // 강화군 기본 좌표 (위도/경도)
  const defaultLocation = { lat: 37.7466, lng: 126.4881 };

  // 매물 위치 좌표 계산 함수
  const getPropertyLocation = (property: Property) => {
    // 실제 위/경도 정보가 있는 경우
    if (property.latitude !== undefined && property.longitude !== undefined) {
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // 지역에 따른 대략적인 위치 (강화군 내 주요 지역)
    const districtLocations: {[key: string]: {lat: number, lng: number}} = {
      '강화읍': { lat: 37.7466, lng: 126.4881 },
      '선원면': { lat: 37.7132, lng: 126.4777 },
      '불은면': { lat: 37.7049, lng: 126.5357 },
      '길상면': { lat: 37.6390, lng: 126.5306 },
      '화도면': { lat: 37.6254, lng: 126.4273 },
      '양도면': { lat: 37.6629, lng: 126.4003 },
      '내가면': { lat: 37.7098, lng: 126.3767 },
      '하점면': { lat: 37.7627, lng: 126.4274 },
      '양사면': { lat: 37.7825, lng: 126.3799 },
      '송해면': { lat: 37.7639, lng: 126.4615 },
      '교동면': { lat: 37.8103, lng: 126.2724 },
      '삼산면': { lat: 37.7290, lng: 126.3368 },
      '서도면': { lat: 37.7504, lng: 126.2108 }
    };
    
    // 매물의 district에 포함된 지역명을 찾아서 좌표 반환
    for (const [district, location] of Object.entries(districtLocations)) {
      if (property.district && property.district.includes(district)) {
        return location;
      }
    }
    
    // 일치하는 지역이 없으면 강화읍 좌표 반환
    return defaultLocation;
  };

  // 지도 초기화
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.log("카카오맵 SDK가 로드되지 않았습니다");
      return;
    }

    if (!mapRef.current) {
      console.log("지도 컨테이너가 없습니다");
      return;
    }

    console.log("카카오맵 초기화 시작");
    
    try {
      // 중심 좌표 및 줌 레벨 설정
      let center, mapLevel;
      
      if (singleProperty) {
        // 단일 매물 모드 - 해당 매물 중심
        const location = getPropertyLocation(singleProperty);
        center = new window.kakao.maps.LatLng(location.lat, location.lng);
        mapLevel = zoom; // 기본값 3 또는 props로 전달된 값
      } else {
        // 다중 매물 모드 - 강화군 중심
        center = new window.kakao.maps.LatLng(37.7464, 126.4878);
        mapLevel = 9;
      }
      
      // 지도 옵션 설정
      const mapOptions = {
        center: center,
        level: mapLevel
      };
      
      const map = new window.kakao.maps.Map(mapRef.current, mapOptions);
      
      // 단일 매물이 제공된 경우 해당 매물만 표시
      if (singleProperty) {
        const location = getPropertyLocation(singleProperty);
        const markerPosition = new window.kakao.maps.LatLng(location.lat, location.lng);
        
        // 마커 생성
        const marker = new window.kakao.maps.Marker({
          map: map,
          position: markerPosition,
          title: singleProperty.title
        });
        
        // 인포윈도우 생성
        const infoWindow = new window.kakao.maps.InfoWindow({ 
          zIndex: 1,
          content: `
            <div style="padding:8px;font-size:12px;max-width:250px;">
              <div style="font-weight:bold;margin-bottom:4px;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${singleProperty.title}</div>
              <div style="color:#666;font-size:12px;margin-bottom:4px;">${singleProperty.type} · ${singleProperty.dealType && Array.isArray(singleProperty.dealType) ? singleProperty.dealType.join(', ') : '매매'}</div>
              <div style="color:#2563eb;font-weight:bold;font-size:13px;">${formatPrice(Number(singleProperty.price) || 0)}</div>
              <div style="color:#888;font-size:11px;margin-top:4px;"><i>* 위치는 대략적인 지역 중심 기준</i></div>
            </div>
          `
        });
        
        // 마커 클릭 시 인포윈도우 표시
        window.kakao.maps.event.addListener(marker, 'click', function() {
          infoWindow.open(map, marker);
        });
        
        // 지도 로딩 완료 시 바로 인포윈도우 표시
        infoWindow.open(map, marker);
        
        // 컴포넌트 언마운트 시 마커 제거
        return () => {
          marker.setMap(null);
        };
      } 
      // 다중 매물 모드
      else {
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
        
        // 인포윈도우 닫기 함수 (중복 방지)
        const closeInfoWindow = () => {
          infoWindow.close();
        };
        
        // 지도 줌 변경 이벤트에 인포윈도우 닫기 추가
        window.kakao.maps.event.addListener(map, 'zoom_changed', closeInfoWindow);
        
        // 드래그 완료 이벤트에도 인포윈도우 닫기 적용
        window.kakao.maps.event.addListener(map, 'dragend', closeInfoWindow);
        
        // 각 매물의 주소를 좌표로 변환하여 마커 생성
        properties.forEach((property, index) => {
          // 지역 필드 + 주소 필드 형식으로 주소 구성
          const district = property.district || '';
          const detailAddress = property.address || '';
          
          // 강화군 지역은 특별 처리
          let address = '';
          if (district.includes('강화')) {
            // 강화군은 '인천광역시 강화군'으로 명시
            address = `인천광역시 강화군 ${district} ${detailAddress}`.trim();
          } 
          // 서울 지역 처리
          else if (district.includes('서울')) {
            // 서울 지역은 '서울특별시'로 통일
            const cleanDistrict = district.replace(/서울특별시|서울시|서울/g, '').trim();
            address = `서울특별시 ${cleanDistrict} ${detailAddress}`.trim();
          }
          // 인천 지역 처리 (강화군 제외)
          else if (district.includes('인천')) {
            address = `인천광역시 ${district} ${detailAddress}`.trim();
          }
          // 기타 지역
          else {
            address = `인천광역시 ${district} ${detailAddress}`.trim();
          }
          
          console.log(`주소 검색 시도: ${address}`);
          
          // 주소가 있고 최소 길이 조건을 만족하면 검색 시도
          if (address.trim() && address.length > 5) {
            // 검색 옵션 설정 (정확도 향상)
            const searchOptions = {
              size: 1,  // 결과 개수 제한
              analyze_type: 'similar'  // 유사 매칭 분석 타입
            };
            
            // 마커 생성 함수
            const createMarker = (coords: any, isExactLocation: boolean = true) => {
              const marker = new window.kakao.maps.Marker({
                map: map,
                position: coords,
                title: property.title
              });
              
              markers.push(marker);
              bounds.extend(coords);
              
              // 마커 클릭 이벤트
              window.kakao.maps.event.addListener(marker, 'click', () => {
                // 기존 인포윈도우 닫기 (중복 방지)
                infoWindow.close();
                
                // 선택된 매물 설정
                setSelectedProperty(property);
                
                // 인포윈도우 내용 설정
                let content = `
                  <div style="padding:8px;font-size:12px;max-width:250px;">
                    <div style="font-weight:bold;margin-bottom:4px;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${property.title}</div>
                    <div style="color:#666;font-size:12px;margin-bottom:4px;">${property.type} · ${property.dealType && Array.isArray(property.dealType) ? property.dealType.join(', ') : '매매'}</div>
                    <div style="color:#2563eb;font-weight:bold;font-size:13px;">${formatPrice(Number(property.price) || 0)}</div>
                `;
                
                // 대략적인 위치를 사용한 경우 알림 추가
                if (!isExactLocation) {
                  content += `<div style="color:#888;font-size:11px;margin-top:4px;"><i>* 위치는 대략적인 지역 중심 기준</i></div>`;
                }
                
                content += `</div>`;
                
                // 인포윈도우 표시
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
                
                // 지도 중심 이동 및 확대 (정확한 위치인 경우만)
                if (isExactLocation) {
                  map.setCenter(coords);
                  map.setLevel(3);
                }
              });
            };
            
            // 카카오맵 API에 주소 검색 요청 (옵션 전달)
            geocoder.addressSearch(address, (result: any, status: any) => {
              if (status === window.kakao.maps.services.Status.OK) {
                console.log(`주소 검색 성공: ${result[0].address_name}`);
                
                // 좌표 생성 및 마커 표시
                const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                createMarker(coords, true);
                
                // 마지막 매물 처리 후 지도 범위 조정
                if (index === properties.length - 1) {
                  map.setBounds(bounds);
                }
              } else {
                console.log(`주소를 찾을 수 없습니다: ${address}`);
                
                // 주소 검색 실패 시 대체 좌표 사용
                let fallbackCoords;
                
                // 지역에 따른 중심 좌표 사용
                if (district.includes('강화')) {
                  fallbackCoords = new window.kakao.maps.LatLng(37.7464, 126.4878); // 강화군 중심
                } else if (district.includes('서울')) {
                  fallbackCoords = new window.kakao.maps.LatLng(37.5665, 126.9780); // 서울 중심
                } else if (district.includes('인천')) {
                  fallbackCoords = new window.kakao.maps.LatLng(37.4563, 126.7052); // 인천 중심
                } else {
                  // 기본 위치에 약간의 랜덤성 추가 (마커 중첩 방지)
                  fallbackCoords = new window.kakao.maps.LatLng(
                    37.7464 + (Math.random() * 0.02 - 0.01), 
                    126.4878 + (Math.random() * 0.02 - 0.01)
                  );
                }
                
                // 대략적인 위치에 마커 생성
                createMarker(fallbackCoords, false);
              }
            }, searchOptions); // 검색 옵션 전달
          }
        });
        
        // 컴포넌트 언마운트 시 마커 제거
        return () => {
          markers.forEach(marker => marker.setMap(null));
        };
      }
    } catch (error) {
      console.error("카카오맵 초기화 오류:", error);
    }
  }, [properties, singleProperty, zoom]);

  // 로딩 화면 표시
  if (!singleProperty && isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${singleProperty ? 'h-full' : 'h-[60vh]'}`}>
      {/* 지도 컨테이너 */}
      <div ref={mapRef} className="w-full h-full"></div>
      
      {/* 선택된 매물 정보 패널 - 다중 매물 모드에서만 표시 */}
      {!singleProperty && selectedProperty && (
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
            {selectedProperty.dealType && Array.isArray(selectedProperty.dealType) && selectedProperty.dealType.map((type, index) => (
              <Badge key={index} variant="outline" className="bg-primary/10 text-primary font-bold">
                {type}
              </Badge>
            ))}
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