import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ArrowRight, User, Heart, MessageCircle, Calendar, Hash } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Post } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getCategoryInfo } from "@/components/community/constants";

const CommunityPreview = () => {
    const { data } = useQuery<any>({
        queryKey: ["/api/posts", { limit: 6 }],
        queryFn: async () => {
            const res = await fetch("/api/posts?page=1&limit=6");
            if (!res.ok) throw new Error("Failed to fetch posts");
            return res.json();
        }
    });

    const posts: Post[] = Array.isArray(data) ? data : (data?.items || []);
    const displayPosts = posts.slice(0, 3);

    const { getCategoryName } = {
        getCategoryName: (category: string) => {
            return getCategoryInfo(category).name;
        }
    };

    return (
        <section className="w-full bg-transparent">
            <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center tracking-tight">
                            <MessageSquare className="h-6 w-6 mr-2 text-indigo-600" />
                            강화도 라이브 커뮤니티
                        </h2>
                    </div>
                    <Link href="/community">
                        <Button variant="ghost" className="text-slate-500 hover:text-indigo-600 font-bold group hidden md:flex text-sm">
                            전체보기 <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {displayPosts.length > 0 ? (
                        displayPosts.map((post) => (
                            <Link key={post.id} href={`/community/${post.id}`}>
                                <div className="flex gap-4 p-4 rounded-3xl bg-white border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer items-center group relative overflow-hidden shadow-sm">
                                    <div className="w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100 relative z-10 group-hover:scale-105 transition-transform duration-500">
                                        {post.imageUrls && post.imageUrls.length > 0 ? (
                                            <img 
                                                src={post.imageUrls[0]} 
                                                alt="" 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop";
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
                                                <Hash className="w-6 h-6 text-indigo-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0 flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px] py-0 px-2 border-indigo-100 text-indigo-600 font-black bg-indigo-50/30 rounded-full">
                                                {getCategoryName(post.category)}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-slate-300" />
                                                {post.createdAt ? format(new Date(post.createdAt), "MM.dd", { locale: ko }) : "-"}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-base line-clamp-1 tracking-tight">
                                            {post.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3 text-slate-300" />
                                                <span className="text-[11px] font-bold text-slate-500">
                                                    {(post as any).author?.nickname || (post as any).author?.username?.split('@')[0] || "이가이버 파트너"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 ml-auto">
                                                <div className="flex items-center gap-1">
                                                    <MessageCircle className="w-3 h-3 text-slate-300" />
                                                    <span className="text-[11px] font-bold">{post.commentCount || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Heart className="w-3 h-3 text-slate-300" />
                                                    <span className="text-[11px] font-bold">{post.likeCount || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-100/30 transition-colors"></div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm shadow-sm">
                            작성된 글이 없습니다.
                        </div>
                    )}
                </div>

                <Link href="/community" className="md:hidden mt-4 block">
                    <Button variant="outline" className="w-full border-slate-200 text-slate-600 font-bold h-12 rounded-2xl text-sm shadow-sm active:scale-95 transition-transform">
                        커뮤니티 바로가기
                    </Button>
                </Link>
            </div>
        </section>
    );
};

export default CommunityPreview;
