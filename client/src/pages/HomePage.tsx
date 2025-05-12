import HomeMap from "@/components/home/HomeMap";
import PropertySearch from "@/components/home/PropertySearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import BlogPosts from "@/components/home/BlogPosts";
import Testimonials from "@/components/home/Testimonials";
import ContactForm from "@/components/contact/ContactForm";
import { useQuery } from "@tanstack/react-query";
import { Agent, News } from "@shared/schema";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Calendar, ArrowRight, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const HomePage = () => {
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });
  
  const { data: latestNews } = useQuery<News[]>({
    queryKey: ["/api/news/latest"],
  });

  return (
    <>
      <div className="pt-16"> {/* Offset for fixed header */}
        <HomeMap />
        <PropertySearch />
        <FeaturedProperties />
        <BlogPosts />
        
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
                      src={news.imageUrl} 
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
        
        <Testimonials />
        
        {/* Contact Section */}
        <section id="contact" className="py-16 bg-gray-light">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">문의하기</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold mb-6">상담 신청</h3>
                <ContactForm />
              </div>
              
              <div>
                <div className="bg-white p-8 rounded-lg shadow-md mb-8">
                  <h3 className="text-2xl font-bold mb-6">연락처 정보</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="text-primary text-xl mt-1 w-8" />
                      <div>
                        <h4 className="font-bold">주소</h4>
                        <p className="text-gray-medium">서울특별시 강남구 테헤란로 123 한국빌딩 5층</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Phone className="text-primary text-xl mt-1 w-8" />
                      <div>
                        <h4 className="font-bold">전화</h4>
                        <p className="text-gray-medium">02-123-4567</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail className="text-primary text-xl mt-1 w-8" />
                      <div>
                        <h4 className="font-bold">이메일</h4>
                        <p className="text-gray-medium">info@한국부동산.kr</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="text-primary text-xl mt-1 w-8" />
                      <div>
                        <h4 className="font-bold">영업시간</h4>
                        <p className="text-gray-medium">월-금: 9:00 - 18:00</p>
                        <p className="text-gray-medium">토: 9:00 - 15:00 (일요일 휴무)</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Map placeholder */}
                <div className="bg-white p-1 rounded-lg shadow-md overflow-hidden h-64">
                  <img 
                    src="https://images.unsplash.com/photo-1609587312208-cea54be969e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600" 
                    alt="서울 강남구 지도" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
