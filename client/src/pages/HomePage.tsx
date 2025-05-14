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
import { Calendar, ArrowRight, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const HomePage = () => {
  // agents 관련 쿼리 제거됨
  
  const { data: latestNews } = useQuery<News[]>({
    queryKey: ["/api/news/latest"],
  });

  return (
    <>
      <div className="pt-16"> {/* Offset for fixed header */}
        {/* 맵과 검색을 오른쪽으로 배치한 새로운 레이아웃 */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 왼쪽 콘텐츠 영역 */}
            <div className="order-2 lg:order-1">
              <div className="p-6 bg-white rounded-lg shadow-md mb-8">
                <h2 className="text-3xl font-bold mb-4">강화도 부동산 전문</h2>
                <p className="text-gray-700 mb-6">
                  강화도 지역 최고의 부동산 중개사무소, 이가이버 공인중개사에서 원하는 매물을 찾아보세요.
                  강화도 전 지역 토지, 주택, 상가 등 다양한 매물 정보를 제공합니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-bold mb-1">20년+</h3>
                    <p className="text-sm text-gray-600">전문 경력</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-bold mb-1">300+</h3>
                    <p className="text-sm text-gray-600">매물 보유</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-bold mb-1">100%</h3>
                    <p className="text-sm text-gray-600">고객 만족도</p>
                  </div>
                </div>
              </div>
              <FeaturedProperties />
            </div>
            
            {/* 오른쪽 지도 및 검색 영역 */}
            <div className="order-1 lg:order-2">
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
        
        {/* News Section */}
        <section id="news" className="py-16 bg-gray-light">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold">최신 부동산 뉴스</h2>
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
