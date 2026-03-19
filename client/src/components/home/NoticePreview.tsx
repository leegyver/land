import { useQuery } from "@tanstack/react-query";
import { Bell, ArrowRight, ChevronRight, Megaphone } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const NoticePreview = () => {
    const { data } = useQuery<{ items: Notice[]; total: number }>({
        queryKey: ["/api/notices", { limit: 4 }],
        queryFn: async () => {
            const res = await fetch("/api/notices?page=1&limit=4");
            if (!res.ok) throw new Error("Failed to fetch notices");
            return res.json();
        }
    });

    const notices = data?.items || [];

    return (
        <section className="bg-white border-b border-slate-100 py-1 md:py-2">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Header Side */}
                    <div className="flex-shrink-0 flex items-center gap-4 md:border-r md:border-slate-200 md:pr-10">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                            <Megaphone className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 leading-tight whitespace-nowrap">주요공지 알림!</h2>
                        </div>
                    </div>

                    {/* Notice List Side */}
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {notices.length > 0 ? (
                            notices.map((notice) => (
                                <Link key={notice.id} href={`/notices`}>
                                    <div className="group cursor-pointer p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 relative overflow-hidden">
                                        <div className="flex flex-col gap-2 relative z-10">
                                            <div className="flex items-center gap-2 mb-1">
                                                {notice.isPinned && (
                                                    <Badge variant="destructive" className="px-1.5 py-0 text-[10px] font-bold">중요</Badge>
                                                )}
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {notice.createdAt ? format(new Date(notice.createdAt), "MM.dd", { locale: ko }) : "-"}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-orange-600 transition-colors">
                                                {notice.title}
                                            </h3>
                                        </div>
                                        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-4 text-slate-400 text-sm font-medium">등록된 공지사항이 없습니다.</div>
                        )}
                    </div>

                    {/* More Button */}
                    <Link href="/notices" className="flex-shrink-0">
                        <Button variant="ghost" size="sm" className="hidden lg:flex items-center text-slate-400 hover:text-slate-900 font-bold group">
                            전체보기 <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button variant="outline" className="lg:hidden w-full border-slate-200 text-slate-600 font-bold h-12 rounded-xl">
                            공지사항 전체보기
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default NoticePreview;
