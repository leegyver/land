import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, User as UserIcon, Eye, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Post } from "@shared/schema";
import { getCategoryInfo } from "./constants";

interface CommunityPostListProps {
    posts: Post[] | undefined;
    isLoading: boolean;
    activeCategory: string;
}

export function CommunityPostList({ posts, isLoading, activeCategory }: CommunityPostListProps) {
    const [, setLocation] = useLocation();

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-[2rem]" />
                ))}
            </div>
        );
    }

    if (!posts || posts.length === 0) {
        return (
            <div className="bg-white border border-slate-100 rounded-[3rem] p-24 text-center shadow-xl shadow-slate-200/50">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">게시글이 없습니다</h3>
                    <p className="text-slate-500 font-bold">첫 번째 게시글의 주인공이 되어보세요!</p>
                    <Button
                        onClick={() => setLocation("/community/new")}
                        className="h-12 px-8 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-xl transition-all"
                    >
                        게시글 작성하기
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 pb-20">
            {posts.map((post) => (
                <Link key={post.id} href={`/community/${post.id}`}>
                    <Card className={`hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 rounded-[2rem] overflow-hidden group cursor-pointer ${post.isPinned ? "bg-indigo-50/70 border-indigo-200" : "bg-white border-slate-100"}`}>
                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                            {post.imageUrls && post.imageUrls.length > 0 && (
                                <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden shrink-0">
                                    <img
                                        src={post.imageUrls[0]}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            )}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-2">
                                    {!!post.isPinned && (
                                        <Badge className="font-black bg-indigo-600 text-white border-none px-3 py-1 rounded-full">
                                            📌 공지
                                        </Badge>
                                    )}
                                    <Badge className={`font-black ${getCategoryInfo(post.category).color} text-white border-none px-3 py-1 rounded-full`}>
                                        {getCategoryInfo(post.category).name}
                                    </Badge>
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {post.createdAt ? format(new Date(post.createdAt), "yyyy.MM.dd", { locale: ko }) : ""}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1 ml-auto">
                                        <UserIcon className="w-3 h-3 text-slate-300" />
                                        {(post as any).author?.nickname || (post as any).author?.username || "알 수 없음"}
                                    </span>
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors tracking-tight">
                                    {post.title}
                                </h3>
                                <div className="text-slate-500 font-medium line-clamp-2 md:line-clamp-3 leading-relaxed">
                                    {post.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/[#*`]/g, '')}
                                </div>
                                <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                                    <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                                        <Eye className="w-4 h-4 text-slate-400" />
                                        조회 {post.viewCount}
                                    </span>
                                    <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                                        <MessageSquare className="w-4 h-4 text-slate-400" />
                                        댓글 {post.commentCount || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
