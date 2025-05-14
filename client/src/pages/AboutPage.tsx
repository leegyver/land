import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { MapIcon, DownloadIcon, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// 실거래가 데이터 인터페이스
interface Transaction {
  거래금액: string;
  건축년도?: string;
  년: string;
  월: string;
  일: string;
  아파트?: string;
  주택유형?: string;
  토지거래구분?: string;
  전용면적?: string;
  법정동?: string;
  지번?: string;
  층?: string;
  type: string;
  address?: string;
  lat?: number;
  lng?: number;
}

interface TransactionsResponse {
  success: boolean;
  count: number;
  data: Transaction[];
}

declare global {
  interface Window {
    kakao: any;
  }
}

const AboutPage = () => {
  const { toast } = useToast();
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [infowindow, setInfowindow] = useState<any>(null);

  // 실거래가 데이터 조회
  const { data: transactionsData, isLoading, isError } = useQuery<TransactionsResponse>({
    queryKey: ['/api/real-estate/transactions'],
    queryFn: getQueryFn({ on401: 'throw' }),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // 카카오맵 초기화
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      initializeMap();
    } else {
      const script = document.createElement('script');
      script.async = true;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_API_KEY}&autoload=false&libraries=services`;
      script.onload = () => {
        window.kakao.maps.load(() => {
          initializeMap();
        });
      };
      document.head.appendChild(script);
    }

    return () => {
      // 마커 및 인포윈도우 제거
      markers.forEach(marker => marker.setMap(null));
      if (infowindow) infowindow.close();
    };
  }, []);

  // 지도 초기화 함수
  const initializeMap = () => {
    const container = document.getElementById('real-estate-map');
    if (!container) {
      console.error('지도 컨테이너가 없습니다');
      return;
    }

    const options = {
      center: new window.kakao.maps.LatLng(37.7456, 126.4949), // 강화군 중심 좌표
      level: 9
    };

    const kakaoMap = new window.kakao.maps.Map(container, options);
    setMap(kakaoMap);

    // 인포윈도우 생성
    const info = new window.kakao.maps.InfoWindow({ zIndex: 1 });
    setInfowindow(info);

    console.log('강화군 실거래가 지도 초기화 완료');
  };

  // 실거래가 데이터로 마커 생성
  useEffect(() => {
    if (!map || !transactionsData || !transactionsData.data || transactionsData.data.length === 0) {
      return;
    }

    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const geocoder = new window.kakao.maps.services.Geocoder();
    const newMarkers: any[] = [];
    let processedCount = 0;

    // 좌표 변환 성공 시 마커 생성 함수
    const createMarker = (transaction: Transaction, position: any) => {
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        map: map,
        position: position,
        title: transaction.address
      });

      // 거래금액에 콤마 추가
      const formattedPrice = Number(transaction.거래금액).toLocaleString() + '만원';

      // 마커 클릭 이벤트 - 인포윈도우 표시
      window.kakao.maps.event.addListener(marker, 'click', function() {
        let content = `<div style="padding:15px;width:300px;line-height:1.5;font-size:14px;">`;
        
        // 거래 유형 표시
        if (transaction.type === '아파트') {
          content += `<div><strong>${transaction.아파트 || '아파트'}</strong></div>`;
        } else if (transaction.type === '단독다가구') {
          content += `<div><strong>${transaction.주택유형 || '단독/다가구'}</strong></div>`;
        } else if (transaction.type === '토지') {
          content += `<div><strong>${transaction.토지거래구분 || '토지'}</strong></div>`;
        }
        
        // 주소 표시
        content += `<div>${transaction.address}</div>`;
        
        // 거래 날짜 표시
        content += `<div>거래일: ${transaction.년}.${transaction.월}.${transaction.일}</div>`;
        
        // 거래 금액 표시
        content += `<div style="color:#e03131;font-weight:bold;font-size:16px;margin-top:5px;">
                      ${formattedPrice}
                    </div>`;
        
        // 추가 정보 표시 (타입별 다른 정보)
        if (transaction.type === '아파트') {
          if (transaction.전용면적) {
            const pyeong = (parseFloat(transaction.전용면적) * 0.3025).toFixed(2);
            content += `<div>전용면적: ${transaction.전용면적}㎡ (${pyeong}평)</div>`;
          }
          if (transaction.층) {
            content += `<div>층수: ${transaction.층}층</div>`;
          }
          if (transaction.건축년도) {
            content += `<div>건축년도: ${transaction.건축년도}년</div>`;
          }
        } else if (transaction.type === '단독다가구') {
          if (transaction.전용면적) {
            const pyeong = (parseFloat(transaction.전용면적) * 0.3025).toFixed(2);
            content += `<div>연면적: ${transaction.전용면적}㎡ (${pyeong}평)</div>`;
          }
          if (transaction.건축년도) {
            content += `<div>건축년도: ${transaction.건축년도}년</div>`;
          }
        }
        
        content += `</div>`;
        
        infowindow.setContent(content);
        infowindow.open(map, marker);
      });

      newMarkers.push(marker);
    };

    // 주소로 좌표 검색
    const processTransaction = (transaction: Transaction, index: number) => {
      if (!transaction.address) return;
      
      setTimeout(() => {
        geocoder.addressSearch(transaction.address, function(result: any, status: any) {
          processedCount++;
          
          if (status === window.kakao.maps.services.Status.OK) {
            const position = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            createMarker(transaction, position);
          } else {
            console.log(`주소 검색 실패: ${transaction.address}`);
          }
          
          // 모든 처리가 완료되면 마커 상태 업데이트
          if (processedCount === transactionsData.data.length) {
            setMarkers(newMarkers);
            
            // 마커가 있는 영역으로 지도 범위 재설정
            if (newMarkers.length > 0) {
              const bounds = new window.kakao.maps.LatLngBounds();
              newMarkers.forEach(marker => {
                bounds.extend(marker.getPosition());
              });
              map.setBounds(bounds);
            }
          }
        });
      }, index * 50); // 요청 간격을 두어 API 제한 회피
    };

    // 최대 50개만 처리 (API 호출 제한 고려)
    const dataToProcess = transactionsData.data.slice(0, 50);
    dataToProcess.forEach(processTransaction);

  }, [map, transactionsData]);

  // 타입별 필터링 및 거래일, 금액별 정렬 기능 추가 가능

  return (
    <div className="pt-16"> {/* Offset for fixed header */}
      <Helmet>
        <title>강화도 실거래가 | 이가이버부동산</title>
        <meta 
          name="description" 
          content="강화도 지역 부동산의 실거래가 정보를 확인하세요. 이가이버부동산에서 제공하는 강화도 지역 토지, 주택, 아파트 등의 최신 실거래가 정보를 확인할 수 있습니다."
        />
        <meta property="og:title" content="강화도 실거래가 | 이가이버부동산" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="강화도 지역 부동산의 실거래가 정보를 확인하세요. 이가이버부동산에서 제공하는 강화도 지역 토지, 주택, 아파트 등의 최신 실거래가 정보를 확인할 수 있습니다." />
      </Helmet>

      <div className="bg-primary/10 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">강화도 실거래가</h1>
          <p className="text-gray-medium mt-2">
            강화도 지역 부동산 실거래가 정보를 확인하세요.
          </p>
          
          {/* 데이터 로딩 상태 표시 */}
          {isLoading && (
            <div className="flex items-center gap-2 mt-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">실거래가 데이터를 불러오는 중...</span>
            </div>
          )}
          
          {/* 데이터 로드 완료 표시 */}
          {transactionsData && transactionsData.count > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-sm bg-primary/5">
                최근 3개월 데이터
              </Badge>
              <Badge variant="outline" className="text-sm bg-primary/5">
                {transactionsData.count}건의 실거래 내역
              </Badge>
            </div>
          )}

          {/* 데이터가 없는 경우 알림 */}
          {!isLoading && (!transactionsData || transactionsData.count === 0) && (
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="text-sm bg-yellow-100 text-yellow-800">
                데이터 로드 대기 중
              </Badge>
              <span className="text-sm text-muted-foreground">API 연동이 필요합니다</span>
            </div>
          )}
        </div>
      </div>
      
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* 지도 영역 */}
          <div className="mx-auto max-w-5xl">
            <div className="mb-3 flex items-center">
              <MapIcon className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-bold">지도로 실거래가 보기</h2>
              <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                {isError && (
                  <span className="text-destructive">데이터 로드 중 오류가 발생했습니다</span>
                )}
                <span>지도에서 마커를 클릭하면 자세한 정보를 확인할 수 있습니다</span>
              </div>
            </div>
            <div className="h-[70vh] w-full rounded-lg overflow-hidden shadow-lg">
              <div id="real-estate-map" className="w-full h-full"></div>
            </div>
            
            {/* 데이터가 없는 경우 안내 메시지 */}
            {!isLoading && (!transactionsData || transactionsData.count === 0) && (
              <div className="mt-6 p-6 border border-yellow-200 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-2">현재 실거래가 데이터가 없습니다</h3>
                <p className="text-gray-700 mb-4">공공데이터포털 실거래가 API 연동을 위한 설정이 필요합니다.</p>
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <p className="font-semibold mb-2">API 활성화 절차:</p>
                  <ol className="list-decimal pl-5 mb-2 space-y-1 text-gray-700">
                    <li>공공데이터포털(data.go.kr)에서 회원 가입 및 로그인</li>
                    <li>다음 API 서비스에 대한 활용 신청:
                      <ul className="list-disc pl-5 mt-1 mb-1">
                        <li>국토교통부 아파트매매 실거래 자료</li>
                        <li>국토교통부 단독/다가구 실거래 자료</li>
                        <li>국토교통부 토지 실거래 자료</li>
                      </ul>
                    </li>
                    <li>마이페이지 &gt; 오픈API &gt; 서비스 관리에서 API 상태 확인</li>
                    <li>승인 완료 후 발급받은 API 키를 관리자에게 전달</li>
                  </ol>
                  <p className="text-sm text-gray-500">* API 승인이 완료되면 실시간 실거래가 데이터를 확인하실 수 있습니다. (승인까지 최대 1-2일 소요)</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
