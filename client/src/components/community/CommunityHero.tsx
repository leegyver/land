import { Link, useLocation } from "wouter";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommunityHeroProps {
    user: any;
}

export function CommunityHero({ user }: CommunityHeroProps) {
    const [, setLocation] = useLocation();

    return (
        <div className="relative pt-2 pb-6 lg:pt-4 lg:pb-10 overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.15),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.1),transparent_50%)]" />
            <div className="container relative mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-bold tracking-wider uppercase backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        강화도 사람들만의 특별한 공간
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                        이가이버 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400">커뮤니티</span>
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg font-medium max-w-4xl mx-auto break-keep leading-relaxed">
                        소제목 정보 공유부터 소소한 이웃 이야기까지,
                        <br className="hidden md:block" />
                        강화도 살이의 모든 즐거움을 함께 나눕니다.
                    </p>

                    {user && (
                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                            <Button
                                onClick={() => setLocation("/community/new")}
                                className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                게시글 작성하기
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
