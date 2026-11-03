import { Building, Facebook, Instagram, Youtube } from "lucide-react";
import NewsletterForm from "./NewsletterForm";
import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white pt-6 pb-24 landscape:pb-16 md:pb-8 pl-safe pr-safe border-t border-slate-800">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <NewsletterForm />
        </div>
        <div className="mb-0">
          <div>
            <div className="flex space-x-3 mt-1">
              <a href="https://www.youtube.com/@강화도부동산이야기" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity bg-white/10 p-2 rounded-full touch-manipulation">
                <img src="/youtube.png" alt="YouTube" width="20" height="20" className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/leegyverceo/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity bg-white/10 p-2 rounded-full touch-manipulation">
                <img src="/instagram.png" alt="Instagram" width="20" height="20" className="w-5 h-5" />
              </a>
              <a href="https://blog.naver.com/9551304" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity bg-white/10 p-2 rounded-full touch-manipulation">
                <img src="/naver-blog.png" alt="Naver Blog" width="20" height="20" className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 mt-6">
          <div className="flex justify-center md:justify-start gap-4 mb-4 text-xs sm:text-sm">
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors py-1">
              이용약관
            </Link>
            <span className="text-slate-700 py-1">|</span>
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors font-semibold py-1">
              개인정보처리방침
            </Link>
          </div>
          <div className="mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-300 md:text-left text-center">이가이버랜드 대표 이민호</h3>
            <p className="text-slate-400 text-[11px] sm:text-xs md:text-left text-center mt-1 leading-relaxed break-keep">
              주소 : 인천광역시 강화군 강화읍 남문로51, 1호 | 사업자 등록번호 786-73-00447 | 대표전화 032.934.3120 | 이메일 9551304@naver.com
            </p>
          </div>
          <p className="text-slate-500 md:text-left text-center text-[10px] sm:text-xs">
            © {new Date().getFullYear()} 이가이버부동산. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
