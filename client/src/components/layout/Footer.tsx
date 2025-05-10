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
              <button className="hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
                  <path fill="#3F51B5" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"/>
                  <path fill="#FFF" d="M34.368,25H31v13h-5V25h-3v-4h3v-2.41c0.002-3.508,1.459-5.59,5.592-5.59H35v4h-2.287C31.104,17,31,17.6,31,18.723V21h4L34.368,25z"/>
                </svg>
              </button>
              <button className="hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
                  <radialGradient id="instaGradient" cx="19.38" cy="42.035" r="44.899" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#fd5"/>
                    <stop offset="0.1" stopColor="#fd5"/>
                    <stop offset="0.5" stopColor="#ff543e"/>
                    <stop offset="1" stopColor="#c837ab"/>
                  </radialGradient>
                  <path fill="url(#instaGradient)" d="M34.017,41.99l-20,0.019c-4.4,0.004-8.003-3.592-8.008-7.992l-0.019-20c-0.004-4.4,3.592-8.003,7.992-8.008l20-0.019c4.4-0.004,8.003,3.592,8.008,7.992l0.019,20C42.014,38.383,38.417,41.986,34.017,41.99z"/>
                  <path fill="#FFF" d="M24,15.492c-5.01,0-9.08,4.07-9.08,9.08s4.07,9.08,9.08,9.08s9.08-4.07,9.08-9.08S29.01,15.492,24,15.492z M24,30.492c-3.23,0-5.85-2.62-5.85-5.85s2.62-5.85,5.85-5.85s5.85,2.62,5.85,5.85S27.23,30.492,24,30.492z"/>
                  <path fill="#FFF" d="M35.517,13.762c0,1.172-0.95,2.122-2.122,2.122c-1.172,0-2.122-0.95-2.122-2.122c0-1.172,0.95-2.122,2.122-2.122C34.566,11.639,35.517,12.589,35.517,13.762z"/>
                </svg>
              </button>
              <button className="hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
                  <path fill="#FF3D00" d="M43.2,33.9c-0.4,2.1-2.1,3.7-4.2,4c-3.3,0.5-8.8,1.1-15,1.1c-6.1,0-11.6-0.6-15-1.1c-2.1-0.3-3.8-1.9-4.2-4C4.4,31.6,4,28.2,4,24c0-4.2,0.4-7.6,0.8-9.9c0.4-2.1,2.1-3.7,4.2-4C12.3,9.6,17.8,9,24,9c6.2,0,11.6,0.6,15,1.1c2.1,0.3,3.8,1.9,4.2,4c0.4,2.3,0.9,5.7,0.9,9.9C44,28.2,43.6,31.6,43.2,33.9z"/>
                  <path fill="#FFF" d="M20 31L20 17 32 24z"/>
                </svg>
              </button>
              <button className="hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
                  <path fill="#00C300" d="M12,30c-1.1,0-2-0.9-2-2V10c0-1.1,0.9-2,2-2h26c1.1,0,2,0.9,2,2v18c0,1.1-0.9,2-2,2H12z"/>
                  <path fill="#FFF" d="M14.4,26.1L14.4,18.2L18.2,22.1Z"/>
                  <path fill="#FFF" d="M33.6,26.1L33.6,18.2L29.8,22.1Z"/>
                  <path fill="#FFF" d="M24,16.5L14.4,26.1H33.6L24,16.5z"/>
                  <path fill="#00C300" d="M10,16V34c0,1.1,0.9,2,2,2h10V33c0-1.1,0.9-2,2-2h0c1.1,0,2,0.9,2,2v3h10c1.1,0,2-0.9,2-2V16H10z"/>
                  <path fill="#FFF" d="M14,37v-9h4v9H14z"/>
                  <path fill="#FFF" d="M30,37v-9h4v9H30z"/>
                  <path fill="#FFF" d="M22,37v-9h4v9H22z"/>
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
