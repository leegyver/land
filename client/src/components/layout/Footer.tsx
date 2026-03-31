import { Building, Facebook, Instagram, Youtube } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white pt-5 pb-8 md:py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <NewsletterForm />
        </div>
        <div className="mb-0">
          <div>

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

        <div className="border-t border-slate-800 pt-4 mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-300 md:text-left text-center">이가이버랜드 대표 이민호</h3>
            <p className="text-slate-500 text-xs md:text-left text-center mt-1">
              주소 : 인천광역시 강화군 강화읍 남문로51, 1호 | 사업자 등록번호 786-73-00447 | 032.934.3120 | 9551304@naver.com
            </p>
          </div>
          <p className="text-slate-500 md:text-left text-center text-xs">© {new Date().getFullYear()} 이가이버부동산. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
