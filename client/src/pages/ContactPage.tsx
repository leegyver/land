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
      
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4">상담 신청</h3>
              <ContactForm />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4">연락처 정보</h3>
              
              <div className="space-y-2">
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
          </div>
        </div>
      </section>
      

    </div>
  );
};

export default ContactPage;
