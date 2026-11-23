import React, { useEffect, useRef, useState, useCallback } from "react";
import { Layers, Map as MapIcon, ZoomIn, ZoomOut, Compass, Loader2 } from "lucide-react";
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

  const [isCadastral, setIsCadastral] = useState(true); // 지적편집도 기본 ON
  const [mapType, setMapType] = useState<"ROADMAP" | "HYBRID">("ROADMAP");
  const [isMapReady, setIsMapReady] = useState(false);
  const [clickedAddress, setClickedAddress] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);

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
        map: map
      });
      markerInstance.current = marker;

      // 커스텀 오버레이 생성
      const overlayContent = document.createElement("div");
      overlayContent.className = "bg-slate-900/90 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-slate-700 whitespace-nowrap pointer-events-none -translate-y-12 font-medium";
      overlayContent.innerHTML = `<span class="text-blue-400 font-bold">📍 선택된 필지:</span> ${addressName || "선택 지번"}`;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: center,
        content: overlayContent,
        yAnchor: 1.3
      });
      overlay.setMap(map);
      overlayInstance.current = overlay;

      // ── 지번 클릭 리스너 등록 ──
      window.kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        const clickLat = latlng.getLat();
        const clickLng = latlng.getLng();

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

      setIsMapReady(true);
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
  }, [lat, lng, addressName]);

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

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      
      {/* 안내 툴팁 바 */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-slate-200/80 flex items-center gap-2 text-xs">
        <Compass className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: "12s" }} />
        <span className="font-semibold text-slate-800">지도의 원하는 필지를 클릭하면 해당 지번이 즉시 조회됩니다</span>
        {isGeocoding && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] py-0 h-4 flex items-center gap-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            지번 분석 중
          </Badge>
        )}
      </div>

      {/* 우측 상단 지도 컨트롤 버튼들 */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
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
        className="w-full h-[320px] sm:h-[420px] cursor-crosshair"
      />

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
