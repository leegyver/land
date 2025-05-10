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
            <div className="flex space-x-6 mt-4">
              <a href="https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <img src="/youtube.png" alt="YouTube" width="36" height="36" />
              </a>
              <a href="https://www.instagram.com/leegyvertv/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <img src="/instagram.png" alt="Instagram" width="36" height="36" />
              </a>
              <a href="https://blog.naver.com/9551304" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <img src="/naver-blog.png" alt="Naver Blog" width="36" height="36" />
              </a>
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
