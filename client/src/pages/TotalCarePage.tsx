import { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { 
  Wrench, Building, Home, ShieldCheck, Phone, CheckCircle2, 
  ArrowRight, Upload, Clock, Sparkles, MapPin, Calendar, Check,
  AlertTriangle, Eye, ThumbsUp, FileText, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import CareEstimateBoard from "@/components/care/CareEstimateBoard";

export default function TotalCarePage() {
  const { toast } = useToast();
  
  // URL 쿼리 파라미터 확인 (?tab=estimates 또는 ?estimateId=...)
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialMode = searchParams.get("tab") === "estimates" || searchParams.get("estimateId") ? "estimates" : "services";
  const initialEstimateId = searchParams.get("estimateId") ? parseInt(searchParams.get("estimateId")!) : null;

  const [mainMode, setMainMode] = useState<"services" | "estimates">(initialMode);
  const [activeTab, setActiveTab] = useState("oneroom");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 폼 입력 상태
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    buildingType: "원룸·다가구",
    serviceCategory: "원룸 유지보수",
    preferredDate: "",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 사진 업로드 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });

      if (!res.ok) throw new Error("업로드 실패");
      const data = await res.json();
      setUploadedImageUrl(data.url);
      toast({
        title: "사진 업로드 완료",
        description: "현장 사진이 성공적으로 첨부되었습니다.",
      });
    } catch (error) {
      toast({
        title: "업로드 오류",
        description: "사진 업로드 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 접수 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast({
        title: "입력 확인",
        description: "성함과 연락처를 입력해 주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 이미지 절대 URL 생성 (이메일 및 외부 연동에서도 정상 열람 가능)
      const fullPhotoUrl = uploadedImageUrl
        ? (uploadedImageUrl.startsWith("http") ? uploadedImageUrl : `https://leegyver.com${uploadedImageUrl}`)
        : "첨부 없음";

      const fullMessage = `
[부동산 토탈케어 접수]
- 건물유형: ${formData.buildingType}
- 신청서비스: ${formData.serviceCategory}
- 현장주소: ${formData.address || "미입력"}
- 희망방문일: ${formData.preferredDate || "조율 필요"}
- 현장사진: ${fullPhotoUrl}
------------------------------------
[상세 증상 및 문의]
${formData.message}
      `.trim();

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email.trim() || "", // 고객이 실제 입력한 경우에만 전달
          phone: formData.phone,
          message: fullMessage,
          inquiryType: "토탈케어",
        }),
      });

      if (!res.ok) throw new Error("접수 실패");

      toast({
        title: "접수가 완료되었습니다!",
        description: "확인 후 이가이버 대표가 빠르게 전화 안내 드리겠습니다.",
      });

      // 폼 초기화
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        buildingType: "원룸·다가구",
        serviceCategory: "원룸 유지보수",
        preferredDate: "",
        message: "",
      });
      setUploadedImageUrl(null);
    } catch (error) {
      toast({
        title: "접수 오류",
        description: "접수 처리 중 문제가 발생했습니다. 전화(010-4787-3120)로 문의주시면 더 빠릅니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>부동산 토탈케어 | 이가이버부동산 (건물유지보수·원룸관리·출장집수리)</title>
        <meta
          name="description"
          content="강화도 부동산 매매부터 건물 유지보수, 원룸 다가구 임대관리, 출장 집수리, 세컨하우스 안심 케어까지! 공인중개사이자 수리 전문가 이가이버가 직접 책임 시공합니다."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs sm:text-sm font-bold mb-3">
                <Wrench className="w-4 h-4" />
                <span>강화도 부동산 중개 + 시설 관리·수리 원스톱 솔루션</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                공인중개사가 직접 수리·관리하는<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400">
                  이가이버 부동산 토탈케어
                </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-300 font-light leading-relaxed">
                외지에 계신 원룸·상가 건물주님의 골치 아픈 시설 민원부터,<br className="hidden sm:inline" />
                전원주택 긴급 출장 집수리, 비어있는 세컨하우스 정기 순회까지 완벽하게 책임집니다.
              </p>
            </motion.div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setMainMode("estimates");
                  document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/30 transition-transform transform hover:-translate-y-0.5 text-sm sm:text-base cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-200" />
                <span>실시간 견적 상담실 / 답변 확인</span>
                <span className="bg-white text-orange-600 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  NEW
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMainMode("services");
                  setTimeout(() => {
                    document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-6 py-3.5 rounded-xl backdrop-blur-sm transition-colors text-sm sm:text-base cursor-pointer"
              >
                <Upload className="w-4 h-4 text-orange-400" />
                <span>간편 견적 신청하기</span>
              </button>
              <a
                href="tel:010-4787-3120"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-6 py-3.5 rounded-xl backdrop-blur-sm transition-colors text-sm sm:text-base"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>긴급 출장 전화 010-4787-3120</span>
              </a>
            </div>
          </div>

          {/* 4 Feature Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 max-w-4xl mx-auto">
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">하청 없는 100%</p>
                <p className="text-sm font-bold text-white">대표 직접 책임시공</p>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">강화도 20년</p>
                <p className="text-sm font-bold text-white">공인중개사 자격보유</p>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">거품 없는 투명성</p>
                <p className="text-sm font-bold text-white">사전 정찰제 견적</p>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">강화 전지역</p>
                <p className="text-sm font-bold text-white">신속 당일 출장 대응</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Pricing & Service Sections / Estimate Board */}
      <section id="main-content" className="py-10 sm:py-16">
        <div className="container mx-auto px-4">
          {/* Main Mode Switcher Tabs */}
          <div className="flex justify-center max-w-md mx-auto mb-10">
            <div className="grid grid-cols-2 p-1.5 bg-slate-200/90 rounded-2xl w-full border border-slate-300 shadow-inner">
              <button
                type="button"
                onClick={() => setMainMode("services")}
                className={`py-3 px-4 rounded-xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mainMode === "services"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Wrench className="w-4 h-4 text-orange-500" />
                <span>서비스 & 단가표</span>
              </button>
              <button
                type="button"
                onClick={() => setMainMode("estimates")}
                className={`py-3 px-4 rounded-xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 relative cursor-pointer ${
                  mainMode === "estimates"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>실시간 견적 상담실</span>
                <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  NEW
                </span>
              </button>
            </div>
          </div>

          {mainMode === "estimates" ? (
            <div className="max-w-5xl mx-auto">
              <CareEstimateBoard initialEstimateId={initialEstimateId} />
            </div>
          ) : (
            <div>
              <div className="text-center max-w-2xl mx-auto mb-10">
                <Badge className="bg-blue-600 text-white mb-2 px-3 py-1 text-xs">서비스 카테고리 & 표준 단가표</Badge>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  필요한 서비스를 선택하고<br />투명한 예상 금액을 확인하세요
                </h2>
                <p className="text-slate-600 text-sm sm:text-base mt-2">
                  ※ 강화 관내 기본 출장·진단비는 3만~5만원이며, 현장 수리 진행 시 출장비는 시공비에서 공제해 드립니다.
                </p>
              </div>

          <Tabs defaultValue="oneroom" className="max-w-5xl mx-auto" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-slate-200/80 rounded-2xl mb-8">
              <TabsTrigger value="oneroom" className="py-3 font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">
                🏢 원룸·다가구 관리
              </TabsTrigger>
              <TabsTrigger value="building" className="py-3 font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">
                🏬 상가·건물 유지보수
              </TabsTrigger>
              <TabsTrigger value="home-repair" className="py-3 font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">
                🔧 생활 집수리
              </TabsTrigger>
              <TabsTrigger value="second-house" className="py-3 font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">
                🏡 세컨하우스 안심구독
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: 원룸 / 다가구 */}
            <TabsContent value="oneroom" className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                      임대인 맞춤형 안심 케어
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                      원룸 · 다가구 · 빌라 시설 유지관리
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      세입자의 시도 때도 없는 잔고장 전화 스트레스 해방! 퇴거 원상복구부터 공용부 정기점검까지 대신합니다.
                    </p>
                  </div>
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 font-bold shrink-0">
                    <a href="#apply-form">이 서비스 신청하기</a>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {/* Card 1 */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <Badge variant="outline" className="border-blue-500 text-blue-600 font-bold mb-2">월간 구독형</Badge>
                      <h4 className="font-extrabold text-lg text-slate-900">월 정기 시설위탁</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">공용부 점검 + 세입자 수리 접수대행</p>
                      
                      <div className="text-2xl font-black text-blue-600 mb-4">
                        호실당 월 1.5만~2만원
                        <span className="text-xs font-normal text-slate-500 block">8가구 기준 월 12만~16만원 (VAT별도)</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 계단·복도 센서등, 도어락 정기점검</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 세입자 수리 민원 원스톱 대행</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 경미한 조명/부속 무상 점검 지원</li>
                      </ul>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="border-2 border-orange-400 rounded-2xl p-5 bg-orange-50/40 relative flex flex-col justify-between shadow-sm">
                    <div className="absolute -top-3 right-4 bg-orange-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                      임대인 강력추천
                    </div>
                    <div>
                      <Badge variant="outline" className="border-orange-500 text-orange-600 font-bold mb-2">원스톱 패키지</Badge>
                      <h4 className="font-extrabold text-lg text-slate-900">퇴거·입주 원상복구</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">파손 점검, 시설 리페어 및 체크리스트</p>
                      
                      <div className="text-2xl font-black text-orange-600 mb-4">
                        건당 15만 ~ 25만원
                        <span className="text-xs font-normal text-slate-500 block">자재비 실비 별도</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-orange-600 shrink-0" /> 세입자 퇴거 시 시설물 훼손 전수조사</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-orange-600 shrink-0" /> 수전·도어락·실리콘 코킹 원복</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-orange-600 shrink-0" /> 조명 교체 및 벽지 부분 하자보수</li>
                      </ul>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <Badge variant="outline" className="border-slate-400 text-slate-600 font-bold mb-2">건별 즉시 수리</Badge>
                      <h4 className="font-extrabold text-lg text-slate-900">원룸 긴급 출동 AS</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">싱크대·변기 막힘, 수도 교체</p>
                      
                      <div className="text-xl font-black text-slate-900 mb-4">
                        5만원 ~ 8만원 선
                        <span className="text-xs font-normal text-slate-500 block">단순 막힘 5만원~ / 수전교체 4만원+부품</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-600 shrink-0" /> 싱크대/욕실 변기 막힘 신속 관통</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-600 shrink-0" /> 세면대 수전, 샤워기, 부속품 교체</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-600 shrink-0" /> 인터폰 및 번호키 고장 수리</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: 건물 / 상가 */}
            <TabsContent value="building" className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      건물 수명 연장 & 자산가치 극대화
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                      상가 · 꼬마빌딩 · 펜션 유지보수
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      공용 시설 고장 방지, 옥상 우레탄 누수 점검, 성수기 펜션 설비 긴급 대응까지 전문가가 관리합니다.
                    </p>
                  </div>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 font-bold shrink-0">
                    <a href="#apply-form">이 서비스 신청하기</a>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {/* Card 1 */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <Badge variant="outline" className="border-blue-500 text-blue-600 font-bold mb-2">월 정기관리</Badge>
                      <h4 className="font-extrabold text-lg text-slate-900">소형 상가·근생 (3층 이하)</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">월 2회 정기 방문 및 외벽/옥상 점검</p>
                      
                      <div className="text-2xl font-black text-blue-600 mb-4">
                        월 15만 ~ 25만원
                        <span className="text-xs font-normal text-slate-500 block">사진 포함 월간 관리 리포트 발송</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 공용부 조명, 누수 흔적 정기 점검</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 옥상 배수구 이물질 청소 & 방수 체크</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 계단 난간, 창문 잠금장치 안전 점검</li>
                      </ul>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <Badge variant="outline" className="border-blue-500 text-blue-600 font-bold mb-2">종합 관리</Badge>
                      <h4 className="font-extrabold text-lg text-slate-900">중형 빌딩 (4~5층)</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">설비 전반 & 소방/전기 분전반 체크</p>
                      
                      <div className="text-2xl font-black text-blue-600 mb-4">
                        월 30만 ~ 50만원
                        <span className="text-xs font-normal text-slate-500 block">규모 및 입주 업종별 맞춤 조율</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 전기 분전반, 펌프 및 정화조 설비 점검</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 외벽 크랙, 실리콘 코킹 상태 정기 진단</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> 하자 발생 시 우선 출장 및 할인 견적</li>
                      </ul>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="border-2 border-amber-400 rounded-2xl p-5 bg-amber-50/40 relative flex flex-col justify-between">
                    <div className="absolute -top-3 right-4 bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                      강화도 펜션 특화
                    </div>
                    <div>
                      <Badge variant="outline" className="border-amber-500 text-amber-600 font-bold mb-2">긴급 출동 케어</Badge>
                      <h4 className="font-extrabold text-lg text-slate-900">펜션 시설 유지보수</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">주말 손님 입실 트러블 즉시 해결</p>
                      
                      <div className="text-2xl font-black text-amber-600 mb-4">
                        기본 월 20만원~
                        <span className="text-xs font-normal text-slate-500 block">성수기 주말 긴급 출장 우선권 부여</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600 shrink-0" /> 바베큐장 데크 파손 및 야외조명 수리</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600 shrink-0" /> 객실별 온수/보일러 순환 점검</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600 shrink-0" /> 상가 유리문 플로어 힌지 교체 (15~25만)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: 생활 집수리 단가표 */}
            <TabsContent value="home-repair" className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      투명 정찰제 시공 공임
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                      일반 주택 · 생활 집수리 표준 요금표
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      작은 수리 하나도 정성을 다해 방문합니다. 부품 자재는 실비로 정직하게 안내해 드립니다.
                    </p>
                  </div>
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 font-bold shrink-0">
                    <a href="#apply-form">수리 견적 접수하기</a>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {/* 항목 1 */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                    <div className="text-emerald-600 font-black text-sm mb-2 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4" />
                      <span>수도 / 배관 / 욕실</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>싱크대 원홀 수전</span>
                        <span className="font-bold text-slate-900">4만 ~ 5만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>세면대/샤워기 수전</span>
                        <span className="font-bold text-slate-900">4만 ~ 5만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>변기 부속 전체 교체</span>
                        <span className="font-bold text-slate-900">4.5만 ~ 6만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>양변기 신규 교체 시공</span>
                        <span className="font-bold text-slate-900">8만 ~ 12만원</span>
                      </li>
                      <li className="flex justify-between py-1">
                        <span>배관 동파 긴급 해빙</span>
                        <span className="font-bold text-slate-900">10만 ~ 20만원</span>
                      </li>
                    </ul>
                  </div>

                  {/* 항목 2 */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                    <div className="text-amber-600 font-black text-sm mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>전기 / 조명 / 차단기</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>LED 방등/주방등 교체</span>
                        <span className="font-bold text-slate-900">2.5만 ~ 3.5만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>거실 대형 LED등 교체</span>
                        <span className="font-bold text-slate-900">4만 ~ 6만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>누전 차단기 점검·교체</span>
                        <span className="font-bold text-slate-900">4만 ~ 6만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>스위치/콘센트 교체(개당)</span>
                        <span className="font-bold text-slate-900">1.5만원 선</span>
                      </li>
                      <li className="flex justify-between py-1">
                        <span>센서등/외부 보안등</span>
                        <span className="font-bold text-slate-900">3만 ~ 5만원</span>
                      </li>
                    </ul>
                  </div>

                  {/* 항목 3 */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                    <div className="text-blue-600 font-black text-sm mb-2 flex items-center gap-1.5">
                      <Building className="w-4 h-4" />
                      <span>문 / 창호 / 방충망</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>디지털 도어락 설치</span>
                        <span className="font-bold text-slate-900">4만 ~ 6만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>미세 방충망 교체 (대형)</span>
                        <span className="font-bold text-slate-900">틀당 4만~6만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>문짝 처짐/끌림 대패 수리</span>
                        <span className="font-bold text-slate-900">4만 ~ 7만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>현관 도어클로저 교체</span>
                        <span className="font-bold text-slate-900">3.5만 ~ 5만원</span>
                      </li>
                      <li className="flex justify-between py-1">
                        <span>창문 실리콘 방수 코킹</span>
                        <span className="font-bold text-slate-900">현장 실측 견적</span>
                      </li>
                    </ul>
                  </div>

                  {/* 항목 4 */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                    <div className="text-orange-600 font-black text-sm mb-2 flex items-center gap-1.5">
                      <Home className="w-4 h-4" />
                      <span>전원주택 외부 설비</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>목재 데크 오일스테인</span>
                        <span className="font-bold text-slate-900">평당 2.5만~3.5만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>썩은 방부목 데크 부분보수</span>
                        <span className="font-bold text-slate-900">현장 확인 견적</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>지하수 모터 펌프 교체</span>
                        <span className="font-bold text-slate-900">10만 ~ 15만원</span>
                      </li>
                      <li className="flex justify-between py-1 border-b border-slate-200/60">
                        <span>마당 울타리/펜스 보수</span>
                        <span className="font-bold text-slate-900">현장 확인 견적</span>
                      </li>
                      <li className="flex justify-between py-1">
                        <span>빗물받이(홈통) 교체</span>
                        <span className="font-bold text-slate-900">현장 확인 견적</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: 세컨하우스 케어 */}
            <TabsContent value="second-house" className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                      서울·경기권 주말주택 소유주 필수
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                      전원주택 · 세컨하우스 안심 구독 케어
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      평일 비어있는 집, 동파나 누수 걱정 없이 주말에 온전한 휴식만 즐기실 수 있도록 빈집을 챙겨드립니다.
                    </p>
                  </div>
                  <Button asChild className="bg-purple-600 hover:bg-purple-700 font-bold shrink-0">
                    <a href="#apply-form">안심케어 신청하기</a>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {/* 베이직 */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <Badge variant="outline" className="border-slate-400 text-slate-700 font-bold mb-2">실속형</Badge>
                      <h4 className="font-extrabold text-lg text-slate-900">베이직 플랜</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">월 1회 정기 순회 점검</p>
                      
                      <div className="text-2xl font-black text-slate-900 mb-4">
                        월 100,000원
                        <span className="text-xs font-normal text-slate-500 block">사진 리포트 카카오톡 전송</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> 월 1회 외부 파손 및 침입 흔적 점검</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> 우편함 정리 및 폐기물 수거</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> 태풍/한파 직후 긴급 순회 점검</li>
                      </ul>
                    </div>
                  </div>

                  {/* 스탠다드 */}
                  <div className="border-2 border-purple-500 rounded-2xl p-5 bg-purple-50/40 relative flex flex-col justify-between shadow-md">
                    <div className="absolute -top-3 right-4 bg-purple-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                      가장 인기
                    </div>
                    <div>
                      <Badge variant="outline" className="border-purple-500 text-purple-600 font-bold mb-2">표준 추천</Badge>
                      <h4 className="font-extrabold text-lg text-slate-900">스탠다드 플랜</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">격주(월 2회) 실내 환기 & 통수</p>
                      
                      <div className="text-2xl font-black text-purple-600 mb-4">
                        월 180,000원
                        <span className="text-xs font-normal text-slate-500 block">실내외 종합 케어 리포트</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> 월 2회 격주 방문 점검</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> 실내 30분 환기 및 수도 배관 통수</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> 보일러 정상 가동 및 동파 예방 체크</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-purple-600 shrink-0" /> 마당 및 화단 간이 이상 유무 확인</li>
                      </ul>
                    </div>
                  </div>

                  {/* 프리미엄 */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <Badge variant="outline" className="border-amber-500 text-amber-600 font-bold mb-2">VIP 케어</Badge>
                      <h4 className="font-extrabold text-lg text-slate-900">프리미엄 플랜</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">도착 전 사전 준비 + 제초 연계</p>
                      
                      <div className="text-2xl font-black text-amber-600 mb-4">
                        월 300,000원
                        <span className="text-xs font-normal text-slate-500 block">집수리 공임 상시 20% 할인 혜택</span>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600 shrink-0" /> 주말 도착 전 보일러/에어컨 사전 가동</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600 shrink-0" /> 정기 마당 잔디 제초(연 2회 기본 포함)</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-600 shrink-0" /> 긴급 고장 발생 시 최우선 무상 진단</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  </section>

  {mainMode === "services" && (
    /* Online Application Form Section */
    <section id="apply-form" className="py-16 bg-slate-900 text-white relative">
      <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
              빠르고 간편한 온라인 접수
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2">
              현장 사진을 찍어 보내주시면<br />더욱 정확한 견적을 드립니다
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              접수 즉시 이가이버 대표에게 알림이 전송되며, 내용 확인 후 30분 이내로 연락드립니다.
            </p>
          </div>

          <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-md shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">성함 / 상호명 <span className="text-red-400">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="예: 홍길동"
                      className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-200">연락처 <span className="text-red-400">*</span></Label>
                    <Input
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="예: 010-1234-5678"
                      className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">이메일 <span className="text-xs text-slate-400 font-normal">(선택)</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="확인메일 수신용"
                      className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buildingType" className="text-slate-200">건물 및 부동산 유형</Label>
                    <select
                      id="buildingType"
                      name="buildingType"
                      value={formData.buildingType}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="원룸·다가구">원룸 · 다가구 · 빌라</option>
                      <option value="상가·꼬마빌딩">상가 · 꼬마빌딩</option>
                      <option value="전원주택·단독주택">전원주택 · 단독주택</option>
                      <option value="세컨하우스·별장">세컨하우스 · 주말주택</option>
                      <option value="펜션·숙박시설">펜션 · 카페 · 숙박시설</option>
                      <option value="기타">기타 부동산</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceCategory" className="text-slate-200">신청 서비스</Label>
                    <select
                      id="serviceCategory"
                      name="serviceCategory"
                      value={formData.serviceCategory}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="원룸 유지보수">원룸 시설위탁 및 퇴거수리</option>
                      <option value="건물 유지보수">상가/빌딩 정기점검 및 하자보수</option>
                      <option value="긴급 집수리">출장 집수리 (수도/전기/창호/도어락)</option>
                      <option value="세컨하우스 관리">세컨하우스 안심 구독 케어</option>
                      <option value="데크/외부시공">데크 오일스테인 및 외부 설비</option>
                      <option value="기타상담">기타 맞춤 견적 상담</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-slate-200">현장 주소 (강화도 내 지역)</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="예: 강화읍 관청리 000-0번지"
                      className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate" className="text-slate-200">희망 방문 일시</Label>
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      className="bg-slate-900/80 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-200">고장 증상 및 요청사항</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="수리가 필요한 부위나 관리받고 싶으신 내용을 상세히 적어주시면 빠른 처리가 가능합니다."
                    className="bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                {/* 사진 업로드 */}
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center justify-between">
                    <span>현장 사진 첨부 (선택)</span>
                    <span className="text-xs text-slate-400">스마트폰 사진 바로 업로드 가능</span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{isUploading ? "사진 올리는 중..." : "사진 파일 선택"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                    {uploadedImageUrl && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> 사진 등록 완료
                      </span>
                    )}
                  </div>
                  {uploadedImageUrl && (
                    <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-slate-600">
                      <img src={uploadedImageUrl} alt="현장 사진 미리보기" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 text-base font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xl shadow-orange-500/20 rounded-xl"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "접수 등록 중..." : "토탈케어 무료 견적 신청하기"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      )}

      {/* Case Studies / Real Examples (신뢰도) */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-xl mx-auto mb-12">
            <Badge className="bg-slate-900 text-white mb-2">실제 시공 사례</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              이가이버가 직접 해결한 현장 이야기
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              강화도 곳곳에서 고객님의 소중한 부동산 자산을 든든하게 지켜드리고 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="p-5">
                <Badge className="bg-orange-500 text-white text-[11px] mb-2 font-bold">원룸 퇴거수리</Badge>
                <h4 className="font-bold text-slate-900 text-base">길상면 12세대 다가구 원상복구</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  임차인 퇴거 후 방치된 수전 누수, 도어락 파손, 욕실 실리콘 코킹을 하루 만에 완벽 복구하여 다음 날 새로운 세입자 입주 완료.
                </p>
              </div>
              <div className="px-5 py-3 bg-white border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">소요시간: 1일</span>
                <span className="font-bold text-orange-600">공실 기간 0일 달성</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="p-5">
                <Badge className="bg-purple-600 text-white text-[11px] mb-2 font-bold">세컨하우스 관리</Badge>
                <h4 className="font-bold text-slate-900 text-base">화도면 별장 한파 동파 예방</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  영하 15도 한파 전 보일러 퇴수 밸브 잠금 및 열선 시공으로 세컨하우스의 고질적 배관 파열 사고를 사전에 완벽 차단.
                </p>
              </div>
              <div className="px-5 py-3 bg-white border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">정기 순회 점검</span>
                <span className="font-bold text-purple-600">수백만원 배관수리비 절감</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="p-5">
                <Badge className="bg-blue-600 text-white text-[11px] mb-2 font-bold">상가 유리문 보수</Badge>
                <h4 className="font-bold text-slate-900 text-base">강화읍 중심상가 강화유리문 힌지 교체</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  문이 쾅 닫히고 바닥에 긁히던 노후 상가 출입문 힌지 교체 및 수평 조정을 통해 안전사고 예방 및 부드러운 개폐 실현.
                </p>
              </div>
              <div className="px-5 py-3 bg-white border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">시공 시간: 2시간</span>
                <span className="font-bold text-blue-600">상가 손님 만족도 상승</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CEO Story / 왜 이가이버인가 결합 섹션 */}
      <section className="py-16 bg-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-md border border-slate-200 flex flex-col md:flex-row items-center gap-8">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shrink-0 border-4 border-orange-500/20 shadow-xl">
              <img
                src="/assets/uploads/ceo_profile.jpg"
                alt="이가이버 대표"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80";
                }}
              />
            </div>
            <div className="space-y-4 text-center md:text-left">
              <Badge className="bg-orange-600 text-white font-bold">전문가 소개</Badge>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                "부동산 중개와 시설 수리를 모두 아는<br className="hidden sm:inline" />진짜 해결사 이가이버입니다"
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-light">
                강화도에서 20여 년간 부동산을 중개하면서 고객님들이 가장 큰 어려움을 겪는 순간은 매매 계약이 끝난 후,
                비어있는 집이 망가지거나 세입자의 잦은 시설 고장 민원으로 스트레스를 받을 때였습니다.
                <br /><br />
                저는 책상에만 앉아있는 중개사가 아닌, <strong>직접 공구를 쥐고 현장에서 집을 고쳐온 기술자</strong>입니다.
                하청에 맡기지 않고 제가 직접 눈으로 보고 정직하게 고쳐드리겠습니다.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="text-xs bg-slate-100 font-semibold px-2.5 py-1 rounded-md text-slate-700 border">공인중개사 자격보유</span>
                <span className="text-xs bg-slate-100 font-semibold px-2.5 py-1 rounded-md text-slate-700 border">종합 생활집수리 전문기술</span>
                <span className="text-xs bg-slate-100 font-semibold px-2.5 py-1 rounded-md text-slate-700 border">강화도 로컬 20년 네트워크</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Floating/Fixed CTA for Mobile */}
      <div className="md:hidden sticky bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex gap-2">
        <a
          href="tel:010-4787-3120"
          className="flex-1 bg-slate-900 text-white text-center py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5 text-amber-400" />
          <span>전화 상담</span>
        </a>
        <button
          type="button"
          onClick={() => {
            setMainMode("estimates");
            document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex-1 bg-orange-600 text-white text-center py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>견적 상담실</span>
        </button>
      </div>
    </div>
  );
}
