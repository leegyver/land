import { useState, useRef, useCallback, useMemo } from "react";
import { NewsletterSubscription } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminTabWrapper } from "../AdminShared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, FileSpreadsheet, Mail, Send, History } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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
  
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [isTestPassed, setIsTestPassed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["/api/admin/newsletter/logs"],
  });
  const logs = (logsData as any[]) || [];

  const quillRef = useRef<ReactQuill>(null);

  const quillImageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("업로드 실패");
        const data = await res.json();

        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', data.url);
          quill.setSelection(range.index + 1, 0);
        }
        toast({ title: "사진 첨부 완료", description: "본문에 사진이 삽입되었습니다." });
      } catch (error) {
        toast({ title: "업로드 실패", description: "사진 첨부 중 오류가 발생했습니다.", variant: "destructive" });
      }
    };
  }, [toast]);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: quillImageHandler
      }
    }
  }), [quillImageHandler]);

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
      <div className="p-6 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-slate-900">구독자 관리</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!window.confirm("관리자(마스터) 메일로 주간 뉴스레터 샘플을 발송하시겠습니까?")) return;
              try {
                const res = await fetch("/api/admin/newsletter/test", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "weekly", target: "master" }),
                });
                if (res.ok) toast({ title: "발송 성공", description: "마스터 메일로 샘플이 발송되었습니다." });
                else throw new Error("발송 실패");
              } catch (e) {
                toast({ title: "발송 실패", description: "메일 발송 중 오류가 발생했습니다.", variant: "destructive" });
              }
            }}
          >
            <Mail className="h-4 w-4 mr-2 text-blue-500" />
            마스터 샘플 발송
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!window.confirm("전체 구독자에게 주간 뉴스레터를 즉시 발송하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
              try {
                const res = await fetch("/api/admin/newsletter/test", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "weekly", target: "all" }),
                });
                if (res.ok) toast({ title: "발송 성공", description: "전체 구독자에게 뉴스레터가 발송되었습니다." });
                else throw new Error("발송 실패");
              } catch (e) {
                toast({ title: "발송 실패", description: "메일 발송 중 오류가 발생했습니다.", variant: "destructive" });
              }
            }}
          >
            <Send className="h-4 w-4 mr-2 text-green-500" />
            구독자 전체 발송
          </Button>

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

          <Button
            size="sm"
            className="rounded-xl shadow-sm bg-blue-600 hover:bg-blue-700 text-white ml-2"
            onClick={() => {
              setCustomSubject("");
              setCustomContent("");
              setIsTestPassed(false);
              setIsCustomDialogOpen(true);
            }}
          >
            <Mail className="h-4 w-4 mr-2" />
            구독자 메일 작성
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

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>구독자 메일 작성</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">메일 제목</Label>
              <Input
                id="subject"
                value={customSubject}
                onChange={(e) => {
                  setCustomSubject(e.target.value);
                  setIsTestPassed(false);
                }}
                placeholder="예: 이번 주 새로운 매물 소식입니다!"
              />
            </div>
            <div className="grid gap-2">
              <Label>메일 내용</Label>
              <div className="h-[400px] mb-12">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={customContent}
                  onChange={(val) => {
                    setCustomContent(val);
                    setIsTestPassed(false);
                  }}
                  modules={quillModules}
                  style={{ height: '100%' }}
                  placeholder="구독자에게 보낼 메일 내용을 작성하세요."
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <p className="text-xs text-slate-500 hidden sm:block">
              {isTestPassed ? "테스트 완료! 전체 발송이 가능합니다." : "안전을 위해 마스터 테스트 발송을 먼저 해야 합니다."}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={isSending || !customSubject || !customContent}
                onClick={async () => {
                  setIsSending(true);
                  try {
                    const res = await fetch("/api/admin/custom-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "subscribers", target: "master", subject: customSubject, content: customContent }),
                    });
                    if (res.ok) {
                      toast({ title: "테스트 발송 성공", description: "마스터 메일로 테스트 메일이 발송되었습니다. 내용을 확인하세요." });
                      setIsTestPassed(true);
                    } else {
                      const data = await res.json();
                      throw new Error(data.message || "발송 실패");
                    }
                  } catch (e: any) {
                    toast({ title: "테스트 발송 실패", description: e.message, variant: "destructive" });
                  } finally {
                    setIsSending(false);
                  }
                }}
              >
                마스터 메일로 테스트 발송
              </Button>
              <Button
                disabled={!isTestPassed || isSending}
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={async () => {
                  if (!window.confirm("정말 전체 구독자에게 메일을 발송하시겠습니까? 이 작업은 취소할 수 없습니다.")) return;
                  setIsSending(true);
                  try {
                    const res = await fetch("/api/admin/custom-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "subscribers", target: "all", subject: customSubject, content: customContent }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      toast({ title: "전체 발송 성공", description: data.message });
                      setIsCustomDialogOpen(false);
                    } else {
                      const data = await res.json();
                      throw new Error(data.message || "발송 실패");
                    }
                  } catch (e: any) {
                    toast({ title: "전체 발송 실패", description: e.message, variant: "destructive" });
                  } finally {
                    setIsSending(false);
                  }
                }}
              >
                전체 발송
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <History className="w-5 h-5 mr-2 text-blue-500" />
            뉴스레터 발송 내역 (히스토리)
          </h2>
        </div>
        <div className="p-0">
          {isLoadingLogs ? (
            <div className="p-8 text-center text-slate-500">발송 내역을 불러오는 중입니다...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">아직 뉴스레터 발송 내역이 없습니다.</div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 sticky top-0">
                  <TableRow>
                    <TableHead>발송 일시</TableHead>
                    <TableHead>발송 유형</TableHead>
                    <TableHead>대상</TableHead>
                    <TableHead>수신자 수</TableHead>
                    <TableHead>메일 제목</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">미리보기</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="text-sm text-slate-500">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell>
                        {log.type === 'weekly' && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">주간</span>}
                        {log.type === 'monthly' && <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">월간</span>}
                        {log.type === 'custom' && <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">수동</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.target === 'master' ? '마스터 메일' : log.target === 'all' ? '구독자 전체' : '일반 회원'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{log.recipientCount} 명</TableCell>
                      <TableCell className="font-medium text-slate-900 max-w-[200px] truncate" title={log.subject}>
                        {log.subject}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <span className="text-green-600 text-sm font-medium">성공</span>
                        ) : (
                          <span className="text-red-600 text-sm font-medium">실패</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsLogDialogOpen(true);
                          }}
                        >
                          본문 보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>발송된 메일 본문 (미리보기)</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 border border-slate-200 rounded-md p-4 bg-slate-50">
            {selectedLog && (
              <div 
                className="email-preview-content bg-white"
                dangerouslySetInnerHTML={{ __html: selectedLog.htmlContent }}
              />
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsLogDialogOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
