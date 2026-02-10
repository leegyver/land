import { Helmet } from "react-helmet";
import PropertyMap from "@/components/map/PropertyMap";

import PropertySection from "@/components/home/PropertySection";
import BannerSlider from "@/components/home/BannerSlider";
import FeaturedProperties from "@/components/home/FeaturedProperties"; // Keep for safe removal later if needed, but unused in new layout
import { useQuery } from "@tanstack/react-query";
import { News } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useRef, useCallback, useEffect, useState } from "react";
import { Calendar, ArrowRight, Newspaper, Youtube, Play, BookOpen, Search, Map, Mic, MicOff, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { propertyTypeOptions } from "@/constants/property-types";

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

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

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

  // 최신 유튜브 영상 데이터 가져오기
  const { data: latestVideos, isLoading: isVideosLoading } = useQuery<YouTubeVideo[]>({
    queryKey: ["/api/youtube/latest"],
  });

  // 최신 뉴스 데이터 가져오기
  const { data: latestNews } = useQuery<News[]>({
    queryKey: ["/api/news/latest"],
  });

  // 최신 블로그 포스트 데이터 가져오기
  const { data: latestBlogPosts, isLoading: isBlogPostsLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/latest"],
  });

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
        <title>이가이버부동산 - 강화도 부동산의 모든 것</title>
        <meta name="description" content="강화도 토지, 전원주택, 상가 정직한 중개. 이가이버부동산이 함께합니다." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative w-full py-4 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/assets/uploads/home-banner-new.jpg")',
          backgroundSize: 'auto 100%'
        }}
      >
        <div className="absolute inset-0 bg-blue-900/10" />

        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center text-white">
          <h1 className="text-2xl md:text-4xl font-bold mb-6 drop-shadow-md leading-tight text-white mb-6">
            강화도의 소중한 공간,<br />
            <span className="text-[#FEE500] drop-shadow-lg">이가이버</span>가 찾아드립니다
          </h1>

          {/* Main Search Bar */}
          <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-full p-1 flex shadow-2xl items-center mb-1 relative">
            <Search className="ml-3 h-5 w-5 text-gray-400 shrink-0" />
            <Input
              className="border-0 focus-visible:ring-0 text-base px-3 text-black placeholder:text-gray-400 h-10 bg-transparent pr-12"
              placeholder="상호, 지역명 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleListening}
              className={`absolute right-20 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8 rounded-full hover:bg-gray-100 z-10 ${isListening ? "text-red-500 animate-pulse" : "text-gray-500 hover:text-primary"
                }`}
              title={!speechSupported ? "음성 검색 미지원 (HTTPS 필요)" : "음성 검색"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              size="sm"
              className="rounded-full px-6 text-base h-10 bg-blue-600 hover:bg-blue-700 shrink-0 z-20"
              onClick={() => handleSearch()}
            >
              검색
            </Button>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            <Link href="/properties">
              <Button variant="outline" className="bg-white/20 backdrop-blur-md border-white/40 text-white hover:bg-white hover:text-blue-600 h-8 px-3 rounded-full text-xs font-medium mb-1 transition-all hover:scale-105">
                전체
              </Button>
            </Link>
            {propertyTypeOptions.filter(type => type !== "기타").map((type) => (
              <Link key={type} href={`/properties?type=${encodeURIComponent(type)}`}>
                <Button variant="outline" className="bg-white/20 backdrop-blur-md border-white/40 text-white hover:bg-white hover:text-blue-600 h-8 px-3 rounded-full text-xs font-medium mb-1 transition-all hover:scale-105">
                  {type}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* Featured Properties Section */}
      <section className="pt-0 pb-0 bg-[#F7F5F0]">
        <div className="container mx-auto px-4">


          {/* 급매물 섹션 */}
          <PropertySection
            title="🔥 급매물"
            queryKey="/api/properties/urgent"
            bgColor="bg-red-50"
          />

          {/* 흥정 매물 섹션 */}
          <PropertySection
            title="🤝 가격 협의 가능"
            queryKey="/api/properties/negotiable"
            bgColor="bg-blue-50"
          />

          {/* 추천 매물 섹션 */}
          <PropertySection
            title={<div className="flex items-center"><ThumbsUp className="w-6 h-6 mr-2 text-primary" />추천 매물</div>}
            queryKey="/api/properties/featured"
          />

          <div className="text-center py-3">
            <Link href="/properties">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white px-8 h-8 rounded-full text-sm">
                매물 더 보기 <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </section >



      {/* Map Section */}
      <section className="py-2 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="flex flex-col h-full justify-between gap-6">
              {/* Banners integrated into Map Section */}
              <div className="grid grid-cols-2 gap-4">
                <BannerSlider location="left" />
                <BannerSlider location="right" />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-1">지도로 한눈에 보기</h2>

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
                  <div className="flex w-full items-center space-x-2 relative">
                    <Input
                      placeholder="지역명 검색 (예: 길상면)"
                      className="flex-1 pr-10"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleListening}
                      className={`absolute right-12 top-1/2 transform -translate-y-1/2 p-1 h-7 w-7 z-10 ${isListening ? "text-red-500 animate-pulse" : "text-gray-500 hover:text-primary"
                        }`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" onClick={() => handleSearch()}><Search className="h-4 w-4" /></Button>
                  </div>
                </div>
                <Link href="/properties">
                  <Button size="lg" className="w-full sm:w-auto h-10">지도에서 매물 찾기</Button>
                </Link>
              </div>
            </div>
            <div className="h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-[#EBE5CE]">
              <PropertyMap />
            </div>
          </div>
        </div>
      </section >

      {/* YouTube Section */}
      <section className="py-2 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-row justify-between items-center mb-2">
            <div>
              <h2 className="text-2xl font-bold mb-0 flex items-center">
                <Youtube className="h-6 w-6 text-red-600 mr-2" />
                이가이버 유튜브
              </h2>
            </div>
            <a
              href="https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0 text-gray-300 hover:text-white transition-colors flex items-center text-sm"
            >
              더보기 <ArrowRight className="ml-1 h-3 w-3" />
            </a>
          </div>

          {isVideosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-800 h-64 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {latestVideos?.slice(0, 5).map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group h-full block"
                >
                  <div className="bg-slate-800 rounded-xl overflow-hidden hover:transform hover:-translate-y-2 transition-all duration-300 shadow-lg border border-slate-700 h-full flex flex-col">
                    <div className="relative aspect-video overflow-hidden shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
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
              ))}
            </div>
          )}
        </div>
      </section >

      {/* News & Blog Section (Combined) */}
      <section className="pt-4 pb-0 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12">
            {/* News */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Newspaper className="h-6 w-6 mr-2 text-primary" />
                  부동산 뉴스
                </h2>
                <Link href="/news" className="text-primary hover:underline text-sm font-medium">더 보기</Link>
              </div>
              <div className="space-y-1">
                {latestNews?.slice(0, 3).map((news) => (
                  <Link key={news.id} href={`/news/${news.id}`}>
                    <div className="flex gap-2 p-2 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer items-center">
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        <img src={news.imageUrl ?? "https://via.placeholder.com/150"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <Badge variant="secondary" className="mb-2 text-xs">{news.category}</Badge>
                        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{news.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{news.summary}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Blog Posts */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <BookOpen className="h-6 w-6 mr-2 text-green-600" />
                  이가이버 포럼
                </h2>
                <a href="https://blog.naver.com/9551304" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium">더 보기</a>
              </div>
              <div className="space-y-1">
                {latestBlogPosts?.slice(0, 3).map((post) => (
                  <a key={post.id} href={post.link} target="_blank" rel="noopener noreferrer">
                    <div className="flex gap-2 p-2 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer items-center">
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={post.thumbnail || "/assets/default-forum.png"}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/assets/default-forum.png";
                          }}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2 text-xs border-green-600 text-green-600">{post.category}</Badge>
                        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{post.title}</h3>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
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
      </section >
    </>
  );
};

export default HomePage;
