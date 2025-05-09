import { Link } from "wouter";
import { Building, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">한국부동산</h3>
            <p className="text-gray-medium mb-4">
              10년 이상의 경험을 바탕으로 고객님께 최상의 부동산 서비스를 제공합니다.
            </p>
            <div className="flex space-x-4">
              <button className="text-white hover:text-primary">
                <Facebook size={20} />
              </button>
              <button className="text-white hover:text-primary">
                <Instagram size={20} />
              </button>
              <button className="text-white hover:text-primary">
                <Youtube size={20} />
              </button>
              <button className="text-white hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="8" x2="21" y2="8"></line>
                  <line x1="8" y1="3" x2="8" y2="21"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">매물 정보</h3>
            <ul className="space-y-2">
              <li><Link href="/properties?type=아파트" className="text-gray-medium hover:text-white">아파트</Link></li>
              <li><Link href="/properties?type=주택" className="text-gray-medium hover:text-white">주택</Link></li>
              <li><Link href="/properties?type=빌라" className="text-gray-medium hover:text-white">빌라</Link></li>
              <li><Link href="/properties?type=오피스텔" className="text-gray-medium hover:text-white">오피스텔</Link></li>
              <li><Link href="/properties?type=상가" className="text-gray-medium hover:text-white">상가/사무실</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">지역 정보</h3>
            <ul className="space-y-2">
              <li><Link href="/properties?district=강남구" className="text-gray-medium hover:text-white">강남구</Link></li>
              <li><Link href="/properties?district=서초구" className="text-gray-medium hover:text-white">서초구</Link></li>
              <li><Link href="/properties?district=마포구" className="text-gray-medium hover:text-white">마포구</Link></li>
              <li><Link href="/properties?district=용산구" className="text-gray-medium hover:text-white">용산구</Link></li>
              <li><Link href="/properties?district=송파구" className="text-gray-medium hover:text-white">송파구</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">고객센터</h3>
            <ul className="space-y-2">
              <li><Link href="/faq" className="text-gray-medium hover:text-white">자주 묻는 질문</Link></li>
              <li><Link href="/terms" className="text-gray-medium hover:text-white">이용약관</Link></li>
              <li><Link href="/privacy" className="text-gray-medium hover:text-white">개인정보처리방침</Link></li>
              <li><Link href="/notices" className="text-gray-medium hover:text-white">공지사항</Link></li>
              <li><Link href="/contact" className="text-gray-medium hover:text-white">문의하기</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 mt-6">
          <p className="text-gray-medium text-center">© {new Date().getFullYear()} 한국부동산. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
