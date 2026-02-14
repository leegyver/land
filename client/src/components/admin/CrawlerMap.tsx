import { useEffect, useRef, useState } from 'react';
import { MapPin, Eye } from 'lucide-react';

interface CrawledProperty {
    id: number;
    atclNo: string;
    atclNm: string;
    rletTpNm: string;
    tradTpNm: string;
    prc: string;
    spc1: string;
    spc2: string;
    flrInfo: string;
    lat: number;
    lng: number;
    imgUrl: string;
    crawledAt: string;
    direction?: string;
    rltrNm?: string;
}

interface CrawlerMapProps {
    properties: CrawledProperty[];
}

const CrawlerMap = ({ properties }: CrawlerMapProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markers = useRef<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<CrawledProperty | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [useDistrict, setUseDistrict] = useState(false);
    const [useSkyview, setUseSkyview] = useState(false);
    const [showRoadview, setShowRoadview] = useState(false);
    const [clickedInfo, setClickedInfo] = useState<{ address: string, lat: number, lng: number } | null>(null);

    const roadviewContainer = useRef<HTMLDivElement>(null);
    const roadviewInstance = useRef<any>(null);
    const roadviewClient = useRef<any>(null);
    const rvMarker = useRef<any>(null);
    const rvIndicator = useRef<any>(null);

    // 1. Initialize Map
    useEffect(() => {
        if (!mapContainer.current || mapInstance.current) return;

        let isMounted = true;

        const initMap = () => {
            if (!isMounted || !mapContainer.current || mapInstance.current) return;

            const options = {
                center: new window.kakao.maps.LatLng(37.7466, 126.4881), // Ex: Ganghwa-eup
                level: 8,
                draggable: true,
                scrollwheel: true
            };

            try {
                const map = new window.kakao.maps.Map(mapContainer.current, options);
                mapInstance.current = map;

                // Add click event for address search
                const geocoder = new window.kakao.maps.services.Geocoder();
                const rvClient = new window.kakao.maps.RoadviewClient();
                roadviewClient.current = rvClient;

                window.kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
                    const latlng = mouseEvent.latLng;

                    // Address search
                    geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
                        if (status === window.kakao.maps.services.Status.OK) {
                            const addr = result[0].address.address_name;
                            setClickedInfo({
                                address: addr,
                                lat: latlng.getLat(),
                                lng: latlng.getLng()
                            });
                            // Close property info if open
                            setSelectedProperty(null);

                            // Sync Roadview if enabled
                            if (roadviewInstance.current) {
                                rvClient.getNearestPanoId(latlng, 50, (panoId: any) => {
                                    if (panoId) {
                                        roadviewInstance.current.setPanoId(panoId, latlng);
                                    }
                                });
                            }
                        }
                    });
                });

                setIsMapLoaded(true);
            } catch (err) {
                console.error("KakaoMap init failed, retrying...", err);
                setTimeout(initMap, 500);
            }
        };

        const loadKakao = () => {
            if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
                window.kakao.maps.load(initMap);
            } else {
                setTimeout(loadKakao, 100);
            }
        };

        loadKakao();

        return () => {
            isMounted = false;
        };
    }, []);

    // 2. Render Markers
    useEffect(() => {
        const map = mapInstance.current;
        if (!isMapLoaded || !map || !properties) return;

        // Cleanup existing markers
        markers.current.forEach(m => m.setMap(null));
        markers.current = [];

        const bounds = new window.kakao.maps.LatLngBounds();
        let hasValidMarker = false;

        properties.forEach((prop) => {
            if (!prop.lat || !prop.lng) return;

            const position = new window.kakao.maps.LatLng(prop.lat, prop.lng);

            const marker = new window.kakao.maps.Marker({
                map: map,
                position: position,
                title: prop.atclNm,
                clickable: true
            });

            window.kakao.maps.event.addListener(marker, 'click', () => {
                setSelectedProperty(prop);
            });

            markers.current.push(marker);
            bounds.extend(position);
            hasValidMarker = true;
        });

        if (hasValidMarker) {
            map.setBounds(bounds);
        }

    }, [isMapLoaded, properties]);

    // 3. Handle Cadastral Map Toggle
    useEffect(() => {
        const map = mapInstance.current;
        if (!isMapLoaded || !map) return;

        if (useDistrict) {
            map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
        } else {
            map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
        }
    }, [isMapLoaded, useDistrict]);

    // Handle Skyview Toggle
    useEffect(() => {
        const map = mapInstance.current;
        if (!isMapLoaded || !map) return;

        if (useSkyview) {
            map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
        } else {
            map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
        }
    }, [isMapLoaded, useSkyview]);

    // Handle Roadview Overlay on Map
    useEffect(() => {
        const map = mapInstance.current;
        if (!isMapLoaded || !map) return;

        if (showRoadview) {
            map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.ROADVIEW);
        } else {
            map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.ROADVIEW);
        }
    }, [isMapLoaded, showRoadview]);

    // 4. Initialize Roadview
    useEffect(() => {
        if (showRoadview && roadviewContainer.current && !roadviewInstance.current) {
            const rv = new window.kakao.maps.Roadview(roadviewContainer.current);
            roadviewInstance.current = rv;

            // Sync Roadview POV to Map Marker
            window.kakao.maps.event.addListener(rv, 'init', () => {
                // SVG for Roadview Position Marker
                const markerSvg = `
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="13" cy="13" r="10" fill="#f97316" stroke="white" stroke-width="2"/>
                        <circle cx="13" cy="13" r="4" fill="white"/>
                    </svg>
                `;
                const markerDataUri = `data:image/svg+xml;base64,${btoa(markerSvg)}`;

                // Create custom marker for Roadview position
                const rvMarkerImage = new window.kakao.maps.MarkerImage(
                    markerDataUri,
                    new window.kakao.maps.Size(26, 26),
                    { offset: new window.kakao.maps.Point(13, 13) }
                );

                rvMarker.current = new window.kakao.maps.Marker({
                    image: rvMarkerImage,
                    position: mapInstance.current.getCenter(),
                    map: mapInstance.current,
                    zIndex: 10
                });

                // SVG for POV Indicator (Arrow)
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
                indicatorContent.style.transition = 'transform 0.1s linear';

                rvIndicator.current = new window.kakao.maps.CustomOverlay({
                    position: mapInstance.current.getCenter(),
                    content: indicatorContent,
                    map: mapInstance.current,
                    xAnchor: 0.5,
                    yAnchor: 0.5,
                    zIndex: 11
                });
            });

            window.kakao.maps.event.addListener(rv, 'viewpoint_changed', () => {
                const viewpoint = rv.getViewpoint();
                if (rvIndicator.current) {
                    const content = rvIndicator.current.getContent() as HTMLElement;
                    content.style.transform = `rotate(${viewpoint.pan}deg)`;
                }
            });

            window.kakao.maps.event.addListener(rv, 'position_changed', () => {
                const pos = rv.getPosition();
                if (rvMarker.current) rvMarker.current.setPosition(pos);
                if (rvIndicator.current) rvIndicator.current.setPosition(pos);
                mapInstance.current.setCenter(pos);
            });

            // If we already have a clicked point, show it
            if (clickedInfo && roadviewClient.current) {
                const position = new window.kakao.maps.LatLng(clickedInfo.lat, clickedInfo.lng);
                roadviewClient.current.getNearestPanoId(position, 50, (panoId: any) => {
                    if (panoId) {
                        rv.setPanoId(panoId, position);
                    }
                });
            }
        }

        // Cleanup marker when roadview is closed
        if (!showRoadview && rvMarker.current) {
            rvMarker.current.setMap(null);
            rvMarker.current = null;
            if (rvIndicator.current) {
                rvIndicator.current.setMap(null);
                rvIndicator.current = null;
            }
            roadviewInstance.current = null;
        }
    }, [showRoadview]);

    return (
        <div className="flex flex-col gap-4">
            <div className="relative w-full h-[500px] bg-slate-100 rounded-lg overflow-hidden border">
                <div ref={mapContainer} className="w-full h-full" />

                {/* Map Type Controls */}
                {isMapLoaded && (
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                        {/* Zoom Controls */}
                        <div className="bg-white rounded shadow-md border overflow-hidden flex flex-col">
                            <button
                                onClick={() => {
                                    if (mapInstance.current) {
                                        mapInstance.current.setLevel(mapInstance.current.getLevel() - 1, { animate: true });
                                    }
                                }}
                                className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center bg-white text-slate-800 hover:bg-slate-100 border-b transition-colors font-bold text-xl md:text-lg"
                                title="확대"
                            >
                                +
                            </button>
                            <button
                                onClick={() => {
                                    if (mapInstance.current) {
                                        mapInstance.current.setLevel(mapInstance.current.getLevel() + 1, { animate: true });
                                    }
                                }}
                                className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center bg-white text-slate-800 hover:bg-slate-100 transition-colors font-bold text-xl md:text-lg"
                                title="축소"
                            >
                                -
                            </button>
                        </div>

                        {/* Feature Controls */}
                        <div className="bg-white rounded shadow-md border overflow-hidden flex flex-col">
                            <button
                                onClick={() => setUseSkyview(!useSkyview)}
                                className={`px-3 py-2 text-xs font-bold transition-colors border-b ${useSkyview ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                            >
                                스카이뷰
                            </button>
                            <button
                                onClick={() => setUseDistrict(!useDistrict)}
                                className={`px-3 py-2 text-xs font-bold transition-colors border-b ${useDistrict ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                            >
                                지적도
                            </button>
                            <button
                                onClick={() => setShowRoadview(!showRoadview)}
                                className={`px-3 py-2 text-xs font-bold transition-colors ${showRoadview ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                            >
                                로드뷰
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {!isMapLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
                        <span className="text-slate-500 text-sm">Validating Map...</span>
                    </div>
                )}

                {/* Info Overlay */}
                {selectedProperty && (
                    <div
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-xl z-20 w-80 border border-slate-200 animate-in fade-in slide-in-from-bottom-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-2 right-2 text-slate-400 hover:text-black p-1"
                            onClick={() => setSelectedProperty(null)}
                        >
                            ✕
                        </button>

                        <div className="flex gap-3 mb-2">
                            {selectedProperty.imgUrl ? (
                                <img src={selectedProperty.imgUrl} className="w-16 h-16 rounded object-cover flex-shrink-0" alt="" />
                            ) : (
                                <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>
                            )}
                            <div className="overflow-hidden">
                                <h4 className="font-bold text-base truncate pr-4" title={selectedProperty.atclNm}>
                                    {selectedProperty.atclNm}
                                </h4>
                                <p className="text-xs text-slate-500">
                                    {selectedProperty.rletTpNm} | {selectedProperty.tradTpNm}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {selectedProperty.flrInfo} | {selectedProperty.spc1 ? `${Math.round(Number(selectedProperty.spc1) / 3.3058)}평 (${selectedProperty.spc1}㎡)` : "-"}
                                </p>
                                {selectedProperty.rltrNm && (
                                    <p className="text-xs text-blue-600 mt-1 font-medium bg-blue-50 px-1 rounded inline-block">
                                        {selectedProperty.rltrNm}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t">
                            <span className="text-blue-600 font-bold text-lg">
                                {selectedProperty.prc}
                            </span>
                            <a
                                href={`https://m.land.naver.com/article/info/${selectedProperty.atclNo}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded font-bold transition-colors"
                            >
                                네이버 확인 &gt;
                            </a>
                        </div>
                    </div>
                )}

                {/* Clicked Address Overlay */}
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
                            <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] text-blue-600 font-bold mb-0.5 uppercase tracking-wider">클릭한 지점 주소</p>
                                <p className="text-xs font-medium text-slate-800 leading-tight">
                                    {clickedInfo.address}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Roadview Container */}
            {showRoadview && (
                <div className="w-full h-[400px] flex justify-center bg-black rounded-lg overflow-hidden border border-slate-800 animate-in fade-in slide-in-from-top-2 relative">
                    {/* Fixed Aspect Ratio Container (4:3) */}
                    <div className="h-full aspect-[4/3] bg-slate-900 overflow-hidden relative shadow-inner">
                        <div ref={roadviewContainer} className="w-full h-full" />
                    </div>

                    {!clickedInfo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-10 text-center">
                            <p className="text-sm font-bold text-white bg-slate-900/80 px-6 py-3 rounded-full shadow-xl border border-white/20">
                                지도를 클릭하여 로드뷰를 확인하세요.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CrawlerMap;
