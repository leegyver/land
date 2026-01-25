import { Helmet } from "react-helmet";
import HomeMap from "@/components/home/HomeMap";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import { useQuery } from "@tanstack/react-query";
import { News } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, ArrowRight, Newspaper, Youtube, Play, BookOpen, Search, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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

const HomePage = () => {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");

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

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      setLocation(`/properties?keyword=${encodeURIComponent(searchKeyword)}`);
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
      <section className="relative h-auto pt-20 pb-4 w-full overflow-hidden">
        {/* Background Image & Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage: 'url("/assets/uploads/1.png")',
          }}
        >
          <div className="absolute inset-0 bg-black/30" /> {/* Dark overlay for text readability */}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-md leading-tight text-white m-[2px]">
            강화도의 소중한 공간,<br className="hidden md:block" />
            <span className="text-[#FEE500] drop-shadow-lg">이가이버</span>가 찾아드립니다
          </h1>
          <p className="text-xl md:text-2xl mb-6 text-gray-100 max-w-2xl drop-shadow-sm">
            토지, 전원주택, 상가까지.<br />
            정직하고 투명한 중개로 고객님의 꿈을 연결해 드립니다.
          </p>

          {/* Main Search Bar */}
          <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-full p-2 flex shadow-2xl items-center mb-8">
            <Search className="ml-4 h-6 w-6 text-gray-400 shrink-0" />
            <Input
              className="border-0 focus-visible:ring-0 text-lg px-4 text-black placeholder:text-gray-400 h-12 bg-transparent"
              placeholder="찾으시는 지역이나 매물을 입력하세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              size="lg"
              className="rounded-full px-8 text-lg h-12 bg-primary hover:bg-primary/90 shrink-0"
              onClick={handleSearch}
            >
              검색
            </Button>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            <Link href="/properties">
              <Button variant="outline" className="bg-white/20 backdrop-blur-md border-white/40 text-white hover:bg-white hover:text-primary h-10 px-5 rounded-full text-base font-medium mb-2 transition-all hover:scale-105">
                전체
              </Button>
            </Link>
            {propertyTypeOptions.map((type) => (
              <Link key={type} href={`/properties?type=${encodeURIComponent(type)}`}>
                <Button variant="outline" className="bg-white/20 backdrop-blur-md border-white/40 text-white hover:bg-white hover:text-primary h-10 px-5 rounded-full text-base font-medium mb-2 transition-all hover:scale-105">
                  {type}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Banner Section */}
      <section className="bg-gray-50 pt-10 pb-2 px-4">
        <div className="container mx-auto">
          <Link href="/about">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-center text-white shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl cursor-pointer">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
              <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                <div className="animate-bounce bg-white/20 p-3 rounded-full mb-2">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  부동산, 어렵지 않아요!
                </h2>
                <p className="text-lg md:text-xl font-medium text-purple-100">
                  <span className="text-[#FEE500] font-bold">애니메이션</span>으로 보는 쉽고 재미있는 부동산 이야기
                </p>
                <div className="mt-4 inline-flex items-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-purple-600 transition-colors group-hover:bg-purple-50">
                  보러가기 <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-all group-hover:bg-white/20"></div>
              <div className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-all group-hover:bg-white/20"></div>
            </div>
          </Link>
        </div>
      </section >

      {/* Featured Properties Section */}
      < section className="pt-4 pb-10 bg-gray-50" >
        <div className="container mx-auto px-4">
          <div className="text-center mb-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">추천 매물</h2>
            <p className="text-lg text-gray-600">이가이버부동산이 자신 있게 추천하는 알짜배기 매물함입니다.</p>
          </div>
          <FeaturedProperties />
          <div className="text-center mt-10">
            <Link href="/properties">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white px-8">
                매물 더 보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section >

      {/* Map Section */}
      < section className="py-10 bg-white" >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">지도로 한눈에 보기</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-md">
                강화도의 지리는 이가이버가 가장 잘 압니다.<br />
                원하시는 지역을 지도로 확인하고 매물을 찾아보세요.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4 text-primary">
                    <Map className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">정확한 위치 기반</h4>
                    <p className="text-gray-600">상세 주소 기반으로 정확한 매물 위치를 제공합니다.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4 text-primary">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">지역별 탐색</h4>
                    <p className="text-gray-600">강화읍, 길상면 등 원하시는 지역만 골라보세요.</p>
                  </div>
                </li>
              </ul>
              <Link href="/properties">
                <Button size="lg" className="w-full sm:w-auto">지도에서 매물 찾기</Button>
              </Link>
            </div>
            <div className="h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
              <HomeMap />
            </div>
          </div>
        </div>
      </section >

      {/* YouTube Section */}
      < section className="py-2 bg-gray-900 text-white" >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-1 flex items-center">
                <Youtube className="h-8 w-8 text-red-600 mr-3" />
                이가이버 유튜브
              </h2>
              <p className="text-gray-400 text-lg">생생한 현장 영상을 유튜브에서 확인하세요.</p>
            </div>
            <a
              href="https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 md:mt-0 text-white hover:text-red-400 transition-colors flex items-center font-medium"
            >
              channel 바로가기 <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>

          {isVideosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 h-64 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestVideos?.slice(0, 4).map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="bg-gray-800 rounded-xl overflow-hidden hover:transform hover:-translate-y-2 transition-all duration-300 shadow-lg">
                    <div className="relative aspect-video overflow-hidden">
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
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-2 text-gray-100 group-hover:text-red-400 transition-colors">
                        {video.title}
                      </h3>
                      <div className="mt-3 flex items-center text-sm text-gray-400">
                        <Youtube className="h-3 w-3 mr-1" /> 이가이버
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section >

      {/* News & Blog Section (Combined) */}
      < section className="py-10 bg-white" >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* News */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Newspaper className="h-6 w-6 mr-2 text-primary" />
                  부동산 뉴스
                </h2>
                <Link href="/news" className="text-primary hover:underline text-sm font-medium">더 보기</Link>
              </div>
              <div className="space-y-4">
                {latestNews?.slice(0, 3).map((news) => (
                  <Link key={news.id} href={`/news/${news.id}`}>
                    <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
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
                <Link href="/blog" className="text-primary hover:underline text-sm font-medium">더 보기</Link>
              </div>
              <div className="space-y-4">
                {latestBlogPosts?.slice(0, 3).map((post) => (
                  <a key={post.id} href={post.link} target="_blank" rel="noopener noreferrer">
                    <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
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
