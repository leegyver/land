import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  Layers, 
  Map as MapIcon, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  Loader2, 
  TrendingUp, 
  Filter, 
  Check, 
  X,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PropertyLookupMapProps {
  lat: number;
  lng: number;
  addressName: string;
  onSelectAddress: (address: string) => void;
  isLoading?: boolean;
}

declare global {
  interface Window {
    kakao: any;
  }
}

interface TransactionItem {
  id: number;
  deal_type: '토지' | '단독다가구' | '아파트';
  umd_nm: string;
  jibun: string;
  address_name: string;
  deal_date: string;
  deal_amount: number;
  dealAmountFormatted: string;
  deal_area: number;
  pyeong: number;
  pyeong_price: number;
  pyeongPriceFormatted: string;
  jimok?: string;
  land_use?: string;
  building_name?: string;
  lat: number;
  lng: number;
}

export default function PropertyLookupMap({
  lat,
  lng,
  addressName,
  onSelectAddress,
  isLoading = false
}: PropertyLookupMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const overlayInstance = useRef<any>(null);
  const txOverlaysRef = useRef<any[]>([]);

  const [isCadastral, setIsCadastral] = useState(true); // 지적편집도 기본 ON
  const [mapType, setMapType] = useState<"ROADMAP" | "HYBRID">("ROADMAP");
  const [isMapReady, setIsMapReady] = useState(false);
  const [clickedAddress, setClickedAddress] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  // 5년 실거래가 지도 오버레이 설정
  const [showTransactions, setShowTransactions] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['토지', '단독다가구', '아파트']);
  const [selectedYears, setSelectedYears] = useState<number>(5);
  const [visibleTxCount, setVisibleTxCount] = useState<number>(0);
  const [isZoomTooFar, setIsZoomTooFar] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  // ── 실거래가 오버레이 정리 함수 ──
  const clearTxOverlays = useCallback(() => {
    if (txOverlaysRef.current && txOverlaysRef.current.length > 0) {
      txOverlaysRef.current.forEach(ov => ov.setMap(null));
      txOverlaysRef.current = [];
    }
  }, []);

  // ── 지도 영역 내 실거래가 불러오기 및 렌더링 ──
  const fetchAndRenderTransactions = useCallback(async () => {
    if (!mapInstance.current || !window.kakao || !showTransactions) {
      clearTxOverlays();
      setVisibleTxCount(0);
      return;
    }

    const map = mapInstance.current;
    const level = map.getLevel();

    // 줌 레벨이 5보다 크면(너무 멀면) 화면 과부하 방지
    if (level > 5) {
      clearTxOverlays();
      setIsZoomTooFar(true);
      setVisibleTxCount(0);
      return;
    }
    setIsZoomTooFar(false);

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    try {
      const queryUrl = `/api/property/ganghwa-transactions?minLat=${sw.getLat()}&maxLat=${ne.getLat()}&minLng=${sw.getLng()}&maxLng=${ne.getLng()}&types=${selectedTypes.join(',')}&years=${selectedYears}&limit=120`;
      const res = await fetch(queryUrl);
      if (!res.ok) return;
      const data = await res.json();

      if (!data.success || !Array.isArray(data.items)) return;

      clearTxOverlays();
      const items: TransactionItem[] = data.items;
      setVisibleTxCount(items.length);

      const newOverlays: any[] = [];

      items.forEach((item) => {
        if (!item.lat || !item.lng) return;

        const pos = new window.kakao.maps.LatLng(item.lat, item.lng);

        // 오버레이 엘리먼트 생성
        const el = document.createElement("div");
        el.className = "cursor-pointer transition-transform transform hover:scale-110 active:scale-95 select-none -translate-y-4";
        
        let bgColor = "bg-emerald-600";
        let typeBadge = "토지";
        if (item.deal_type === '단독다가구') {
          bgColor = "bg-amber-600";
          typeBadge = "주택";
        } else if (item.deal_type === '아파트') {
          bgColor = "bg-blue-600";
          typeBadge = "아파트";
        }

        const dateSub = item.deal_date ? `'${item.deal_date.substring(2, 4)}.${item.deal_date.substring(5, 7)}` : '';
        const pyeongPriceShort = item.pyeong_price > 0 ? `평당 ${item.pyeong_price.toLocaleString()}만` : '';

        el.innerHTML = `
          <div class="flex flex-col items-center">
            <div class="${bgColor} text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md border border-white/80 whitespace-nowrap flex items-center gap-1">
              <span class="opacity-90">${typeBadge}</span>
              <span class="font-extrabold">${item.dealAmountFormatted}</span>
            </div>
            <div class="bg-slate-900/80 text-white text-[9px] px-1.5 py-0.2 rounded mt-0.5 shadow font-medium whitespace-nowrap">
              ${pyeongPriceShort || dateSub}
            </div>
          </div>
        `;

        el.onclick = (e) => {
          e.stopPropagation();
          setSelectedTx(item);
        };

        const overlay = new window.kakao.maps.CustomOverlay({
          position: pos,
          content: el,
          yAnchor: 1.0,
          zIndex: 10
        });

        overlay.setMap(map);
        newOverlays.push(overlay);
      });

      txOverlaysRef.current = newOverlays;
    } catch (err) {
      console.error("실거래가 지도 오버레이 렌더링 실패:", err);
    }
  }, [showTransactions, selectedTypes, selectedYears, clearTxOverlays]);

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (!window.kakao || !window.kakao.maps) return;

      const defaultLat = lat && lat > 0 ? lat : 37.744774;
      const defaultLng = lng && lng > 0 ? lng : 126.494269;
      const center = new window.kakao.maps.LatLng(defaultLat, defaultLng);

      const options = {
        center,
        level: 3, // 필지 지번이 잘 보이는 상세 레벨
        draggable: true,
        scrollwheel: true
      };

      const map = new window.kakao.maps.Map(mapRef.current, options);
      mapInstance.current = map;

      // 지적편집도 기본 활성화
      map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);

      // 중심 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: center,
        map: map,
        zIndex: 20
      });
      markerInstance.current = marker;

      // 커스텀 오버레이 생성
      const overlayContent = document.createElement("div");
      overlayContent.className = "bg-slate-900/90 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700 whitespace-nowrap pointer-events-none -translate-y-12 font-medium z-30";
      overlayContent.innerHTML = `<span class="text-blue-400 font-bold">📍 선택된 필지:</span> ${addressName || "선택 지번"}`;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: center,
        content: overlayContent,
        yAnchor: 1.3,
        zIndex: 25
      });
      overlay.setMap(map);
      overlayInstance.current = overlay;

      // ── 지번 클릭 리스너 등록 ──
      window.kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        const clickLat = latlng.getLat();
        const clickLng = latlng.getLng();

        setSelectedTx(null);
        setIsGeocoding(true);

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(clickLng, clickLat, (result: any, status: any) => {
          setIsGeocoding(false);
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            const doc = result[0];
            const newAddr = doc.address?.address_name || doc.road_address?.address_name;
            if (newAddr) {
              setClickedAddress(newAddr);
              marker.setPosition(latlng);
              
              if (overlayInstance.current) {
                overlayContent.innerHTML = `<span class="text-emerald-400 font-bold">📍 클릭 지번:</span> ${newAddr}`;
                overlayInstance.current.setPosition(latlng);
              }

              // 상위 컴포넌트 호출 -> 토지/건물/실거래 자동 조회
              onSelectAddress(newAddr);
            }
          }
        });
      });

      // ── 지도 이동/확대 이벤트 (디바운스 연동) ──
      let debounceTimer: any = null;
      window.kakao.maps.event.addListener(map, "idle", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchAndRenderTransactions();
        }, 200);
      });

      setIsMapReady(true);
      fetchAndRenderTransactions();
    };

    if (window.kakao && window.kakao.maps) {
      if (window.kakao.maps.load) {
        window.kakao.maps.load(initMap);
      } else {
        initMap();
      }
    } else {
      const timer = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(timer);
          if (window.kakao.maps.load) {
            window.kakao.maps.load(initMap);
          } else {
            initMap();
          }
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, []);

  // 필터나 기간, ON/OFF 변경 시 재조회
  useEffect(() => {
    if (isMapReady) {
      fetchAndRenderTransactions();
    }
  }, [showTransactions, selectedTypes, selectedYears, isMapReady, fetchAndRenderTransactions]);

  // 2. 검색 주소 변경 시 지도 중심 및 마커 갱신
  useEffect(() => {
    if (!mapInstance.current || !lat || !lng || lat <= 0 || lng <= 0) return;

    const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
    mapInstance.current.setCenter(moveLatLon);
    mapInstance.current.setLevel(3);

    if (markerInstance.current) {
      markerInstance.current.setPosition(moveLatLon);
    }

    if (overlayInstance.current) {
      overlayInstance.current.setPosition(moveLatLon);
      const content = overlayInstance.current.getContent();
      if (content) {
        content.innerHTML = `<span class="text-blue-400 font-bold">📍 선택된 필지:</span> ${addressName}`;
      }
    }

    // 새 위치에서 실거래가 갱신
    setTimeout(() => {
      fetchAndRenderTransactions();
    }, 300);
  }, [lat, lng, addressName, fetchAndRenderTransactions]);

  // 3. 지적편집도 토글 핸들러
  const toggleCadastral = useCallback(() => {
    if (!mapInstance.current || !window.kakao) return;
    const map = mapInstance.current;
    if (isCadastral) {
      map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
      setIsCadastral(false);
    } else {
      map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
      setIsCadastral(true);
    }
  }, [isCadastral]);

  // 4. 지도 타입(일반/스카이뷰) 토글
  const toggleMapType = useCallback(() => {
    if (!mapInstance.current || !window.kakao) return;
    const map = mapInstance.current;
    if (mapType === "ROADMAP") {
      map.setMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
      setMapType("HYBRID");
    } else {
      map.setMapTypeId(window.kakao.maps.MapTypeId.ROADMAP);
      setMapType("ROADMAP");
    }
  }, [mapType]);

  // 5. 줌 조절
  const zoomIn = () => {
    if (!mapInstance.current) return;
    mapInstance.current.setLevel(mapInstance.current.getLevel() - 1);
  };
  const zoomOut = () => {
    if (!mapInstance.current) return;
    mapInstance.current.setLevel(mapInstance.current.getLevel() + 1);
  };

  // 거래 유형 필터 토글
  const toggleType = (t: string) => {
    setSelectedTypes(prev => 
      prev.includes(t) 
        ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) 
        : [...prev, t]
    );
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      
      {/* 상단 안내 & 상태 바 */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 max-w-[calc(100%-110px)]">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-slate-200/80 flex items-center gap-2 text-xs">
          <Compass className="w-4 h-4 text-blue-600 animate-spin shrink-0" style={{ animationDuration: "12s" }} />
          <span className="font-semibold text-slate-800 truncate">원하는 필지를 클릭하면 해당 지번이 즉시 분석됩니다</span>
          {isGeocoding && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] py-0 h-4 flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              분석 중
            </Badge>
          )}
        </div>

        {/* 실거래가 필터 및 카운트 바 */}
        {showTransactions && (
          <div className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200/80 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              실거래가 ({selectedYears}년):
            </span>

            {/* 유형 선택 */}
            <div className="inline-flex rounded-md shadow-xs bg-slate-100 p-0.5">
              {(['토지', '단독다가구', '아파트'] as const).map((t) => {
                const label = t === '단독다가구' ? '주택' : t;
                const isSelected = selectedTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                      isSelected 
                        ? (t === '토지' ? 'bg-emerald-600 text-white' : t === '단독다가구' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white')
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 기간 선택 */}
            <div className="inline-flex rounded-md shadow-xs bg-slate-100 p-0.5">
              {([1, 3, 5] as const).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setSelectedYears(y)}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                    selectedYears === y ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>

            {/* 표시 건수 */}
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] py-0 h-4 font-semibold">
              {isZoomTooFar ? "확대 필요" : `화면 내 ${visibleTxCount}건`}
            </Badge>
          </div>
        )}
      </div>

      {/* 우측 상단 지도 컨트롤 버튼들 */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        {/* 5년 실거래가 토글 버튼 */}
        <Button
          type="button"
          size="sm"
          onClick={() => setShowTransactions(prev => !prev)}
          variant={showTransactions ? "default" : "outline"}
          className={`h-8 px-2.5 text-xs font-bold shadow-md transition-all ${
            showTransactions 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" 
              : "bg-white/95 text-slate-700 hover:bg-slate-100"
          }`}
          title="강화군 5년 실거래가 지도 오버레이 켜기/끄기"
        >
          <TrendingUp className="w-3.5 h-3.5 mr-1" />
          실거래 {showTransactions ? "ON" : "OFF"}
        </Button>

        {/* 지적편집도 토글 버튼 */}
        <Button
          type="button"
          size="sm"
          onClick={toggleCadastral}
          variant={isCadastral ? "default" : "outline"}
          className={`h-8 px-2.5 text-xs font-bold shadow-md transition-all ${
            isCadastral 
              ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600" 
              : "bg-white/95 text-slate-700 hover:bg-slate-100"
          }`}
          title="지적편집도(용도지역/지번 경계선) 켜기/끄기"
        >
          <Layers className="w-3.5 h-3.5 mr-1" />
          지적도 {isCadastral ? "ON" : "OFF"}
        </Button>

        {/* 스카이뷰 토글 버튼 */}
        <Button
          type="button"
          size="sm"
          onClick={toggleMapType}
          variant="outline"
          className="h-8 px-2.5 text-xs font-bold bg-white/95 text-slate-700 hover:bg-slate-100 shadow-md"
        >
          <MapIcon className="w-3.5 h-3.5 mr-1" />
          {mapType === "ROADMAP" ? "위성(스카이뷰)" : "일반지도"}
        </Button>

        {/* 줌 버튼 */}
        <div className="flex flex-col bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={zoomIn}
            className="p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-700 border-b border-slate-200 transition-colors"
            title="확대"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            className="p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors"
            title="축소"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 지도 렌더링 컨테이너 */}
      <div 
        ref={mapRef} 
        className="w-full h-[360px] sm:h-[460px] cursor-crosshair"
      />

      {/* 클릭된 실거래가 상세 팝업 카드 */}
      {selectedTx && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Badge className={
                  selectedTx.deal_type === '토지' ? 'bg-emerald-600 text-white' :
                  selectedTx.deal_type === '단독다가구' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                }>
                  {selectedTx.deal_type}
                </Badge>
                <span className="font-extrabold text-base text-slate-900">
                  {selectedTx.dealAmountFormatted}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-1 truncate">
                {selectedTx.address_name}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div>
              <span className="text-slate-400">거래일자:</span>
              <span className="font-semibold text-slate-700 ml-1">{selectedTx.deal_date}</span>
            </div>
            <div>
              <span className="text-slate-400">거래면적:</span>
              <span className="font-semibold text-slate-700 ml-1">
                {selectedTx.deal_area > 0 ? `${selectedTx.deal_area}㎡ (${selectedTx.pyeong}평)` : '-'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">평당 단가:</span>
              <span className="font-bold text-emerald-700 ml-1">{selectedTx.pyeongPriceFormatted}</span>
              {selectedTx.jimok && (
                <span className="ml-2 text-slate-500">지목: {selectedTx.jimok}</span>
              )}
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            className="w-full mt-2.5 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1"
            onClick={() => {
              onSelectAddress(selectedTx.address_name);
              setSelectedTx(null);
            }}
          >
            <span>이 지번 대장 & 분석 조회</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* 로딩 인디케이터 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-30 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/80 text-white text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>대장 및 실거래 데이터 조회 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
