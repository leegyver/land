import { useState, useMemo } from "react";
import { News } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminTabWrapper } from "../AdminShared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, FileText } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface AdminNewsTabProps {
  news: News[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
}

export default function AdminNewsTab({ news, isLoading, isError, error, refetch }: AdminNewsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pagination Logic
  const itemsPerPage = 20;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(news.length / itemsPerPage);
  const paginatedNews = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return news.slice(start, start + itemsPerPage);
  }, [news, page]);

  const syncMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/news/update"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "동기화 성공", description: "최신 뉴스 기사가 업데이트되었습니다." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/news/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "삭제 성공", description: "뉴스가 삭제되었습니다." });
    }
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">뉴스 아카이브</h2>
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="sm" className="rounded-xl shadow-sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          기사 동기화
        </Button>
      </div>

      <AdminTabWrapper isLoading={isLoading} isError={isError} error={error} isEmpty={news.length === 0} emptyMessage="뉴스가 없습니다." onRetry={refetch}>
        <div id="admin-list-top" className="scroll-mt-20" />
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>정보/미디어</TableHead>
              <TableHead>출처</TableHead>
              <TableHead className="hidden md:table-cell">일시</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedNews.map(item => (
              <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-16 bg-slate-100 rounded border overflow-hidden flex-shrink-0">
                      {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <FileText className="m-auto h-4 w-4 text-slate-300" />}
                    </div>
                    <div className="font-bold text-slate-900 text-sm line-clamp-1 max-w-[300px]">{item.title || "제목 없음"}</div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-500 font-medium">{item.source}</TableCell>
                <TableCell className="hidden md:table-cell text-xs text-slate-400">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4 border-t border-slate-100 bg-slate-50/50">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => { setPage(p => Math.max(1, p - 1)); document.getElementById('admin-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} 
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = page - 2 + i;
                  if (page <= 2) pageNum = i + 1;
                  else if (page >= totalPages - 1) pageNum = totalPages - 4 + i;
                  
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          isActive={page === pageNum} 
                          onClick={() => { setPage(pageNum); document.getElementById('admin-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); document.getElementById('admin-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} 
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </AdminTabWrapper>
    </div>
  );
}
