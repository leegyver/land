import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { Link } from 'wouter';

// 전역 타입 선언
declare global {
  interface Window {
    kakao: any;
  }
}

// 숫자를 한국어 표기법으로 변환
function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '';
  const numPrice = Number(price);
  if (isNaN(numPrice)) return '';
  if (numPrice >= 100000000) {
    return `${Math.floor(numPrice / 100000000)}억 ${numPrice % 100000000 > 0 ? Math.floor((numPrice % 100000000) / 10000) + '만' : ''}원`;
  } else if (numPrice >= 10000) {
    return `${Math.floor(numPrice / 10000)}만원`;
  }
  return `${numPrice.toLocaleString()}원`;
}

// 가격 값이 유효한지 확인
function hasValidPrice(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined || value === '' || value === '0' || value === 0) {
    return false;
  }
  const numValue = Number(value);
  return !isNaN(numValue) && numValue > 0;
}

// 가격 정보 HTML 생성 함수
function buildPriceInfoHtml(property: Property): string {
  let html = '';
  if (hasValidPrice(property.price)) {
    html += `<div style="color:#2563eb;font-weight:bold;font-size:13px;">매매가: ${formatPrice(property.price)}</div>`;
  }
  if (hasValidPrice(property.deposit)) {
    html += `<div style="color:#2563eb;font-weight:bold;font-size:13px;">전세금: ${formatPrice(property.deposit)}</div>`;
  }
  if (hasValidPrice(property.depositAmount)) {
    html += `<div style="color:#2563eb;font-weight:bold;font-size:13px;">보증금: ${formatPrice(property.depositAmount)}</div>`;
  }
  if (hasValidPrice(property.monthlyRent)) {
    html += `<div style="color:#2563eb;font-weight:bold;font-size:13px;">월세: ${formatPrice(property.monthlyRent)}</div>`;
  }
  if (hasValidPrice(property.maintenanceFee)) {
    html += `<div style="color:#2563eb;font-weight:bold;font-size:13px;">관리비: ${formatPrice(property.maintenanceFee)}</div>`;
  }
  return html;
}

interface KakaoMapProps {
  singleProperty?: Property;
  properties?: Property[];
  zoom?: number;
}

export default function KakaoMap({ singleProperty, properties: externalProperties, zoom = 3 }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  // 매물 데이터 가져오기
  const { data: fetchedProperties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !singleProperty && !externalProperties
  });

  const properties = externalProperties || fetchedProperties;

  // 매물 위치 좌표 계산 함수 (Fallback용)
  const getPropertyLocation = (property: Property) => {
    // 지역에 따른 대략적인 위치 (강화군 내 주요 지역)
    const districtLocations: { [key: string]: { lat: number, lng: number } } = {
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

    for (const [district, location] of Object.entries(districtLocations)) {
      if (property.district && property.district.includes(district)) return location;
    }

    return { lat: 37.7466, lng: 126.4881 }; // default
  };

  // 1. SDK 로딩 확인
  useEffect(() => {
    // 10초 타임아웃
    const timeout = setTimeout(() => {
      if (!sdkReady) {
        console.warn("Kakao SDK load timeout");
      }
    }, 10000);

    const timer = setInterval(() => {
      // @ts-ignore
      if (window.kakao && window.kakao.maps && window.kakao.maps.Map && window.kakao.maps.services) {
        setSdkReady(true);
        clearInterval(timer);
        clearTimeout(timeout);
      }
    }, 500); // 0.5초 간격 체크
    return () => { clearInterval(timer); clearTimeout(timeout); };
  }, [sdkReady]);

  // 2. 지도 초기화 ... (중략) ...

  // 렌더링
  if (!singleProperty && !externalProperties && isLoading) {
    return <div className="flex items-center justify-center h-[60vh] bg-gray-100">매물 정보 로딩중...</div>;
  }

  return (
    <div className={`relative w-full ${singleProperty ? 'h-full' : 'h-[60vh]'}`}>

      {/* 디버그 상태 오버레이 (지도가 안 뜰 때만 보임) */}
      {!sdkReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 z-20 text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p>카카오 맵 불러오는 중...</p>
          <p className="text-xs text-gray-500 mt-2">10초 이상 걸리면 새로고침 해주세요.</p>
          <div className="text-xs text-red-500 mt-4 px-4 text-center">
            지도가 계속 안 나오나요?<br />
            1. 카카오 개발자 센터 &gt; 플랫폼 &gt; Web &gt; 사이트 도메인 등록 확인<br />
            2. 현재 주소({window.location.origin})가 등록되어 있어야 합니다.
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full bg-gray-100" style={{ minHeight: '300px' }}></div>


      {/* 선택된 매물 정보 패널 (다중 매물 모드) */}
      {!singleProperty && selectedProperty && (
        <div className="absolute top-4 right-4 md:w-64 bg-white rounded-lg shadow-lg p-3 z-10">
          <button
            className="absolute top-2 right-2 text-gray-500"
            onClick={() => setSelectedProperty(null)}
          >✕</button>
          <Link href={`/properties/${selectedProperty.id}`}>
            <h3 className="font-bold text-sm mb-2 hover:text-blue-600 truncate pr-4 cursor-pointer">{selectedProperty.title}</h3>
          </Link>
          <div className="text-xs text-gray-600 mb-2">{selectedProperty.district} · {selectedProperty.type}</div>
          <div dangerouslySetInnerHTML={{ __html: buildPriceInfoHtml(selectedProperty) }} />
          <Link href={`/properties/${selectedProperty.id}`} className="block mt-2 text-center bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700">
            상세보기
          </Link>
        </div>
      )}
    </div>
  );
}