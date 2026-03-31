import { useState } from "react";
import { NewsletterSubscription } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminTabWrapper } from "../AdminShared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, FileSpreadsheet } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface AdminNewsletterTabProps {
  subscriptions: NewsletterSubscription[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
}

export default function AdminNewsletterTab({ subscriptions, isLoading, isError, error, refetch }: AdminNewsletterTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Basic pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(subscriptions.length / itemsPerPage);

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => apiRequest("POST", `/api/admin/batch-delete/newsletter`, { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter"] });
      setSelectedIds([]);
      toast({ title: "삭제 성공", description: "선택한 구독 정보가 삭제되었습니다." });
    }
  });

  const handleDelete = (id?: number) => {
    if (id) {
      if (window.confirm("이 구독자를 삭제하시겠습니까?")) {
        deleteMutation.mutate([id]);
      }
    } else if (selectedIds.length > 0) {
      if (window.confirm(`선택한 ${selectedIds.length}개의 구독 정보를 삭제하시겠습니까?`)) {
        deleteMutation.mutate(selectedIds);
      }
    }
  };

  const exportCsv = () => {
    if (!subscriptions || subscriptions.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Email,Subscribed At\n"
      + subscriptions.map(s => `${s.email},${s.createdAt ? new Date(s.createdAt).toLocaleString('ko-KR') : '-'}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "newsletter_subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(subscriptions.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const paginatedSubs = subscriptions.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">구독자 관리</h2>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => handleDelete()} 
              disabled={deleteMutation.isPending} 
              size="sm" 
              className="rounded-xl shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              선택 삭제 ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={exportCsv} size="sm" className="rounded-xl shadow-sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel 내보내기
          </Button>
        </div>
      </div>

      <AdminTabWrapper isLoading={isLoading} isError={isError} error={error} isEmpty={subscriptions.length === 0} emptyMessage="구독자가 없습니다." onRetry={refetch}>
        <div id="admin-list-top" className="scroll-mt-20" />
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={subscriptions.length > 0 && selectedIds.length === subscriptions.length} 
                  onCheckedChange={(c) => toggleAll(!!c)} 
                />
              </TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>구독 일시</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubs.map(item => (
              <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.includes(item.id)} 
                    onCheckedChange={(c) => toggleOne(item.id, !!c)} 
                  />
                </TableCell>
                <TableCell className="font-medium text-slate-900">{item.email}</TableCell>
                <TableCell className="text-sm text-slate-500">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
