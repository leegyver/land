import { Phone } from "lucide-react";
import { KAKAO_CHANNEL_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

const FloatingCTA = () => {
    const [location] = useLocation();

    // Don't show on admin pages or map popup
    if (location.startsWith("/admin") || location.startsWith("/popup")) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-20 right-3.5 z-40 md:bottom-8 md:right-8 landscape:bottom-14 landscape:right-3 flex flex-col landscape:flex-row gap-2.5 sm:gap-3 items-end landscape:items-center pr-safe pb-safe"
            >
                <div className="flex flex-col landscape:flex-row gap-2.5 sm:gap-3 items-end">
                    {/* Phone Button (Secondary) */}
                    <a
                        href="tel:010-4787-3120"
                        className="group relative touch-manipulation"
                    >
                        <span className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-bold tracking-tight px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-md pointer-events-none">
                            전화 상담
                        </span>
                        <Button
                            size="icon"
                            className="w-12 h-12 sm:w-14 sm:h-14 landscape:w-10 landscape:h-10 rounded-2xl landscape:rounded-xl bg-white hover:bg-slate-50 text-slate-900 shadow-lg border-2 border-slate-900 transition-all duration-300 hover:scale-105 active:scale-95"
                            title="전화 상담: 010-4787-3120"
                        >
                            <Phone className="w-5 h-5 sm:w-6 sm:h-6 landscape:w-4 landscape:h-4 text-slate-900" />
                        </Button>
                    </a>

                    {/* KakaoTalk Button (Principal CTA - prominent & perfectly sized) */}
                    <a
                        href={KAKAO_CHANNEL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative touch-manipulation"
                    >
                        <span className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-yellow-400 text-slate-950 text-[11px] font-black tracking-tight px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-md pointer-events-none">
                            카카오톡 상담
                        </span>
                        <Button
                            size="icon"
                            className="w-14 h-14 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 rounded-2xl landscape:rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-slate-950 shadow-xl border-2 border-yellow-400/80 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center p-0"
                            title="카카오톡 1:1 상담"
                        >
                            <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-9 sm:h-9 landscape:w-6 landscape:h-6 fill-slate-950">
                                <path d="M50,0 C22.386,0 0,17.909 0,40 C0,53.139 8.689,64.753 21.906,72.13 C21.074,75.592 17.396,89.504 17.067,90.773 C16.654,92.449 17.894,92.437 18.655,91.936 C19.244,91.548 36.108,80.04 41.89,76.306 C44.558,76.768 47.288,77 50,77 C77.614,77 100,59.091 100,37 C100,14.909 77.614,0 50,0 Z" />
                            </svg>
                        </Button>
                        {/* Notification Badge */}
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 landscape:h-4 landscape:w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 sm:h-6 sm:w-6 landscape:h-4 landscape:w-4 bg-red-600 text-[10px] landscape:text-[8px] font-black text-white justify-center items-center border-2 border-white">1</span>
                        </span>
                    </a>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FloatingCTA;
