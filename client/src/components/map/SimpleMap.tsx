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

export default function SimpleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
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
        // 주소 구성
        let address = '';
        
        if (property.district && property.district.includes('강화')) {
          address = `인천광역시 강화군 ${property.address || ''}`;
        } else {
          address = `${property.city || '인천광역시'} ${property.district || ''} ${property.address || ''}`;
        }
        
        // 주소가 있으면 검색 시도
        if (address.trim()) {
          geocoder.addressSearch(address, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              // 좌표 생성
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              
              // 마커 생성
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
                
                // 인포윈도우 내용 설정
                const content = `
                  <div style="padding:5px;font-size:12px;max-width:200px;text-align:center;">
                    <strong>${property.title}</strong>
                  </div>
                `;
                
                // 인포윈도우 표시
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
                
                // 지도 중심 이동
                map.setCenter(coords);
              });
              
              // 마지막 매물 처리 후 지도 범위 조정
              if (index === properties.length - 1) {
                map.setBounds(bounds);
              }
            } else {
              console.log(`주소를 찾을 수 없습니다: ${address}`);
              
              // 강화군 내 임의의 위치에 마커 생성 (실제 위치가 없는 경우)
              const randomLat = 37.7464 + (Math.random() * 0.05 - 0.025);
              const randomLng = 126.4878 + (Math.random() * 0.05 - 0.025);
              const randomPosition = new window.kakao.maps.LatLng(randomLat, randomLng);
              
              const marker = new window.kakao.maps.Marker({
                map: map,
                position: randomPosition,
                title: property.title
              });
              
              markers.push(marker);
              bounds.extend(randomPosition);
              
              // 마커 클릭 이벤트
              window.kakao.maps.event.addListener(marker, 'click', () => {
                setSelectedProperty(property);
                
                const content = `
                  <div style="padding:5px;font-size:12px;max-width:200px;text-align:center;">
                    <strong>${property.title}</strong>
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
    } catch (error) {
      console.error("카카오맵 초기화 오류:", error);
    }
  }, [properties]);

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