import { Phone, MessageCircle } from "lucide-react";
import { SiKakaotalk } from "react-icons/si";

const FloatingContactButtons = () => {
  const phoneNumber = "01047873120";
  const kakaoChannelUrl = "http://pf.kakao.com/_xaxbxlxfs/chat";

  return (
    <>
      {/* PC 버전: 지도 상단 고정 */}
      <div className="hidden md:flex fixed top-20 right-4 z-40 flex-col gap-3" data-testid="floating-buttons-desktop">
        <a
          href={`tel:${phoneNumber}`}
          className="flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-all"
          data-testid="button-call-desktop"
        >
          <Phone className="w-5 h-5" />
          <span className="font-medium">전화상담</span>
        </a>
        <a
          href={kakaoChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#FEE500] text-[#191919] px-4 py-3 rounded-full shadow-lg hover:bg-[#FDD835] transition-all"
          data-testid="button-kakao-desktop"
        >
          <SiKakaotalk className="w-5 h-5" />
          <span className="font-medium">카톡상담</span>
        </a>
      </div>

      {/* 모바일 버전: 하단 고정 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg" data-testid="floating-buttons-mobile">
        <div className="flex">
          <a
            href={`tel:${phoneNumber}`}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-4"
            data-testid="button-call-mobile"
          >
            <Phone className="w-5 h-5" />
            <span className="font-medium">전화상담</span>
          </a>
          <a
            href={kakaoChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#FEE500] text-[#191919] py-4"
            data-testid="button-kakao-mobile"
          >
            <SiKakaotalk className="w-5 h-5" />
            <span className="font-medium">카톡상담</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default FloatingContactButtons;
