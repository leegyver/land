import { MessageCircle, Phone } from "lucide-react";
import { KAKAO_CHANNEL_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const FloatingCTA = () => {
    const [location] = useLocation();

    // Don't show on admin pages or map popup
    // Move after hooks to prevent "Rendered fewer hooks than expected" (Error #300)
    if (location.startsWith("/admin") || location.startsWith("/popup")) return null;

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
                <div className="flex flex-col gap-4">
                    {/* KakaoTalk Button (Principal CTA) */}
                    <a
                        href={KAKAO_CHANNEL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative"
                    >
                        <Button
                            size="icon"
                            className="w-16 h-16 rounded-2xl bg-[#FEE500] hover:bg-[#FDD835] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] border-2 border-transparent hover:border-black/5 transition-all duration-300 hover:scale-110 active:scale-95"
                            title="카카오톡 상담"
                        >
                            <MessageCircle className="w-8 h-8 fill-current" />
                        </Button>
                        {/* Notification Badge */}
                        <span className="absolute -top-1 -right-1 flex h-6 w-6">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-6 w-6 bg-red-600 text-[10px] font-black text-white justify-center items-center border-2 border-white">1</span>
                        </span>
                    </a>

                    {/* Phone Button (Secondary) */}
                    <a
                        href="tel:010-4787-3120"
                        className="group relative"
                    >
                        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-xl">
                            Call Agent
                        </span>
                        <Button
                            size="icon"
                            className="w-14 h-14 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] border-2 border-slate-900 transition-all duration-300 hover:scale-110 active:scale-95"
                            title="전화 상담"
                        >
                            <Phone className="w-6 h-6" />
                        </Button>
                    </a>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FloatingCTA;
