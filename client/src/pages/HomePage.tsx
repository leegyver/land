import Hero from "@/components/home/Hero";
import PropertySearch from "@/components/home/PropertySearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Testimonials from "@/components/home/Testimonials";
import ContactForm from "@/components/contact/ContactForm";
import { useQuery } from "@tanstack/react-query";
import { Agent } from "@shared/schema";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const HomePage = () => {
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  return (
    <>
      <div className="pt-16"> {/* Offset for fixed header */}
        <Hero />
        <PropertySearch />
        <FeaturedProperties />
        <WhyChooseUs />
        
        {/* Agent Section */}
        <section id="agents" className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">전문 중개사 소개</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {agents && agents.map((agent) => (
                <Card key={agent.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition text-center">
                  <div className="h-64 overflow-hidden">
                    <img 
                      src={agent.imageUrl} 
                      alt={agent.name} 
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <CardContent className="p-6">
                    <Link href={`/agents/${agent.id}`}>
                      <h3 className="text-xl font-bold mb-1 hover:text-primary transition-colors cursor-pointer">
                        {agent.name}
                      </h3>
                    </Link>
                    <p className="text-primary font-medium mb-3">{agent.title}</p>
                    <p className="text-gray-medium mb-4">{agent.description}</p>
                    <div className="flex justify-center space-x-3">
                      <a href={`tel:${agent.phone}`} className="text-dark hover:text-primary">
                        <Phone className="h-5 w-5" />
                      </a>
                      <a href={`mailto:${agent.email}`} className="text-dark hover:text-primary">
                        <Mail className="h-5 w-5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <Testimonials />
        
        {/* About Section */}
        <section id="about" className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">한국부동산 소개</h2>
                <p className="text-gray-medium mb-4">
                  2010년에 설립된 한국부동산은 서울 수도권 지역의 프리미엄 부동산 중개 서비스를 제공하고 있습니다.
                </p>
                <p className="text-gray-medium mb-4">
                  10명 이상의 전문 중개사들이 각자의 전문 분야에서 풍부한 경험과 지식을 바탕으로 고객님께 최상의 서비스를 제공합니다.
                </p>
                <p className="text-gray-medium mb-8">
                  저희는 단순한 중개를 넘어 고객님의 라이프스타일과 니즈를 정확히 파악하여 최적의 주거 공간을 찾아드리는 것을 목표로 합니다.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center">
                    <svg className="text-primary mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>10년 이상의 경험</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="text-primary mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>프리미엄 매물 보유</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="text-primary mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>투명한 정보 제공</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="text-primary mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>전문적인 상담 서비스</span>
                  </div>
                </div>
                
                <Link href="/contact" className="inline-block bg-primary hover:bg-secondary text-white font-bold py-3 px-6 rounded-lg transition">
                  상담 신청하기
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg overflow-hidden h-64">
                  <img 
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000" 
                    alt="한국부동산 사무실 내부" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-lg overflow-hidden h-64">
                  <img 
                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000" 
                    alt="중개사 미팅" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-lg overflow-hidden h-64">
                  <img 
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000" 
                    alt="고객 상담" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-lg overflow-hidden h-64">
                  <img 
                    src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=1000" 
                    alt="사무실 리셉션" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
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
