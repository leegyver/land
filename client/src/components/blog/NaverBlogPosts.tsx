import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// import { formatDate } from "@/lib/utils"; // Not using this function

export interface BlogPost {
  title: string;
  link: string;
  date: string;
  thumbnail: string;
  summary: string;
  categoryNo?: string;
}

export default function NaverBlogPosts() {
  // 블로그 포스트 데이터 가져오기 (항상 최신 데이터)
  const { data: posts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts", { skipCache: true }],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5분
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">최신 블로그 포스트</h2>
            <div className="w-40 h-8 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-4 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <h3 className="text-xl font-medium text-red-700 mb-2">블로그 포스트를 불러올 수 없습니다</h3>
            <p className="text-red-600 mb-4">데이터를 가져오는 중 오류가 발생했습니다</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="bg-white hover:bg-gray-100"
            >
              다시 시도
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold">최신 블로그 포스트</h2>
          <a
            href="https://blog.naver.com/9551304"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          >
            블로그 방문하기 <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {posts.map((post, index) => (
              <Card 
                key={index} 
                className="overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
              >
                <div className="h-48 overflow-hidden bg-gray-100">
                  {post.thumbnail ? (
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                      <p className="text-gray-400">이미지 없음</p>
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex-grow">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-2">{post.summary}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{post.date}</span>
                  </div>
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-xs flex items-center"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    <span>읽기</span>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium mb-2">등록된 블로그 포스트가 없습니다</h3>
            <p className="text-gray-500 mb-4">곧 새로운 부동산 정보와 관련 글이 업데이트될 예정입니다</p>
            <a
              href="https://blog.naver.com/9551304"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium inline-flex items-center"
            >
              네이버 블로그 방문하기 <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}