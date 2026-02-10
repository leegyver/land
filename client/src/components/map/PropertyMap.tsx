
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSaju } from '@/contexts/SajuContext';
import { getCompatibilityScore } from '@/lib/saju';
import SajuFormModal from '@/components/saju/SajuFormModal';
import SajuDetailModal from '@/components/saju/SajuDetailModal';
import TarotModal from '@/components/tarot/TarotModal';
import { Sparkles, HelpCircle } from 'lucide-react';
import { formatKoreanPrice } from '@/lib/formatter';

declare global {
  interface Window {
    kakao: any;
    kakaoKey?: string;
    kakaoMapLoaded?: boolean;
  }
}

interface PropertyMapProps {
  properties?: Property[];
}

const PropertyMap = ({ properties: passedProperties }: PropertyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const infoWindowRef = useRef<any>(null);
  const { user } = useAuth(); // useAuth 훅 사용

  // Saju & Tarot Logic
  const { sajuData, openSajuModal } = useSaju();
  const [isTarotOpen, setIsTarotOpen] = useState(false);
  const [isSajuDetailOpen, setIsSajuDetailOpen] = useState(false);
  const [compatibility, setCompatibility] = useState<{
    score: number,
    comment: string,
    details?: {
      investment: { style: string, advice: string },
      styling: { colors: string, tip: string },
      location: string
    }
  } | null>(null);

  // 모든 매물 데이터 가져오기 (props가 없을 때만) - 캐시 적극 활용
  const { data: fetchedProperties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !passedProperties,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });

  const properties = passedProperties || fetchedProperties;
  const isMapDataLoading = !passedProperties && isLoading;

  // 1. 지도 엔진 초기화 (최초 1회만, 절대 재실행 금지)
  useEffect(() => {
    // 이미 초기화 작업이 시작되었거나 컨테이너가 없으면 실행 중단
    if (isInitialized || mapInstanceRef.current || !mapRef.current) return;

    let isMounted = true;
    console.log("PropertyMap: 엔진 초기화 시퀀스 시작");

    const initMap = () => {
      if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

      try {
        const options = {
          center: new window.kakao.maps.LatLng(37.7464, 126.4878),
          level: 9
        };

        const map = new window.kakao.maps.Map(mapRef.current, options);
        mapInstanceRef.current = map;
        infoWindowRef.current = new window.kakao.maps.InfoWindow({ zIndex: 1 });

        setIsInitialized(true);
        console.log("PropertyMap: 지도 엔진 로드 완료");

        // 렌더링 타이밍 이슈 대응
        setTimeout(() => {
          if (map && isMounted) {
            map.relayout();
            map.setCenter(options.center);
          }
        }, 150);
      } catch (err) {
        console.error("PropertyMap: 카카오맵 API 에러 - 재시도", err);
        setTimeout(initMap, 500);
      }
    };

    const loadKakao = () => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(initMap);
      } else {
        setTimeout(loadKakao, 200);
      }
    };

    loadKakao();

    return () => { isMounted = false; };
  }, []); // 의존성 없음: 컴포넌트 생애 주기 내 단 1회 실행 보장

  // 2. 매물 마커 렌더링 (데이터 변경 시 엔진을 건드리지 않고 마커만 조작)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isInitialized || !map || !properties) return;

    // 기존 마커 즉시 클린업
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const geocoder = new window.kakao.maps.services.Geocoder();
    const bounds = new window.kakao.maps.LatLngBounds();
    let isMounted = true;
    let processedCount = 0;

    if (properties.length === 0) return;

    console.log(`PropertyMap: ${properties.length}개 매물 정보 처리 중...`);

    properties.forEach((property) => {
      const district = property.district || "";
      const detailAddress = property.address || "";
      const query = (district.includes("강화") || district.includes("서울")
        ? `${district} ${detailAddress}`
        : `인천광역시 ${district} ${detailAddress}`).trim().replace(/\s+/g, ' ');

      if (query.length > 2) {
        geocoder.addressSearch(query, (result: any, status: any) => {
          if (!isMounted || !mapInstanceRef.current) return;
          processedCount++;

          if (status === window.kakao.maps.services.Status.OK) {
            const position = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            const marker = new window.kakao.maps.Marker({
              map: map,
              position: position,
              title: property.title,
            });

            markersRef.current.push(marker);
            bounds.extend(position);

            window.kakao.maps.event.addListener(marker, 'click', () => {
              if (isMounted) {
                setSelectedProperty(property);
                const dealTypeText = (property.dealType || []).filter(t => ['매매', '전세', '월세'].includes(t)).join(', ');
                const content = `
                  <div style="padding: 10px; min-width: 200px; font-family: 'Malgun Gothic', sans-serif;">
                    <div style="font-weight: 800; font-size: 15px; margin-bottom: 2px;">${property.title}</div>
                    <div style="color: #4b5563; font-size: 13px; margin-bottom: 5px;">${property.type}${dealTypeText ? ' · ' + dealTypeText : ''}</div>
                    <div style="color: #2563eb; font-weight: 800; font-size: 14px;">${formatKoreanPrice(property.price || 0)}</div>
                  </div>
                `;
                infoWindowRef.current?.setContent(content);
                infoWindowRef.current?.open(map, marker);
              }
            });
          }

          // 비동기 루프 종료 시점 판정
          if (processedCount === properties.length && !bounds.isEmpty()) {
            map.setBounds(bounds);
          }
        });
      } else {
        processedCount++;
      }
    });

    return () => {
      isMounted = false;
      // 마커를 지우는 동작은 렌더링 주기에만 (데이터가 다시 들어오면 자동 클린업됨)
    };
  }, [isInitialized, properties]); // properties가 바뀔 때만 마커 리프레시

  // 3. 궁합 계산
  useEffect(() => {
    if (selectedProperty && sajuData) {
      const result = getCompatibilityScore(sajuData, {
        id: selectedProperty.id,
        direction: selectedProperty.direction || '남향',
        floor: selectedProperty.floor || 5
      });
      setCompatibility(result);
    } else {
      setCompatibility(null);
    }
  }, [selectedProperty, sajuData]);


  return (
    <div className="relative h-full w-full bg-slate-50 border border-slate-200">
      {/* 지도 컨테이너 - 항상 존재하도록 하여 인스턴스 파괴 방지 */}
      <div ref={mapRef} className="w-full h-full" style={{ visibility: isInitialized ? 'visible' : 'hidden' }}></div>

      {/* 로딩 오버레이 */}
      {(isMapDataLoading || !isInitialized) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mb-3"></div>
          <span className="text-sm text-slate-500 font-bold">지도를 불러오는 중입니다...</span>
        </div>
      )}

      {/* 매물 정보 패널 */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-2xl p-5 z-30 animate-in slide-in-from-bottom-5 border border-slate-200">
          <button
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-900 transition-colors p-1"
            onClick={() => {
              setSelectedProperty(null);
              infoWindowRef.current?.close();
            }}
          >
            ✕
          </button>

          <Link href={`/properties/${selectedProperty.id}`}>
            <h3 className="font-extrabold text-lg mb-2 hover:text-primary transition-colors cursor-pointer pr-8 leading-tight">
              {selectedProperty.title}
            </h3>
          </Link>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="bg-primary/10 text-primary border-none text-[11px] px-2 py-0.5 font-bold">
              {selectedProperty.type}
            </Badge>
            {selectedProperty.dealType && Array.isArray(selectedProperty.dealType) && selectedProperty.dealType
              .filter(t => ['매매', '전세', '월세'].includes(t))
              .map((type, idx) => (
                <Badge
                  key={idx}
                  className={cn("border-none text-[11px] px-2 py-0.5 font-bold",
                    type === '매매' ? 'bg-red-50 text-red-600' :
                      type === '전세' ? 'bg-blue-50 text-blue-600' :
                        type === '월세' ? 'bg-indigo-50 text-indigo-600' :
                          'bg-slate-50 text-slate-600'
                  )}
                >
                  {type}
                </Badge>
              ))}
          </div>

          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
            {sajuData && compatibility ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" /> 사주 궁합 분석
                  </span>
                  <span className={`text-sm font-black ${compatibility.score >= 80 ? 'text-green-600' : compatibility.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                    {compatibility.score}점
                  </span>
                </div>
                <div className="p-3 bg-purple-50/50 rounded-lg text-xs leading-relaxed text-slate-700 font-medium border border-purple-100/30">
                  {compatibility.comment}
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    className="flex-1 text-[11px] bg-purple-600 text-white font-bold py-1.5 rounded hover:bg-purple-700 transition-colors"
                    onClick={() => setIsSajuDetailOpen(true)}
                  >
                    보고서 보기
                  </button>
                  <button
                    className="flex-1 text-[11px] bg-white text-purple-600 border border-purple-200 font-bold py-1.5 rounded hover:bg-purple-50 transition-colors"
                    onClick={() => setIsTarotOpen(true)}
                  >
                    타로 조언
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={user ? openSajuModal : undefined}
                className="flex items-center justify-between cursor-pointer group"
              >
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-400 transition-colors" /> 내 운세와 맞을까?
                </span>
                {user ? (
                  <span className="text-[11px] font-black text-purple-600 group-hover:underline">분석하기 &gt;</span>
                ) : (
                  <Link href="/auth">
                    <span className="text-[11px] font-black text-purple-600 group-hover:underline">회원가입 후 확인 &gt;</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-400 font-bold">매매가</span>
              <span className="text-xl font-black text-primary leading-none">
                {formatKoreanPrice(selectedProperty.price || 0)}
              </span>
            </div>
            <Link href={`/properties/${selectedProperty.id}`} className="w-full">
              <Button className="w-full h-11 bg-slate-900 hover:bg-black text-white font-black text-sm rounded-lg">
                상세 정보 확인하기
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Modals */}
      <SajuFormModal />
      {selectedProperty && (
        <TarotModal
          isOpen={isTarotOpen}
          onClose={() => setIsTarotOpen(false)}
          propertyTitle={selectedProperty.title}
        />
      )}
      <SajuDetailModal
        isOpen={isSajuDetailOpen}
        onClose={() => setIsSajuDetailOpen(false)}
        sajuData={sajuData}
      />
    </div>
  );
};

export default PropertyMap;