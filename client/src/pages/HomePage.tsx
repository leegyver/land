import HomeMap from "@/components/home/HomeMap";
import PropertySearch from "@/components/home/PropertySearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
// BlogPosts 컴포넌트 제거됨
// Testimonials 컴포넌트 제거됨
// ContactForm 컴포넌트 제거됨
import { useQuery } from "@tanstack/react-query";
import { News } from "@shared/schema";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, ArrowRight, Newspaper, Youtube, Play, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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
  // agents 관련 쿼리 제거됨
  
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

  return (
    <>
      <div className="pt-16"> {/* Offset for fixed header */}
        {/* 맵과 검색을 오른쪽으로 배치한 새로운 레이아웃 */}
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 왼쪽 콘텐츠 영역 - 추천 매물만 표시 (3/4 크기) */}
            <div className="order-2 lg:order-1 lg:col-span-3">
              <FeaturedProperties />
            </div>
            
            {/* 오른쪽 지도 및 검색 영역 (1/4 크기) */}
            <div className="order-1 lg:order-2 lg:col-span-1">
              {/* 지도 */}
              <div className="rounded-lg overflow-hidden shadow-md mb-6">
                <HomeMap />
              </div>
              
              {/* 검색 폼 */}
              <div className="rounded-lg overflow-hidden shadow-md">
                <PropertySearch />
              </div>
            </div>
          </div>
        </div>
        
        {/* YouTube Videos Section */}
        <section id="youtube" className="py-4 bg-gradient-to-r from-red-50 to-red-100">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <Youtube className="h-6 w-6 mr-2 text-red-600" />
                이가이버 유튜브 최신 영상
              </h2>
              <a 
                href="https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                유튜브 채널 방문하기 <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            
            {isVideosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="bg-white rounded-lg overflow-hidden shadow-md h-full flex flex-col animate-pulse">
                    <div className="h-40 bg-gray-200" />
                    <CardContent className="p-4 flex-grow">
                      <div className="h-4 bg-gray-200 rounded-md mb-2 w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded-md mb-2 w-full"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : latestVideos && latestVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {latestVideos.slice(0, 5).map((video) => (
                  <Card key={video.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition h-full flex flex-col">
                    <div className="h-40 overflow-hidden relative group">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300"
                        >
                          <Play className="h-6 w-6" />
                        </a>
                      </div>
                    </div>
                    <CardContent className="p-4 flex-grow">
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h3 className="text-base font-semibold mb-2 line-clamp-2 hover:text-red-600 transition-colors">
                          {video.title.length > 70 ? video.title.substring(0, 70) + '...' : video.title}
                        </h3>
                      </a>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <div className="flex items-center text-xs text-gray-medium">
                        <Youtube className="h-3 w-3 mr-1 text-red-600" />
                        이가이버 유튜브
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 shadow text-center">
                <p className="text-gray-medium">현재 유튜브 영상을 불러올 수 없습니다. 나중에 다시 시도해주세요.</p>
                <a 
                  href="https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 mt-2"
                >
                  유튜브에서 직접 보기 <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </section>
        
        {/* Blog Posts Section */}
        <section id="blog" className="py-4 bg-gradient-to-r from-green-50 to-green-100">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-green-600" />
                부동산 블로그
              </h2>
              <a 
                href="https://blog.naver.com/9551304" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                블로그 방문하기 <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isBlogPostsLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="h-16 bg-slate-200 rounded w-3/4"></div>
                  </div>
                </div>
              ) : latestBlogPosts && latestBlogPosts.length > 0 ? (
                latestBlogPosts.slice(0, 3).map((post) => (
                  <Card key={post.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition h-full flex flex-col">
                    <CardContent className="p-4 flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                          부동산 최신글
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {post.publishedAt}
                        </span>
                      </div>
                      <a 
                        href={post.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h3 className="text-lg font-semibold mb-3 hover:text-green-600 transition-colors">
                          {post.title}
                        </h3>
                      </a>
                    </CardContent>
                    <CardFooter className="p-4 pt-1">
                      <a 
                        href={post.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                      >
                        자세히 보기 <ArrowRight className="h-3 w-3" />
                      </a>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">블로그 포스트가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* News Section */}
        <section id="news" className="py-4 bg-gray-light">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">최신 부동산뉴스</h2>
              <Link href="/news" className="text-primary hover:text-secondary font-medium flex items-center gap-1">
                모든 뉴스 보기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {latestNews && latestNews.slice(0, 5).map((news) => (
                <Card key={news.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition h-full flex flex-col">
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={news.imageUrl ?? 'https://via.placeholder.com/400x200?text=뉴스+이미지'} 
                      alt={news.title} 
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <CardContent className="p-4 flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                        {news.category}
                      </Badge>
                      {news.isPinned && (
                        <Badge variant="secondary" className="bg-secondary/20 text-secondary text-xs">
                          주요
                        </Badge>
                      )}
                    </div>
                    
                    <Link href={`/news/${news.id}`}>
                      <h3 className="text-base font-bold mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {news.title}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-gray-medium line-clamp-2 mb-2">
                      {news.summary}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center text-xs text-gray-medium">
                        <Calendar className="h-3 w-3 mr-1" />
                        {news.createdAt && formatDistanceToNow(new Date(news.createdAt), { addSuffix: true, locale: ko })}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-medium">
                        <Newspaper className="h-3 w-3 mr-1" />
                        {news.source}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              {(!latestNews || latestNews.length === 0) && (
                <div className="col-span-5 bg-white rounded-lg p-8 text-center shadow">
                  <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-medium" />
                  <h3 className="text-xl font-medium mb-2">아직 등록된 뉴스가 없습니다</h3>
                  <p className="text-gray-medium">
                    곧 강화도와 인천 지역의 최신 부동산 뉴스가 업데이트될 예정입니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Testimonials 섹션 제거됨 */}
        
{/* Contact Section - 제거됨 */}
      </div>
    </>
  );
};

export default HomePage;
