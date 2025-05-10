import { Link } from "wouter";
import { Building, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">이가이버부동산</h3>
            <p className="text-gray-400 mb-4">
              상호: 이가이버공인중개사 사무소<br />
              대표: 이민호<br />
              주소: 인천광역시 강화군 강화읍 남문로51, 1호<br />
              등록번호: 28710-2021-00012<br />
              연락처: 032.934.3120 / 010.4787.3120<br />
              이메일: 9551304@naver.com<br />
              영업시간: 년중무휴-외근이 많으니 방문시 사전연락 부탁드립니다
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
            <h3 className="text-xl font-bold mb-4">고객센터</h3>
            <ul className="space-y-2">
              <li><Link href="/faq" className="text-gray-400 hover:text-white">자주 묻는 질문</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">이용약관</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white">개인정보처리방침</Link></li>
              <li><Link href="/notices" className="text-gray-400 hover:text-white">공지사항</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">문의하기</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 mt-6">
          <p className="text-gray-400 text-center">© {new Date().getFullYear()} 이가이버부동산. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
