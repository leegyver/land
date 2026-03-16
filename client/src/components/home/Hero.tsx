import { useRef, useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Mic, MicOff, ArrowRight, Building, CheckCircle2, Trophy, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, useScroll, useTransform } from "framer-motion";

// Types are now in src/types/speech-recognition.d.ts
import type { SpeechRecognition } from "@/types/speech-recognition";
import { KAKAO_CHANNEL_URL } from "@/lib/constants";

const Hero = () => {
  const [, setLocation] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

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
      alert("음성 검색은 보안 연결(HTTPS) 환경이나 지원되는 브라우저(Chrome, Safari 등)에서만 사용 가능합니다.");
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

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Section (Dark Premium) */}
      <div className="absolute inset-0 bg-slate-950 z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />

      {/* Content Container */}
      <div className="container relative z-20 px-4 h-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Text & CTA */}
          <div className="text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-blue-600/20 backdrop-blur-md border border-blue-500/50 rounded-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-white font-bold text-sm tracking-wide">강화도 부동산 전문가 1:1 매매 솔루션</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                강화도 토지·주택<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 relative">
                  자산 가치의 극대화
                  <svg className="absolute w-full h-4 -bottom-1 left-0 text-blue-600 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 L 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 font-medium mb-8">
                강화도 10년의 노하우로 <span className="text-white border-b-2 border-blue-500 pb-1">핵심 매물</span>을 정확하게 분석하고 최고의 거래를 약속합니다.
              </p>

              <div className="flex items-center gap-6 text-gray-300 mb-8 bg-black/40 p-5 rounded-sm border border-white/10 w-fit backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-400 tracking-widest mb-2">TOTAL TRANSACTIONS</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-white text-xl">누적 거래 127건+</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-blue-400 tracking-widest mb-2">SATISFACTION</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-white text-xl">고객 만족도 4.98</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 focus-within:z-50 relative">
                <Button
                  onClick={() => window.open(KAKAO_CHANNEL_URL, '_blank')}
                  size="lg"
                  className="h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl rounded-sm transform transition-all hover:translate-y-[-2px] shadow-xl border border-blue-500"
                >
                  <span className="inline-flex items-center">전문가 1:1 상담 예약<ArrowRight className="ml-2 w-6 h-6" /></span>
                </Button>

                <Button
                  onClick={() => setLocation("/properties")}
                  size="lg"
                  variant="outline"
                  className="h-16 px-10 bg-transparent border-2 border-white/40 text-white hover:bg-white hover:text-black font-bold text-xl rounded-sm transition-all"
                >
                  전체 매물 둘러보기
                </Button>
              </div>
            </motion.div>

            {/* Simple Search Bar (Secondary) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative max-w-md"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="관심 지역이나 매물 번호를 입력하세요"
                  className="pl-12 pr-12 h-14 bg-white/5 backdrop-blur-md border-white/20 text-white placeholder:text-gray-500 rounded-sm focus-visible:ring-blue-500/50"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={toggleListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full hover:bg-white/10 ${isListening ? "text-red-500 animate-pulse" : "text-gray-400"}`}
                >
                  {isListening ? <MicOff className="h-5 h-5" /> : <Mic className="h-5 h-5" />}
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Representative Image */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative z-10 w-[420px] h-[550px] mx-auto overflow-hidden rounded-t-full border-t-8 border-x-8 border-white/10 shadow-2xl">
              <img
                src="/assets/uploads/ceo_profile.jpg"
                alt="이가이버 대표"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Expert Badge - Repositioned to 2/5 (approx 40%) to avoid face */}
              <div className="absolute top-[40%] -right-6 bg-white/95 backdrop-blur-sm p-5 rounded-sm shadow-2xl transform rotate-3 border-l-4 border-blue-600">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-blue-600 font-black tracking-widest uppercase">Expertise</p>
                    <p className="text-slate-900 font-black text-lg leading-tight">강화도 부동산<br />분석 20년</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xl">
                    20
                  </div>
                </div>
              </div>

              {/* Name Tag */}
              <div className="absolute bottom-10 left-0 right-0 px-8">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-sm">
                  <p className="text-white font-black text-3xl tracking-tighter mb-1">이가이버</p>
                  <p className="text-blue-400 font-bold text-sm flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-blue-400" />
                    공인중개사 / 강화도 부동산 전문가
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/20 blur-[100px] rounded-full z-0" />
            <div className="absolute -top-10 -right-10 w-60 h-60 bg-indigo-600/20 blur-[80px] rounded-full z-0" />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
