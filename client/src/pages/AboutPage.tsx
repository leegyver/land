import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet";

const AboutPage = () => {
  return (
    <div className="pt-16"> {/* Offset for fixed header */}
      <Helmet>
        <title>회사소개 | 한국부동산</title>
        <meta 
          name="description" 
          content="2010년에 설립된 한국부동산은 서울 수도권 지역의 프리미엄 부동산 중개 서비스를 제공하고 있습니다. 10년 이상의 풍부한 경험과 전문성을 바탕으로 고객님께 최상의 부동산 서비스를 제공합니다."
        />
        <meta property="og:title" content="회사소개 | 한국부동산" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="2010년에 설립된 한국부동산은 서울 수도권 지역의 프리미엄 부동산 중개 서비스를 제공하고 있습니다. 10년 이상의 풍부한 경험과 전문성을 바탕으로 고객님께 최상의 부동산 서비스를 제공합니다." />
      </Helmet>

      <div className="bg-primary/10 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">회사소개</h1>
          <p className="text-gray-medium mt-2">
            한국부동산은 고객의 니즈에 맞는 최적의 부동산 서비스를 제공합니다.
          </p>
        </div>
      </div>
      
      <section className="py-16">
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
                  <CheckCircle className="text-primary mr-2" size={20} />
                  <span>10년 이상의 경험</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-primary mr-2" size={20} />
                  <span>프리미엄 매물 보유</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-primary mr-2" size={20} />
                  <span>투명한 정보 제공</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-primary mr-2" size={20} />
                  <span>전문적인 상담 서비스</span>
                </div>
              </div>
              
              <Link href="/contact">
                <Button className="bg-primary hover:bg-secondary text-white font-bold py-3 px-6 rounded-lg transition">
                  상담 신청하기
                </Button>
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
      
      <section className="py-16 bg-gray-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">우리의 미션</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="text-primary text-3xl" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">최고의 서비스</h3>
              <p className="text-gray-medium">
                고객 만족을 최우선으로 생각하며, 항상 최고의 서비스를 제공하기 위해 노력합니다.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="text-primary text-3xl" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <line x1="3" x2="21" y1="9" y2="9" />
                  <line x1="9" x2="9" y1="21" y2="9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">정확한 정보</h3>
              <p className="text-gray-medium">
                정확하고 투명한 정보 제공을 통해 고객의 신뢰를 얻고 최적의 의사결정을 돕습니다.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="text-primary text-3xl" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">고객 맞춤 솔루션</h3>
              <p className="text-gray-medium">
                각 고객의 니즈와 상황에 맞는 맞춤형 부동산 솔루션을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">회사 연혁</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                  <div className="w-1 flex-grow bg-primary"></div>
                </div>
                <div className="pb-8">
                  <div className="text-xl font-bold">2010년</div>
                  <p className="text-gray-medium">한국부동산 설립, 강남구 사무실 오픈</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                  <div className="w-1 flex-grow bg-primary"></div>
                </div>
                <div className="pb-8">
                  <div className="text-xl font-bold">2013년</div>
                  <p className="text-gray-medium">서초구 지점 확장, 중개사 인원 확충</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                  <div className="w-1 flex-grow bg-primary"></div>
                </div>
                <div className="pb-8">
                  <div className="text-xl font-bold">2016년</div>
                  <p className="text-gray-medium">온라인 부동산 플랫폼 구축, 디지털 서비스 확장</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                  <div className="w-1 h-8 bg-transparent"></div>
                </div>
                <div>
                  <div className="text-xl font-bold">2020년</div>
                  <p className="text-gray-medium">창립 10주년, 프리미엄 부동산 서비스 브랜드로 자리매김</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
