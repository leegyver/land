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
    const timer = setInterval(() => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.Map && window.kakao.maps.services) {
        setSdkReady(true);
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // 2. 지도 초기화 (SDK 준비 + 데이터 변경 시)
  useEffect(() => {
    if (!sdkReady || !mapRef.current) return;

    console.log("Kakao Map init with Geocoding...");

    try {
      let center, mapLevel;

      // 초기 중심값 (나중에 setBounds로 변경됨)
      if (singleProperty) {
        const loc = getPropertyLocation(singleProperty);
        center = new window.kakao.maps.LatLng(loc.lat, loc.lng);
        mapLevel = zoom;
      } else {
        center = new window.kakao.maps.LatLng(37.7464, 126.4878);
        mapLevel = 9;
      }

      const mapOptions = { center, level: mapLevel };
      const map = new window.kakao.maps.Map(mapRef.current, mapOptions);

      // ---------- 마커 생성 로직 ----------
      const bounds = new window.kakao.maps.LatLngBounds();
      const geocoder = new window.kakao.maps.services.Geocoder();

      const createMarker = (prop: Property, position: any, isExact = false) => {
        const marker = new window.kakao.maps.Marker({
          map: map,
          position: position,
          title: prop.title
        });

        // 인포윈도우
        const content = `
          <div style="padding:10px;font-size:12px;width:200px;">
            <div style="font-weight:bold;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${prop.title}</div>
            ${buildPriceInfoHtml(prop)}
            ${!isExact ? '<div style="color:#888;font-size:10px;margin-top:3px;">* 지역 기준 위치</div>' : ''}
          </div>
        `;
        const infoWindow = new window.kakao.maps.InfoWindow({ zIndex: 1, content });

        window.kakao.maps.event.addListener(marker, 'click', () => {
          if (!singleProperty) setSelectedProperty(prop);
          infoWindow.open(map, marker);
        });

        if (singleProperty) infoWindow.open(map, marker);
      };

      const propertiesToRender = singleProperty ? [singleProperty] : (properties || []);

      propertiesToRender.forEach((prop) => {
        // 1. 위경도 데이터가 DB에 있으면 최우선 사용
        // @ts-ignore
        if (prop.latitude && prop.longitude) {
          // @ts-ignore
          const coords = new window.kakao.maps.LatLng(prop.latitude, prop.longitude);
          createMarker(prop, coords, true);
          if (!singleProperty) bounds.extend(coords);
          return;
        }

        // 2. 주소 검색 시도 (상세 주소가 있는 경우)
        let fullAddress = `인천광역시 강화군 ${prop.district || ''} ${prop.address || ''}`.trim();

        // 예외처리
        if (prop.district && (prop.district.includes("서울") || prop.district.includes("인천"))) {
          fullAddress = `${prop.district} ${prop.address || ''}`.trim();
        }

        geocoder.addressSearch(fullAddress, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            createMarker(prop, coords, true);
            if (!singleProperty) {
              bounds.extend(coords);
              map.setBounds(bounds);
            } else {
              map.setCenter(coords); // 단일 매물은 검색된 위치로 이동
            }
          } else {
            // 3. 검색 실패 시 지역 중심 좌표 사용
            const loc = getPropertyLocation(prop);
            const coords = new window.kakao.maps.LatLng(loc.lat, loc.lng);

            // 목록 모드에서는 겹침 방지
            if (!singleProperty) {
              const offsetLat = (Math.random() - 0.5) * 0.002;
              const offsetLng = (Math.random() - 0.5) * 0.002;
              const randomCoords = new window.kakao.maps.LatLng(loc.lat + offsetLat, loc.lng + offsetLng);
              createMarker(prop, randomCoords, false);
              bounds.extend(randomCoords);
              map.setBounds(bounds);
            } else {
              createMarker(prop, coords, false);
              map.setCenter(coords);
            }
          }
        });
      });

    } catch (e) {
      console.error("Map render error:", e);
    }
  }, [sdkReady, properties, singleProperty]);

  if (!singleProperty && !externalProperties && isLoading) {
    return <div className="flex items-center justify-center h-[60vh] bg-gray-100">로딩중...</div>;
  }

  return (
    <div className={`relative w-full ${singleProperty ? 'h-full' : 'h-[60vh]'}`}>
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