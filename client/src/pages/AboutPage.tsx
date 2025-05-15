import React, { useEffect } from "react";
import { Helmet } from "react-helmet";

const AboutPage = () => {
  useEffect(() => {
    // 페이지 로드 시 즉시 외부 사이트로 리다이렉트
    window.location.href = "https://www.disco.re/";
  }, []);

  return (
    <div className="pt-16 flex items-center justify-center min-h-screen">
      <Helmet>
        <title>리다이렉트 | 이가이버부동산</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="text-center">
        <p className="text-lg">잠시 후 자동으로 이동합니다...</p>
        <p className="mt-4">
          <a 
            href="https://www.disco.re/" 
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            클릭하여 바로 이동
          </a>
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
