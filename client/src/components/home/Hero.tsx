import { useRef, useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Mic, MicOff, Phone, Trees, Home as HomeIcon, Store, Gavel, Trophy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import type { SpeechRecognition } from "@/types/speech-recognition";
import { KAKAO_CHANNEL_URL } from "@/lib/constants";

const Hero = () => {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ko-KR';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchKeyword(transcript);
        handleSearch(transcript);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert("음성 검색은 보안 연결(HTTPS) 환경이나 지원되는 브라우저에서 사용 가능합니다.");
      return;
    }
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  }, [isListening]);

  const handleSearch = (keyword?: string) => {
    const term = keyword || searchKeyword;
    if (term.trim()) setLocation(`/properties?keyword=${encodeURIComponent(term.trim())}`);
    else setLocation("/properties");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const categoryButtons = [
    {
      title: "토지",
      desc: "전·답·대지·임야",
      icon: Trees,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200 hover:border-emerald-500",
      onClick: () => setLocation(`/properties?type=${encodeURIComponent("토지")}`),
    },
    {
      title: "주택",
      desc: "전원·농가주택",
      icon: HomeIcon,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200 hover:border-amber-500",
      onClick: () => setLocation(`/properties?type=${encodeURIComponent("주택")}`),
    },
    {
      title: "상가",
      desc: "점포·창고·펜션",
      icon: Store,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200 hover:border-blue-500",
      onClick: () => setLocation(`/properties?type=${encodeURIComponent("상가공장창고펜션")}`),
    },
    {
      title: "반값경매",
      desc: "법원정식등록",
      badge: "50%↓",
      icon: Gavel,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-300 hover:border-rose-500 ring-2 ring-rose-500/20",
      onClick: () => setLocation("/auctions"),
    },
  ];

  return (
    <section className="relative w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden pt-4 pb-6 md:pt-12 md:pb-16 landscape:pt-4 landscape:pb-6">
      {/* Background Subtle Pattern */}
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 max-w-4xl">
        {/* Top Badges (Desktop only or very compact on mobile) */}
        <div className="hidden sm:flex items-center justify-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-xs font-semibold">
            <Trophy className="w-3 h-3 text-yellow-400" />
            강화도 20년 전문 중개
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-semibold">
            <ShieldCheck className="w-3 h-3 text-blue-300" />
            강화군 유일 법원등록 입찰대리
          </span>
        </div>

        {/* Main Title - Compact on mobile */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            강화도 부동산 &middot;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200">
              법원경매
            </span>
          </h1>
          <p className="hidden sm:block text-slate-300 text-xs sm:text-base max-w-xl mx-auto font-normal mt-1.5">
            토지·주택·상가 실매물부터 시세 반값 법원 경매까지 안전하게 찾아드립니다.
          </p>
        </div>

        {/* Search Bar - Crisp & Fast */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto mb-4 sm:mb-6"
        >
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-1 sm:p-1.5 border-2 border-white/80 focus-within:border-orange-500 transition-all">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-2.5 sm:ml-3 shrink-0" />
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="지역(강화읍, 길상면), 매물종류, 키워드 검색"
              className="flex-1 border-0 focus-visible:ring-0 text-slate-900 placeholder:text-gray-400 text-xs sm:text-base bg-transparent h-10 sm:h-12 px-2 sm:px-3 font-medium"
            />
            {speechSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl mr-1 hover:bg-slate-100 ${isListening ? "text-red-500 animate-pulse" : "text-gray-400"}`}
                title="음성 검색"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Button
              onClick={() => handleSearch()}
              className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-base shrink-0 shadow-md transition-transform active:scale-95 touch-manipulation"
            >
              검색
            </Button>
          </div>
        </motion.div>

        {/* 4 Crisp & Intuitive Category Menu Buttons (1 row of 4 on mobile & desktop) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5 max-w-2xl mx-auto">
          {categoryButtons.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.title}
                onClick={cat.onClick}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white text-slate-900 border ${cat.borderColor} shadow-md transition-all text-center group cursor-pointer touch-manipulation min-h-[72px] sm:min-h-[100px]`}
              >
                {cat.badge && (
                  <span className="absolute -top-2 right-1 sm:right-2 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                    {cat.badge}
                  </span>
                )}
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${cat.bgColor} flex items-center justify-center mb-1 sm:mb-2 shadow-inner group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${cat.iconColor}`} />
                </div>
                <h3 className="text-xs sm:text-base font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-orange-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="hidden sm:block text-[10px] sm:text-xs font-semibold text-slate-500 line-clamp-1 mt-1">
                  {cat.desc}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Direct Call & Kakao Quick CTA - Desktop only, since mobile has bottom nav & floating CTA */}
        <div className="hidden md:flex flex-wrap items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-700/50">
          <a
            href="tel:010-4787-3120"
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm px-5 py-2.5 rounded-full shadow-lg shadow-orange-500/30 transition-all transform hover:scale-105"
          >
            <Phone className="w-4 h-4 fill-white" />
            <span>010-4787-3120 직통 상담</span>
          </a>
          <Button
            onClick={() => window.open(KAKAO_CHANNEL_URL, '_blank')}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-bold text-sm h-10 px-5 rounded-full"
          >
            카카오톡 1:1 상담
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
