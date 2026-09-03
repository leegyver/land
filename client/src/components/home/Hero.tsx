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

  const scrollToAuction = () => {
    const el = document.getElementById("auction-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      setLocation("/properties?category=auction");
    }
  };

  const categoryButtons = [
    {
      title: "토지",
      desc: "전·답·대지·임야",
      icon: Trees,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200 hover:border-emerald-500",
      onClick: () => setLocation("/properties?type=land"),
    },
    {
      title: "주택",
      desc: "전원주택·농가주택",
      icon: HomeIcon,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200 hover:border-amber-500",
      onClick: () => setLocation("/properties?type=house"),
    },
    {
      title: "상가",
      desc: "근린상가·점포·창고",
      icon: Store,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200 hover:border-blue-500",
      onClick: () => setLocation("/properties?type=commercial"),
    },
    {
      title: "법원경매",
      desc: "⚡반값 찬스·안전입찰",
      badge: "시세 50%↓",
      icon: Gavel,
      iconColor: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-300 hover:border-rose-500 ring-2 ring-rose-500/20",
      onClick: scrollToAuction,
    },
  ];

  return (
    <section className="relative w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden pt-8 pb-12 md:pt-14 md:pb-20">
      {/* Background Subtle Pattern */}
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-orange-500/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 max-w-5xl">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-xs md:text-sm font-semibold">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            강화도 20년 전문 중개
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs md:text-sm font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            강화군 유일 법원등록 입찰대리
          </span>
        </div>

        {/* Main Title */}
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            강화도 최고의 부동산 파트너,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200">
              이가이버
            </span>
          </h1>
          <p className="text-slate-300 text-sm md:text-lg max-w-2xl mx-auto font-medium">
            토지·주택·상가 급매물부터 시세 반값 법원 경매까지 안전하게 찾아드립니다.
          </p>
        </div>

        {/* Big Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto mb-10"
        >
          <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-1.5 border-2 border-white/80 focus-within:border-orange-500 transition-all">
            <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="지역(예: 길상면, 강화읍), 매물종류, 키워드 검색"
              className="flex-1 border-0 focus-visible:ring-0 text-slate-900 placeholder:text-gray-400 text-sm md:text-base bg-transparent h-11 md:h-12 px-3 font-medium"
            />
            {speechSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={`w-9 h-9 rounded-xl mr-1 hover:bg-slate-100 ${isListening ? "text-red-500 animate-pulse" : "text-gray-400"}`}
                title="음성 검색"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Button
              onClick={() => handleSearch()}
              className="h-11 md:h-12 px-5 md:px-7 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm md:text-base shrink-0 shadow-md transition-transform active:scale-95"
            >
              검색
            </Button>
          </div>
        </motion.div>

        {/* 4 Super Friendly Category Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {categoryButtons.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.title}
                onClick={cat.onClick}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-white text-slate-900 border-2 ${cat.borderColor} shadow-lg transition-all text-center group cursor-pointer`}
              >
                {cat.badge && (
                  <span className="absolute -top-2.5 right-2 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full shadow-md animate-bounce">
                    {cat.badge}
                  </span>
                )}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${cat.bgColor} flex items-center justify-center mb-2.5 sm:mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-8 h-8 sm:w-9 sm:h-9 ${cat.iconColor}`} />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-0.5 tracking-tight group-hover:text-orange-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 line-clamp-1">
                  {cat.desc}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Direct Call & Kakao Quick CTA */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-4 border-t border-slate-700/50">
          <a
            href="tel:010-4787-3120"
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm sm:text-base px-6 py-3 rounded-full shadow-lg shadow-orange-500/30 transition-all transform hover:scale-105"
          >
            <Phone className="w-4 h-4 fill-white" />
            <span>010-4787-3120 직통 상담</span>
          </a>
          <Button
            onClick={() => window.open(KAKAO_CHANNEL_URL, '_blank')}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-bold text-sm sm:text-base h-12 px-6 rounded-full"
          >
            카카오톡 1:1 상담
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
