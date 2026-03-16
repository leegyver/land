import { Helmet } from "react-helmet";
import NoticeBanner from "@/components/home/NoticeBanner";
import PropertyMap from "@/components/map/PropertyMap";
import PropertySection from "@/components/home/PropertySection";
import BannerSlider from "@/components/home/BannerSlider";
import YoutubeSection from "@/components/home/YoutubeSection";
import NewsAndBlogSection from "@/components/home/NewsAndBlogSection";
import Hero from "@/components/home/Hero";
import ReviewSection from "@/components/home/ReviewSection";
import { Link, useLocation } from "wouter";
import { useRef, useCallback, useEffect, useState } from "react";
import { ArrowRight, Search, Map, Mic, MicOff, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Types are now in src/types/speech-recognition.d.ts
import type { SpeechRecognition, SpeechRecognitionEvent } from "@/types/speech-recognition";

const HomePage = () => {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ko-KR';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setSearchKeyword(transcript);
        handleSearch(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert("음성 검색은 보안 연결(HTTPS) 환경이나 지원되는 브라우저(Chrome, Safari 등)에서만 사용 가능합니다.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening]);

  const handleSearch = (keyword?: string) => {
    const term = keyword || searchKeyword;
    if (term.trim()) {
      setLocation(`/properties?keyword=${encodeURIComponent(term.trim())}`);
    } else {
      setLocation("/properties");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <Helmet>
        <title>이가이버부동산 - 강화도 부동산 전문 중개</title>
        <meta name="description" content="강화도 부동산 전문 중개 - 토지, 주택, 아파트, 상가 매물 정보. 강화도 지역 부동산 매매 및 임대 서비스를 제공합니다." />
        <meta name="keywords" content="강화도 부동산, 강화도 토지, 강화도 전원주택, 강화도 매물, 이가이버, 이가이버부동산" />

        {/* Open Graph / Facebook / Naver Blog */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://leegyver.com/" />
        <meta property="og:title" content="이가이버부동산 - 강화도 부동산 전문 중개" />
        <meta property="og:description" content="강화도 부동산 전문 중개 - 토지, 주택, 아파트, 상가 매물 정보. 강화도 지역 부동산 매매 및 임대 서비스를 제공합니다." />
        <meta property="og:image" content="https://leegyver.com/images/thumbnail.png" />
        <meta property="og:site_name" content="이가이버부동산" />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://leegyver.com/" />
        <meta name="twitter:title" content="이가이버부동산 - 강화도 부동산 전문 중개" />
        <meta name="twitter:description" content="강화도 부동산 전문 중개 - 토지, 주택, 아파트, 상가 매물 정보. 강화도 지역 부동산 매매 및 임대 서비스를 제공합니다." />
        <meta name="twitter:image" content="https://leegyver.com/images/thumbnail.png" />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": "이가이버부동산",
              "image": "https://leegyver.com/images/thumbnail.png",
              "@id": "https://leegyver.com",
              "url": "https://leegyver.com",
              "telephone": "032-934-3120", 
              "priceRange": "$$",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "인천광역시 강화군 강화읍 남문로 51 (남산리 96-1)",
                "addressLocality": "Ganghwa-gun",
                "addressRegion": "Incheon",
                "postalCode": "23030",
                "addressCountry": "KR"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 37.6437,
                "longitude": 126.4912
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday"
                ],
                "opens": "09:00",
                "closes": "18:00"
              },
              "sameAs": [
                "https://blog.naver.com/9551304",
                "https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA"
              ]
            }
          `}
        </script>
      </Helmet>

      {/* Notice Banner */}
      <NoticeBanner />

      {/* Hero Section */}
      <Hero />



      {/* PREMIUM Properties Section */}
      <section className="pt-12 pb-16 bg-slate-900 border-t-4 border-orange-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-600/5 rounded-full blur-[120px] transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        <div className="container mx-auto px-4 space-y-16 relative z-10">
          {/* 급매물 */}
          <div>
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4 border-b border-slate-700/50 pb-4">
              <div>
                <span className="inline-block bg-orange-600 text-white font-black text-[10px] md:text-xs px-2 py-0.5 rounded-sm tracking-wider mb-2">HOT LISTING</span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">강력 추천 급매물</h2>
              </div>
              <Link href="/properties?tag=urgent">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 w-full md:w-auto">
                  전체 매물 보기 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <PropertySection
              title=""
              queryKey="/api/properties/urgent?limit=4"
              bgColor="bg-transparent"
            />
          </div>

          {/* 협상 가능 매물 */}
          <div>
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4 border-b border-slate-700/50 pb-4">
              <div>
                <span className="inline-block bg-blue-600 text-white font-black text-[10px] md:text-xs px-2 py-0.5 rounded-sm tracking-wider mb-2">NEGOTIABLE</span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">가격 협의 가능 매물</h2>
              </div>
              <Link href="/properties?tag=negotiable">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 w-full md:w-auto">
                  전체 매물 보기 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <PropertySection
              title=""
              queryKey="/api/properties/negotiable?limit=4"
              bgColor="bg-transparent"
            />
          </div>

          {/* 장기 투자 추천 */}
          <div>
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4 border-b border-slate-700/50 pb-4">
              <div>
                <span className="inline-block bg-green-600 text-white font-black text-[10px] md:text-xs px-2 py-0.5 rounded-sm tracking-wider mb-2">FUTURE PROSPECT</span>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">장기투자 전략매물</h2>
              </div>
              <Link href="/properties?tag=long-term">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 w-full md:w-auto">
                  전체 매물 보기 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <PropertySection
              title=""
              queryKey="/api/properties/long-term?limit=4"
              bgColor="bg-transparent"
            />
          </div>

          {/* 추천 매물 */}
          <div>
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4 border-b border-slate-700/50 pb-4">
              <div>
                <span className="inline-block bg-purple-600 text-white font-black text-[10px] md:text-xs px-2 py-0.5 rounded-sm tracking-wider mb-2">RECOMMENDED</span>
                <h2 className="text-2xl md:text-3xl font-black flex items-center text-white tracking-tight">
                  <ThumbsUp className="w-6 h-6 md:w-7 md:h-7 mr-2 text-purple-400" /> 이가이버 추천매물
                </h2>
              </div>
              <Link href="/properties?tag=recommended">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10 w-full md:w-auto">
                  전체 매물 보기 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <PropertySection
              title=""
              queryKey="/api/properties/featured"
              bgColor="bg-transparent"
            />
          </div>

          <div className="text-center pt-8 border-t border-slate-800">
            <Link href="/properties">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white font-black px-12 h-14 md:h-16 rounded-full text-lg shadow-[0_0_30px_rgba(255,107,0,0.3)] hover:shadow-[0_0_40px_rgba(255,107,0,0.5)] transition-all hover:scale-105 border-2 border-orange-500/50">
                전체 매물 리스트 검색 <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section >

      {/* Review Section */}
      <ReviewSection />

      {/* MAP Section */}
      <section className="py-16 bg-slate-100 relative overflow-hidden">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
              <span className="text-orange-600">지역별 매물</span> 지도 검색
            </h2>
            <p className="text-slate-600 font-medium">강화도 전역의 매물을 지도로 한눈에 파악하세요</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-bl-full z-0 pointer-events-none opacity-50"></div>
                
                <h3 className="text-xl font-bold mb-4 flex items-center text-slate-800 relative z-10">
                  <Search className="w-5 h-5 mr-2 text-orange-600" /> 간편 지역 검색
                </h3>
                
                <div className="mb-6 relative z-10">
                  <Input
                    placeholder="지역명 (예: 길상면)"
                    className="w-full bg-slate-50 border-slate-200 text-slate-900 h-12 pr-12 focus-visible:ring-orange-500 font-medium shadow-sm transition-all focus:bg-white"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleListening}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl transition-colors ${isListening ? "bg-red-50 text-red-500 hover:bg-red-100 animate-pulse" : "text-slate-400 hover:text-orange-600 hover:bg-orange-50"}`}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </div>
                
                <Link href="/properties">
                  <Button className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-lg shadow-md hover:shadow-lg transition-all active:scale-95">
                    해당 지역 검색하기
                  </Button>
                </Link>
              </div>

              {/* Banners integrated here as "Sponsor Ads" */}
              <div className="space-y-4 hidden lg:block">
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-2 shadow-sm hover:shadow-md transition-shadow">
                  <BannerSlider location="left" />
                </div>
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-2 shadow-sm hover:shadow-md transition-shadow">
                  <BannerSlider location="right" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl border-[6px] border-white relative bg-slate-200">
                <div className="absolute inset-0 border border-slate-200 rounded-[24px] pointer-events-none z-20"></div>
                <PropertyMap showCrawled={true} />
              </div>
            </div>
            
            {/* Mobile Ads Grid */}
            <div className="grid grid-cols-2 gap-4 lg:hidden mt-4">
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-2 shadow-sm">
                <BannerSlider location="left" />
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-2 shadow-sm">
                <BannerSlider location="right" />
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* YouTube Section */}
      <YoutubeSection />

      {/* News & Blog Section (Combined) */}
      <NewsAndBlogSection />

    </>
  );
};

export default HomePage;
