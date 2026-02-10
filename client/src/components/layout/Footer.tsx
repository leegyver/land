import { Link } from "wouter";
import { Building, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white pt-0 pb-16 md:py-6">
      <div className="container mx-auto px-4">
        <div className="mb-0">
          <div>
            <h3 className="text-xl font-bold mb-2 mt-3 md:mt-0 text-white">이가이버부동산</h3>
            <p className="text-slate-300 mb-2 leading-tight text-sm">
              상호: 이가이버공인중개사 사무소 | 대표: 이민호<br />
              주소: 인천광역시 강화군 강화읍 남문로51, 1호<br />
              등록번호: 28710-2021-00012<br />
              연락처: 032.934.3120 / 010.4787.3120<br />
              이메일: 9551304@naver.com
            </p>
            <div className="flex space-x-3 mt-1">
              <a href="https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity bg-white/10 p-1.5 rounded-full">
                <img src="/youtube.png" alt="YouTube" width="20" height="20" className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/leegyverceo/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity bg-white/10 p-1.5 rounded-full">
                <img src="/instagram.png" alt="Instagram" width="20" height="20" className="w-5 h-5" />
              </a>
              <a href="https://blog.naver.com/9551304" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity bg-white/10 p-1.5 rounded-full">
                <img src="/naver-blog.png" alt="Naver Blog" width="20" height="20" className="w-5 h-5" />
              </a>
            </div>
          </div>


        </div>

        <div className="border-t border-slate-800 pt-2 mt-2">
          <p className="text-slate-500 text-center text-xs">© {new Date().getFullYear()} 이가이버부동산. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
