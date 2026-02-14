import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Layers, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

declare global {
    interface Window {
        kakao: any;
    }
}

const RoadviewPopupPage = () => {
    const [location] = useLocation();
    const mapRef = useRef<HTMLDivElement>(null);
    const rvRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const rvInstanceRef = useRef<any>(null);
    const rvClientRef = useRef<any>(null);
    const rvMarkerRef = useRef<any>(null);
    const rvIndicatorRef = useRef<any>(null);

    const [isInitialized, setIsInitialized] = useState(false);

    // Parse query params
    const getParams = () => {
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const lat = parseFloat(params.get('lat') || '37.7464');
        const lng = parseFloat(params.get('lng') || '126.4878');
        const title = params.get('title');
        const price = params.get('price');
        return { lat, lng, title, price };
    };

    useEffect(() => {
        if (isInitialized) return;

        const loadKakao = () => {
            if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
                window.kakao.maps.load(init);
            } else {
                setTimeout(loadKakao, 200);
            }
        };

        const init = () => {
            if (!mapRef.current || !rvRef.current) return;
            const { lat, lng, title, price } = getParams();
            const position = new window.kakao.maps.LatLng(lat, lng);

            // 1. Init Map
            const mapOptions = {
                center: position,
                level: 3
            };
            const map = new window.kakao.maps.Map(mapRef.current, mapOptions);
            map.addControl(new window.kakao.maps.MapTypeControl(), window.kakao.maps.ControlPosition.TOPRIGHT);
            map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);

            // Show Roadview Overlay (Blue lines) by default
            map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.ROADVIEW);

            mapInstanceRef.current = map;

            // 1.1 Add Target Property Marker (Green Teardrop) if title exists
            if (title) {
                const greenMarkerUri = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2229%22%20height%3D%2242%22%20viewBox%3D%220%200%2029%2042%22%3E%3Cpath%20d%3D%22M14.5%200C6.49%200%200%206.49%200%2014.5C0%2025.37%2014.5%2042%2014.5%2042S29%2025.37%2029%2014.5C29%206.49%2022.51%200%2014.5%200z%22%20fill%3D%22%2375D03C%22%2F%3E%3Ccircle%20cx%3D%2214.5%22%20cy%3D%2214.5%22%20r%3D%226%22%20fill%3D%22%23FFFFFF%22%2F%3E%3C%2Fsvg%3E";
                const markerImage = new window.kakao.maps.MarkerImage(
                    greenMarkerUri,
                    new window.kakao.maps.Size(29, 42)
                );
                const marker = new window.kakao.maps.Marker({
                    position: position,
                    map: map,
                    image: markerImage,
                    zIndex: 20
                });

                // Add Label
                const labelContent = document.createElement('div');
                labelContent.className = 'px-2 py-1 bg-white border border-green-500 rounded text-xs font-bold text-slate-800 shadow-sm whitespace-nowrap transform -translate-y-12';
                labelContent.innerText = title;
                if (price) labelContent.innerText += ` (${price})`;

                const labelOverlay = new window.kakao.maps.CustomOverlay({
                    position: position,
                    content: labelContent,
                    map: map,
                    yAnchor: 2.2,
                    zIndex: 21
                });
            }


            // 2. Init Roadview
            const rv = new window.kakao.maps.Roadview(rvRef.current);
            const rvClient = new window.kakao.maps.RoadviewClient();
            rvInstanceRef.current = rv;
            rvClientRef.current = rvClient;

            // 3. Sync Logic
            rvClient.getNearestPanoId(position, 50, (panoId: any) => {
                if (panoId) {
                    rv.setPanoId(panoId, position);
                } else {
                    // Fallback if no roadview nearby
                    alert("선택한 위치(매물 위치) 주변에 로드뷰가 없습니다. 지도를 클릭하여 위치를 변경해보세요.");
                }
            });

            // Init Handler
            window.kakao.maps.event.addListener(rv, 'init', () => {
                // Create Marker
                const markerSvg = `
                    <svg width="30" height="30" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="13" cy="13" r="10" fill="#f97316" stroke="white" stroke-width="2"/>
                        <circle cx="13" cy="13" r="4" fill="white"/>
                    </svg>
                `;
                const markerImage = new window.kakao.maps.MarkerImage(
                    `data:image/svg+xml;base64,${btoa(markerSvg)}`,
                    new window.kakao.maps.Size(30, 30),
                    { offset: new window.kakao.maps.Point(15, 15) }
                );

                rvMarkerRef.current = new window.kakao.maps.Marker({
                    image: markerImage,
                    position: position,
                    map: map,
                    zIndex: 30
                });

                // Create Indicator (Fan shape)
                const indicatorSvg = `
                    <svg width="46" height="46" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2 L35 38 L20 30 L5 38 Z" fill="#f97316" fill-opacity="0.6" stroke="white" stroke-width="1.5"/>
                    </svg>
                `;
                const indicatorContent = document.createElement('div');
                indicatorContent.style.width = '46px';
                indicatorContent.style.height = '46px';
                indicatorContent.style.backgroundImage = `url(data:image/svg+xml;base64,${btoa(indicatorSvg)})`;
                indicatorContent.style.backgroundSize = 'contain';
                indicatorContent.style.backgroundRepeat = 'no-repeat';

                rvIndicatorRef.current = new window.kakao.maps.CustomOverlay({
                    position: position,
                    content: indicatorContent,
                    map: map,
                    xAnchor: 0.5,
                    yAnchor: 0.5,
                    zIndex: 29
                });
            });

            // Viewpoint Change
            window.kakao.maps.event.addListener(rv, 'viewpoint_changed', () => {
                const viewpoint = rv.getViewpoint();
                if (rvIndicatorRef.current) {
                    const content = rvIndicatorRef.current.getContent() as HTMLElement;
                    content.style.transform = `rotate(${viewpoint.pan}deg)`;
                }
            });

            // Position Change
            window.kakao.maps.event.addListener(rv, 'position_changed', () => {
                const pos = rv.getPosition();
                if (rvMarkerRef.current) rvMarkerRef.current.setPosition(pos);
                if (rvIndicatorRef.current) rvIndicatorRef.current.setPosition(pos);
                map.setCenter(pos);
            });

            // Map Click -> Move Roadview
            window.kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
                const latlng = mouseEvent.latLng;
                rvClient.getNearestPanoId(latlng, 50, (panoId: any) => {
                    if (panoId) {
                        rv.setPanoId(panoId, latlng);
                    }
                });
            });

            setIsInitialized(true);
        };

        loadKakao();
    }, []);

    // Toggle Cadastral Map
    // Toggle Cadastral & Skyview Map
    const [useDistrict, setUseDistrict] = useState(false);
    const [useSkyview, setUseSkyview] = useState(false);

    useEffect(() => {
        if (!mapInstanceRef.current) return;

        // District
        if (useDistrict) {
            mapInstanceRef.current.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
        } else {
            mapInstanceRef.current.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
        }

        // Skyview
        if (useSkyview) {
            mapInstanceRef.current.addOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
        } else {
            mapInstanceRef.current.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
        }
    }, [useDistrict, useSkyview, isInitialized]);

    return (
        <div className="flex flex-col h-[100dvh] w-screen overflow-hidden pb-24 md:pb-0">
            {/* Top: Map (Flexible height) */}
            <div className="flex-1 w-full relative border-b-4 border-slate-900">
                <div ref={mapRef} className="w-full h-full" />
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                        onClick={() => setUseDistrict(!useDistrict)}
                        className={cn(
                            "px-3 py-2 text-sm font-bold transition-colors bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2",
                            useDistrict ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent' : ''
                        )}
                    >
                        <Layers className="w-4 h-4" />
                        지적도
                    </button>
                    <button
                        onClick={() => setUseSkyview(!useSkyview)}
                        className={cn(
                            "px-3 py-2 text-sm font-bold transition-colors bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2",
                            useSkyview ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent' : ''
                        )}
                    >
                        <Layers className="w-4 h-4" />
                        스카이뷰
                    </button>
                    {/* Instruction Overlay */}
                    <div className="bg-white/90 px-3 py-2 text-xs font-bold rounded shadow border text-slate-700 pointer-events-none">
                        지도를 클릭하면 로드뷰 위치가 이동합니다
                    </div>
                </div>
            </div>

            {/* Bottom: Roadview (Flexible height) */}
            <div className="flex-1 w-full relative">
                <div ref={rvRef} className="w-full h-full" />
            </div>
        </div>
    );
};

export default RoadviewPopupPage;
