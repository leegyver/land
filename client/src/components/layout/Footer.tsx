import { Link } from "wouter";
import { Building, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-4">
      <div className="container mx-auto px-4">
        <div className="mb-0">
          <div>
            <h3 className="text-xl font-bold mb-1">이가이버부동산</h3>
            <p className="text-gray-400 mb-0">
              상호: 이가이버공인중개사 사무소<br />
              대표: 이민호<br />
              주소: 인천광역시 강화군 강화읍 남문로51, 1호<br />
              등록번호: 28710-2021-00012<br />
              연락처: 032.934.3120 / 010.4787.3120<br />
              이메일: 9551304@naver.com
            </p>
            <div className="flex space-x-6 mt-2">
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


        </div>

        <div className="border-t border-gray-800 pt-6 mt-6">
          <p className="text-gray-400 text-center">© {new Date().getFullYear()} 이가이버부동산. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
