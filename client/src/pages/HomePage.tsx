import { Helmet } from "react-helmet";
import NoticeBanner from "@/components/home/NoticeBanner";
import PropertyMap from "@/components/map/PropertyMap";
import PropertySection from "@/components/home/PropertySection";
import BannerSlider from "@/components/home/BannerSlider";
import Hero from "@/components/home/Hero";
import ReviewSection from "@/components/home/ReviewSection";
import { useQuery } from "@tanstack/react-query";
import { News } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Calendar, ArrowRight, Newspaper, Youtube, Play, BookOpen, Search, Map, ThumbsUp, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
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



      {/* Featured Properties Section */}
      <section className="pt-8 pb-0 bg-[#F7F5F0]">
        <div className="container mx-auto px-4">


          <div className="flex justify-between items-center mb-1 mt-0">
            <h2 className="text-2xl font-bold">✨ 최신매물</h2>
            <Link href="/properties">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
                더보기 <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <PropertySection
            title=""
            queryKey="/api/properties/latest?limit=4"
            bgColor="bg-white"
          />

          <div className="flex justify-between items-center mb-1 mt-6">
            <h2 className="text-2xl font-bold">🔥 급매물</h2>
            <Link href="/properties?tag=urgent">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
                더보기 <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <PropertySection
            title=""
            queryKey="/api/properties/urgent?limit=4"
            bgColor="bg-red-50"
          />

          {/* 흥정 매물 섹션 */}
          <div className="flex justify-between items-center mb-1 mt-6">
            <h2 className="text-2xl font-bold">🤝 가격 협의 가능</h2>
            <Link href="/properties?tag=negotiable">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
                더보기 <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <PropertySection
            title=""
            queryKey="/api/properties/negotiable?limit=4"
            bgColor="bg-blue-50"
          />

          {/* 장기투자 매물 섹션 */}
          <div className="flex justify-between items-center mb-1 mt-6">
            <h2 className="text-2xl font-bold text-red-600">📈 장기투자 추천</h2>
            <Link href="/properties?tag=long-term">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
                더보기 <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <PropertySection
            title=""
            queryKey="/api/properties/long-term?limit=4"
            bgColor="bg-green-50"
          />

          {/* 추천 매물 섹션 */}
          <div className="flex justify-between items-center mb-1 mt-6">
            <h2 className="text-2xl font-bold flex items-center"><ThumbsUp className="w-6 h-6 mr-2 text-primary" />추천 매물</h2>
            <Link href="/properties?tag=featured">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
                더보기 <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <PropertySection
            title=""
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
        videos={latestVideos}
        isLoading={isVideosLoading}
        channelUrl="https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA"
      />

      {/* YouTube Section 2: 강화도 부동산이야기 */}
      <YouTubeSliderSection
        title="강화도 부동산이야기"
        videos={secondChannelVideos}
        isLoading={isSecondVideosLoading}
        channelUrl="https://youtube.com/channel/UChvA8_nrczWDBYdHUum7Amw?si=K45xaU3foR1mSPFE"
      />

      {/* News & Community & Blog Section (Combined) */}
      <section className="pt-4 pb-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* News */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Newspaper className="h-5 w-5 mr-2 text-primary" />
                  부동산 뉴스
                </h2>
                <Link href="/news" className="text-primary hover:underline text-xs font-medium">전체보기</Link>
              </div>
              <div className="space-y-[2px]">
                {latestNews?.slice(0, 3).map((news) => (
                  <Link key={news.id} href={`/news/${news.id}`} className="block">
                    <div className="group flex gap-3 cursor-pointer">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <img src={news.imageUrl ?? "https://via.placeholder.com/150"} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className="mb-1 text-[10px] h-5 bg-blue-50 text-blue-600 border-none">{news.category}</Badge>
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm group-hover:text-primary transition-colors">{news.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{news.summary}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Community Section (New) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-500" />
                  실시간 커뮤니티
                </h2>
                <Link href="/community" className="text-primary hover:underline text-xs font-medium">전체보기</Link>
              </div>
              <div className="space-y-[2px]">
                {latestPosts?.slice(0, 3).map((post) => (
                  <Link key={post.id} href={`/community/${post.id}`} className="block">
                    <div className="group flex gap-3 cursor-pointer">
                      <div className="w-20 h-20 flex-shrink-0 bg-orange-50 rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                        {post.imageUrls && post.imageUrls.length > 0 ? (
                          <img src={post.imageUrls[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <MessageSquare className="w-8 h-8 text-orange-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="mb-1 text-[10px] h-5 bg-orange-100 text-orange-600 border-none font-bold">
                          {post.category === 'qa' ? '궁금해요' : post.category === 'stories' ? '강화도이야기' : '건축/리모델링'}
                        </Badge>
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm group-hover:text-orange-500 transition-colors">{post.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-medium">
                          <span className="flex items-center gap-1">
                            {post.author?.username || '익명'}
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

            {/* Blog Posts */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  이가이버 포럼
                </h2>
                <a href="https://blog.naver.com/9551304" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-medium">전체보기</a>
              </div>
              <div className="space-y-[2px]">
                {latestBlogPosts?.slice(0, 3).map((post) => (
                  <a key={post.id} href={post.link} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="group flex gap-3 cursor-pointer">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <img
                          src={post.thumbnail || "/assets/default-forum.png"}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="mb-1 text-[10px] h-5 border-green-600 text-green-600 font-bold">{post.category}</Badge>
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm group-hover:text-green-600 transition-colors">{post.title}</h3>
                        <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-1 font-medium">
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
const YouTubeSliderSection = ({ title, videos, isLoading, channelUrl }: {
  title: string,
  videos: YouTubeVideo[] | undefined,
  isLoading: boolean,
  channelUrl: string
}) => {
  return (
    <section className="py-2 bg-slate-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-row justify-between items-center mb-2">
          <div>
            <h2 className="text-2xl font-bold mb-0 flex items-center">
              <Youtube className="h-6 w-6 text-red-600 mr-2" />
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
