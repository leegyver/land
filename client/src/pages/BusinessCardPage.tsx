import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import {
  Phone,
  MessageSquare,
  MessageCircle,
  Share2,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Download,
  Building2,
  ShieldCheck,
  CreditCard,
  Navigation,
  Globe,
  Youtube,
  Instagram,
  Compass,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    kakao: any;
  }
}

// 명함 정보 설정 (필요 시 수정 가능)
const CARD_INFO = {
  name: "이민호",
  title: "대표 공인중개사",
  subtitle: "강화도 부동산 매매, 임대 & 경공매 권리분석 전문가",
  agency: "이가이버 공인중개사 사무소",
  brand: "이가이버랜드",
  slogan: "모든 강화도 부동산은 이가이버로 연결됩니다.",
  
  // 연락처
  mobile: "010-4787-3120",
  phone: "032-934-3120",
  fax: "032-932-3120",
  email: "9551304@naver.com",
  
  // 등록 및 사업자 정보
  businessNo: "558-23-01088",
  realtorNo: "제28710-2021-00012호", // 공인중개사 등록번호
  
  // 주소
  addressRoad: "인천광역시 강화군 강화읍 남문로 51, 1호",
  addressJibun: "인천광역시 강화군 강화읍 남산리 96-1",
  
  // 계좌 정보 (계약금/중개보수/자문료 입금용)
  bankAccounts: [
    {
      bankName: "카카오뱅크",
      accountNumber: "3333-37-4397902",
      accountHolder: "이민호"
    },
    {
      bankName: "기업은행",
      accountNumber: "339-108411-04-012",
      accountHolder: "(주)이구동성"
    }
  ],
  bankInfo: {
    bankName: "카카오뱅크",
    accountNumber: "3333-37-4397902",
    accountHolder: "이민호"
  },
  
  // 좌표 (인천 강화군 강화읍 남문로 51 실측 좌표)
  coords: {
    lat: 37.742424,
    lng: 126.487597
  },

  // 소셜 및 외부 링크
  links: {
    website: "https://leegyver.com",
    kakaoChannel: "https://pf.kakao.com/_xaxbxlxfs/chat",
    youtube: "https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA",
    blog: "https://blog.naver.com/9551304",
    instagram: "https://www.instagram.com/leegyver.leeminho/"
  },

  // 프로필 사진 경로
  profileImage: "/assets/uploads/ceo_profile.jpg"
};

export default function BusinessCardPage() {
  const { toast } = useToast();
  const [copiedAccountIdx, setCopiedAccountIdx] = useState<number | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // 카카오 지도 로드
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const initMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        timer = setTimeout(initMap, 200);
        return;
      }

      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(CARD_INFO.addressRoad, (result: any, status: any) => {
          if (!mapRef.current) return;

          let coords: any;
          if (status === window.kakao.maps.services.Status.OK) {
            coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
          } else {
            coords = new window.kakao.maps.LatLng(CARD_INFO.coords.lat, CARD_INFO.coords.lng);
          }

          const map = new window.kakao.maps.Map(mapRef.current, {
            center: coords,
            level: 3
          });

          // 마커 생성
          const marker = new window.kakao.maps.Marker({
            position: coords,
            map: map
          });

          // 인포윈도우
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding:6px 10px;font-size:12px;font-weight:bold;color:#0f172a;text-align:center;border-radius:8px;">
                ${CARD_INFO.agency}
              </div>
            `
          });
          infowindow.open(map, marker);
        });
      });
    };

    initMap();
    return () => clearTimeout(timer);
  }, []);

  // 계좌번호 복사
  const handleCopyAccount = async (account: typeof CARD_INFO.bankAccounts[0], idx: number) => {
    const textToCopy = `${account.bankName} ${account.accountNumber} ${account.accountHolder}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedAccountIdx(idx);
      toast({
        title: "계좌번호가 복사되었습니다",
        description: `${account.bankName} ${account.accountNumber} (${account.accountHolder})`
      });
      setTimeout(() => setCopiedAccountIdx(null), 2500);
    } catch (err) {
      toast({
        title: "복사 실패",
        description: "직접 드래그하여 복사해주세요.",
        variant: "destructive"
      });
    }
  };

  // 주소 복사
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CARD_INFO.addressRoad);
      setCopiedAddress(true);
      toast({
        title: "주소가 복사되었습니다",
        description: CARD_INFO.addressRoad
      });
      setTimeout(() => setCopiedAddress(false), 2500);
    } catch (err) {
      toast({
        title: "복사 실패",
        description: "직접 드래그하여 복사해주세요.",
        variant: "destructive"
      });
    }
  };

  // 명함 링크 복사 / 공유
  const handleShareCard = async () => {
    const url = "https://leegyver.com/card";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${CARD_INFO.agency} ${CARD_INFO.name} 대표 모바일 명함`,
          text: `${CARD_INFO.agency} ${CARD_INFO.name} 대표의 모바일 명함입니다.`,
          url: url
        });
        return;
      } catch (e) {
        // 취소했거나 미지원 시 복사로 진행
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast({
        title: "명함 링크가 복사되었습니다",
        description: "원하시는 곳에 붙여넣기(Ctrl+V)하여 전달하세요."
      });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      toast({
        title: "복사 실패",
        description: url
      });
    }
  };

  // 연락처(vCard) 파일 생성 및 다운로드 (서버 API 연동으로 모바일 인앱/사파리 100% 호환)
  const handleDownloadVCard = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      // 서버 엔드포인트(/api/vcard)로 직접 이동하여 스마트폰 네이티브 연락처 등록 트리거
      window.location.href = "/api/vcard";
      toast({
        title: "연락처 파일 다운로드",
        description: "화면의 [가져오기] 또는 [저장] 버튼을 누르면 전화번호부에 등록이 완료됩니다."
      });
    } catch (err) {
      // 차단 브라우저 대응 새 창 열기
      window.open("/api/vcard", "_blank");
    }
  };

  // 티맵 길안내 (상호명 검색 실패 방지를 위해 정확한 좌표 기반 경로안내 실행)
  const handleOpenTmap = (e: React.MouseEvent) => {
    e.preventDefault();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // 티맵 앱: 목적지 좌표와 상호명으로 즉시 경로안내 시작
      const tmapUrl = `tmap://route?goalname=${encodeURIComponent(CARD_INFO.agency)}&goaly=${CARD_INFO.coords.lat}&goalx=${CARD_INFO.coords.lng}`;
      window.location.href = tmapUrl;
      // 1.5초 후 앱 미설치 시 카카오맵 길찾기로 대체 오픈
      setTimeout(() => {
        window.open(`https://map.kakao.com/link/to/${encodeURIComponent(CARD_INFO.agency)},${CARD_INFO.coords.lat},${CARD_INFO.coords.lng}`, "_blank");
      }, 1500);
    } else {
      // PC 환경에서는 카카오맵 길찾기로 오픈
      window.open(`https://map.kakao.com/link/to/${encodeURIComponent(CARD_INFO.agency)},${CARD_INFO.coords.lat},${CARD_INFO.coords.lng}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-0 sm:py-6 flex justify-center items-start selection:bg-amber-500 selection:text-white">
      <Helmet>
        <title>{`${CARD_INFO.agency} ${CARD_INFO.name} 대표 | 모바일 명함`}</title>
        <meta name="description" content={`${CARD_INFO.agency} 대표 공인중개사 ${CARD_INFO.name}. 전화, 문자, 카톡상담, 오시는 길 안내.`} />
        <meta property="og:title" content={`${CARD_INFO.agency} ${CARD_INFO.name} 대표 모바일 명함`} />
        <meta property="og:description" content={`${CARD_INFO.slogan} 직통: ${CARD_INFO.mobile}`} />
        <meta property="og:image" content={CARD_INFO.profileImage} />
        <meta property="og:url" content="https://leegyver.com/card" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Helmet>

      {/* 스마트폰 카드 컨테이너 (360px ~ 430px 폭 최적화) */}
      <div className="w-full sm:max-w-[420px] bg-slate-900 sm:rounded-3xl shadow-2xl border border-slate-800/80 overflow-hidden text-slate-100 flex flex-col relative">
        
        {/* 상단 액션바 (공유 & 연락처 저장) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleShareCard}
            aria-label="명함 공유하기"
            className="w-9 h-9 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>

        {/* 상단 비주얼 헤더 배너 */}
        <div className="relative h-44 bg-gradient-to-br from-amber-600 via-amber-700 to-slate-950 overflow-hidden">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 bottom-0 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="absolute top-5 left-5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider bg-white/15 backdrop-blur-md text-amber-200 border border-amber-300/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              OFFICIAL CERTIFIED
            </span>
          </div>
        </div>

        {/* 프로필 이미지 & 기본 정보 */}
        <div className="px-6 relative -mt-16 pb-4">
          <div className="flex flex-col items-center text-center">
            {/* 프로필 사진 */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full ring-4 ring-slate-900 ring-offset-2 ring-offset-amber-500 shadow-2xl overflow-hidden bg-slate-800">
                {!imgError ? (
                  <img
                    src={CARD_INFO.profileImage}
                    alt={CARD_INFO.name}
                    className="w-full h-full object-cover object-top"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-600 to-amber-800 text-white text-3xl font-bold">
                    {CARD_INFO.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md border-2 border-slate-900">
                대표
              </div>
            </div>

            {/* 이름 및 직함 */}
            <h1 className="text-2xl font-black text-white mt-3.5 flex items-center gap-2">
              {CARD_INFO.name}
              <span className="text-sm font-semibold text-amber-400 font-sans tracking-normal">
                {CARD_INFO.title}
              </span>
            </h1>

            <p className="text-xs font-semibold text-slate-400 mt-1">
              {CARD_INFO.agency}
            </p>

            <p className="text-[13px] text-slate-300 mt-2 font-medium bg-slate-800/60 px-3.5 py-1.5 rounded-full border border-slate-700/60 break-keep">
              "{CARD_INFO.slogan}"
            </p>
          </div>
        </div>

        {/* 4대 원터치 퀵 액션 (전화, 문자, 카톡, 연락처저장) */}
        <div className="px-5 py-2">
          <div className="grid grid-cols-4 gap-2.5">
            {/* 1. 전화 걸기 */}
            <a
              href={`tel:${CARD_INFO.mobile}`}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/30 hover:brightness-110 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Phone className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xs font-bold">전화 걸기</span>
              <span className="text-[10px] opacity-80 mt-0.5">직통연결</span>
            </a>

            {/* 2. 문자 보내기 */}
            <a
              href={`sms:${CARD_INFO.mobile}?body=안녕하세요 대표님, 모바일 명함 보고 연락드립니다.`}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-900/30 hover:brightness-110 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">문자 전송</span>
              <span className="text-[10px] opacity-80 mt-0.5">문자문의</span>
            </a>

            {/* 3. 카카오톡 상담 */}
            <a
              href={CARD_INFO.links.kakaoChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-900/30 hover:brightness-110 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xs font-bold">카톡 상담</span>
              <span className="text-[10px] opacity-75 mt-0.5">1:1 실시간</span>
            </a>

            {/* 4. 연락처 폰에 저장 */}
            <a
              href="/api/vcard"
              download="이민호-이가이버.vcf"
              onClick={handleDownloadVCard}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 text-white border border-slate-600/60 shadow-lg hover:brightness-110 active:scale-95 transition-all text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-xs font-bold">연락처 저장</span>
              <span className="text-[10px] text-slate-300 mt-0.5">폰에추가</span>
            </a>
          </div>
        </div>

        {/* 메인 콘텐츠 리스트 */}
        <div className="px-5 py-3 space-y-4">

          {/* 1. 중개사무소 인증 & 자격 상세 */}
          <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/70 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-700/60">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Building2 className="w-4 h-4" />
                공인중개사 자격 및 등록정보
              </span>
              <span className="text-[11px] text-slate-400">등록 완료</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">상호명</span>
                <span className="font-semibold text-slate-200">{CARD_INFO.agency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">대표 공인중개사</span>
                <span className="font-semibold text-slate-200">{CARD_INFO.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">중개등록번호</span>
                <span className="font-mono font-semibold text-amber-300">{CARD_INFO.realtorNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">사업자등록번호</span>
                <span className="font-mono font-semibold text-slate-200">{CARD_INFO.businessNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">대표전화 / 팩스</span>
                <span className="font-mono text-slate-200">{CARD_INFO.phone} / {CARD_INFO.fax}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">이메일</span>
                <span className="font-mono text-slate-200">{CARD_INFO.email}</span>
              </div>
            </div>
          </div>

          {/* 2. 계좌번호 복사 섹션 (사용자 필수 요구사항) */}
          <div className="bg-gradient-to-r from-slate-800/90 to-amber-950/30 rounded-2xl p-3.5 sm:p-4 border border-amber-500/30 shadow-md">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100">입금 전용 계좌안내</h3>
                <p className="text-[11px] text-slate-400">중개보수 · 용역비 · 입찰보증금</p>
              </div>
            </div>

            {/* 계좌 정보 카드 목록 (가로바 없음, 각 계좌 한 줄 배치 + 개별 복사 버튼) */}
            <div className="space-y-2">
              {CARD_INFO.bankAccounts.map((account, idx) => {
                const isCopied = copiedAccountIdx === idx;
                return (
                  <div
                    key={idx}
                    className="bg-slate-900/90 rounded-xl px-2.5 sm:px-3 py-2.5 border border-slate-700/60 overflow-hidden flex items-center justify-between gap-1 sm:gap-1.5"
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {account.bankName}
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-amber-400 tracking-tight whitespace-nowrap">
                        {account.accountNumber}
                      </span>
                      <span className="shrink-0 text-[10px] sm:text-[11px] font-medium text-slate-300 whitespace-nowrap">
                        <span className="text-slate-400">예금주: </span>
                        <strong className="text-white font-bold">{account.accountHolder}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyAccount(account, idx)}
                      className={`shrink-0 flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all active:scale-95 shadow ${
                        isCopied
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-slate-950" />
                          <span>복사완료</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>복사</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. 오시는 길 & 지도 섹션 */}
          <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/70 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100">오시는 길 & 사무소 위치</h3>
              </div>
              <button
                onClick={handleCopyAddress}
                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 bg-slate-700/70 px-2 py-1 rounded-lg border border-slate-600 transition-colors"
              >
                {copiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                주소 복사
              </button>
            </div>

            <div className="text-xs text-slate-300 mb-3 space-y-0.5">
              <p className="font-semibold text-slate-100">{CARD_INFO.addressRoad}</p>
              <p className="text-slate-400 text-[11px]">(지번) {CARD_INFO.addressJibun}</p>
            </div>

            {/* 카카오맵 뷰어 */}
            <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-700 relative mb-3 bg-slate-900">
              <div ref={mapRef} className="w-full h-full" />
            </div>

            {/* 3대 네비게이션 앱 원터치 연동 */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://map.kakao.com/link/to/${encodeURIComponent(CARD_INFO.agency)},${CARD_INFO.coords.lat},${CARD_INFO.coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>카카오맵</span>
              </a>

              <a
                href={`https://map.naver.com/v5/search/${encodeURIComponent(CARD_INFO.addressRoad)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-[#03C75A] text-white text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>네이버지도</span>
              </a>

              <button
                type="button"
                onClick={handleOpenTmap}
                className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-red-600 text-white text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>티맵 길안내</span>
              </button>
            </div>
          </div>

          {/* 4. 공식 웹사이트 및 소셜 채널 바로가기 */}
          <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/70 shadow-sm space-y-2.5">
            <div className="text-xs font-bold text-slate-300 pb-1 border-b border-slate-700/60 flex items-center justify-between">
              <span>이가이버 공식 채널</span>
              <span className="text-[10px] text-slate-400">바로가기</span>
            </div>

            {/* 공식 홈페이지 */}
            <a
              href={CARD_INFO.links.website}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    이가이버부동산 공식 홈페이지
                  </div>
                  <div className="text-[10px] text-slate-400">leegyver.com 매물 검색 & 부동산 정보</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            </a>

            {/* 유튜브 채널 */}
            <a
              href={CARD_INFO.links.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center">
                  <Youtube className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                    유튜브 '이가이버의 강화도 부동산 및 일상' 채널
                  </div>
                  <div className="text-[10px] text-slate-400">생생한 부동산 현장 영상 & 강화도 일상 안내</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            </a>

            {/* 네이버 블로그 */}
            <a
              href={CARD_INFO.links.blog}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    공식 네이버 블로그
                  </div>
                  <div className="text-[10px] text-slate-400">강화도 소개 & 이가이버 칼럼</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            </a>

            {/* 인스타그램 */}
            <a
              href={CARD_INFO.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Instagram className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors">
                    인스타그램 공식 계정
                  </div>
                  <div className="text-[10px] text-slate-400">@leegyver.leeminho</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            </a>
          </div>

          {/* 명함 전달 / 공유하기 하단 바 */}
          <div className="pt-2">
            <button
              onClick={handleShareCard}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/40 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>링크가 클립보드에 복사되었습니다!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>이 모바일 명함 보내기 / 링크 복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 하단 푸터 저작권 */}
        <div className="mt-4 pt-4 pb-8 px-6 text-center border-t border-slate-800/80 bg-slate-950/60">
          <p className="text-[11px] text-slate-400 font-medium">
            {CARD_INFO.agency} · 대표 {CARD_INFO.name}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            © {new Date().getFullYear()} {CARD_INFO.brand}. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}
