import { useState } from "react";
import { Phone, X } from "lucide-react";
import { SiKakaotalk } from "react-icons/si";

const FloatingContactButtons = () => {
  const phoneNumber = "010-4787-3120";
  const phoneNumberRaw = "01047873120";
  const kakaoChannelUrl = "http://pf.kakao.com/_xaxbxlxfs/chat";
  const [showPhonePopup, setShowPhonePopup] = useState(false);

  return (
    <>
      {/* PC 버전: 지도 상단 고정 */}
      <div className="hidden md:flex fixed top-20 right-4 z-40 flex-col gap-3" data-testid="floating-buttons-desktop">
        <button
          onClick={() => setShowPhonePopup(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-all"
          data-testid="button-call-desktop"
        >
          <Phone className="w-5 h-5" />
          <span className="font-medium">전화상담</span>
        </button>
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

      {/* PC 전화번호 팝업 */}
      {showPhonePopup && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/50" onClick={() => setShowPhonePopup(false)}>
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">전화 상담</h3>
              <button onClick={() => setShowPhonePopup(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-4">
              <Phone className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold text-primary">{phoneNumber}</p>
              <p className="text-gray-500 mt-2">위 번호로 전화주시면 친절히 상담해 드립니다.</p>
            </div>
          </div>
        </div>
      )}

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
