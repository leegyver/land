import React from "react";
import { Helmet } from "react-helmet";

const AboutPage = () => {
  return (
    <div className="pt-16"> {/* 상단 메뉴 오프셋 */}
      <Helmet>
        <title>강화도 실거래가 | 이가이버부동산</title>
        <meta 
          name="description" 
          content="강화도 지역 부동산 정보를 확인하세요."
        />
      </Helmet>
      
      {/* 외부 웹사이트를 iframe으로 표시 */}
      <div className="w-full h-screen">
        <iframe 
          src="https://www.disco.re/" 
          className="w-full h-full border-none"
          title="disco.re"
          sandbox="allow-scripts allow-same-origin allow-forms"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
};

export default AboutPage;
