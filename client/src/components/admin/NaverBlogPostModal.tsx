import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, Send, CheckCircle2, ExternalLink, AlertCircle, RefreshCw, 
  Settings, Key, Image as ImageIcon, LogIn, Loader2, X, Globe, Lock,
  MessageCircle, PhoneCall
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface NaverBlogPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "property" | "post";
  targetId: number;
  initialTitle?: string;
}

interface NaverStatus {
  sessionExists: boolean;
  blogId: string;
  defaultVisibility: "public" | "private";
  updatedAt?: string;
  hasGeminiKey: boolean;
}

export function NaverBlogPostModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  initialTitle
}: NaverBlogPostModalProps) {
  const { toast } = useToast();

  // 설정 및 세션 상태
  const [status, setStatus] = useState<NaverStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [blogIdInput, setBlogIdInput] = useState("");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isOpeningLogin, setIsOpeningLogin] = useState(false);
  const [nidAutInput, setNidAutInput] = useState("");
  const [nidSesInput, setNidSesInput] = useState("");
  const [isSavingCookies, setIsSavingCookies] = useState(false);

  // 원고 데이터
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");

  // 상태 관리
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [verification, setVerification] = useState<any>(null);

  // 상태 조회
  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await apiRequest("GET", "/api/admin/naver-blog/status");
      const data = await res.json();
      setStatus(data);
      setBlogIdInput(data.blogId || "");
      setIsPublic(data.defaultVisibility !== "private");
    } catch (err: any) {
      console.error("Failed to fetch naver blog status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // AI 초안 생성 요청
  const generateDraft = async (customInstructions?: string) => {
    setIsGenerating(true);
    setPublishedUrl(null);
    try {
      const res = await apiRequest("POST", "/api/admin/naver-blog/generate", {
        type: targetType,
        id: targetId,
        customInstructions: customInstructions || customPrompt
      });
      const data = await res.json();
      
      setTitle(data.title || "");
      setContent(data.content || "");
      setVerification(data.verification || null);
      
      const MANDATORY_TAGS = ["강화도부동산", "강화군부동산", "이가이버", "부동산전문"];
      const rawTags = Array.isArray(data.tags) ? data.tags : [];
      const combinedTags = Array.from(new Set([...MANDATORY_TAGS, ...rawTags.map((t: string) => String(t).replace(/^#/, "").trim())])).filter(Boolean).slice(0, 10);
      setTags(combinedTags);
      
      const imgs = Array.isArray(data.images) ? data.images : [];
      setAvailableImages(imgs);
      setSelectedImages(imgs); // 기본 전체 선택

      toast({
        title: "AI 블로그 원고 생성 완료",
        description: "원고 내용을 검토 및 수정한 후 [네이버 블로그로 발행]을 눌러주세요."
      });
    } catch (err: any) {
      console.error("Failed to generate blog post:", err);
      toast({
        title: "원고 생성 실패",
        description: err.message || "원고 생성 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 모달 열릴 때 초기 데이터 로드
  useEffect(() => {
    if (isOpen && targetId) {
      fetchStatus();
      generateDraft();
    } else {
      setPublishedUrl(null);
      setShowConfig(false);
    }
  }, [isOpen, targetId]);

  // 설정 저장
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      await apiRequest("POST", "/api/admin/naver-blog/config", {
        blogId: blogIdInput.trim(),
        geminiApiKey: geminiKeyInput.trim() || undefined
      });
      toast({
        title: "설정 저장 완료",
        description: "네이버 블로그 및 AI 설정이 업데이트되었습니다."
      });
      fetchStatus();
      setGeminiKeyInput("");
      setShowConfig(false);
    } catch (err: any) {
      toast({
        title: "설정 저장 실패",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // 수동 쿠키 등록
  const handleSaveCookies = async () => {
    if (!nidAutInput.trim() || !nidSesInput.trim()) {
      toast({
        title: "쿠키 입력 필요",
        description: "NID_AUT와 NID_SES 값을 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    setIsSavingCookies(true);
    try {
      await apiRequest("POST", "/api/admin/naver-blog/save-cookies", {
        nidAut: nidAutInput.trim(),
        nidSes: nidSesInput.trim()
      });
      toast({
        title: "네이버 쿠키 저장 완료!",
        description: "로그인 세션이 등록되었습니다. 이제 블로그로 바로 발행하실 수 있습니다."
      });
      fetchStatus();
      setNidAutInput("");
      setNidSesInput("");
    } catch (err: any) {
      toast({
        title: "쿠키 저장 실패",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSavingCookies(false);
    }
  };

  // 대화형 네이버 로그인 실행
  const handleOpenLogin = async () => {
    setIsOpeningLogin(true);
    try {
      await apiRequest("POST", "/api/admin/naver-blog/open-login");
      toast({
        title: "로그인 브라우저 실행됨",
        description: "화면에 뜬 브라우저에서 네이버 로그인을 완료하시면 세션이 자동 저장됩니다."
      });
      // 10초 후부터 주기적으로 세션 체크
      const interval = setInterval(async () => {
        const res = await apiRequest("GET", "/api/admin/naver-blog/status");
        const data = await res.json();
        if (data.sessionExists) {
          setStatus(data);
          clearInterval(interval);
          setIsOpeningLogin(false);
          toast({
            title: "네이버 로그인 성공!",
            description: "로그인 세션이 안전하게 저장되었습니다."
          });
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(interval);
        setIsOpeningLogin(false);
      }, 120000);
    } catch (err: any) {
      toast({
        title: "로그인 창 실행 실패",
        description: err.message,
        variant: "destructive"
      });
      setIsOpeningLogin(false);
    }
  };

  // 태그 추가/삭제
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // 이미지 선택 토글
  const toggleImage = (img: string) => {
    if (selectedImages.includes(img)) {
      setSelectedImages(selectedImages.filter(i => i !== img));
    } else {
      setSelectedImages([...selectedImages, img]);
    }
  };

  // 최종 네이버 블로그 발행
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "입력 확인 필요",
        description: "제목과 본문 내용을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!status?.sessionExists) {
      toast({
        title: "네이버 로그인 필요",
        description: "먼저 상단 [네이버 로그인] 버튼을 눌러 로그인을 완료해주세요.",
        variant: "destructive"
      });
      setShowConfig(true);
      return;
    }

    setIsPublishing(true);
    setPublishedUrl(null);
    try {
      const MANDATORY_TAGS = ["강화도부동산", "강화군부동산", "이가이버", "부동산전문"];
      const finalTagsToPublish = Array.from(new Set([...MANDATORY_TAGS, ...tags.map(t => t.replace(/^#/, "").trim())])).filter(Boolean).slice(0, 10);

      const categoryName = targetType === "property" ? "매물 정보" : "일상다반사";

      const res = await apiRequest("POST", "/api/admin/naver-blog/publish", {
        title: title.trim().replace(/\*\*/g, ""),
        content: content.trim().replace(/\*\*/g, ""),
        tags: finalTagsToPublish,
        imageUrls: selectedImages,
        isPublic,
        categoryName,
        targetType
      });
      const data = await res.json();
      
      setPublishedUrl(data.postUrl || `https://blog.naver.com/${status.blogId}`);
      toast({
        title: "네이버 블로그 발행 성공! 🎉",
        description: "글이 네이버 블로그에 성공적으로 등록되었습니다."
      });
    } catch (err: any) {
      console.error("Publish error:", err);
      toast({
        title: "블로그 발행 실패",
        description: err.message || "발행 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-[#03C75A] text-white font-black text-xs px-2 py-0.5 rounded">N</span>
              <DialogTitle className="text-xl font-bold">네이버 블로그 자동 포스팅</DialogTitle>
            </div>
            <div className="flex items-center gap-2 mr-6">
              {status?.sessionExists ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  로그인됨 ({status.blogId})
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-xs">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  네이버 로그인 필요
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-slate-500 hover:text-slate-900"
                onClick={() => setShowConfig(!showConfig)}
              >
                <Settings className="w-4 h-4 mr-1" />
                설정
              </Button>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            홈페이지 데이터를 바탕으로 AI가 블로그용 원고를 자동 생성했습니다. 검수 후 [네이버로 발행]을 누르세요.
          </DialogDescription>
        </DialogHeader>

        {/* 상단 설정 패널 (토글) */}
        {showConfig && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-3 mb-2 animate-in fade-in-50">
            <div className="flex items-center justify-between font-semibold text-slate-800 pb-2 border-b">
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-primary" />
                네이버 연동 및 AI 설정
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)} className="h-6 w-6 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-600 font-medium">네이버 블로그 ID</Label>
                <Input
                  value={blogIdInput}
                  onChange={(e) => setBlogIdInput(e.target.value)}
                  placeholder="예: 9551304"
                  className="h-8 mt-1 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">blog.naver.com/<strong>ID</strong>에 해당하는 계정 ID</p>
              </div>

              <div>
                <Label className="text-xs text-slate-600 font-medium flex items-center justify-between">
                  <span>Google Gemini API Key</span>
                  {status?.hasGeminiKey ? (
                    <span className="text-[11px] text-emerald-600 font-medium">연동 완료</span>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-medium">기본 템플릿 모드</span>
                  )}
                </Label>
                <Input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder={status?.hasGeminiKey ? "•••••••••••••••• (설정됨)" : "AI Studio API Key 입력"}
                  className="h-8 mt-1 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">입력 시 더 자연스러운 고품질 맞춤 원고를 생성합니다.</p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                className="h-8 text-xs font-bold"
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
              >
                {isSavingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                기본 설정 저장
              </Button>
            </div>

            {/* 네이버 로그인 세션 등록 섹션 */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#03C75A]" />
                  네이버 로그인 세션 등록 (최초 1회만 필요)
                </span>
                {status?.sessionExists && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-emerald-300">
                    현재 세션 정상 연결됨
                  </Badge>
                )}
              </div>

              {/* 방법 1: 쿠키 직접 입력 (가장 간단하고 빠름) */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">⚡ 방법 1: 네이버 쿠키 직접 입력 (추천)</span>
                  <span className="text-[11px] text-slate-400">naver.com 로그인 상태에서 복사</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-slate-500 font-semibold">NID_AUT 값</Label>
                    <Input
                      value={nidAutInput}
                      onChange={(e) => setNidAutInput(e.target.value)}
                      placeholder="NID_AUT 쿠키 값 붙여넣기"
                      className="h-8 text-xs font-mono mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-500 font-semibold">NID_SES 값</Label>
                    <Input
                      value={nidSesInput}
                      onChange={(e) => setNidSesInput(e.target.value)}
                      placeholder="NID_SES 쿠키 값 붙여넣기"
                      className="h-8 text-xs font-mono mt-0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-slate-400">
                    * 크롬에서 F12 키 → Application(애플리케이션) → Cookies → https://www.naver.com 에서 확인
                  </p>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-[#03C75A] hover:bg-[#02b350] text-white font-bold"
                    onClick={handleSaveCookies}
                    disabled={isSavingCookies}
                  >
                    {isSavingCookies ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    쿠키 등록하기
                  </Button>
                </div>
              </div>

              {/* 방법 2: PC 전용 로그인 프로그램 안내 */}
              <div className="p-3 bg-slate-100/70 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <span>🖥️ 방법 2: 내 컴퓨터에서 1회 로그인 프로그램 실행</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  프로젝트 폴더(<code className="bg-white px-1 py-0.5 rounded border text-slate-700">e:\server\homepage</code>)에 생성된 <strong>네이버로그인.bat</strong> 파일을 더블클릭하시면, 화면에 실제 크롬 브라우저가 뜨면서 로그인 세션이 서버로 자동 전송됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 발행 성공 알림 배너 */}
        {publishedUrl && (
          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>네이버 블로그에 성공적으로 발행되었습니다!</span>
            </div>
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#03C75A] hover:bg-[#02b350] px-3 py-1.5 rounded-md shadow-sm transition-colors"
            >
              블로그 글 확인하기 <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* 메인 편집 폼 */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {isGenerating ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Sparkles className="w-10 h-10 text-primary animate-bounce" />
              <p className="text-base font-semibold text-slate-700">AI가 네이버 블로그 맞춤 원고를 작성하고 있습니다...</p>
              <p className="text-xs text-slate-500">매물 특성과 입지 조건을 분석하여 매력적인 글을 생성 중입니다.</p>
            </div>
          ) : (
            <>
              {/* AI 할루시네이션 & 팩트체크 검증 상태 카드 */}
              {verification && (
                <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  verification.passed ? "bg-emerald-50/80 border-emerald-200 text-emerald-950" : "bg-blue-50/80 border-blue-200 text-blue-950"
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-slate-800">
                        🛡️ AI 할루시네이션 방지 & 팩트체크 검증 완료
                      </span>
                      <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-300 text-[10px] py-0 px-1.5 font-bold">
                        {verification.passed ? "검증 통과" : "자동 보정 완료"}
                      </Badge>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {verification.summary}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px] text-slate-700 font-medium">
                      <span>✔ 매물 사실정보 일치</span>
                      <span>✔ 대표: 이민호</span>
                      <span>✔ 직통: 010-4787-3120</span>
                      <span>✔ 카카오/전화 배너 링크 포함</span>
                      <span>✔ 볼드(**) 기호 100% 제거</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 제목 */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">블로그 제목</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="네이버 블로그 제목을 입력하세요"
                  className="mt-1 font-medium text-slate-900"
                />
              </div>

              {/* 이미지 선택 */}
              {availableImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                      블로그 첨부 사진 ({selectedImages.length}/{availableImages.length}개 선택됨)
                    </Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedImages([...availableImages])}
                        className="text-[11px] text-primary hover:underline"
                      >
                        전체 선택
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedImages([])}
                        className="text-[11px] text-slate-500 hover:underline"
                      >
                        전체 해제
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2 bg-slate-50 border rounded-lg max-h-36 overflow-y-auto">
                    {availableImages.map((img, idx) => {
                      const isSelected = selectedImages.includes(img);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleImage(img)}
                          className={`relative group cursor-pointer aspect-square rounded-md overflow-hidden border-2 transition-all ${
                            isSelected ? "border-primary ring-2 ring-primary/20" : "border-slate-200 opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`매물 사진 ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e: any) => { e.target.style.display = 'none'; }}
                          />
                          <div className={`absolute top-1 right-1 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? "bg-primary text-white" : "bg-slate-700/60 text-white"
                          }`}>
                            {isSelected ? "✓" : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 본문 내용 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-semibold text-slate-700">본문 내용 (스마트에디터에 자동 입력됨)</Label>
                  <span className="text-[11px] text-slate-400">{content.length}자</span>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder="본문 내용을 입력하세요"
                  className="font-normal text-xs leading-relaxed font-mono"
                />
              </div>

              {/* 본문 자동 삽입 배너 이미지 미리보기 */}
              <div className="space-y-2 p-3 bg-slate-50 border rounded-lg">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  본문 자동 삽입 배너 이미지 및 하이퍼링크 (교차 배치)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="border rounded-lg overflow-hidden bg-white p-2 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
                        카카오톡 1:1 상담 배너
                      </span>
                      <a
                        href="https://pf.kakao.com/_xaxbxlxfs/chat"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono transition-colors"
                      >
                        pf.kakao.com ↗
                      </a>
                    </div>
                    <img
                      src="/images/banner_kakao.png"
                      alt="카카오톡 실시간 상담 배너"
                      className="w-full h-auto rounded border object-contain"
                    />
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-white p-2 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        전화 상담 바로연결 배너
                      </span>
                      <a
                        href="tel:010-4787-3120"
                        className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono transition-colors"
                      >
                        010-4787-3120 📞
                      </a>
                    </div>
                    <img
                      src="/images/banner_call.png"
                      alt="전화 상담 바로연결 배너"
                      className="w-full h-auto rounded border object-contain"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  * 본문 안내문 아래에 각 배너 이미지가 정밀하게 삽입되며, 터치 시 카카오톡 상담창 및 전화 연결로 이동하도록 하이퍼링크가 자동 설정됩니다.
                </p>
              </div>

              {/* 해시태그 */}
              <div>
                <Label className="text-xs font-semibold text-slate-700">해시태그 (최대 10개)</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5 p-2 bg-slate-50 border rounded-lg min-h-[42px] items-center">
                  {tags.map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="gap-1 text-xs py-1 px-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1 ml-1">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="+ 태그 입력 (엔터)"
                      className="h-6 w-28 text-xs border-dashed"
                    />
                  </div>
                </div>
              </div>

              {/* AI 재작성 지시사항 입력 */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <Input
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="AI 재작성 추가 요청 (예: 가격 인하 강조해줘, 감성적인 카페 분위기로 써줘)"
                  className="h-8 text-xs bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      generateDraft();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs shrink-0 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  onClick={() => generateDraft()}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
                  다시 작성
                </Button>
              </div>
            </>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <DialogFooter className="pt-3 border-t mt-3 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
              <span className="text-xs text-slate-500 font-medium">발행 카테고리:</span>
              <span className="text-xs font-bold text-slate-800">
                {targetType === "property" ? "매물 정보™" : "일상다반사"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(Boolean(checked))}
              />
              <Label htmlFor="isPublic" className="text-xs text-slate-700 cursor-pointer flex items-center gap-1 font-medium">
                {isPublic ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    전체공개로 발행
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    비공개로 발행 (테스트용)
                  </>
                )}
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isPublishing}>
              닫기
            </Button>
            <Button
              size="sm"
              className="bg-[#03C75A] hover:bg-[#02b350] text-white font-bold gap-1.5 shadow-sm"
              onClick={handlePublish}
              disabled={isPublishing || isGenerating}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  스마트에디터에 등록 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  네이버 블로그로 발행하기
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
