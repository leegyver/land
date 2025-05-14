import { Helmet } from "react-helmet";

const AboutPage = () => {
  return (
    <div className="pt-16"> {/* Offset for fixed header */}
      <Helmet>
        <title>강화도 실거래가 | 이가이버부동산</title>
        <meta 
          name="description" 
          content="강화도 지역 부동산의 실거래가 정보를 확인하세요. 이가이버부동산에서 제공하는 강화도 지역 토지, 주택, 아파트 등의 최신 실거래가 정보를 확인할 수 있습니다."
        />
        <meta property="og:title" content="강화도 실거래가 | 이가이버부동산" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="강화도 지역 부동산의 실거래가 정보를 확인하세요. 이가이버부동산에서 제공하는 강화도 지역 토지, 주택, 아파트 등의 최신 실거래가 정보를 확인할 수 있습니다." />
      </Helmet>

      <div className="bg-primary/10 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">강화도 실거래가</h1>
          <p className="text-gray-medium mt-2">
            강화도 지역 부동산 실거래가 정보를 확인하세요.
          </p>
        </div>
      </div>
      
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl bg-white p-6 rounded-lg shadow-md">
            <p className="text-center text-lg mb-8">
              실거래가 정보 준비 중입니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
