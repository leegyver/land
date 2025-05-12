import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    kakao: any;
    kakaoKey?: string;
    kakaoMapLoaded?: boolean;
  }
}

// 숫자를 한국어 표기법으로 변환 (예: 10000 -> 1만)
const formatNumberToKorean = (num: number): string => {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1).replace(/\.0$/, '')}억`;
  } else if (num >= 10000) {
    return `${(num / 10000).toFixed(0)}만`;
  }
  return num.toLocaleString();
};

const PropertyMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [infoWindow, setInfoWindow] = useState<any>(null);

  // 모든 매물 데이터 가져오기
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // 카카오맵 초기화
  useEffect(() => {
    // HTML에 이미 삽입된 카카오맵 SDK 스크립트를 확인
    const waitForKakaoSDK = () => {
      if (window.kakao && window.kakao.maps) {
        console.log("카카오맵 SDK 감지됨, 초기화 시작");
        initializeMap();
        return;
      }
      
      console.log("카카오맵 SDK 로딩 대기 중...");
      // 일정 시간 후 다시 확인
      setTimeout(waitForKakaoSDK, 500);
    };
    
    waitForKakaoSDK();
  }, []);

  // 맵 초기화 함수
  const initializeMap = () => {
    if (!mapRef.current) {
      console.error("맵 컨테이너 요소가 없습니다");
      return;
    }

    try {
      console.log("카카오맵 초기화 시작");
      
      // 기본 위치를 강화군 중심으로 설정
      const options = {
        center: new window.kakao.maps.LatLng(37.7464, 126.4878), // 강화군 중심 좌표
        level: 9 // 확대 레벨 (숫자가 작을수록 확대)
      };

      const kakaoMap = new window.kakao.maps.Map(mapRef.current, options);
      setMap(kakaoMap);
      console.log("카카오맵 생성 성공");

      // 정보 윈도우 생성
      const kakaoInfoWindow = new window.kakao.maps.InfoWindow({ zIndex: 1 });
      setInfoWindow(kakaoInfoWindow);
    } catch (error) {
      console.error("카카오맵 초기화 오류:", error);
    }
  };

  // 매물 마커 표시
  useEffect(() => {
    if (!map || !properties || properties.length === 0) {
      console.log("매물 데이터 또는 지도 객체가 없습니다");
      return;
    }

    try {
      console.log("매물 마커 표시 시작, 매물 수:", properties.length);
      
      // 지오코더 서비스 객체 생성
      const geocoder = new window.kakao.maps.services.Geocoder();
      const bounds = new window.kakao.maps.LatLngBounds();
      const markers: any[] = [];
      
      // 매물들의 좌표를 얻기 위한 함수
      const getCoordinates = (property: Property, index: number) => {
        try {
          // 주소 정보로 위치 찾기 (주소 형식 개선)
          let address = '';
          
          // 강화군 지역 주소 최적화
          if (property.district && property.district.includes('강화')) {
            address = `인천광역시 강화군 ${property.address || ''}`;
          } else {
            address = `${property.city || '인천광역시'} ${property.district || ''} ${property.address || ''}`;
          }
          
          // 주소에서 중복되는 지역명 제거
          address = address.replace(/인천광역시 인천광역시/g, '인천광역시');
          address = address.replace(/서울특별시 서울특별시/g, '서울특별시');
          address = address.replace(/서울 서울/g, '서울');
          
          console.log(`주소 검색 시도: ${address}`);
          
          geocoder.addressSearch(address, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              console.log(`주소 검색 성공: ${address}`);
              const position = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              createMarker(property, position, index);
              bounds.extend(position);
              
              // 마지막 매물 처리 후 지도 범위 재설정
              if (index === properties.length - 1) {
                map.setBounds(bounds);
              }
            } else {
              console.log(`주소를 찾을 수 없습니다: ${address}`);
              
              // 주소를 찾을 수 없는 경우 임의의 포인트 지정 (테스트용)
              if (property.id) {
                // 강화군 중심에서 약간씩 위치를 변경하여 임시 마커 생성
                const lat = 37.7464 + (Math.random() * 0.05 - 0.025);
                const lng = 126.4878 + (Math.random() * 0.05 - 0.025);
                const position = new window.kakao.maps.LatLng(lat, lng);
                createMarker(property, position, index);
                bounds.extend(position);
              }
            }
          });
        } catch (error) {
          console.error("주소 검색 오류:", error);
        }
      };

    // 마커 생성 함수
    const createMarker = (property: Property, position: any, index: number) => {
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        map: map,
        position: position,
        title: property.title,
      });
      
      markers.push(marker);

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // 클릭된 매물 정보 설정
        setSelectedProperty(property);
        
        // 거래 유형 (매매/전세/월세) 판단
        let dealTypeText = '매매';
        if (property.dealType && Array.isArray(property.dealType)) {
          dealTypeText = property.dealType[0] || '매매';
        }
        
        // 정보창 내용 구성
        const content = `
          <div style="padding: 8px; max-width: 250px; font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;">
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${property.title}</div>
            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">${property.type} · ${dealTypeText}</div>
            <div style="color: #2563eb; font-weight: bold; font-size: 13px;">${formatNumberToKorean(Number(property.price) || 0)}원</div>
          </div>
        `;
        
        // 정보창 표시
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });
    };

    // 각 매물에 대해 좌표 획득 및 마커 생성
    properties.forEach((property, index) => {
      getCoordinates(property, index);
    });

    // 컴포넌트 언마운트 시 마커 제거
    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
    
    } catch (error) {
      console.error("매물 마커 생성 중 오류 발생:", error);
      return () => {};
    }
  }, [map, properties, infoWindow]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative h-[60vh] w-full">
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
              {formatNumberToKorean(Number(selectedProperty.price) || 0)}원
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
};

export default PropertyMap;