import { useQuery } from "@tanstack/react-query";
import { Newspaper, BookOpen, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { News } from "@shared/schema";
import { useInView } from "@/hooks/use-in-view";

interface BlogPost {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  publishedAt: string;
  category: string;
  summary?: string;
}

const NewsAndBlogSection = () => {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px" });

  const { data: latestNews } = useQuery<News[]>({
    queryKey: ["/api/news/latest"],
    enabled: inView,
  });

  const { data: latestBlogPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/latest"],
    enabled: inView,
  });

  return (
    <section className="py-2 bg-slate-50 border-t border-slate-100" ref={ref}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* News */}
          <div>
            <div className="flex justify-between items-center mb-4 px-1 border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-blue-500" />
                부동산 뉴스
              </h2>
              <Link href="/news" className="text-blue-500 hover:text-blue-600 text-xs font-medium bg-blue-50/50 px-2.5 py-1 rounded transition-colors">더 보기</Link>
            </div>
            <div className="flex flex-col gap-[2px]">
              {latestNews?.slice(0, 3).map((news) => (
                <Link key={news.id} href={`/news/${news.id}`}>
                  <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer items-start group">
                    <div className="w-20 h-20 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-50">
                      <img 
                        src={news.imageUrl ?? "https://via.placeholder.com/150"} 
                        alt="" 
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/150";
                        }}
                      />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <Badge variant="secondary" className="mb-1.5 w-fit text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 border-none">{news.category || '일반 부동산'}</Badge>
                      <h3 className="font-bold text-slate-900 line-clamp-2 leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">{news.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{news.summary || '강화도 부동산 관련 최신 소식을 빠르게 전달해드립니다.'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Blog Posts */}
          <div>
            <div className="flex justify-between items-center mb-4 px-1 border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-500" />
                이가이버 포럼
              </h2>
              <a href="https://blog.naver.com/9551304" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 text-xs font-medium bg-green-50/50 px-2.5 py-1 rounded transition-colors">더 보기</a>
            </div>
            <div className="flex flex-col gap-[2px]">
               {(!latestBlogPosts || latestBlogPosts.length === 0) ? (
                 <div className="text-center py-12 text-slate-500 text-sm bg-white rounded-2xl border border-slate-100 italic">네이버 블로그 데이터 연동 중입니다...</div>
               ) : (
                latestBlogPosts?.slice(0, 3).map((post) => (
                  <a key={post.id} href={post.link} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer items-start group">
                      <div className="w-20 h-20 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-50">
                        <img
                          src={post.thumbnail || "/assets/default-forum.png"}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/assets/default-forum.png";
                          }}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col flex-grow justify-center py-1">
                        <Badge variant="outline" className="mb-2 w-fit text-[10px] font-bold border-green-500/30 text-green-600 bg-green-50/50 px-2 py-0.5">{post.category || '부동산꿀팁'}</Badge>
                        <h3 className="font-bold text-slate-900 line-clamp-1 leading-snug mb-1 group-hover:text-green-600 transition-colors">{post.title}</h3>
                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 opacity-80 mt-auto">
                          <Calendar className="h-3 w-3" />
                          {post.publishedAt || '최근 등록'}
                        </div>
                      </div>
                    </div>
                  </a>
                ))
               )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsAndBlogSection;
