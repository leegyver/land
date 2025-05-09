import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { News } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ExternalLink, Newspaper } from "lucide-react";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 15;

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("latest");

  // 최신 뉴스 가져오기 (6개)
  const { data: latestNews, isLoading: isLoadingLatest } = useQuery<News[]>({
    queryKey: ["/api/news/latest"],
  });

  // 모든 뉴스 가져오기
  const { data: allNews, isLoading: isLoadingAll } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  // 페이지네이션 계산
  const totalPages = allNews ? Math.ceil(allNews.length / ITEMS_PER_PAGE) : 0;
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentPageItems = allNews ? allNews.slice(startIdx, endIdx) : [];

  // 이전 페이지로 이동
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 다음 페이지로 이동
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 특정 페이지로 이동
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지네이션 링크 생성
  const renderPaginationLinks = () => {
    const links = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i} 
            onClick={() => goToPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return links;
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="container mx-auto px-4 py-20">
      <Helmet>
        <title>부동산 뉴스 | 한국부동산</title>
        <meta name="description" content="강화도와 인천 지역의 최신 부동산 뉴스와 정보를 확인하세요." />
      </Helmet>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">부동산 뉴스</h1>
        <p className="text-neutral-600">강화도와 관련된 부동산 뉴스를 게시합니다</p>
      </div>

      <Tabs defaultValue="latest" value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="latest">최신 뉴스</TabsTrigger>
          <TabsTrigger value="all">전체 뉴스</TabsTrigger>
        </TabsList>

        {/* 최신 뉴스 (갤러리 형식) */}
        <TabsContent value="latest" className="mt-6">
          {isLoadingLatest ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : latestNews && latestNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestNews.map((news) => (
                <Card key={news.id} className="overflow-hidden h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge className="mb-2">{news.category}</Badge>
                      <div className="flex items-center text-sm text-neutral-500">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(news.createdAt!)}
                      </div>
                    </div>
                    <CardTitle className="text-xl line-clamp-2">{news.title}</CardTitle>
                    <CardDescription className="line-clamp-3 mt-2">
                      {news.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-neutral-600 line-clamp-4">{news.content}</p>
                  </CardContent>
                  <CardFooter className="pt-2 border-t">
                    <Button variant="ghost" className="ml-auto" size="sm" asChild>
                      <a href={news.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                        <span className="mr-1">원문 보기</span>
                        <ExternalLink size={14} />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-4 text-lg font-medium">등록된 뉴스가 없습니다</h3>
              <p className="mt-2 text-neutral-500">곧 새로운 부동산 뉴스가 업데이트될 예정입니다.</p>
            </div>
          )}
        </TabsContent>

        {/* 전체 뉴스 (게시판 형식) */}
        <TabsContent value="all" className="mt-6">
          {isLoadingAll ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : allNews && allNews.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-neutral-100">
                      <th className="py-3 px-4 text-left font-medium text-neutral-700">제목</th>
                      <th className="py-3 px-4 text-center font-medium text-neutral-700 w-24">카테고리</th>
                      <th className="py-3 px-4 text-center font-medium text-neutral-700 w-32">등록일</th>
                      <th className="py-3 px-4 text-center font-medium text-neutral-700 w-24">원문</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageItems.map((news) => (
                      <tr key={news.id} className="border-b hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium line-clamp-1">{news.title}</p>
                            <p className="text-sm text-neutral-500 line-clamp-1 mt-1">{news.summary}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline">{news.category}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-neutral-600 text-sm">
                          <div className="flex flex-col items-center">
                            <span>{formatDate(news.createdAt!)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <a 
                            href={news.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:text-primary/80"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <Pagination className="mt-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={goToPreviousPage} disabled={currentPage === 1} />
                  </PaginationItem>
                  
                  {renderPaginationLinks()}
                  
                  <PaginationItem>
                    <PaginationNext onClick={goToNextPage} disabled={currentPage === totalPages} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="mx-auto h-12 w-12 text-neutral-400" />
              <h3 className="mt-4 text-lg font-medium">등록된 뉴스가 없습니다</h3>
              <p className="mt-2 text-neutral-500">곧 새로운 부동산 뉴스가 업데이트될 예정입니다.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}