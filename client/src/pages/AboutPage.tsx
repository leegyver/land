import React from "react";
import { Helmet } from "react-helmet";

const AboutPage = () => {
  return (
    <div className="pt-16"> {/* 상단 메뉴 오프셋 */}
      <Helmet>
        <title>실거래가(디스코) | 이가이버부동산</title>
        <meta 
          name="description" 
          content="실거래가 정보를 디스코에서 확인하세요."
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
