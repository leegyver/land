import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useSaju } from "@/contexts/SajuContext";
import { CommunityHero } from "@/components/community/CommunityHero";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { CommunityPostList } from "@/components/community/CommunityPostList";
import { getCategoryInfo, CATEGORY_ALL } from "@/components/community/constants";

export default function CommunityPage() {
    const [location] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const initialCategory = searchParams.get("category") || CATEGORY_ALL;
    
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const { sajuData } = useSaju();
    const { user } = useAuth();

    const { data: posts, isLoading } = useQuery<Post[]>({
        queryKey: ["/api/posts", activeCategory],
        queryFn: async () => {
            const url = activeCategory === CATEGORY_ALL ? "/api/posts" : `/api/posts?category=${activeCategory}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("게시글을 불러오는데 실패했습니다.");
            return res.json();
        }
    });

    return (
        <>
            <Helmet>
                <title>커뮤니티 | 이가이버부동산</title>
            </Helmet>

            {/* Hero Section */}
            <CommunityHero user={user} />

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar - Desktop */}
                    <div className="lg:col-span-1 space-y-6">
                        <CommunitySidebar
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            sajuData={sajuData}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-slate-100 font-black">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl ${getCategoryInfo(activeCategory).color} text-white shadow-lg shadow-slate-200`}>
                                    {(() => {
                                        const Icon = getCategoryInfo(activeCategory).icon;
                                        return <Icon className="w-6 h-6" />;
                                    })()}
                                </div>
                                <div>
                                    <h2 className="text-2xl text-slate-900">{getCategoryInfo(activeCategory).name}</h2>
                                    <p className="text-sm text-slate-500 font-bold">{getCategoryInfo(activeCategory).desc}</p>
                                </div>
                            </div>
                        </div>

                        <CommunityPostList
                            posts={posts}
                            isLoading={isLoading}
                            activeCategory={activeCategory}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
