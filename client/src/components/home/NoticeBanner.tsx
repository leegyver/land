
import { useQuery } from "@tanstack/react-query";
import { Notice } from "@shared/schema";
import { Megaphone, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function NoticeBanner() {
    const { data: notice, isLoading } = useQuery<Notice | null>({
        queryKey: ["/api/notices/pinned"],
    });

    if (isLoading || !notice) return null;

    return (
        <div className="bg-slate-900 text-white border-b border-slate-800">
            <div className="container mx-auto px-4 py-3">
                <Link href="/contact?tab=notice">
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
                </Link>
            </div>
        </div>
    );
}
