import { Helmet } from "react-helmet";
import NoticeBanner from "@/components/home/NoticeBanner";
import PropertyMap from "@/components/map/PropertyMap";
import PropertySection from "@/components/home/PropertySection";
import BannerSlider from "@/components/home/BannerSlider";
import Hero from "@/components/home/Hero";
import ReviewSection from "@/components/home/ReviewSection";
import { useQuery } from "@tanstack/react-query";
import { News, Auction } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Calendar, ArrowRight, Newspaper, Youtube, Play, BookOpen, Search, Map, ThumbsUp, MessageSquare, Gavel, ShieldCheck, Clock, CheckCircle2, Phone, Sparkles, Trees, Home as HomeIcon } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// 유튜브 비디오 타입 정의
interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt?: string;
}

// 네이버 블로그 포스트 타입 정의
interface BlogPost {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  publishedAt: string;
  category: string;
  summary?: string;
}

const HomePage = () => {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");

  // 최신 유튜브 영상 데이터 가져오기 (이가이버 유튜브 - 채널ID: UCCG3_JlKhgalqhict7tKkbA)
    // 유튜브 라이브 상태 확인
  const { data: channel1Live } = useQuery<{ isLive: boolean; videoId?: string }>({
    queryKey: ["/api/youtube/live", "UCCG3_JlKhgalqhict7tKkbA"],
    queryFn: async () => {
      const res = await fetch(`/api/youtube/live/UCCG3_JlKhgalqhict7tKkbA`);
      if (!res.ok) return { isLive: false };
      return res.json();
    },
    refetchInterval: 2 * 60 * 1000,
  });

  const { data: channel2Live } = useQuery<{ isLive: boolean; videoId?: string }>({
    queryKey: ["/api/youtube/live", "UChvA8_nrczWDBYdHUum7Amw"],
    queryFn: async () => {
      const res = await fetch(`/api/youtube/live/UChvA8_nrczWDBYdHUum7Amw`);
      if (!res.ok) return { isLive: false };
      return res.json();
    },
    refetchInterval: 2 * 60 * 1000,
  });

  const { data: channel3Live } = useQuery<{ isLive: boolean; videoId?: string }>({
    queryKey: ["/api/youtube/live", "UCRicoETqTmWVJ8_o34OxwFg"],
    queryFn: async () => {
      const res = await fetch(`/api/youtube/live/UCRicoETqTmWVJ8_o34OxwFg`);
      if (!res.ok) return { isLive: false };
      return res.json();
    },
    refetchInterval: 2 * 60 * 1000,
  });

  const { data: latestVideos, isLoading: isVideosLoading } = useQuery<YouTubeVideo[]>({
    queryKey: ["/api/youtube/channel", "UCCG3_JlKhgalqhict7tKkbA", "5"],
    queryFn: async () => {
      const response = await fetch(`/api/youtube/channel/UCCG3_JlKhgalqhict7tKkbA?limit=5`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
  });

  // 두 번째 유튜브 채널 데이터 가져오기 (강화도부동산이야기 - 채널ID: UChvA8_nrczWDBYdHUum7Amw)
  const { data: secondChannelVideos, isLoading: isSecondVideosLoading } = useQuery<YouTubeVideo[]>({
    queryKey: ["/api/youtube/channel", "UChvA8_nrczWDBYdHUum7Amw", "5"],
    queryFn: async () => {
      const response = await fetch(`/api/youtube/channel/UChvA8_nrczWDBYdHUum7Amw?limit=5`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
  });

  // 세 번째 유튜브 채널 데이터 가져오기 (강화114부동산TV - 채널ID: UCRicoETqTmWVJ8_o34OxwFg)
  const { data: thirdChannelVideos, isLoading: isThirdVideosLoading } = useQuery<YouTubeVideo[]>({
    queryKey: ["/api/youtube/channel", "UCRicoETqTmWVJ8_o34OxwFg", "5"],
    queryFn: async () => {
      const response = await fetch(`/api/youtube/channel/UCRicoETqTmWVJ8_o34OxwFg?limit=5`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
  });

  // 최신 뉴스 데이터 가져오기
  const { data: latestNews } = useQuery<News[]>({
    queryKey: ["/api/news/latest"],
  });

  // 최신 블로그 포스트 데이터 가져오기
  const { data: latestBlogPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/latest"],
  });

  // 최신 커뮤니티 게시글 데이터 가져오기
  const { data: latestPosts } = useQuery<any[]>({
    queryKey: ["/api/posts", { limit: 3 }],
  });

  // 추천 경매 데이터 가져오기
  const { data: featuredAuctions, isLoading: isAuctionsLoading } = useQuery<Auction[]>({
    queryKey: ["/api/auctions/featured"],
  });

  // 테마별 추천 매물 탭 상태 ('latest' | 'urgent' | 'auction' | 'land' | 'house_comm')
  const [selectedThemeTab, setSelectedThemeTab] = useState<'latest' | 'urgent' | 'auction' | 'land' | 'house_comm'>('latest');

  // D-Day 계산 헬퍼
  const getDDay = (targetDateStr: string) => {
    try {
      const target = new Date(targetDateStr);
      const today = new Date();
      target.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "D-Day (오늘)";
      if (diffDays > 0) return `D-${diffDays}`;
      return "마감";
    } catch {
      return "진행중";
    }
  };

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



      {/* 강화군 유일 법원등록 경매·공매 신뢰 배너 */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white py-4 md:py-5 border-y-2 border-amber-500/40 shadow-xl">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
                <Gavel className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="bg-amber-400/20 text-amber-300 text-xs font-black px-2.5 py-0.5 rounded-md border border-amber-400/40">
                    강화군 유일
                  </span>
                  <span className="text-xs text-slate-400 font-medium">인천지방법원 등록 공제 4억원 보증</span>
                </div>
                <h2 className="text-base sm:text-xl font-extrabold text-white mt-0.5 tracking-tight">
                  법원 정식 등록 경매·공매 입찰대리 중개사
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  권리분석부터 현장 답사, 법원 입찰, 명도까지 100% 안전하게 이가이버가 직접 책임집니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setSelectedThemeTab('auction')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>🔨 이번 주 추천 경매 보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a
                href="tel:010-4787-3120"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5 fill-white" />
                <span>010-4787-3120</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Tab Property Showcase */}
      <section id="auction-section" className="pt-8 pb-10 bg-[#F7F5F0]">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">HOT & FEATURED</span>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>🔥 이가이버 추천 매물 & 경매관</span>
              </h2>
            </div>

            {/* Tab Buttons (5개 테마) */}
            <div className="flex flex-wrap gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl">
              <button
                onClick={() => setSelectedThemeTab('latest')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  selectedThemeTab === 'latest'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                ✨ 최근매물
              </button>
              <button
                onClick={() => setSelectedThemeTab('urgent')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  selectedThemeTab === 'urgent'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                🔥 초급매물
              </button>
              <button
                onClick={() => setSelectedThemeTab('auction')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1 ${
                  selectedThemeTab === 'auction'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>🔨 반값경매공매</span>
                <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">HOT</span>
              </button>
              <button
                onClick={() => setSelectedThemeTab('land')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  selectedThemeTab === 'land'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                🌲 토지추천
              </button>
              <button
                onClick={() => setSelectedThemeTab('house_comm')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  selectedThemeTab === 'house_comm'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                🏡 주택상가추천
              </button>
            </div>
          </div>

          {/* Tab 1: 법원 경매·공매 */}
          {selectedThemeTab === 'auction' && (
            <div>
              {isAuctionsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-80 bg-white rounded-3xl animate-pulse shadow-sm" />
                  ))}
                </div>
              ) : featuredAuctions && featuredAuctions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredAuctions.map((auction) => (
                    <div
                      key={auction.id}
                      className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 hover:shadow-2xl transition-all duration-300 flex flex-col group"
                    >
                      {/* Image & Badges */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={auction.imageUrl || "/assets/default-property-images/house.png"}
                          alt={auction.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Discount Badge */}
                        {auction.discountRate && auction.discountRate > 0 && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs sm:text-sm font-black px-2.5 py-1 rounded-full shadow-lg">
                            ⚡ -{auction.discountRate}% 반값
                          </div>
                        )}
                        {/* D-Day Badge */}
                        <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-xs font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-amber-400/30">
                          <Clock className="w-3 h-3" />
                          <span>{getDDay(auction.auctionDate)}</span>
                        </div>
                        {/* Case Number on Image */}
                        <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          {auction.court} | {auction.caseNumber}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {auction.propertyType}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              입찰일: {auction.auctionDate.split(' ')[0]}
                            </span>
                            {auction.safetyRating && (
                              <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" />
                                {auction.safetyRating}
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1 mb-1">
                            {auction.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                            {auction.address}
                          </p>

                          {/* Prices */}
                          <div className="bg-slate-50 rounded-2xl p-3 mb-3 border border-slate-100">
                            <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                              <span>감정평가액</span>
                              <span className="line-through">{auction.appraisalPrice}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs font-bold text-slate-700">최저입찰가</span>
                              <span className="text-lg sm:text-xl font-black text-rose-600">
                                {auction.minimumPrice}
                              </span>
                            </div>
                          </div>

                          {/* Expert Comment */}
                          {auction.expertComment && (
                            <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 mb-2 line-clamp-2">
                              💡 <strong>이가이버 소견:</strong> {auction.expertComment}
                            </p>
                          )}
                        </div>

                        {/* CTA Call Button */}
                        <a
                          href="tel:010-4787-3120"
                          className="mt-3 w-full bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Phone className="w-3.5 h-3.5 fill-current" />
                          <span>입찰대리 의뢰 (010-4787-3120)</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 경매 물건 준비 중일 때 안내 카드 */
                <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-amber-300 max-w-2xl mx-auto shadow-sm">
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                    <Gavel className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">
                    현재 강화군 추천 경매 물건을 권리분석 중입니다
                  </h3>
                  <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                    강화도 내에 관심 있으신 경매 사건번호나 원하시는 물건 조건(예: 1억원대 전원주택 경매)을 알려주시면 가장 안전한 물건을 직접 발굴해 드립니다.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a
                      href="tel:010-4787-3120"
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4 fill-slate-950" />
                      <span>010-4787-3120 경매 의뢰하기</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: 최근매물 */}
          {selectedThemeTab === 'latest' && (
            <div>
              <PropertySection
                title=""
                queryKey="/api/properties/latest"
                bgColor="bg-white"
              />
            </div>
          )}

          {/* Tab: 초급매물 */}
          {selectedThemeTab === 'urgent' && (
            <div>
              <PropertySection
                title=""
                queryKey="/api/properties/urgent"
                bgColor="bg-white"
              />
            </div>
          )}

          {/* Tab: 토지추천 */}
          {selectedThemeTab === 'land' && (
            <div>
              <PropertySection
                title=""
                queryKey="/api/properties/type/land"
                bgColor="bg-white"
              />
            </div>
          )}

          {/* Tab: 주택상가추천 */}
          {selectedThemeTab === 'house_comm' && (
            <div>
              <PropertySection
                title=""
                queryKey="/api/properties/type/house_comm"
                bgColor="bg-white"
              />
            </div>
          )}

          {/* Bottom View All Link */}
          <div className="text-center pt-8">
            <Link href="/properties">
              <Button variant="outline" size="lg" className="border-slate-300 text-slate-800 hover:bg-slate-900 hover:text-white px-8 h-11 rounded-full text-sm font-bold transition-all shadow-sm">
                강화도 전체 매물 더 보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Review Section */}
      <ReviewSection />

      {/* Map Section */}
      <section className="py-2 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="flex flex-col h-full justify-between gap-6">
              {/* Banners integrated into Map Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BannerSlider location="left" />
                <BannerSlider location="right" />
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">지도로 한눈에 보기</h2>

                <ul className="space-y-1 mb-2">
                  <li className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-full mr-4 text-primary">
                      <Map className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">정확한 위치 기반</h4>
                      <p className="text-slate-600">상세 주소 기반으로 정확한 매물 위치를 제공합니다.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-full mr-4 text-primary">
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">지역별 탐색</h4>
                      <p className="text-slate-600">강화읍, 길상면 등 원하시는 지역만 골라보세요.</p>
                    </div>
                  </li>
                </ul>
                <div className="mb-4">
                  <div className="flex w-full items-center space-x-2">
                    <Input
                      placeholder="지역명 검색 (예: 길상면)"
                      className="flex-1"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <Button size="icon" onClick={() => handleSearch()}><Search className="h-4 w-4" /></Button>
                  </div>
                </div>
                <Link href="/properties">
                  <Button size="lg" className="w-full sm:w-auto h-10">지도에서 매물 찾기</Button>
                </Link>
              </div>
            </div>
            <div className="h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-[#EBE5CE]">
              <PropertyMap showCrawled={true} />
            </div>
          </div>
        </div>
      </section >

      {/* YouTube Section 1: 이가이버 유튜브 */}
      <YouTubeSliderSection
        title="이가이버 유튜브"
        videos={latestVideos} isLoading={isVideosLoading} channelUrl="https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA" isLive={channel1Live?.isLive} liveVideoId={channel1Live?.videoId}
      />

      {/* YouTube Section 2: 강화도 부동산이야기 */}
      <YouTubeSliderSection
        title="강화도 부동산이야기"
        videos={secondChannelVideos} isLoading={isSecondVideosLoading} channelUrl="https://youtube.com/channel/UChvA8_nrczWDBYdHUum7Amw?si=K45xaU3foR1mSPFE" isLive={channel2Live?.isLive} liveVideoId={channel2Live?.videoId}
      />

      {/* YouTube Section 3: 강화114부동산TV */}
      <YouTubeSliderSection
        title="강화114부동산TV"
        videos={thirdChannelVideos} isLoading={isThirdVideosLoading} channelUrl="https://youtube.com/channel/UCRicoETqTmWVJ8_o34OxwFg" isLive={channel3Live?.isLive} liveVideoId={channel3Live?.videoId}
      />

      <section className="pt-4 pb-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* News */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
                  <Newspaper className="h-5 w-5 mr-2 text-primary" />
                  부동산 뉴스
                </h2>
                <Link href="/news" className="text-primary hover:underline text-xs font-medium">전체보기</Link>
              </div>
              <div className="space-y-[4px] md:space-y-4">
                {latestNews?.slice(0, 3).map((news) => (
                  <Link key={news.id} href={`/news/${news.id}`} className="block">
                    <div className="group flex gap-4 cursor-pointer">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <img src={news.imageUrl ?? "https://via.placeholder.com/150"} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className="mb-1 text-xs px-1.5 py-0 h-5 bg-blue-50 text-blue-600 border-none">{news.category}</Badge>
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm md:text-base group-hover:text-primary transition-colors">{news.title}</h3>
                        <p className="text-xs md:text-sm text-gray-500 line-clamp-2 mt-0.5">{news.summary}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-500" />
                  실시간 커뮤니티
                </h2>
                <Link href="/community" className="text-primary hover:underline text-xs font-medium">전체보기</Link>
              </div>
              <div className="space-y-[4px] md:space-y-4">
                {latestPosts?.slice(0, 3).map((post) => (
                  <Link key={post.id} href={`/community/${post.id}`} className="block">
                    <div className="group flex items-center gap-4 cursor-pointer">
                      <div className="w-20 h-20 flex-shrink-0 bg-orange-50 rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                        {post.imageUrls && post.imageUrls.length > 0 ? (
                          <img src={post.imageUrls[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <MessageSquare className="w-8 h-8 text-orange-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="mb-1 text-xs px-1.5 py-0 h-5 bg-orange-100 text-orange-600 border-none font-bold">
                          {post.category === 'qa' ? '궁금해요' : post.category === 'stories' ? '강화도이야기' : '건축/리모델링'}
                        </Badge>
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm md:text-base group-hover:text-orange-500 transition-colors">{post.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            {post.author?.nickname || post.author?.username || '익명'}
                          </span>
                          <span>•</span>
                          <span>{post.createdAt ? format(new Date(post.createdAt), "MM.dd") : ""}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  이가이버 포럼
                </h2>
                <a href="https://blog.naver.com/9551304" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-medium">전체보기</a>
              </div>
              <div className="space-y-[4px] md:space-y-4">
                {latestBlogPosts?.slice(0, 3).map((post) => (
                  <a key={post.id} href={post.link} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="group flex items-center gap-4 cursor-pointer">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <img
                          src={post.thumbnail || "/assets/default-forum.png"}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="mb-1 text-xs px-1.5 py-0 h-5 border-green-600 text-green-600 font-bold">{post.category}</Badge>
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm md:text-base group-hover:text-green-600 transition-colors">{post.title}</h3>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-1 font-medium">
                          <Calendar className="h-3 w-3" />
                          {post.publishedAt}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

// 유튜브 슬라이더 섹션 컴포넌트
const YouTubeSliderSection = ({ title, videos, isLoading, channelUrl, isLive, liveVideoId }: {
  title: string,
  videos: YouTubeVideo[] | undefined,
  isLoading: boolean,
  channelUrl: string,
  isLive?: boolean,
  liveVideoId?: string
}) => {
  return (
    <section className="py-2 bg-slate-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-row justify-between items-center mb-2">
          <div>
            <h2 className="text-lg md:text-2xl font-bold mb-0 flex items-center">
              <Youtube className="h-5 w-5 md:h-6 md:w-6 text-red-600 mr-2" />
              {title}
            </h2>
          </div>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0 text-gray-300 hover:text-white transition-colors flex items-center text-sm"
          >
            더보기 <ArrowRight className="ml-1 h-3 w-3" />
          </a>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-800 h-64 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full relative px-2"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {videos?.map((video) => (
                <CarouselItem key={video.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-[45%] lg:basis-1/4 xl:basis-1/5">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group h-full block"
                  >
                    <div className="bg-slate-800 rounded-xl overflow-hidden hover:transform hover:-translate-y-2 transition-all duration-300 shadow-lg border border-slate-700 h-full flex flex-col">
                      <div className="relative aspect-video overflow-hidden shrink-0">
                        <img
                          src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-red-600 p-3 rounded-full text-white">
                            <Play className="h-6 w-6 fill-current" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex-grow bg-slate-800">
                        <h3 className="font-semibold line-clamp-2 text-gray-100 group-hover:text-red-400 transition-colors text-sm">
                          {video.title}
                        </h3>
                      </div>
                    </div>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white/10 border-white/20 text-white hover:bg-white/20" />
              <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white/10 border-white/20 text-white hover:bg-white/20" />
            </div>
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default HomePage;
