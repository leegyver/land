import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CareEstimate } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Lock, Unlock, Eye, Calendar, Clock, Phone, MapPin, 
  Wrench, Building, Plus, Search, CheckCircle2, AlertCircle, 
  FileText, Send, Copy, Check, Trash2, Edit3, Sparkles, 
  Shield, ChevronRight, Upload, X, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CareEstimateBoardProps {
  initialEstimateId?: number | null;
}

export default function CareEstimateBoard({ initialEstimateId }: CareEstimateBoardProps) {
  const { user } = useAuth();
  const isAdmin = user && (user.role === "admin" || user.role === "master");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 필터 및 검색 상태
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 모달 상태
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<CareEstimate | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 비밀번호 확인 모달 상태
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetSecretId, setTargetSecretId] = useState<number | null>(null);
  const [inputPassword, setInputPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 관리자 견적 답글 작성/수정 모드
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [answerFormData, setAnswerFormData] = useState({
    estimateLabor: "",
    estimateParts: "",
    estimateSchedule: "",
    estimateContent: "",
    status: "answered",
    sendKakaoNotice: true,
  });

  // 카피 완료 상태
  const [hasCopied, setHasCopied] = useState(false);

  // 신규 견적 의뢰 폼 상태 (개인정보 보호를 위해 비밀글 기본 ON)
  const [newEstimateData, setNewEstimateData] = useState({
    title: "",
    authorName: "",
    phone: "",
    address: "",
    category: "생활집수리",
    content: "",
    imageUrl: "",
    isSecret: true,
    password: "",
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 1. 견적 목록 조회
  const { data: estimates = [], isLoading, refetch } = useQuery<CareEstimate[]>({
    queryKey: ["/api/care-estimates", categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`/api/care-estimates?${params.toString()}`);
      if (!res.ok) throw new Error("목록 로드 실패");
      return res.json();
    },
  });

  // 초기 ID 지정 시 자동 열람
  useQuery({
    queryKey: ["/api/care-estimates", initialEstimateId],
    queryFn: async () => {
      if (!initialEstimateId) return null;
      const res = await fetch(`/api/care-estimates/${initialEstimateId}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data) {
        if (data.isLocked) {
          setTargetSecretId(data.id);
          setIsPasswordModalOpen(true);
        } else {
          setSelectedEstimate(data);
          setIsDetailModalOpen(true);
        }
      }
      return data;
    },
    enabled: !!initialEstimateId,
  });

  // 2. 신규 견적 의뢰 등록 뮤테이션
  const createMutation = useMutation({
    mutationFn: async (data: typeof newEstimateData) => {
      const res = await fetch("/api/care-estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "등록 실패");
      }
      return res.json();
    },
    onSuccess: (created) => {
      toast({
        title: "견적 신청 완료",
        description: "견적 문의가 정상 접수되었습니다. 이가이버가 확인 후 신속히 견적을 등록해 드립니다!",
      });
      setIsWriteModalOpen(false);
      setNewEstimateData({
        title: "",
        authorName: "",
        phone: "",
        address: "",
        category: "생활집수리",
        content: "",
        imageUrl: "",
        isSecret: true,
        password: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/care-estimates"] });
      setSelectedEstimate(created);
      setIsDetailModalOpen(true);
    },
    onError: (err: any) => {
      toast({
        title: "등록 오류",
        description: err.message || "견적 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 3. 관리자 견적 답변 등록/수정 뮤테이션
  const answerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof answerFormData }) => {
      const res = await fetch(`/api/care-estimates/${id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "답변 등록 실패");
      }
      return res.json();
    },
    onSuccess: (resData) => {
      toast({
        title: "견적 등록 완료",
        description: resData.message || "견적 답변이 성공적으로 등록되었습니다!",
      });
      setIsEditingAnswer(false);
      setSelectedEstimate(resData.estimate);
      queryClient.invalidateQueries({ queryKey: ["/api/care-estimates"] });
    },
    onError: (err: any) => {
      toast({
        title: "견적 등록 오류",
        description: err.message || "견적 답변 등록 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 4. 견적 상담 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password?: string }) => {
      const res = await fetch(`/api/care-estimates/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "삭제 실패");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "삭제 완료", description: "견적 의뢰 내역이 삭제되었습니다." });
      setIsDetailModalOpen(false);
      setSelectedEstimate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/care-estimates"] });
    },
    onError: (err: any) => {
      toast({
        title: "삭제 실패",
        description: err.message || "삭제 권한이 없거나 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 비밀번호 검증 핸들러
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSecretId || !inputPassword.trim()) return;

    try {
      const res = await fetch(`/api/care-estimates/${targetSecretId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: inputPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsPasswordModalOpen(false);
        setInputPassword("");
        setPasswordError("");
        setSelectedEstimate(data.estimate);
        setIsDetailModalOpen(true);
      } else {
        setPasswordError(data.message || "비밀번호가 일치하지 않습니다.");
      }
    } catch (e: any) {
      setPasswordError("검증 중 오류가 발생했습니다.");
    }
  };

  // 사진 업로드 핸들러
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) throw new Error("업로드 실패");
      const data = await res.json();
      setNewEstimateData((prev) => ({ ...prev, imageUrl: data.url }));
      toast({ title: "사진 첨부 완료", description: "현장 사진이 성공적으로 첨부되었습니다." });
    } catch (err) {
      toast({ title: "업로드 실패", description: "사진 업로드 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // 카드 클릭 시 상세 열람
  const handleItemClick = async (item: CareEstimate) => {
    if (item.isSecret && !isAdmin) {
      setTargetSecretId(item.id);
      setInputPassword("");
      setPasswordError("");
      setIsPasswordModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/care-estimates/${item.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setSelectedEstimate(fullData);
        setIsDetailModalOpen(true);
        // 답변 폼 초기값 채우기
        setAnswerFormData({
          estimateLabor: fullData.estimateLabor || "",
          estimateParts: fullData.estimateParts || "",
          estimateSchedule: fullData.estimateSchedule || "",
          estimateContent: fullData.estimateContent || "",
          status: fullData.status || "answered",
          sendKakaoNotice: true,
        });
        setIsEditingAnswer(false);
      }
    } catch (err) {
      toast({ title: "오류", description: "상세 정보를 불러올 수 없습니다.", variant: "destructive" });
    }
  };

  // 카카오톡 전달용 메시지 복사
  const handleCopyKakaoText = () => {
    if (!selectedEstimate) return;

    const kakaoText = 
`📋 [이가이버 토탈케어 맞춤 견적서]

안녕하세요, ${selectedEstimate.authorName} 고객님!
이가이버 부동산 토탈케어팀입니다.
문의주신 의뢰건에 대한 수리 견적 안내드립니다.

📌 의뢰건: ${selectedEstimate.title}
📍 현장위치: ${selectedEstimate.address || "강화 관내"}
━━━━━━━━━━━━━━━━━━
💰 예상 공임비: ${selectedEstimate.estimateLabor || "현장 점검 후 확정"}
🔧 예상 자재비: ${selectedEstimate.estimateParts || "실비 정산/별도"}
📅 방문 가능일: ${selectedEstimate.estimateSchedule || "일정 협의"}
━━━━━━━━━━━━━━━━━━
📝 상세 견적 및 시공 안내:
${selectedEstimate.estimateContent || "견적 내용이 준비 중입니다."}

* 현장 상태 및 추가 부속에 따라 일부 변동될 수 있습니다.
* 수리 확정 또는 일정 조율은 본 카톡 회신이나 전화(010-4787-3120) 주시면 신속히 방문 드리겠습니다!

🔗 온라인 견적서 확인:
https://leegyver.com/total-care?tab=estimates&estimateId=${selectedEstimate.id}`;

    navigator.clipboard.writeText(kakaoText).then(() => {
      setHasCopied(true);
      toast({
        title: "카톡 전달 양식 복사 완료!",
        description: "클립보드에 복사되었습니다. 고객 카카오톡에 바로 [붙여넣기]하여 발송하실 수 있습니다.",
      });
      setTimeout(() => setHasCopied(false), 2500);
    });
  };

  // 필터링된 목록
  const filteredList = estimates.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.authorName.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.address && item.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 상단 안내 & 액션 헤더 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-orange-500 text-white font-bold text-xs px-2.5 py-0.5">
                실시간 양방향 소통
              </Badge>
              <Badge variant="outline" className="text-slate-300 border-slate-700 text-xs">
                투명한 공임·자재비 공개
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              실시간 수리·케어 견적 상담실
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
              고장난 곳이나 수리가 필요한 현장 사진을 올려주시면, 이가이버가 직접 확인 후 
              정직하고 투명한 맞춤 견적서(공임+부품비+방문일)를 회신해 드립니다.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <Button
              onClick={() => setIsWriteModalOpen(true)}
              className="w-full sm:w-auto px-6 py-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>무료 견적 의뢰하기</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* 상태 필터 탭 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "전체보기" },
            { id: "pending", label: "견적대기", badge: "amber" },
            { id: "answered", label: "견적완료", badge: "blue" },
            { id: "completed", label: "시공완료", badge: "green" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 카테고리 필터 & 검색 인풋 */}
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">전체 분야</option>
            <option value="원룸·다가구">원룸·다가구</option>
            <option value="상가·건물">상가·건물</option>
            <option value="생활집수리">생활집수리</option>
            <option value="세컨하우스 케어">세컨하우스</option>
            <option value="기타">기타</option>
          </select>

          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="제목, 작성자 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs sm:text-sm rounded-xl h-9"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl px-2.5 h-9"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* 견적 상담 리스트 */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
          <p className="text-sm">견적 상담 목록을 불러오는 중입니다...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">등록된 견적 의뢰가 없습니다</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            집이나 건물에 수리가 필요하신가요? 사진과 함께 첫 견적을 의뢰해 보세요!
          </p>
          <Button
            onClick={() => setIsWriteModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            무료 견적 의뢰하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredList.map((item) => {
            const isAnswered = item.status === "answered" || item.status === "completed";
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-white hover:bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* 왼쪽 정보 */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 상태 배지 */}
                    {item.status === "pending" && (
                      <Badge className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        견적대기
                      </Badge>
                    )}
                    {item.status === "answered" && (
                      <Badge className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        견적완료
                      </Badge>
                    )}
                    {item.status === "completed" && (
                      <Badge className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5">
                        <Check className="w-3 h-3 mr-1" />
                        시공완료
                      </Badge>
                    )}

                    {/* 카테고리 배지 */}
                    <Badge variant="outline" className="text-slate-600 text-[11px] border-slate-300">
                      {item.category}
                    </Badge>

                    {item.isSecret && (
                      <span className="flex items-center text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        비밀글
                      </span>
                    )}

                    {item.imageUrl && (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        📷 사진첨부
                      </span>
                    )}
                  </div>

                  {/* 제목 */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors flex items-center gap-1.5 truncate">
                    {item.title}
                  </h3>

                  {/* 부가 정보: 의뢰인, 지역, 작성일 */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{item.authorName} 고객님</span>
                    {item.address && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.address}
                      </span>
                    )}
                    <span>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                    </span>
                    <span className="flex items-center gap-0.5 text-slate-400">
                      <Eye className="w-3 h-3" />
                      {item.viewCount || 0}
                    </span>
                  </div>

                  {/* 견적 답글 도착 안내 (계단식 답글 형태) */}
                  {isAnswered && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-orange-600 bg-orange-100/80 border border-orange-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                          ↳ [답변] 이가이버 맞춤 견적서
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-600" />
                          작성 고객님과 관리자만 열람 가능
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 shrink-0">
                        견적서 열람 ➔
                      </span>
                    </div>
                  )}
                </div>

                {/* 오른쪽 상태 버튼 */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  {isAnswered ? (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200 shadow-sm">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>견적 답글 확인</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
                      <span>의뢰 내용 보기</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. 신규 무료 견적 의뢰 작성 모달 */}
      {/* ======================================================== */}
      <Dialog open={isWriteModalOpen} onOpenChange={setIsWriteModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-orange-500 text-white font-bold">무료 견적 신청</Badge>
              <span className="text-xs text-slate-500">이가이버가 직접 확인 후 맞춤 견적서 회신</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900">
              수리·관리 견적 의뢰서 작성
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              현장 사진을 첨부해 주시면 더욱 정확하고 빠른 견적 산출이 가능합니다.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newEstimateData.title || !newEstimateData.authorName || !newEstimateData.phone || !newEstimateData.content) {
                toast({ title: "입력 확인", description: "제목, 성함, 연락처, 의뢰내용을 모두 입력해 주세요.", variant: "destructive" });
                return;
              }
              const phoneDigits = newEstimateData.phone.replace(/[^0-9]/g, "");
              const phoneLast4 = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : "0000";
              const finalPassword = newEstimateData.password.trim() || phoneLast4;

              createMutation.mutate({
                ...newEstimateData,
                password: finalPassword,
              });
            }}
            className="space-y-4 py-2"
          >
            {/* 제목 */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">의뢰 제목 *</Label>
              <Input
                placeholder="예: 원룸 싱크대 수전 누수 교체 및 실리콘 코킹 견적 문의"
                value={newEstimateData.title}
                onChange={(e) => setNewEstimateData((prev) => ({ ...prev, title: e.target.value }))}
                className="rounded-xl"
                required
              />
            </div>

            {/* 성함 / 연락처 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">고객 성함 *</Label>
                <Input
                  placeholder="예: 홍길동"
                  value={newEstimateData.authorName}
                  onChange={(e) => setNewEstimateData((prev) => ({ ...prev, authorName: e.target.value }))}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">연락처 * (견적 안내 카톡 발송용)</Label>
                <Input
                  placeholder="예: 010-1234-5678"
                  value={newEstimateData.phone}
                  onChange={(e) => setNewEstimateData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            {/* 분야 / 현장 주소 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">서비스 분야 *</Label>
                <select
                  value={newEstimateData.category}
                  onChange={(e) => setNewEstimateData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="원룸·다가구">원룸·다가구 관리 및 수리</option>
                  <option value="상가·건물">상가·빌딩 시설 유지보수</option>
                  <option value="생활집수리">종합 생활집수리 (수전/도어/조명)</option>
                  <option value="세컨하우스 케어">세컨하우스·별장 정기 관리</option>
                  <option value="기타">기타 수리 및 상담</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">현장 주소 / 위치</Label>
                <Input
                  placeholder="예: 강화군 길상면 온수리 원룸"
                  value={newEstimateData.address}
                  onChange={(e) => setNewEstimateData((prev) => ({ ...prev, address: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* 현장 사진 업로드 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">현장 사진 첨부 (선택)</Label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-2xl p-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-orange-50/50 transition-colors w-full sm:w-auto">
                  <Upload className="w-4 h-4 text-orange-500" />
                  <span>{isUploadingPhoto ? "사진 업로드 중..." : "현장 사진 파일 선택"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>

                {newEstimateData.imageUrl && (
                  <div className="relative group shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={newEstimateData.imageUrl}
                      alt="첨부사진"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewEstimateData((prev) => ({ ...prev, imageUrl: "" }))}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 수리 요청 상세 내용 */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">수리 요청 상세 내용 *</Label>
              <Textarea
                rows={4}
                placeholder="어떤 곳에 문제가 발생했는지 자세히 적어주세요.&#10;(예: 싱크대 하부장 바닥으로 물이 조금씩 배어 나오고 있습니다. 수전 교체 및 배수구 호스 점검 부탁드립니다.)"
                value={newEstimateData.content}
                onChange={(e) => setNewEstimateData((prev) => ({ ...prev, content: e.target.value }))}
                className="rounded-xl text-sm"
                required
              />
            </div>

            {/* 비밀글 설정 */}
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newEstimateData.isSecret}
                  onChange={(e) => setNewEstimateData((prev) => ({ ...prev, isSecret: e.target.checked }))}
                  className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  비밀글로 등록하기 (작성 고객님과 관리자만 열람 가능)
                </span>
              </label>

              {newEstimateData.isSecret && (
                <div className="pt-1 space-y-1.5 bg-white/70 p-3 rounded-xl border border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-slate-700 font-semibold shrink-0">열람 비밀번호 (선택):</Label>
                    <Input
                      type="password"
                      maxLength={4}
                      placeholder={newEstimateData.phone ? `${newEstimateData.phone.replace(/[^0-9]/g, "").slice(-4)} (휴대폰 뒷자리 자동)` : "숫자 4자리"}
                      value={newEstimateData.password}
                      onChange={(e) => setNewEstimateData((prev) => ({ ...prev, password: e.target.value }))}
                      className="w-44 h-8 text-xs rounded-lg bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    * 비워두실 경우 <strong>고객님의 휴대폰 번호 뒷자리 4자리</strong>가 비밀번호로 자동 지정되어 차후 편리하게 열람하실 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsWriteModalOpen(false)}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6"
              >
                {createMutation.isPending ? "접수 중..." : "견적 의뢰 등록하기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 2. 비밀글 비밀번호 확인 모달 */}
      {/* ======================================================== */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-2 text-amber-600">
              <Lock className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-lg font-black text-slate-900">
              비밀글 열람 비밀번호 확인
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-600 leading-relaxed">
              본 견적 의뢰와 이가이버의 맞춤 답변은 <strong>의뢰 고객과 관리자만 열람 가능한 비밀글</strong>입니다.<br />
              접수 시 입력하셨던 <strong>휴대폰 번호 뒷자리 4자리</strong> (또는 설정하신 비밀번호)를 입력해 주세요.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyPassword} className="space-y-4 py-2">
            <div>
              <Input
                type="password"
                maxLength={8}
                placeholder="휴대폰 뒷자리 4자리 또는 비밀번호"
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  setPasswordError("");
                }}
                className="text-center tracking-widest text-base font-bold rounded-xl h-12"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-rose-500 text-center mt-1.5 font-medium">
                  {passwordError}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-xl flex-1"
              >
                닫기
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex-1"
              >
                확인
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 3. 견적 의뢰 및 견적 답변 상세 모달 */}
      {/* ======================================================== */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          {selectedEstimate && (
            <div className="space-y-6">
              {/* 모달 상단 헤더 */}
              <div className="border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {selectedEstimate.status === "pending" && (
                      <Badge className="bg-amber-500 text-white font-bold text-xs">견적대기</Badge>
                    )}
                    {selectedEstimate.status === "answered" && (
                      <Badge className="bg-blue-600 text-white font-bold text-xs">견적완료</Badge>
                    )}
                    {selectedEstimate.status === "completed" && (
                      <Badge className="bg-emerald-600 text-white font-bold text-xs">시공완료</Badge>
                    )}
                    <Badge variant="outline" className="text-slate-600 text-xs">
                      {selectedEstimate.category}
                    </Badge>
                    {selectedEstimate.isSecret && (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> 비밀글
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400">
                    등록일: {selectedEstimate.createdAt ? new Date(selectedEstimate.createdAt).toLocaleString() : ""}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {selectedEstimate.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-600 mt-2 font-medium">
                  <span>의뢰인: <strong>{selectedEstimate.authorName}</strong></span>
                  {selectedEstimate.phone && (
                    <span>연락처: <strong className="text-orange-600">{selectedEstimate.phone}</strong></span>
                  )}
                  {selectedEstimate.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedEstimate.address}
                    </span>
                  )}
                </div>
              </div>

              {/* 고객 의뢰 내용 & 사진 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  고객 수리 요청 내용
                </h4>
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedEstimate.content}
                </div>

                {selectedEstimate.imageUrl && (
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 mb-2">현장 첨부 사진:</h5>
                    <div className="max-w-md rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black/5">
                      <img
                        src={selectedEstimate.imageUrl}
                        alt="현장 사진"
                        className="w-full max-h-72 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* 관리자 공식 견적서 카드 (견적완료 시 출력) */}
              {/* ======================================================== */}
              {(selectedEstimate.status === "answered" || selectedEstimate.status === "completed") && !isEditingAnswer && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500 text-white font-black text-xs px-2.5 py-0.5 shadow-sm">
                        ↳ [답글] 이가이버 맞춤 견적서
                      </Badge>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                        <Lock className="w-3 h-3 text-amber-600" />
                        의뢰 고객님과 관리자만 확인 가능한 비공개 견적서
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      공식 검토 완료
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-blue-900/50 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-md">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-orange-400 tracking-wider">이가이버 공인</span>
                        <h3 className="text-lg sm:text-xl font-black">부동산 토탈케어 맞춤 견적서</h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">견적 산출일시</span>
                      <span className="text-xs font-semibold text-slate-200">
                        {selectedEstimate.answeredAt ? new Date(selectedEstimate.answeredAt).toLocaleString() : "최근"}
                      </span>
                    </div>
                  </div>

                  {/* 금액 및 일정 3단 요약 카드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <span className="text-xs text-slate-400 block mb-1">예상 공임비</span>
                      <span className="text-base sm:text-lg font-black text-amber-400">
                        {selectedEstimate.estimateLabor || "현장 확인 후 안내"}
                      </span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <span className="text-xs text-slate-400 block mb-1">예상 자재/부품비</span>
                      <span className="text-base sm:text-lg font-black text-sky-400">
                        {selectedEstimate.estimateParts || "실비 정산 / 협의"}
                      </span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <span className="text-xs text-slate-400 block mb-1">방문/시공 가능 예정일</span>
                      <span className="text-sm sm:text-base font-bold text-emerald-400">
                        {selectedEstimate.estimateSchedule || "일정 조율"}
                      </span>
                    </div>
                  </div>

                  {/* 상세 시공 설명 및 가이드 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2">
                    <h5 className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      작업 방법 및 상세 안내
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedEstimate.estimateContent}
                    </p>
                  </div>

                  {/* 안내 문구 및 상담 연결 */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-white/10">
                    <p className="text-center sm:text-left">
                      * 현장 상태 및 추가 부속에 따라 견적이 변동될 수 있습니다.<br />
                      * 시공 확정 및 일정 조율은 전화 문의 주시면 가장 빠릅니다.
                    </p>
                    <a
                      href="tel:010-4787-3120"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>이가이버 바로 통화 (010-4787-3120)</span>
                    </a>
                  </div>
                </div>
              </div>
              )}

              {/* 관리자: 견적 작성 / 수정 폼 (답변 대기 중이거나 수정 버튼 클릭 시) */}
              {isAdmin && (isEditingAnswer || selectedEstimate.status === "pending") && (
                <div className="bg-orange-50/70 border-2 border-orange-200 rounded-3xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-600 text-white font-bold">관리자 전용</Badge>
                      <h4 className="font-black text-slate-900 text-base sm:text-lg">
                        {selectedEstimate.status === "pending" ? "견적서 작성 및 답글 달기" : "견적서 내용 수정"}
                      </h4>
                    </div>
                    {isEditingAnswer && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingAnswer(false)}
                        className="text-xs rounded-xl"
                      >
                        수정 취소
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">예상 공임비</Label>
                      <Input
                        placeholder="예: 80,000원"
                        value={answerFormData.estimateLabor}
                        onChange={(e) => setAnswerFormData((prev) => ({ ...prev, estimateLabor: e.target.value }))}
                        className="bg-white rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">예상 부품/자재비</Label>
                      <Input
                        placeholder="예: 35,000원 (국산 고급 수전)"
                        value={answerFormData.estimateParts}
                        onChange={(e) => setAnswerFormData((prev) => ({ ...prev, estimateParts: e.target.value }))}
                        className="bg-white rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">방문 가능 예정일</Label>
                      <Input
                        placeholder="예: 이번 주 목요일 오후 2시"
                        value={answerFormData.estimateSchedule}
                        onChange={(e) => setAnswerFormData((prev) => ({ ...prev, estimateSchedule: e.target.value }))}
                        className="bg-white rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">상세 작업 내용 및 안내사항 *</Label>
                    <Textarea
                      rows={4}
                      placeholder="작업 순서, 호환 부품 정보, 현장 방문 시 유의사항 등을 적어주세요."
                      value={answerFormData.estimateContent}
                      onChange={(e) => setAnswerFormData((prev) => ({ ...prev, estimateContent: e.target.value }))}
                      className="bg-white rounded-xl text-sm"
                      required
                    />
                  </div>

                  {/* 카카오톡 나에게 보내기 자동 발송 체크박스 */}
                  <div className="bg-white p-3 rounded-xl border border-orange-200 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={answerFormData.sendKakaoNotice}
                        onChange={(e) => setAnswerFormData((prev) => ({ ...prev, sendKakaoNotice: e.target.checked }))}
                        className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                      />
                      <span>카카오톡 [나에게 보내기]로 고객 전달용 견적 메시지 즉시 전송</span>
                    </label>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      카톡에서 복사/수정 후 고객에게 바로 공유 가능
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      onClick={() => {
                        if (!answerFormData.estimateContent.trim()) {
                          toast({ title: "안내내용 입력", description: "상세 견적 안내사항을 입력해 주세요.", variant: "destructive" });
                          return;
                        }
                        answerMutation.mutate({ id: selectedEstimate.id, data: answerFormData });
                      }}
                      disabled={answerMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl px-6"
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      {answerMutation.isPending ? "저장 중..." : "견적서 저장 및 카톡 발송"}
                    </Button>
                  </div>
                </div>
              )}

              {/* 하단 관리자 액션 바 & 닫기 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin && (
                    <>
                      {/* 카톡 전달 메시지 복사 버튼 */}
                      <Button
                        size="sm"
                        onClick={handleCopyKakaoText}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        {hasCopied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                        <span>카톡 전달용 견적 양식 복사</span>
                      </Button>

                      {/* 수정 토글 */}
                      {!isEditingAnswer && selectedEstimate.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAnswerFormData({
                              estimateLabor: selectedEstimate.estimateLabor || "",
                              estimateParts: selectedEstimate.estimateParts || "",
                              estimateSchedule: selectedEstimate.estimateSchedule || "",
                              estimateContent: selectedEstimate.estimateContent || "",
                              status: selectedEstimate.status || "answered",
                              sendKakaoNotice: true,
                            });
                            setIsEditingAnswer(true);
                          }}
                          className="rounded-xl text-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          견적 답변 수정
                        </Button>
                      )}

                      {/* 삭제 버튼 */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("이 견적 의뢰 내역을 완전히 삭제하시겠습니까?")) {
                            deleteMutation.mutate({ id: selectedEstimate.id });
                          }
                        }}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        삭제
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
