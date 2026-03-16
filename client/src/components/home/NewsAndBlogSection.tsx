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
    <section className="pt-4 pb-0 bg-white" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12">
          {/* News */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Newspaper className="h-6 w-6 mr-2 text-primary" />
                부동산 뉴스
              </h2>
              <Link href="/news" className="text-primary hover:underline text-sm font-medium">더 보기</Link>
            </div>
            <div className="space-y-1">
              {latestNews?.slice(0, 3).map((news) => (
                <Link key={news.id} href={`/news/${news.id}`}>
                  <div className="flex gap-2 p-2 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer items-center">
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={news.imageUrl ?? "https://via.placeholder.com/150"} 
                        alt="" 
                        loading="lazy"
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/150";
                        }}
                      />
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-2 text-xs">{news.category}</Badge>
                      <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{news.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{news.summary}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Blog Posts */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-green-600" />
                이가이버 포럼
              </h2>
              <a href="https://blog.naver.com/9551304" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium">더 보기</a>
            </div>
            <div className="space-y-1">
              {latestBlogPosts?.slice(0, 3).map((post) => (
                <a key={post.id} href={post.link} target="_blank" rel="noopener noreferrer">
                  <div className="flex gap-2 p-2 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer items-center">
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={post.thumbnail || "/assets/default-forum.png"}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/assets/default-forum.png";
                        }}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2 text-xs border-green-600 text-green-600">{post.category}</Badge>
                      <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{post.title}</h3>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {post.publishedAt}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsAndBlogSection;
