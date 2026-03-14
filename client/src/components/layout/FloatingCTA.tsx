import { MessageCircle, Phone, X } from "lucide-react";
import { KAKAO_CHANNEL_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const FloatingCTA = () => {
    // const [isVisible, setIsVisible] = useState(false); // Removed scroll logic
    const [location] = useLocation();

    // useEffect(() => { ... }, []); // Removed scroll listener

    // Don't show on admin pages or map popup
    if (location.startsWith("/admin") || location.startsWith("/popup")) return null;

    // 챗봇 스크립트 (환영 메시지) - 3초 후 표시
    const [showBubble, setShowBubble] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowBubble(true);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {/* Always visible logic: The user requested "always visible". 
                However, existing logic hides it until scroll. 
                I will remove the scroll check for the Kakao button or make the whole component always visible?
                "홈페이지 오른쪽 하단에 카카오톡 플로팅 버튼 (항상 보이게)"
                I'll make it always visible but keep the animation for initial load.
            */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-20 right-4 z-40 md:bottom-8 md:right-8 flex flex-col gap-4 items-end"
            >
                {/* Welcome Bubble */}
                <AnimatePresence>
                    {showBubble && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="bg-white p-4 rounded-2xl rounded-tr-none shadow-xl border border-slate-100 max-w-[250px] mb-2 relative"
                        >
                            <button
                                onClick={() => setShowBubble(false)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                            <p className="text-sm font-medium text-gray-800 leading-snug">
                                👋 안녕하세요! <br />
                                <span className="text-orange-600 font-bold">원하시는 매물</span>이 있으신가요?
                                제가 찾아드릴게요!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col gap-3">
                    {/* KakaoTalk Button (Principal CTA) */}
                    <a
                        href={KAKAO_CHANNEL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative"
                    >
                        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            카카오톡 무료상담
                        </span>
                        <Button
                            size="icon"
                            className="w-14 h-14 rounded-full bg-[#FEE500] hover:bg-[#FDD835] text-black shadow-lg shadow-black/10 border-none transition-transform hover:scale-110"
                            title="카카오톡 상담"
                        >
                            <MessageCircle className="w-7 h-7 fill-current" />
                        </Button>
                        {/* Notification Badge */}
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white justify-center items-center">1</span>
                        </span>
                    </a>

                    {/* Phone Button (Secondary) */}
                    <a
                        href="tel:010-4787-3120"
                        className="group"
                    >
                        <Button
                            size="icon"
                            className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 text-gray-600 shadow-md border border-gray-100 transition-all"
                            title="전화 상담"
                        >
                            <Phone className="w-5 h-5" />
                        </Button>
                    </a>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FloatingCTA;
