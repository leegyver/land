import { Medal, Home, Handshake } from "lucide-react";

const WhyChooseUs = () => {
  return (
    <section className="py-16 bg-gray-light">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">왜 한국부동산인가?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <Medal className="text-primary text-3xl" />
            </div>
            <h3 className="text-xl font-bold mb-3">10년 이상의 경험</h3>
            <p className="text-gray-medium">
              10년 이상의 풍부한 부동산 경험으로 고객님의 니즈에 꼭 맞는 매물을 찾아드립니다.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <Home className="text-primary text-3xl" />
            </div>
            <h3 className="text-xl font-bold mb-3">엄선된 프리미엄 매물</h3>
            <p className="text-gray-medium">
              저희는 직접 확인한 검증된 매물만을 소개합니다. 모든 매물은 철저한 심사를 거칩니다.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <Handshake className="text-primary text-3xl" />
            </div>
            <h3 className="text-xl font-bold mb-3">신뢰할 수 있는 서비스</h3>
            <p className="text-gray-medium">
              투명한 거래와 정직한 상담으로 고객님의 소중한 자산을 안전하게 관리해 드립니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
