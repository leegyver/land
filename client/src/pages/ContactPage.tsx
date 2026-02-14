import ContactForm from "@/components/contact/ContactForm";
import NoticeBoard from "@/components/notice/NoticeBoard";
import { MapPin, Phone, Mail, Clock, Copy, Navigation } from "lucide-react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    kakao: any;
  }
}

const ContactPage = () => {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("inquiry");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [useSkyview, setUseSkyview] = useState(false);
  const { toast } = useToast();

  const officeInfo = {
    address: "인천광역시 강화군 강화읍 남문로51, 1호",
    jibun: "인천 강화군 강화읍 남산리 96-1",
    phone: "032-934-3120",
    mobile: "010-4787-3120",
    email: "9551304@naver.com",
    owner: "이가이버 공인중개사 사무소",
    coords: { lat: 37.7441, lng: 126.4882 }
  };

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 탭 변경 시 mapRef가 존재하고 kakao 객체가 있으면 지도 그리기
    if (activeTab === "inquiry" && mapRef.current) {

      const loadMap = () => {
        if (!window.kakao || !window.kakao.maps) {
          // 카카오 스크립트가 아직 로드되지 않았으면 재시도
          setTimeout(loadMap, 100);
          return;
        }

        window.kakao.maps.load(() => {
          if (!mapRef.current) return;

          const geocoder = new window.kakao.maps.services.Geocoder();

          // 주소로 좌표 검색 (사용자가 카카오맵에서 잘 나온다고 했으므로 지오코더 신뢰)
          geocoder.addressSearch('인천광역시 강화군 강화읍 남문로 51', (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

              const mapOptions = {
                center: coords,
                level: 3
              };

              const map = new window.kakao.maps.Map(mapRef.current, mapOptions);
              mapInstanceRef.current = map;

              // 마커 표시
              const marker = new window.kakao.maps.Marker({
                map: map,
                position: coords
              });

              // 인포윈도우 (글자 크기 축소 요청 반영)
              const iwContent = `<div style="padding:3px;text-align:center;width:150px;word-break:keep-all;font-size:12px;"><b>${officeInfo.owner}</b><br><a href="https://map.kakao.com/link/to/이가이버공인중개사사무소,${result[0].y},${result[0].x}" style="color:blue;font-size:11px;" target="_blank">길찾기</a></div>`;
              const infowindow = new window.kakao.maps.InfoWindow({
                content: iwContent
              });
              infowindow.open(map, marker);
            } else {
              // 실패 시 기존 좌표 백업 사용 (하지만 거의 발생 안할 것임)
              const coords = new window.kakao.maps.LatLng(officeInfo.coords.lat, officeInfo.coords.lng);
              const map = new window.kakao.maps.Map(mapRef.current, { center: coords, level: 3 });
              mapInstanceRef.current = map;
              new window.kakao.maps.Marker({ map, position: coords });
            }
          });
        });
      };

      loadMap();
    }
  }, [activeTab]);

  // Handle Skyview Toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && window.kakao) {
      if (useSkyview) {
        map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
      } else {
        map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
      }
    }
  }, [useSkyview, activeTab]); // Include activeTab to re-apply if map re-inits

  // Handle Query Params for Tabs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "notice") setActiveTab("notice");
    else if (tab === "inquiry") setActiveTab("inquiry");
  }, [location]);

  // Extract query params for pre-filling form
  const queryParams = new URLSearchParams(window.location.search);
  const atclNo = queryParams.get("atclNo") || undefined;
  const propertyTitle = queryParams.get("title") || undefined;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: `${label}가 클립보드에 복사되었습니다.`,
    });
  };

  return (
    <div className="">
      <Helmet>
        <title>고객센터 | 이가이버부동산</title>
        <meta
          name="description"
          content="이가이버부동산 고객센터입니다. 문의하기 및 공지사항을 확인하세요."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">고객센터</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
            <TabsTrigger value="inquiry" className="text-lg">문의하기</TabsTrigger>
            <TabsTrigger value="notice" className="text-lg">공지사항</TabsTrigger>
          </TabsList>

          <TabsContent value="inquiry" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Contact Info & Map */}
              <div className="space-y-6">
                <Card className="overflow-hidden border-none shadow-md">
                  <CardContent className="p-0">
                    <div ref={mapRef} className="w-full h-[300px] lg:h-[400px] bg-gray-100 relative">
                      {/* Skyview Toggle */}
                      <div className="absolute top-4 right-4 z-20">
                        <button
                          onClick={() => setUseSkyview(!useSkyview)}
                          className={`px-3 py-2 text-xs font-bold rounded shadow-md border bg-white text-gray-700 hover:bg-gray-100 transition-colors ${useSkyview ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent' : ''}`}
                        >
                          스카이뷰
                        </button>
                      </div>
                      {!window.kakao && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          지도를 불러오는 중...
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-6 bg-white">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                          <MapPin className="h-5 w-5 text-primary" />
                          오시는 길 (본점)
                        </h3>
                        <div className="pl-7 space-y-1">
                          <p className="text-gray-800 font-medium text-lg">{officeInfo.address}</p>
                          <p className="text-gray-500 text-sm">(지번) {officeInfo.jibun}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-8"
                            onClick={() => copyToClipboard(officeInfo.address, "주소")}
                          >
                            <Copy className="h-3 w-3 mr-2" />
                            주소 복사
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                            <Phone className="h-5 w-5 text-primary" />
                            연락처
                          </h3>
                          <div className="pl-7 space-y-1">
                            <p className="text-gray-800 font-bold text-xl">{officeInfo.phone}</p>
                            <p className="text-gray-600 font-medium text-lg">{officeInfo.mobile}</p>
                            <p className="text-gray-500 text-sm">{officeInfo.owner} 대표</p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-8"
                                asChild
                              >
                                <a href={`tel:${officeInfo.phone}`}>
                                  <Phone className="h-3 w-3 mr-2" />
                                  유선
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-8"
                                asChild
                              >
                                <a href={`tel:${officeInfo.mobile}`}>
                                  <Phone className="h-3 w-3 mr-2" />
                                  무선
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                            <Clock className="h-5 w-5 text-primary" />
                            운영 시간
                          </h3>
                          <div className="pl-7">
                            <p className="text-gray-800 font-medium">09:00 - 19:00</p>
                            <p className="text-gray-500 text-sm">연중무휴</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: User Form */}
              <div className="space-y-6" ref={formRef}>
                <Card className="border-none shadow-md h-full">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <Mail className="h-6 w-6 text-primary" />
                      상담 신청
                    </h2>
                    <p className="text-gray-600 mb-8">
                      궁금하신 점을 남겨주시면 확인 후 신속하게 답변 드리겠습니다.
                    </p>
                    <ContactForm key={atclNo || 'default'} atclNo={atclNo} propertyTitle={propertyTitle} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notice" className="bg-white p-6 rounded-lg shadow-sm border min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <NoticeBoard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContactPage;
