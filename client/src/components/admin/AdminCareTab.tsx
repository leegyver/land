import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Inquiry } from "@shared/schema";
import { format } from "date-fns";
import { 
  Phone, Mail, Calendar, Image as ImageIcon, Trash2, 
  ExternalLink, Wrench, Building, Search, RefreshCw, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminCareTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  // 문의 목록 조회
  const { data: inquiries = [], isLoading, refetch } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
    queryFn: async () => {
      const res = await fetch("/api/inquiries");
      if (!res.ok) throw new Error("문의 목록을 불러올 수 없습니다.");
      return res.json();
    },
  });

  // 문의 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "삭제 완료", description: "문의 내역이 안전하게 삭제되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      if (selectedInquiry) setSelectedInquiry(null);
    },
    onError: () => {
      toast({ title: "삭제 실패", description: "문의 내역 삭제 중 오류가 발생했습니다.", variant: "destructive" });
    },
  });

  // 카카오 연동 상태 조회
  const { data: kakaoStatus, refetch: refetchKakao } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/admin/kakao/status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/kakao/status");
      return res.json();
    },
  });

  const [isTestingKakao, setIsTestingKakao] = useState(false);
  const handleTestKakao = async () => {
    setIsTestingKakao(true);
    try {
      const res = await fetch("/api/admin/kakao/test", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "카카오톡 발송 성공", description: data.message });
      } else {
        toast({ title: "발송 실패", description: data.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "오류", description: e.message, variant: "destructive" });
    } finally {
      setIsTestingKakao(false);
    }
  };

  // 메시지에서 첨부 이미지 URL 추출 헬퍼
  const extractImageUrl = (message: string): string | null => {
    const match = message.match(/https?:\/\/[^\s<"']+\.(?:jpg|jpeg|png|webp|gif)|\/uploads\/[^\s<"']+\.(?:jpg|jpeg|png|webp|gif)/i);
    if (!match) return null;
    const url = match[0];
    return url.startsWith("http") ? url : url;
  };

  const filteredInquiries = inquiries.filter((item) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      item.name.toLowerCase().includes(kw) ||
      item.phone.toLowerCase().includes(kw) ||
      item.message.toLowerCase().includes(kw) ||
      (item.inquiryType && item.inquiryType.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                토탈케어 및 일반 문의 접수 관리
              </CardTitle>
              <CardDescription>
                홈페이지에서 접수된 실시간 출장수리, 건물유지보수, 세컨하우스 케어 내역입니다.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                새로고침
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 카카오톡 알림 연동 상태 바 */}
          <div className="mb-6 p-4 rounded-2xl border bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEE500] text-[#3C1E1E] flex items-center justify-center font-black shrink-0 shadow-sm text-xs">
                TALK
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">
                    카카오톡 실시간 알림 [나에게 보내기]
                  </span>
                  {kakaoStatus?.connected ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      연동 활성화됨
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      미연동 (연결 필요)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {kakaoStatus?.connected
                    ? "홈페이지에 새 문의/토탈케어가 접수되면 대표님 카카오톡 [나와의 채팅]으로 즉시 자동 전송됩니다."
                    : "버튼을 눌러 카카오 계정을 연결하시면 문의 접수 즉시 카톡 [나와의 채팅]으로 바로 전달됩니다."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {kakaoStatus?.connected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestKakao}
                    disabled={isTestingKakao}
                    className="text-xs font-bold border-amber-300 hover:bg-amber-50"
                  >
                    {isTestingKakao ? "카톡 전송 중..." : "테스트 카톡 보내기"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    <a href="/api/admin/kakao/auth">계정 재연결</a>
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  asChild
                  className="bg-[#FEE500] hover:bg-[#FADA0A] text-[#3C1E1E] font-extrabold text-xs shadow-sm"
                >
                  <a href="/api/admin/kakao/auth">카카오톡 알림 연결하기 (1클릭)</a>
                </Button>
              )}
            </div>
          </div>

          {/* 검색 바 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="신청자명, 연락처, 증상 내용 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm font-semibold text-slate-500 shrink-0">
              총 {filteredInquiries.length}건
            </div>
          </div>

          {/* 목록 테이블 / 카드 */}
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">데이터를 불러오는 중입니다...</div>
          ) : filteredInquiries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              {searchKeyword ? "검색 결과가 없습니다." : "접수된 문의 및 토탈케어 내역이 없습니다."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInquiries.map((inquiry) => {
                const imageUrl = extractImageUrl(inquiry.message);
                const isCare = inquiry.inquiryType === "토탈케어" || inquiry.message.includes("토탈케어");

                return (
                  <div
                    key={inquiry.id}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-orange-300 transition-all bg-white hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* 정보 좌측 */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {isCare ? (
                          <Badge className="bg-orange-500 text-white font-bold text-xs">
                            🛠️ 토탈케어
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-blue-600 border-blue-400 text-xs">
                            일반문의
                          </Badge>
                        )}
                        <span className="font-extrabold text-base text-slate-900">
                          {inquiry.name}
                        </span>
                        <a
                          href={`tel:${inquiry.phone}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded border border-orange-200 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{inquiry.phone}</span>
                        </a>
                        {inquiry.email && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {inquiry.email}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto md:ml-0 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {inquiry.createdAt ? format(new Date(inquiry.createdAt), "yyyy.MM.dd HH:mm") : "-"}
                        </span>
                      </div>

                      {/* 메시지 요약 */}
                      <p className="text-sm text-slate-700 whitespace-pre-line line-clamp-2 leading-relaxed bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 font-mono text-xs">
                        {inquiry.message}
                      </p>
                    </div>

                    {/* 우측 액션 & 사진 썸네일 */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {imageUrl && (
                        <div
                          onClick={() => setSelectedPhoto(imageUrl)}
                          className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group shadow-sm shrink-0"
                          title="사진 크게보기"
                        >
                          <img src={imageUrl} alt="현장 사진" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="text-xs font-semibold"
                      >
                        상세보기
                      </Button>

                      <a
                        href={`tel:${inquiry.phone}`}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>전화하기</span>
                      </a>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`'${inquiry.name}'님의 접수 내역을 정말 삭제하시겠습니까?`)) {
                            deleteMutation.mutate(inquiry.id);
                          }
                        }}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사진 확대 모달 */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl p-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-orange-500" /> 현장 첨부 사진
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-black/5 flex items-center justify-center max-h-[70vh]">
              <img src={selectedPhoto} alt="현장 첨부 사진 원본" className="max-h-[70vh] w-auto object-contain" />
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href={selectedPhoto || "#"} target="_blank" rel="noopener noreferrer">
                새 창에서 원본 보기 <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 문의 상세 모달 */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              {selectedInquiry?.name}님의 접수 상세
            </DialogTitle>
            <DialogDescription>
              접수일시: {selectedInquiry?.createdAt ? format(new Date(selectedInquiry.createdAt), "yyyy-MM-dd HH:mm:ss") : "-"}
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4 text-sm mt-2">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">연락처</span>
                  <a href={`tel:${selectedInquiry.phone}`} className="font-bold text-orange-600 hover:underline">
                    {selectedInquiry.phone}
                  </a>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">이메일</span>
                  <span className="font-semibold text-slate-700">
                    {selectedInquiry.email || "미입력"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">접수 전문</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-60 overflow-y-auto">
                  {selectedInquiry.message}
                </div>
              </div>

              {extractImageUrl(selectedInquiry.message) && (
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">현장 첨부 사진</span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-60 bg-black/5 flex items-center justify-center">
                    <img
                      src={extractImageUrl(selectedInquiry.message)!}
                      alt="현장 사진"
                      className="max-h-60 w-auto object-contain cursor-pointer"
                      onClick={() => setSelectedPhoto(extractImageUrl(selectedInquiry.message)!)}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("정말 이 접수 내역을 삭제하시겠습니까?")) {
                      deleteMutation.mutate(selectedInquiry.id);
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> 삭제
                </Button>
                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                  <span>즉시 전화 연결 ({selectedInquiry.phone})</span>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
