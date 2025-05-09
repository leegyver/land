import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { News } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const newsId = parseInt(params.id);

  const { data: news, isLoading, error } = useQuery<News>({
    queryKey: ["/api/news", newsId],
    queryFn: async () => {
      const response = await fetch(`/api/news/${newsId}`);
      if (!response.ok) {
        throw new Error("뉴스를 불러올 수 없습니다");
      }
      return response.json();
    },
    enabled: !isNaN(newsId),
  });

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'yyyy년 MM월 dd일');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-10 bg-gray-200 w-3/4 mb-4 rounded"></div>
          <div className="h-6 bg-gray-200 w-1/4 mb-8 rounded"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">뉴스를 찾을 수 없습니다</h1>
          <p className="text-neutral-600 mb-6">
            {error instanceof Error ? error.message : "요청하신 뉴스가 존재하지 않거나 삭제되었습니다."}
          </p>
          <Button onClick={() => setLocation("/news")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            뉴스 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <Helmet>
        <title>{news.title} | 부동산 뉴스 | 한국부동산</title>
        <meta name="description" content={news.description} />
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/news")} className="mb-6">
          <ChevronLeft className="mr-2 h-4 w-4" />
          뉴스 목록으로 돌아가기
        </Button>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <Badge>{news.category}</Badge>
              <div className="flex items-center text-neutral-500">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{formatDate(news.createdAt!)}</span>
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl mb-2">{news.title}</CardTitle>
            <p className="text-neutral-600 text-lg">{news.description}</p>
          </CardHeader>
          <CardContent>
            <div className="prose prose-neutral max-w-none mb-6">
              {news.content && news.content.split('\n').map((paragraph, idx) => (
                paragraph ? <p key={idx}>{paragraph}</p> : <br key={idx} />
              ))}
            </div>
            
            <div className="mt-8 pt-4 border-t">
              <Button variant="outline" className="flex items-center" asChild>
                <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <span className="mr-2">원문 기사 보기</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}