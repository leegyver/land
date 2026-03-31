
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Notice } from "@shared/schema";
import { Megaphone, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function NoticeBanner() {
    const { data: notice, isLoading, isFetching } = useQuery<Notice | null>({
        queryKey: ["/api/notices/pinned"],
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지 (불필요한 리페칭 방지)
        refetchOnWindowFocus: false, // 탭 전환 시 리페칭 방지 (깜빡임 원인)
        refetchOnMount: true, // 기본값 false를 재정의 - 공지는 항상 확인 필요
        placeholderData: keepPreviousData, // 리페칭 중에도 이전 데이터 유지
    });

    // 데이터가 없고 로딩 중이면 레이아웃 시프트 방지를 위해 빈 공간 유지
    // (isLoading은 최초 로딩일 때만 true - 리페칭 중에는 isFetching만 true)
    if (!notice && !isLoading) return null; // 데이터 확정적으로 없음
    if (!notice) return null; // 로딩 중이어도 아직 데이터가 없으면 숨김 (최초)

    return (
        <div className="bg-slate-900 text-white border-b border-slate-800">
            <div className="container mx-auto px-4 py-3">
                <a href="/contact?tab=notice" className="block">
                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="bg-white/10 p-1.5 rounded-full group-hover:bg-red-600 transition-colors">
                            <Megaphone className="h-4 w-4 text-red-400 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 flex items-center gap-2 overflow-hidden">
                            <span className="font-bold text-white bg-red-600 px-2 py-0.5 rounded text-xs whitespace-nowrap">공지</span>
                            <span className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                                {notice.title}
                            </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                </a>
            </div>
        </div>
    );
}


