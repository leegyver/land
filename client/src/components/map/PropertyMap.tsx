
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSaju } from '@/contexts/SajuContext';
import { getCompatibilityScore } from '@/lib/saju';
import SajuFormModal from '@/components/saju/SajuFormModal';
import TarotModal from '@/components/tarot/TarotModal';
import { Sparkles, HelpCircle, Layers, Eye, MapPin } from 'lucide-react';
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
  showCrawled?: boolean;
}

const PropertyMap = ({ properties: passedProperties, showCrawled = false }: PropertyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const infoWindowRef = useRef<any>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Map Feature States
  const [useDistrict, setUseDistrict] = useState(false);
  const [useSkyview, setUseSkyview] = useState(false);
  const [showRoadview, setShowRoadview] = useState(false);
  const [isJibunMode, setIsJibunMode] = useState(false);
  const [clickedInfo, setClickedInfo] = useState<{ address: string, lat: number, lng: number } | null>(null);

  // Roadview Refs
  const roadviewContainerRef = useRef<HTMLDivElement>(null);
  const roadviewInstanceRef = useRef<any>(null);
  const roadviewClientRef = useRef<any>(null);
  const rvMarkerRef = useRef<any>(null);
  const rvIndicatorRef = useRef<any>(null);

  // Saju & Tarot Logic
  const { sajuData, openSajuModal } = useSaju();
  const [isTarotOpen, setIsTarotOpen] = useState(false);
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
    queryKey: ['/api/properties/integrated', showCrawled], // Integrated API with filter
    queryFn: async () => {
      const res = await fetch(`/api/properties/integrated?includeCrawled=${showCrawled}`);
      if (!res.ok) throw new Error("Failed to fetch integrated properties");
      return res.json();
    },
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
          level: 9,
          scrollwheel: true, // Enable wheel zoom
          draggable: true,
        };

        const map = new window.kakao.maps.Map(mapRef.current, options);
        mapInstanceRef.current = map;
        infoWindowRef.current = new window.kakao.maps.InfoWindow({ zIndex: 1 });

        // Click listener for Jibun Mode
        window.kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
          // We'll handle logic in a separate effect that checks isJibunMode ref/state
          // But since state in listener is stale, we can dispatch a custom event or check a ref.
          // Or simply re-bind listener when mode changes (which is what we will do below).
        });

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

  // Handle Jibun Mode Toggle without re-rendering markers
  const isJibunModeRef = useRef(false);
  useEffect(() => {
    isJibunModeRef.current = isJibunMode;
  }, [isJibunMode]);

  // Handle Map Clicks for Jibun Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isInitialized || !map) return;

    const geocoder = new window.kakao.maps.services.Geocoder();

    const handleMapClick = (mouseEvent: any) => {
      // Check if we should ignore this click (e.g., marker was clicked)
      if (map && (map as any).ignoreNextClick) {
        (map as any).ignoreNextClick = false;
        return;
      }

      // Use Ref for current state check inside listener
      if (!isJibunModeRef.current) return;

      const latlng = mouseEvent.latLng;
      geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const addr = result[0]?.address?.address_name || result[0]?.road_address?.address_name;
          if (addr) {
            setClickedInfo({
              address: addr,
              lat: latlng.getLat(),
              lng: latlng.getLng()
            });
            // Also close property info if open
            setSelectedProperty(null);
            infoWindowRef.current?.close();

            // Sync Roadview if enabled
            if (showRoadview && roadviewClientRef.current && roadviewInstanceRef.current) {
              roadviewClientRef.current.getNearestPanoId(latlng, 50, (panoId: any) => {
                if (panoId) {
                  roadviewInstanceRef.current.setPanoId(panoId, latlng);
                }
              });
            }
          }
        }
      });
    };

    // Remove previous listener to avoid duplicates/stale state
    // Note: standard removeListener requires the exact function reference.
    // Since we define handleMapClick inside useEffect, it changes every time.
    // Kakao maps event listeners accumulate. We should be careful.
    // A clean way is to use a ref for the handler or clear all click listeners.
    // For now, let's assume we can remove it if we track it.
    // Actually, simpler: attach ONE listener in init, and check a mutable Ref for 'isJibunMode'.
    // But since I didn't do that in init, I'll do this:

    window.kakao.maps.event.addListener(map, 'click', handleMapClick);

    return () => {
      window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
    };
  }, [isInitialized, showRoadview]); // Removed isJibunMode dependency to prevent re-binding constantly (Ref handles it)


  // Handle Cadastral Map Toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isInitialized || !map) return;

    if (useDistrict) {
      map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
    } else {
      map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
    }
  }, [isInitialized, useDistrict]);

  // Handle Skyview (Hybrid) Toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isInitialized || !map) return;

    if (useSkyview) {
      map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
    } else {
      map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
    }
  }, [isInitialized, useSkyview]);


  // Handle Roadview Toggle
  useEffect(() => {
    if (showRoadview && roadviewContainerRef.current && !roadviewInstanceRef.current) {
      // Init Roadview
      const rv = new window.kakao.maps.Roadview(roadviewContainerRef.current);
      const rvClient = new window.kakao.maps.RoadviewClient();
      roadviewInstanceRef.current = rv;
      roadviewClientRef.current = rvClient;

      const map = mapInstanceRef.current;
      const center = map.getCenter();

      // Find nearest pano
      rvClient.getNearestPanoId(center, 50, (panoId: any) => {
        if (panoId) {
          rv.setPanoId(panoId, center);
        } else {
          // If no pano at center, try a default or just wait for click
          // console.log("No roadview at center");
        }
      });

      // Sync logic (Marker & Indicator)
      window.kakao.maps.event.addListener(rv, 'init', () => {
        // ... (Same marker logic as CrawlerMap) ...
        const markerSvg = `
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="13" cy="13" r="10" fill="#f97316" stroke="white" stroke-width="2"/>
                    <circle cx="13" cy="13" r="4" fill="white"/>
                </svg>
            `;
        const markerDataUri = `data:image/svg+xml;base64,${btoa(markerSvg)}`;
        const rvMarkerImage = new window.kakao.maps.MarkerImage(
          markerDataUri,
          new window.kakao.maps.Size(26, 26),
          { offset: new window.kakao.maps.Point(13, 13) }
        );

        rvMarkerRef.current = new window.kakao.maps.Marker({
          image: rvMarkerImage,
          position: center,
          map: map,
          zIndex: 10
        });

        const indicatorSvg = `
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2 L35 38 L20 30 L5 38 Z" fill="#f97316" fill-opacity="0.8" stroke="white" stroke-width="1.5"/>
                </svg>
            `;
        const indicatorDataUri = `data:image/svg+xml;base64,${btoa(indicatorSvg)}`;
        const indicatorContent = document.createElement('div');
        indicatorContent.style.width = '40px';
        indicatorContent.style.height = '40px';
        indicatorContent.style.backgroundImage = `url(${indicatorDataUri})`;
        indicatorContent.style.backgroundSize = 'contain';
        indicatorContent.style.backgroundRepeat = 'no-repeat';

        rvIndicatorRef.current = new window.kakao.maps.CustomOverlay({
          position: center,
          content: indicatorContent,
          map: map,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 11
        });
      });

      window.kakao.maps.event.addListener(rv, 'viewpoint_changed', () => {
        const viewpoint = rv.getViewpoint();
        if (rvIndicatorRef.current) {
          const content = rvIndicatorRef.current.getContent() as HTMLElement;
          content.style.transform = `rotate(${viewpoint.pan}deg)`;
        }
      });

      window.kakao.maps.event.addListener(rv, 'position_changed', () => {
        const pos = rv.getPosition();
        if (rvMarkerRef.current) rvMarkerRef.current.setPosition(pos);
        if (rvIndicatorRef.current) rvIndicatorRef.current.setPosition(pos);
        map.setCenter(pos);
      });

    } else if (!showRoadview && roadviewInstanceRef.current) {
      // Cleanup
      if (rvMarkerRef.current) rvMarkerRef.current.setMap(null);
      if (rvIndicatorRef.current) rvIndicatorRef.current.setMap(null);
      roadviewInstanceRef.current = null;
      // Ref to container is fine, we just hide it via React render
    }
  }, [showRoadview]);


  // 2. 매물 마커 렌더링 (데이터 변경 시 엔진을 건드리지 않고 마커만 조작)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!isInitialized || !map || !properties) return;

    // Define global close function for the info window
    (window as any).closePropertyInfoWindow = () => {
      infoWindowRef.current?.close();
    };

    // 기존 마커 즉시 클린업
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const geocoder = new window.kakao.maps.services.Geocoder();
    const bounds = new window.kakao.maps.LatLngBounds();
    let isMounted = true;
    let processedCount = 0;

    if (properties.length === 0) return;

    console.log(`PropertyMap: ${properties.length}개 매물 정보 처리 중...`);

    properties.forEach((property: any) => {
      const isNaver = property.source === 'naver';
      // Use existing lat/lng if available (Naver properties have them)
      if (property.latitude && property.longitude) {
        const position = new window.kakao.maps.LatLng(property.latitude, property.longitude);
        addMarker(position, property, isNaver);
        processedCount++;
        checkBounds();
      } else {
        // Geocode for properties without coordinates
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
              addMarker(position, property, isNaver);
              checkBounds();
            }
          });
        } else {
          processedCount++;
          checkBounds();
        }
      }
    });

    function checkBounds() {
      if (properties && processedCount === properties.length && !bounds.isEmpty()) {
        map.setBounds(bounds);
      }
    }

    function addMarker(position: any, property: any, isNaver: boolean) {
      // Custom Green Marker Data URI (SVG) - Teardrop shape
      const greenMarkerUri = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2229%22%20height%3D%2242%22%20viewBox%3D%220%200%2029%2042%22%3E%3Cpath%20d%3D%22M14.5%200C6.49%200%200%206.49%200%2014.5C0%2025.37%2014.5%2042%2014.5%2042S29%2025.37%2029%2014.5C29%206.49%2022.51%200%2014.5%200z%22%20fill%3D%22%2375D03C%22%2F%3E%3Ccircle%20cx%3D%2214.5%22%20cy%3D%2214.5%22%20r%3D%226%22%20fill%3D%22%23FFFFFF%22%2F%3E%3C%2Fsvg%3E";

      const imageSrc = isNaver
        ? greenMarkerUri
        : "https://t1.daumcdn.net/mapjsapi/images/marker.png"; // Default Blue marker
      const imageSize = new window.kakao.maps.Size(29, 42); // Standard marker size
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

      const marker = new window.kakao.maps.Marker({
        map: map,
        position: position,
        title: property.title,
        image: markerImage
      });

      markersRef.current.push(marker);
      bounds.extend(position);

      // Flag to ignore map click when marker is clicked
      window.kakao.maps.event.addListener(marker, 'click', () => {
        // Set flag on map instance to ignore the subsequent map click event
        if (map) {
          (map as any).ignoreNextClick = true;
          // Clear flag after short delay just in case map click doesn't fire
          setTimeout(() => {
            if (map) (map as any).ignoreNextClick = false;
          }, 200);
        }

        if (isMounted) {
          // Allow marker selection even in Jibun mode (removed restrict check)

          setSelectedProperty(property);
          setClickedInfo(null); // Clear clicked info if selecting property

          const dealTypes = property.dealType || [];
          let priceContent = '';

          // 매매 가격 표시
          if (dealTypes.includes('매매') && property.price && Number(property.price) > 0) {
            priceContent += `<div style="color: #2563eb; font-weight: 800; font-size: 14px;">매매 ${formatKoreanPrice(property.price)}</div>`;
          }

          // 전세 가격 표시
          if (dealTypes.includes('전세') && property.deposit && Number(property.deposit) > 0) {
            priceContent += `<div style="color: #059669; font-weight: 800; font-size: 14px;">전세 ${formatKoreanPrice(property.deposit)}</div>`;
          }

          // 월세 가격 표시
          if (dealTypes.includes('월세') && (Number(property.deposit) > 0 || Number(property.depositAmount) > 0 || Number(property.monthlyRent) > 0)) {
            const deposit = Number(property.deposit) || Number(property.depositAmount) || 0;
            const monthly = Number(property.monthlyRent) || 0;
            const depositText = deposit === 0 ? "0" : formatKoreanPrice(deposit);
            const monthlyText = monthly === 0 ? "0" : formatKoreanPrice(monthly);

            priceContent += `<div style="color: #7c3aed; font-weight: 800; font-size: 14px;">보증금 ${depositText} / 월 ${monthlyText}</div>`;
          }

          // 가격 정보가 없는 경우 기본 처리
          if (!priceContent) {
            priceContent = `<div style="color: #2563eb; font-weight: 800; font-size: 14px;">${formatKoreanPrice(property.price || 0) || '가격문의'}</div>`;
          }

          // Disclaimer for Naver properties
          const disclaimer = isNaver
            ? `<div style="margin-top: 5px; font-size: 10px; color: #666; line-height: 1.3; background-color: #f9fafb; padding: 4px; border-radius: 4px; border: 1px solid #e5e7eb;">
               이 매물은 공동중개를 진행해야하는 관계로 물건의 정확한 파악이 필요합니다. 정확한 정보를 원하시면 문의하기버튼을 누르시고 문의를 해주세요
             </div>`
            : '';

          // Use direct window.location.href for safer navigation in map context
          const actionButton = isNaver
            ? `<div onclick="window.location.href='/contact?tab=inquiry&atclNo=${property.atclNo}&title=${encodeURIComponent(property.title)}'" style="cursor:pointer; display:block; margin-top:5px; padding:5px; background:#10b981; color:white; text-align:center; border-radius:4px; font-size:12px; font-weight:bold;">문의하기</div>`
            : '';

          const closeButton = `<div onclick="window.closePropertyInfoWindow()" style="position: absolute; top: 6px; right: 8px; cursor: pointer; color: #999; font-size: 14px; font-weight: bold; line-height: 1; z-index:10;">✕</div>`;

          const content = `
                      <div style="padding: 15px 10px 10px 10px; width: 250px; height: auto; font-family: 'Pretendard', sans-serif; line-height: 1.25; display: flex; flex-direction: column; justify-content: center; position: relative;">
                        ${closeButton}
                        <div style="font-weight: 800; font-size: 13.5px; margin-bottom: 2px; word-break: keep-all; white-space: normal; color: #191919; padding-right: 15px;">${property.title}</div>
                        <div style="color: #6b7280; font-size: 11px; margin-bottom: 3px;">${property.type}</div>
                        <div style="display: flex; flex-direction: column; gap: 1px;">
                          ${priceContent}
                        </div>
                        ${disclaimer}
                        ${actionButton}
                      </div>
                    `;
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(map, marker);
        }
      });
    }

    return () => {
      isMounted = false;
      // Cleanup global closure
      delete (window as any).closePropertyInfoWindow;
    };
  }, [isInitialized, properties]);

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


  // Handle Geolocation (Find Near Me)
  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const map = mapInstanceRef.current;
        if (map) {
          const locPosition = new window.kakao.maps.LatLng(latitude, longitude);
          map.setCenter(locPosition);
          map.setLevel(5);

          new window.kakao.maps.Marker({
            map: map,
            position: locPosition,
            title: "내 위치"
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
      }
    );
  };

  // Handle Open Roadview in New Window
  const openRoadviewPopup = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const center = map.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();

    // Construct URL with optional property info if selected
    let url = `/popup/roadview?lat=${lat}&lng=${lng}`;

    if (selectedProperty) {
      url += `&title=${encodeURIComponent(selectedProperty.title)}`;
      if (selectedProperty.price) {
        const price = formatKoreanPrice(selectedProperty.price);
        url += `&price=${encodeURIComponent(price)}`;
      } else if (selectedProperty.deposit) {
        const price = formatKoreanPrice(selectedProperty.deposit);
        url += `&price=${encodeURIComponent('전세 ' + price)}`;
      }
    }

    // Open Roadview Popup Window
    const width = 1300;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      url,
      'RoadviewPopup',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=no,status=no`
    );
  };

  // Zoom Handlers
  const handleZoomIn = () => {
    const map = mapInstanceRef.current;
    if (map) map.setLevel(map.getLevel() - 1, { animate: true });
  };

  const handleZoomOut = () => {
    const map = mapInstanceRef.current;
    if (map) map.setLevel(map.getLevel() + 1, { animate: true });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 border border-slate-200">
      {/* Map Section - Always Full Height now */}
      <div className="w-full h-full relative">
        <div ref={mapRef} className="w-full h-full" style={{ visibility: isInitialized ? 'visible' : 'hidden' }}></div>

        {/* Map Type Controls */}
        {isInitialized && (
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            {/* Zoom Controls */}
            <div className="bg-white rounded-md shadow-md border overflow-hidden flex flex-col">
              <button
                onClick={handleZoomIn}
                className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center bg-white text-slate-800 hover:bg-slate-100 border-b transition-colors font-bold text-xl md:text-lg"
                title="확대"
              >
                +
              </button>
              <button
                onClick={handleZoomOut}
                className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center bg-white text-slate-800 hover:bg-slate-100 transition-colors font-bold text-xl md:text-lg"
                title="축소"
              >
                -
              </button>
            </div>

            {/* Feature Controls */}
            <div className="bg-white rounded-md shadow-md border overflow-hidden flex flex-col">
              <button
                onClick={handleFindNearMe}
                className="px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs font-bold transition-colors border-b flex items-center gap-2 md:gap-1.5 bg-white text-gray-700 hover:bg-gray-100"
                title="내 위치 중심"
              >
                <MapPin className="w-4 h-4 md:w-3.5 md:h-3.5 text-red-500" />
                <span className="hidden md:inline">내 위치</span>
              </button>
              <button
                onClick={() => setUseSkyview(!useSkyview)}
                className={cn(
                  "px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs font-bold transition-colors border-b flex items-center gap-2 md:gap-1.5",
                  useSkyview ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                )}
                title="스카이뷰(위성지도) 보기"
              >
                <Layers className="w-4 h-4 md:w-3.5 md:h-3.5" />
                <span className="hidden md:inline">스카이뷰</span>
              </button>
              <button
                onClick={() => setUseDistrict(!useDistrict)}
                className={cn(
                  "px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs font-bold transition-colors border-b flex items-center gap-2 md:gap-1.5",
                  useDistrict ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                )}
                title="지적도 보기"
              >
                <Layers className="w-4 h-4 md:w-3.5 md:h-3.5" />
                <span className="hidden md:inline">지적도</span>
              </button>
              <button
                onClick={openRoadviewPopup}
                className="px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs font-bold transition-colors border-b flex items-center gap-2 md:gap-1.5 bg-white text-gray-700 hover:bg-gray-100"
                title="로드뷰 크게 보기 (새 창)"
              >
                <Eye className="w-4 h-4 md:w-3.5 md:h-3.5" />
                <span className="hidden md:inline">로드뷰</span>
              </button>
              <button
                onClick={() => {
                  setIsJibunMode(!isJibunMode);
                  setClickedInfo(null);
                }}
                className={cn(
                  "px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs font-bold transition-colors flex items-center gap-2 md:gap-1.5",
                  isJibunMode ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                )}
                title="클릭하여 주소(지번) 확인"
              >
                <MapPin className="w-4 h-4 md:w-3.5 md:h-3.5" />
                <span className="hidden md:inline">지번보기</span>
              </button>
            </div>
          </div>
        )}

        {/* Clicked Address Info (Same as before) */}
        {clickedInfo && (
          <div
            className="absolute top-4 left-4 z-20 bg-white/95 p-3 rounded-lg shadow-lg border border-blue-200 animate-in fade-in slide-in-from-top-2 max-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-1 right-1 text-slate-400 hover:text-black p-1"
              onClick={() => setClickedInfo(null)}
            >
              ✕
            </button>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-purple-600 font-bold mb-0.5 uppercase tracking-wider">선택 위치 주소</p>
                <p className="text-xs font-medium text-slate-800 leading-tight">
                  {clickedInfo.address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {(isMapDataLoading || !isInitialized) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary mb-3"></div>
            <span className="text-sm text-slate-500 font-bold">지도를 불러오는 중입니다...</span>
          </div>
        )}

        {/* Property Info Panel */}
        {selectedProperty && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white rounded-xl shadow-2xl p-2 z-30 animate-in slide-in-from-bottom-5 border border-slate-200 max-h-[95%] overflow-y-auto scrollbar-hide">
            <button
              className="absolute top-1 right-1 text-slate-400 hover:text-slate-900 transition-colors p-1 z-10"
              onClick={() => {
                setSelectedProperty(null);
                infoWindowRef.current?.close();
              }}
            >
              <span className="text-xs font-bold font-mono">✕</span>
            </button>

            {sajuData && compatibility ? (
              // Simplified Fortune View - Compact
              <div className="py-1">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" /> 내 운세와의 궁합
                  </span>
                  <Badge className={cn(
                    "font-black text-[10px] px-2 py-0 h-5",
                    compatibility.score >= 80 ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                      compatibility.score >= 50 ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                        'bg-red-100 text-red-700 hover:bg-red-100'
                  )}>
                    {compatibility.score}점
                  </Badge>
                </div>

                <div className="p-2.5 bg-purple-50 rounded-lg text-[11px] leading-tight text-slate-700 font-bold border border-purple-100 mb-2 shadow-inner">
                  {compatibility.comment}
                </div>

                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-2 h-9 rounded-lg shadow-sm transition-all active:scale-[0.98] text-xs"
                  onClick={() => setLocation(`/properties/${selectedProperty.id}`)}
                >
                  운세와 상세정보 확인하기
                </Button>
              </div>
            ) : (
              // Ultra-Minimal Standard View - Compact
              <div className="py-0.5">
                <div
                  onClick={user ? openSajuModal : () => setLocation('/auth')}
                  className="flex items-center justify-between cursor-pointer group py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-purple-50 hover:border-purple-100 transition-all mb-2"
                >
                  <span className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 transition-colors" /> 내 운세와 맞을까?
                  </span>
                  <span className="text-[10px] text-purple-600 font-black bg-white px-1.5 py-0.5 rounded border border-purple-100 shadow-sm">분석하기</span>
                </div>

                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2 h-9 rounded-lg shadow-sm transition-all active:scale-[0.98] text-xs"
                  onClick={() => setLocation(`/properties/${selectedProperty.id}`)}
                >
                  상세보기
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <SajuFormModal />
      {selectedProperty && (
        <TarotModal
          isOpen={isTarotOpen}
          onClose={() => setIsTarotOpen(false)}
          propertyTitle={selectedProperty.title}
        />
      )}
    </div>
  );
};

export default PropertyMap;