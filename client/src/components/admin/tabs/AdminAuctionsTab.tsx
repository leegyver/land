import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Gavel, ShieldCheck, Clock, ExternalLink, Image, RefreshCw } from "lucide-react";
import { Auction } from "@shared/schema";

export default function AdminAuctionsTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 폼 상태
  const [caseNumber, setCaseNumber] = useState("");
  const [court, setCourt] = useState("인천지방법원 본원");
  const [propertyType, setPropertyType] = useState("주택");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("강화읍");
  const [landArea, setLandArea] = useState("");
  const [buildingArea, setBuildingArea] = useState("");
  const [appraisalPriceRaw, setAppraisalPriceRaw] = useState<number>(0);
  const [appraisalPrice, setAppraisalPrice] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [auctionDate, setAuctionDate] = useState("");
  const [status, setStatus] = useState("진행중");
  const [safetyRating, setSafetyRating] = useState("안전");
  const [expertComment, setExpertComment] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [featured, setFeatured] = useState(true);

  // 경매 목록 쿼리
  const { data: auctions = [], isLoading, refetch } = useQuery<Auction[]>({
    queryKey: ["/api/auctions"],
  });

  // 유찰 차수에 따른 자동 계산 헬퍼
  const handleCalculateDiscount = (round: string) => {
    if (!appraisalPriceRaw || appraisalPriceRaw <= 0) {
      toast({ variant: "destructive", title: "알림", description: "먼저 감정평가액(숫자)을 입력해주세요." });
      return;
    }

    let rate = 0;
    let factor = 1.0;

    if (round === "0") {
      rate = 0;
      factor = 1.0;
    } else if (round === "1") {
      rate = 30; // 1회 유찰시 30% 할인 (인천지방법원 기준 70%)
      factor = 0.7;
    } else if (round === "2") {
      rate = 51; // 2회 유찰시 (0.7 * 0.7 = 0.49 -> 51% 할인)
      factor = 0.49;
    } else if (round === "3") {
      rate = 66; // 3회 유찰시 (0.49 * 0.7 = 0.343 -> 66% 할인)
      factor = 0.343;
    }

    const minPriceNum = Math.floor(appraisalPriceRaw * factor);
    const depositNum = Math.floor(minPriceNum * 0.1);

    const formatWon = (num: number) => {
      if (num >= 100000000) {
        const eok = Math.floor(num / 100000000);
        const man = Math.floor((num % 100000000) / 10000);
        return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
      }
      return `${Math.floor(num / 10000).toLocaleString()}만원`;
    };

    setDiscountRate(rate);
    setAppraisalPrice(formatWon(appraisalPriceRaw));
    setMinimumPrice(formatWon(minPriceNum));
    setDeposit(formatWon(depositNum));
    toast({ title: "자동 계산 완료", description: `최저입찰가(${rate}% 할인)와 보증금(10%)이 계산되었습니다.` });
  };

  // 등록/수정 모달 열기
  const openModal = (auction?: Auction) => {
    if (auction) {
      setEditingAuction(auction);
      setCaseNumber(auction.caseNumber);
      setCourt(auction.court || "인천지방법원 본원");
      setPropertyType(auction.propertyType || "주택");
      setTitle(auction.title);
      setAddress(auction.address);
      setDistrict(auction.district || "강화읍");
      setLandArea(auction.landArea || "");
      setBuildingArea(auction.buildingArea || "");
      setAppraisalPrice(auction.appraisalPrice);
      setMinimumPrice(auction.minimumPrice);
      setDeposit(auction.deposit);
      setDiscountRate(auction.discountRate || 0);
      setAuctionDate(auction.auctionDate);
      setStatus(auction.status || "진행중");
      setSafetyRating(auction.safetyRating || "안전");
      setExpertComment(auction.expertComment || "");
      setImageUrl(auction.imageUrl);
      setYoutubeUrl(auction.youtubeUrl || "");
      setFeatured(auction.featured ?? true);
    } else {
      setEditingAuction(null);
      setCaseNumber("");
      setCourt("인천지방법원 본원");
      setPropertyType("주택");
      setTitle("");
      setAddress("인천시 강화군 ");
      setDistrict("강화읍");
      setLandArea("");
      setBuildingArea("");
      setAppraisalPriceRaw(300000000);
      setAppraisalPrice("3억원");
      setMinimumPrice("2억 1,000만원");
      setDeposit("2,100만원");
      setDiscountRate(30);
      setAuctionDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + " 10:00");
      setStatus("진행중");
      setSafetyRating("안전");
      setExpertComment("권리분석 상 인수되는 권리 없으며 명도 협의 수월한 추천 물건");
      setImageUrl("");
      setYoutubeUrl("");
      setFeatured(true);
    }
    setIsDialogOpen(true);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImageUrl(data.url);
      toast({ title: "업로드 성공", description: "대표 이미지가 등록되었습니다." });
    } catch (error) {
      toast({ variant: "destructive", title: "업로드 실패", description: "이미지 업로드 중 오류가 발생했습니다." });
    } finally {
      setIsUploading(false);
    }
  };

  // 생성 Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auctions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions/featured"] });
      toast({ title: "성공", description: "경매 물건이 등록되었습니다." });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "오류", description: err.message || "경매 등록 실패" });
    },
  });

  // 수정 Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/auctions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions/featured"] });
      toast({ title: "성공", description: "경매 물건이 수정되었습니다." });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "오류", description: err.message || "경매 수정 실패" });
    },
  });

  // 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/auctions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions/featured"] });
      toast({ title: "성공", description: "경매 물건이 삭제되었습니다." });
    },
    onError: () => toast({ variant: "destructive", title: "오류", description: "삭제 중 오류가 발생했습니다." }),
  });

  // 상태 빠른 변경 핸들러
  const handleQuickStatusChange = async (id: number, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/auctions/${id}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions/featured"] });
      toast({ title: "상태 변경", description: `상태가 '${newStatus}'(으)로 변경되었습니다.` });
    } catch {
      toast({ variant: "destructive", title: "오류", description: "상태 변경 실패" });
    }
  };

  // 저장 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim()) {
      toast({ variant: "destructive", title: "필수 입력", description: "사건번호를 입력해주세요." });
      return;
    }
    if (!title.trim()) {
      toast({ variant: "destructive", title: "필수 입력", description: "물건명을 입력해주세요." });
      return;
    }
    if (!imageUrl.trim()) {
      toast({ variant: "destructive", title: "필수 입력", description: "대표 이미지를 등록해주세요." });
      return;
    }

    const payload = {
      caseNumber,
      court,
      propertyType,
      title,
      address,
      district,
      landArea: landArea || null,
      buildingArea: buildingArea || null,
      appraisalPrice,
      minimumPrice,
      deposit,
      discountRate: Number(discountRate),
      auctionDate,
      status,
      safetyRating,
      expertComment: expertComment || null,
      imageUrl,
      youtubeUrl: youtubeUrl || null,
      featured,
    };

    if (editingAuction) {
      updateMutation.mutate({ id: editingAuction.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Description & Action */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-amber-500/30">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-amber-400/30">
            <Gavel className="w-3.5 h-3.5" />
            강화군 유일 법원 정식 등록 공인중개사 입찰대리
          </div>
          <h2 className="text-2xl font-black tracking-tight">법원 경매·공매 물건 관리</h2>
          <p className="text-sm text-slate-300">
            인천지방법원 경매 물건을 등록하면 메인 화면의 [반값 경매·공매] 탭에 즉시 노출됩니다.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            새로고침
          </Button>
          <Button
            onClick={() => openModal()}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/30"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            새 경매물건 등록
          </Button>
        </div>
      </div>

      {/* Auction List Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">데이터를 불러오는 중입니다...</div>
        ) : auctions.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
              <Gavel className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">등록된 경매 물건이 없습니다</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              새 경매물건 등록 버튼을 눌러 인천지방법원의 강화군 경매 추천 물건을 등록해보세요.
            </p>
            <Button onClick={() => openModal()} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> 첫 경매물건 등록하기
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4">대표사진</th>
                  <th className="p-4">사건번호 / 법원</th>
                  <th className="p-4">물건명 / 주소</th>
                  <th className="p-4">감정가 / 최저입찰가</th>
                  <th className="p-4">매각기일</th>
                  <th className="p-4">안전도</th>
                  <th className="p-4">진행상태</th>
                  <th className="p-4 text-center">메인노출</th>
                  <th className="p-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auctions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <img
                        src={item.imageUrl || "/assets/default-property-images/house.png"}
                        alt=""
                        className="w-16 h-12 rounded-xl object-cover border border-slate-200"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{item.caseNumber}</div>
                      <div className="text-xs text-slate-400">{item.court}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-800 line-clamp-1">{item.title}</div>
                      <div className="text-xs text-slate-400 line-clamp-1">{item.address}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-slate-400 line-through">{item.appraisalPrice}</div>
                      <div className="font-extrabold text-rose-600 flex items-center gap-1.5">
                        <span>{item.minimumPrice}</span>
                        {item.discountRate ? (
                          <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                            -{item.discountRate}%
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{item.auctionDate.split(' ')[0]}</div>
                      <div className="text-xs text-amber-600 font-semibold">{item.auctionDate.split(' ')[1] || ""}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        {item.safetyRating || "안전"}
                      </span>
                    </td>
                    <td className="p-4">
                      <Select
                        value={item.status}
                        onValueChange={(val) => handleQuickStatusChange(item.id, val)}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs font-bold rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="진행중">진행중</SelectItem>
                          <SelectItem value="낙찰">낙찰</SelectItem>
                          <SelectItem value="유찰">유찰</SelectItem>
                          <SelectItem value="변경">변경</SelectItem>
                          <SelectItem value="취하">취하</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${item.featured ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(item)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`'${item.caseNumber}' 경매 물건을 삭제하시겠습니까?`)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-amber-500" />
              <span>{editingAuction ? "경매 물건 수정" : "새 법원 경매·공매 물건 등록"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* 1. 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">사건번호 *</Label>
                <Input
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="예: 2024타경 12345"
                  className="mt-1 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">관할 법원</Label>
                <Input
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">물건 종류</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="토지">토지 (전·답·임야)</SelectItem>
                    <SelectItem value="주택">전원주택 / 단독주택</SelectItem>
                    <SelectItem value="농가주택">농가주택</SelectItem>
                    <SelectItem value="상가">상가 / 점포 / 빌딩</SelectItem>
                    <SelectItem value="기타">기타 부동산</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">읍/면 지역</Label>
                <Input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="예: 길상면, 화도면, 강화읍"
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">물건명 (제목) *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: [2회유찰 반값] 화도면 바다조망 전원주택"
                className="mt-1 rounded-xl"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">소재지 상세주소 *</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 인천광역시 강화군 화도면 사기리 123"
                className="mt-1 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700">토지면적</Label>
                <Input
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  placeholder="예: 495㎡ (150평)"
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">건물면적</Label>
                <Input
                  value={buildingArea}
                  onChange={(e) => setBuildingArea(e.target.value)}
                  placeholder="예: 99㎡ (30평)"
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            {/* 2. 가격 및 유찰 자동 계산기 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                  ⚡ 스마트 유찰 가격 계산기
                </span>
                <span className="text-[11px] text-amber-700">인천지방법원 기준 (유찰시 30% 저감)</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label className="text-[11px] font-bold text-slate-700">감정평가액 (숫자만 입력)</Label>
                  <Input
                    type="number"
                    value={appraisalPriceRaw || ""}
                    onChange={(e) => setAppraisalPriceRaw(Number(e.target.value))}
                    placeholder="예: 300000000 (3억원)"
                    className="mt-1 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">유찰 차수</Label>
                  <Select onValueChange={handleCalculateDiscount}>
                    <SelectTrigger className="mt-1 rounded-xl bg-white">
                      <SelectValue placeholder="차수 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">신건 (100%)</SelectItem>
                      <SelectItem value="1">1회 유찰 (70%)</SelectItem>
                      <SelectItem value="2">2회 유찰 (49%)</SelectItem>
                      <SelectItem value="3">3회 유찰 (34%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">표시 감정가</Label>
                  <Input
                    value={appraisalPrice}
                    onChange={(e) => setAppraisalPrice(e.target.value)}
                    className="mt-0.5 rounded-lg bg-white text-xs"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">최저입찰가</Label>
                  <Input
                    value={minimumPrice}
                    onChange={(e) => setMinimumPrice(e.target.value)}
                    className="mt-0.5 rounded-lg bg-white text-xs font-bold text-rose-600"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">보증금 (10%)</Label>
                  <Input
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className="mt-0.5 rounded-lg bg-white text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 3. 기일 및 상태 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">매각기일 (YYYY-MM-DD HH:mm) *</Label>
                <Input
                  value={auctionDate}
                  onChange={(e) => setAuctionDate(e.target.value)}
                  placeholder="2026-10-15 10:00"
                  className="mt-1 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">진행 상태</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="진행중">진행중</SelectItem>
                    <SelectItem value="낙찰">낙찰</SelectItem>
                    <SelectItem value="유찰">유찰</SelectItem>
                    <SelectItem value="변경">변경</SelectItem>
                    <SelectItem value="취하">취하</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">권리분석 안전도</Label>
                <Select value={safetyRating} onValueChange={setSafetyRating}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="안전">안전 (특수권리 없음)</SelectItem>
                    <SelectItem value="상담필요">상담필요 (협의요망)</SelectItem>
                    <SelectItem value="주의">주의 (전문분석 필수)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 4. 이가이버 전문가 코멘트 */}
            <div>
              <Label className="text-xs font-bold text-slate-700">이가이버 전문가 권리분석 한줄평</Label>
              <Textarea
                value={expertComment}
                onChange={(e) => setExpertComment(e.target.value)}
                placeholder="예: 말소기준등기 이후 모든 근저당 소멸되며, 대항력 있는 임차인 없어 인수보증금 0원인 매우 안전한 물건입니다."
                rows={2}
                className="mt-1 rounded-xl"
              />
            </div>

            {/* 5. 사진 업로드 */}
            <div>
              <Label className="text-xs font-bold text-slate-700">대표 사진 등록 *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="이미지 URL을 입력하거나 파일을 업로드하세요"
                  className="rounded-xl flex-1"
                  required
                />
                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1 border border-slate-200">
                  <Image className="w-4 h-4" />
                  <span>{isUploading ? "업로드 중..." : "파일 선택"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              {imageUrl && (
                <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-slate-200">
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* 6. 유튜브 링크 & 메인 추천 */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <Label className="text-xs font-bold text-slate-700">현장 답사 유튜브 링크 (선택)</Label>
                <Input
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className="mt-1 rounded-xl"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 mt-5">
                <div>
                  <div className="text-xs font-bold text-slate-800">메인 화면 추천 노출</div>
                  <div className="text-[10px] text-slate-400">메인 [반값 경매] 탭 최우선 노출</div>
                </div>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                취소
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl px-6"
              >
                {editingAuction ? "수정 완료" : "경매 물건 등록하기"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
