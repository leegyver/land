import ContactForm from "@/components/contact/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Helmet } from "react-helmet";

const ContactPage = () => {
  return (
    <div className="pt-16"> {/* Offset for fixed header */}
      <Helmet>
        <title>문의하기 | 이가이버부동산</title>
        <meta 
          name="description" 
          content="이가이버부동산에 문의하세요. 부동산 매매, 임대, 투자에 관한 모든 궁금증을 전문가가 상담해 드립니다."
        />
        <meta property="og:title" content="문의하기 | 이가이버부동산" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="이가이버부동산에 문의하세요. 부동산 매매, 임대, 투자에 관한 모든 궁금증을 전문가가 상담해 드립니다." />
      </Helmet>

      <div className="bg-primary/10 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">문의하기</h1>
          <p className="text-gray-medium mt-2">
            궁금한 점이나 상담이 필요하시면 언제든지 문의해 주세요.
          </p>
        </div>
      </div>
      
      <section className="py-16">
        <div className="container mx-auto px-4">
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
                      <p className="text-gray-medium">인천광역시 강화군 강화읍 남문로51, 1호</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="text-primary text-xl mt-1 w-8" />
                    <div>
                      <h4 className="font-bold">전화</h4>
                      <p className="text-gray-medium">032-934-3120 / 010-4787-3120</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="text-primary text-xl mt-1 w-8" />
                    <div>
                      <h4 className="font-bold">이메일</h4>
                      <p className="text-gray-medium">9551304@naver.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="text-primary text-xl mt-1 w-8" />
                    <div>
                      <h4 className="font-bold">영업시간</h4>
                      <p className="text-gray-medium">년중무휴</p>
                      <p className="text-gray-medium">외근이 많으니 방문시 사전연락 부탁드립니다</p>
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
      
      <section className="py-12 bg-gray-light">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">자주 묻는 질문</h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold mb-2">부동산 매물 문의는 어떻게 하나요?</h3>
              <p className="text-gray-medium">
                웹사이트의 매물 상세 페이지에서 문의하기 버튼을 통해 바로 문의하시거나, 
                전화 또는 이메일로 연락주시면 담당 중개사가 빠르게 답변 드립니다.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold mb-2">매물 방문은 어떻게 예약하나요?</h3>
              <p className="text-gray-medium">
                원하시는 매물의 담당 중개사에게 연락하시면 방문 일정을 조율해 드립니다.
                방문 시 필요한 서류나 준비사항도 안내해 드립니다.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold mb-2">계약 절차는 어떻게 진행되나요?</h3>
              <p className="text-gray-medium">
                매물 확인 후 계약 의사가 있으시면, 계약금 지급과 계약서 작성이 진행됩니다.
                한국부동산에서는 모든 법적 절차를 투명하게 안내하고 도와드립니다.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-bold mb-2">중개 수수료는 얼마인가요?</h3>
              <p className="text-gray-medium">
                중개 수수료는 법정 요율에 따라 책정되며, 거래 금액과 부동산 유형에 따라 달라집니다.
                자세한 내용은 상담 시 안내해 드립니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
