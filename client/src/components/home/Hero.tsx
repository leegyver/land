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
      {/* Background Image with Parallax */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: 'url("/assets/uploads/home-banner-new.jpg")',
          y: y,
          scale: 1.1
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />

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
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-orange-500/20 backdrop-blur-md border border-orange-500/50 rounded-full">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-orange-300 font-bold text-sm tracking-wide">강화도 토지·주택·상가 전문</span>
                <span className="text-gray-400 text-xs">|</span>
                <span className="text-white font-medium text-sm">2026년 지금이 기회입니다</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                강화도의 소중한 공간,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 relative">
                  이가이버가 찾아드립니다
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-500 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                  </svg>
                </span>
              </h1>

              <div className="flex items-center gap-6 text-gray-300 mb-8">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium">누적 거래 127건+</span>
                </div>
                <div className="w-px h-4 bg-gray-600" />
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium">고객 만족도 4.98점</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => window.open(KAKAO_CHANNEL_URL, '_blank')}
                  size="lg"
                  className="h-14 px-8 btn-primary-cta text-lg rounded-full"
                >
                  지금 상담 신청하고 <br className="sm:hidden" />무료로 매물 추천 받기
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <Button
                  onClick={() => setLocation("/properties")}
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white font-bold text-lg rounded-full transition-all"
                >
                  지도에서 바로 매물 보기
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
                  placeholder="원하시는 지역이나 매물을 검색해보세요"
                  className="pl-12 pr-12 h-12 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-gray-400 rounded-xl focus-visible:ring-orange-500/50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-white/10 ${isListening ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-white"}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Representative Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative z-10 w-[400px] h-[500px] mx-auto bg-gradient-to-b from-gray-900/0 to-gray-900/80 rounded-b-3xl overflow-hidden">
              {/* Placeholder for Representative Image - Replace src with actual image */}
              <img
                src="/assets/uploads/home-banner-final-v3.jpg"
                alt="이가이버 대표"
                className="w-full h-full object-cover object-center mask-image-gradient"
                style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
              />

              {/* Expert Badge */}
              <div className="absolute top-10 -right-4 bg-white p-4 rounded-xl shadow-2xl transform rotate-3 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    10
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">SINCE 2014</p>
                    <p className="text-gray-900 font-bold text-sm">10년차 강화도 전문가</p>
                  </div>
                </div>
              </div>

              {/* Name Tag */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-center w-max">
                <p className="text-white font-bold text-lg">이가이버 <span className="text-orange-400 font-normal text-sm ml-1">대표 공인중개사</span></p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -inset-4 bg-orange-500/20 blur-3xl rounded-full z-0 opacity-50" />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
