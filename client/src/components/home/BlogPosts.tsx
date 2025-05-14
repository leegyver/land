import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, File, Link as LinkIcon } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// 블로그 포스트 타입 정의
interface BlogPost {
  title: string;
  link: string;
  date: string;
  thumbnail: string;
  summary: string;
}

const BlogPosts = () => {
  // 블로그 포스트 데이터 가져오기 (skipCache=true로 항상 최신 데이터)
  const { data: blogPosts, isLoading, error } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts", { skipCache: true }],
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0, // 항상 최신 데이터를 가져오도록 설정
  });

  return (
    <section id="blog" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-bold">최신 블로그 포스트</h2>
          <a 
            href="https://blog.naver.com/9551304" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:text-secondary font-medium flex items-center gap-1"
          >
            블로그 방문하기 <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <File className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-medium mb-2">블로그 포스트를 불러올 수 없습니다</h3>
            <p className="text-gray-medium">
              잠시 후 다시 시도해주세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {blogPosts && blogPosts.length > 0 ? (
              blogPosts.map((post, index) => (
                <Card key={index} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition h-full flex flex-col">
                  {post.thumbnail && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                        블로그
                      </Badge>
                    </div>

                    <a 
                      href={post.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <h3 className="text-base font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                    </a>

                    {post.summary && (
                      <p className="text-sm text-gray-medium line-clamp-2 mb-2">
                        {post.summary}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center text-xs text-gray-medium">
                        <Calendar className="h-3 w-3 mr-1" />
                        {post.date}
                      </div>

                      <a 
                        href={post.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-secondary flex items-center"
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        읽기
                      </a>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-5 bg-white rounded-lg p-8 text-center shadow">
                <File className="h-12 w-12 mx-auto mb-4 text-gray-medium" />
                <h3 className="text-xl font-medium mb-2">아직 등록된 블로그 포스트가 없습니다</h3>
                <p className="text-gray-medium">
                  곧 최신 블로그 포스트가 업데이트될 예정입니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogPosts;