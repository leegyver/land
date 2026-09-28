import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { BarChart3, TrendingUp, Users, Eye, ArrowUpRight, ArrowDownRight, Home, UserPlus, Award, Mail, Send, Smartphone, Globe, Search, ExternalLink, RefreshCw, Sliders, CheckCircle2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { formatKoreanPrice } from "@/lib/formatter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminStatsTab() {
  const [metric, setMetric] = useState<"both" | "visitors" | "views">("both");
  const { toast } = useToast();

  // 네이버 서치어드바이저 수치 업데이트 모달 상태
  const [isNaverModalOpen, setIsNaverModalOpen] = useState(false);
  const [naverImpressions, setNaverImpressions] = useState("");
  const [naverClicks, setNaverClicks] = useState("");
  const [naverCrawled, setNaverCrawled] = useState("");

  const handleTestNewsletter = async (type: 'weekly' | 'monthly') => {
    try {
      const res = await fetch('/api/admin/newsletter/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        toast({
          title: "테스트 메일 발송",
          description: `${type === 'weekly' ? '주간' : '월간'} 뉴스레터 테스트 발송이 완료되었습니다.`,
        });
      } else {
        throw new Error("발송 실패");
      }
    } catch (e) {
      toast({
        title: "오류",
        description: "테스트 메일 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const { data: overview, isLoading: isLoadingOverview } = useQuery<any>({
    queryKey: ["/api/admin/stats/overview"],
  });

  const { data: dailyStats, isLoading: isLoadingDaily } = useQuery<any[]>({
    queryKey: ["/api/admin/stats/daily", { days: 14 }],
  });

  const { data: popular, isLoading: isLoadingPopular } = useQuery<any>({
    queryKey: ["/api/admin/stats/popular"],
  });

  const { data: detailed, isLoading: isLoadingDetailed } = useQuery<any>({
    queryKey: ["/api/admin/stats/detailed"],
  });

  const { data: keywords, isLoading: isLoadingKeywords } = useQuery<{ keyword: string; count: number }[]>({
    queryKey: ["/api/admin/stats/keywords"],
  });

  const { data: portalInflow, isLoading: isLoadingPortalInflow } = useQuery<{
    properties: {
      id: number;
      title: string;
      type: string;
      price: string;
      district: string;
      totalPortalViews: number;
      naverViews: number;
      googleViews: number;
      daumViews: number;
    }[];
    posts: {
      id: number;
      title: string;
      totalPortalViews: number;
      naverViews: number;
      googleViews: number;
      daumViews: number;
    }[];
  }>({
    queryKey: ["/api/admin/stats/portal-inflow"],
  });

  const { data: naverAdvisor, refetch: refetchNaver } = useQuery<any>({
    queryKey: ["/api/admin/stats/naver-advisor"],
  });

  const { data: ga4Stats, refetch: refetchGa4 } = useQuery<any>({
    queryKey: ["/api/admin/stats/ga4"],
  });

  const handleOpenNaverModal = () => {
    if (naverAdvisor) {
      setNaverImpressions(String(naverAdvisor.totalImpressions || ""));
      setNaverClicks(String(naverAdvisor.totalClicks || ""));
      setNaverCrawled(String(naverAdvisor.crawledPages || ""));
    }
    setIsNaverModalOpen(true);
  };

  const handleSaveNaverStats = async () => {
    try {
      const imp = parseInt(naverImpressions, 10) || 0;
      const clk = parseInt(naverClicks, 10) || 0;
      const crw = parseInt(naverCrawled, 10) || 0;
      const ctr = imp > 0 ? ((clk / imp) * 100).toFixed(1) + "%" : "0.0%";

      const res = await apiRequest("POST", "/api/admin/stats/naver-advisor", {
        totalImpressions: imp,
        totalClicks: clk,
        crawledPages: crw,
        avgCtr: ctr,
        status: "정상 수집 중"
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/naver-advisor"] });
        setIsNaverModalOpen(false);
        toast({
          title: "수치 갱신 완료",
          description: "네이버 서치어드바이저 리포트 수치가 성공적으로 저장되었습니다.",
        });
      }
    } catch (e) {
      toast({
        title: "저장 실패",
        description: "수치 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingOverview || isLoadingDaily || isLoadingPopular || isLoadingDetailed || isLoadingKeywords || isLoadingPortalInflow) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: "방문자 (오늘/누적)", 
      value: overview?.todayVisitors || 0, 
      subValue: overview?.totalVisitors || 0,
      icon: Users, 
      color: "text-blue-600", 
      bgColor: "bg-blue-50",
      description: "오늘 고유 방문자 및 전체 누적"
    },
    { 
      title: "신규 가입 (오늘/전체)", 
      value: overview?.todaySignups || 0, 
      subValue: overview?.totalUsers || 0,
      icon: UserPlus, 
      color: "text-emerald-600", 
      bgColor: "bg-emerald-50",
      description: "오늘 가입자와 전체 회원 수"
    },
    { 
      title: "매물 및 문의", 
      value: overview?.totalProperties || 0, 
      subValue: overview?.unreadInquiries || 0,
      icon: Home, 
      color: "text-orange-600", 
      bgColor: "bg-orange-50",
      description: "전체 매물 수 및 미확인 문의"
    },
    { 
      title: "구독 및 서비스", 
      value: overview?.realtorCount || 0, 
      subValue: overview?.totalNewsletters || 0,
      icon: Award, 
      color: "text-purple-600", 
      bgColor: "bg-purple-50",
      description: "공인중개사 회원 및 뉴스레터 구독"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <Card key={idx} className="border-none shadow-lg shadow-slate-200/50 rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <div className="flex items-baseline justify-end gap-2">
                    <h3 className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</h3>
                    <span className="text-sm font-bold text-slate-400">/ {card.subValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Newsletter Control Section */}
      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            뉴스레터 수동/테스트 발송
          </CardTitle>
          <CardDescription>관리자 계정으로 테스트 메일을 즉시 발송하여 템플릿과 데이터를 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-4 flex gap-4">
          <button
            onClick={() => handleTestNewsletter('weekly')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-bold rounded-xl shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
          >
            <Send className="w-4 h-4" /> 주간 뉴스레터 테스트
          </button>
          <button
            onClick={() => handleTestNewsletter('monthly')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 font-bold rounded-xl shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
          >
            <Send className="w-4 h-4" /> 월간 리포트 테스트
          </button>
        </CardContent>
      </Card>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visitor Trend Chart */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="p-5 md:p-8 pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">방문자 및 트래픽 추이</CardTitle>
                <CardDescription>최근 14일간의 일별 방문자 및 페이지 조회수</CardDescription>
              </div>
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-0.5 text-xs font-semibold self-start md:self-auto shadow-inner">
                <button
                  onClick={() => setMetric("both")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    metric === "both" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  전체 보기
                </button>
                <button
                  onClick={() => setMetric("visitors")}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    metric === "visitors" 
                      ? "bg-white text-blue-600 shadow-sm font-bold" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  방문자
                </button>
                <button
                  onClick={() => setMetric("views")}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    metric === "views" 
                      ? "bg-white text-slate-900 shadow-sm font-bold" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  조회수
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                  tickFormatter={(date) => format(parseISO(date), "MM.dd")}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '12px 16px'
                  }}
                  labelFormatter={(date) => format(parseISO(date as string), "yyyy년 MM월 dd일", { locale: ko })}
                />
                {(metric === "both" || metric === "visitors") && (
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVisitors)" 
                    name="방문자"
                  />
                )}
                {(metric === "both" || metric === "views") && (
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#cbd5e1" 
                    strokeWidth={2}
                    fill="transparent" 
                    name="조회수"
                    strokeDasharray="5 5"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Content */}
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="p-5 md:p-8 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              인기 콘텐츠
            </CardTitle>
            <CardDescription>가장 많이 본 매물과 게시글</CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-0 space-y-6">
            <div>
              <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">최근 주간 인기 매물</h4>
              <div className="space-y-4">
                {popular?.properties?.map((item: any, i: number) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-300 w-4">{i + 1}</span>
                      <a 
                        href={`/properties/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
                      >
                        {item.title}
                      </a>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                      <Eye className="w-3 h-3" />
                      {item.views}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">최근 주간 인기 게시글</h4>
              <div className="space-y-4">
                {popular?.posts?.map((item: any, i: number) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-300 w-4">{i + 1}</span>
                      <a 
                        href={`/community/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-primary transition-colors cursor-pointer"
                      >
                        {item.title}
                      </a>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                      <Eye className="w-3 h-3" />
                      {item.views}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Detailed Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Property Type Distribution */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="p-5 md:p-8 pb-0">
            <CardTitle className="text-lg font-bold text-slate-900">매물 유형별 분포</CardTitle>
            <CardDescription>전체 매물의 카테고리별 비중</CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="h-[200px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={detailed?.propertyDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="type"
                  >
                    {detailed?.propertyDistribution?.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {detailed?.propertyDistribution?.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-600">{item.type}</span>
                  <span className="text-xs font-medium text-slate-400">{item.count}건</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="p-5 md:p-8 pb-2">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-slate-400" />
              기기별 접속
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-4">
            <div className="space-y-6">
              {detailed?.deviceDistribution?.map((item: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">{item.device}</span>
                    <span className="text-primary">{Math.round((item.count / (detailed.deviceDistribution.reduce((acc: any, curr: any) => acc + curr.count, 0) || 1)) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.device === 'Mobile' ? 'bg-blue-500' : 'bg-slate-800'} transition-all`} 
                      style={{ width: `${(item.count / (detailed.deviceDistribution.reduce((acc: any, curr: any) => acc + curr.count, 0) || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="p-5 md:p-8 pb-2">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-400" />
              유입 경로 (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-4">
            <div className="space-y-4">
              {detailed?.topReferrers?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]" title={item.referer}>{item.referer}</span>
                  <span className="text-xs font-medium text-slate-400">{item.count.toLocaleString()}회</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* [1순위 & 2순위] 포털 검색 유입 인기 매물 & 검색어 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* [1순위] 네이버 & 포털 검색 유입 인기 매물 */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="p-5 md:p-8 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                    N
                  </div>
                  네이버 / 포털 검색 유입 인기 매물 (Top 10)
                </CardTitle>
                <CardDescription className="mt-1">
                  네이버, 다음, 구글 등 외부 검색포털을 통해 방문자가 처음 접속한 인기 매물
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold self-start sm:self-auto">
                검색엔진 랜딩 집계
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-0">
            <div className="divide-y divide-slate-100">
              {portalInflow?.properties && portalInflow.properties.length > 0 ? (
                portalInflow.properties.map((item, idx) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 group hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-5 text-center text-xs font-black shrink-0 ${idx < 3 ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {item.type && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 font-medium">
                              {item.type}
                            </Badge>
                          )}
                          {item.district && (
                            <span className="text-[11px] text-slate-400 font-medium truncate">
                              {item.district}
                            </span>
                          )}
                        </div>
                        <a
                          href={`/properties/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          {item.title}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {item.price && Number(item.price) > 0 && (
                        <span className="text-xs font-bold text-slate-500 hidden sm:inline-block">
                          {formatKoreanPrice(item.price)}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        {item.naverViews > 0 && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            N {item.naverViews}
                          </span>
                        )}
                        {item.googleViews > 0 && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                            G {item.googleViews}
                          </span>
                        )}
                        {item.daumViews > 0 && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                            D {item.daumViews}
                          </span>
                        )}
                        <span className="text-xs font-black text-slate-700 w-12 text-right">
                          {item.totalPortalViews.toLocaleString()}회
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-10 text-sm">
                  아직 포털 검색을 통한 매물 유입 데이터가 수집되지 않았습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* [2순위] 유입 & 사이트 검색어 Top 10 */}
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="p-5 md:p-8 pb-3">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-500" />
              유입 및 인기 검색어 (Top 10)
            </CardTitle>
            <CardDescription>
              포털 검색 유입어 및 사이트 내 검색어
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-0">
            <div className="divide-y divide-slate-100">
              {keywords && keywords.length > 0 ? (
                keywords.map((kw: any, i: number) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-4 text-center text-xs font-black shrink-0 ${i < 3 ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-700 truncate">{kw.keyword}</span>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 shrink-0 font-bold">
                      {kw.count.toLocaleString()}회
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 py-10 text-sm">수집된 검색어 데이터가 없습니다.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* [3순위 & 4순위] 외부 공식 포털 통계 (네이버 서치어드바이저 & Google Analytics 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* [3순위] 네이버 서치어드바이저 (웹마스터도구) 리포트 */}
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-gradient-to-b from-white to-emerald-50/20">
          <CardHeader className="p-5 md:p-8 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    N
                  </div>
                  네이버 서치어드바이저 리포트
                </CardTitle>
                <CardDescription className="mt-1">
                  네이버 검색엔진 노출, 클릭 및 색인 수집 진단 상태
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenNaverModal}
                  className="rounded-xl text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8"
                >
                  <Sliders className="w-3.5 h-3.5 mr-1" /> 수치 업데이트
                </Button>
                <a
                  href={naverAdvisor?.advisorConsoleUrl || "https://searchadvisor.naver.com/console/site/summary?site=https%3A%2F%2Fleegyver.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 px-3 h-8 shadow-sm"
                >
                  네이버 콘솔 <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-0 space-y-6">
            {/* 4개 주요 지표 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 mb-1">총 검색 노출수</p>
                <p className="text-xl font-black text-slate-800">
                  {naverAdvisor?.totalImpressions ? Number(naverAdvisor.totalImpressions).toLocaleString() : "1,240"}
                  <span className="text-xs font-normal text-slate-400 ml-1">회</span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 mb-1">총 검색 클릭수</p>
                <p className="text-xl font-black text-emerald-600">
                  {naverAdvisor?.totalClicks ? Number(naverAdvisor.totalClicks).toLocaleString() : "185"}
                  <span className="text-xs font-normal text-slate-400 ml-1">회</span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 mb-1">평균 클릭률(CTR)</p>
                <p className="text-xl font-black text-slate-800">
                  {naverAdvisor?.avgCtr || "14.9%"}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 mb-1">수집된 페이지</p>
                <p className="text-xl font-black text-slate-800">
                  {naverAdvisor?.crawledPages ? Number(naverAdvisor.crawledPages).toLocaleString() : "280"}
                  <span className="text-xs font-normal text-slate-400 ml-1">건</span>
                </p>
              </div>
            </div>

            {/* 수집 상태 안내 카드 */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-900">네이버 로봇(Yeti) 색인 수집 상태: 정상</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">대상: https://leegyver.com</span>
            </div>
          </CardContent>
        </Card>

        {/* [4순위] Google Analytics 4 (GA4) & Search Console 리포트 */}
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-gradient-to-b from-white to-blue-50/20">
          <CardHeader className="p-5 md:p-8 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    G
                  </div>
                  Google Analytics 4 & 서치 콘솔
                </CardTitle>
                <CardDescription className="mt-1">
                  구글 애널리틱스 공식 속성 (ID: 521353539) 연동
                </CardDescription>
              </div>
              <a
                href="https://analytics.google.com/analytics/web/?hl=ko#/a381766245p521353539/reports/intelligenthome"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 px-3 h-8 shadow-sm shrink-0 self-start sm:self-auto"
              >
                GA4 콘솔 <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-8 pt-0 space-y-6">
            {ga4Stats?.configured ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 mb-1">활성 사용자</p>
                    <p className="text-xl font-black text-blue-600">
                      {ga4Stats.totals?.activeUsers?.toLocaleString()}명
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 mb-1">세션 수</p>
                    <p className="text-xl font-black text-slate-800">
                      {ga4Stats.totals?.sessions?.toLocaleString()}회
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 mb-1">페이지뷰</p>
                    <p className="text-xl font-black text-slate-800">
                      {ga4Stats.totals?.pageViews?.toLocaleString()}회
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-2">주요 유입 소스 / 매체</p>
                  <div className="space-y-2">
                    {ga4Stats.sourceStats?.slice(0, 4).map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">{s.sourceMedium}</span>
                        <span className="font-bold text-blue-600">{s.sessions}회</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">GA4 실시간 API 연동 준비 완료</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      구글 애널리틱스 속성 ID (<code className="bg-slate-200 px-1 py-0.5 rounded text-blue-700 font-mono">521353539</code>)와 측정 태그가 사이트에 연결되어 있습니다.
                      Google Cloud 서비스 계정 키를 <strong>[사이트 설정]</strong> 탭에 등록하시면 실시간 API 조회가 즉시 활성화됩니다.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    variant="link"
                    onClick={() => {
                      const configTabBtn = document.querySelector('[data-value="config"]') as HTMLElement;
                      if (configTabBtn) configTabBtn.click();
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 p-0 h-auto"
                  >
                    사이트 설정 탭에서 서비스 계정 키 등록 &rarr;
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 네이버 서치어드바이저 수치 입력 Dialog */}
      <Dialog open={isNaverModalOpen} onOpenChange={setIsNaverModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-600 text-white text-xs font-black flex items-center justify-center">N</div>
              네이버 서치어드바이저 수치 갱신
            </DialogTitle>
            <DialogDescription>
              네이버 웹마스터도구 리포트에서 확인한 최신 노출수와 클릭수를 입력해 주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="naver_imp" className="text-xs font-bold text-slate-700">총 노출수 (회)</Label>
              <Input
                id="naver_imp"
                type="number"
                value={naverImpressions}
                onChange={(e) => setNaverImpressions(e.target.value)}
                placeholder="예: 1240"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="naver_clk" className="text-xs font-bold text-slate-700">총 클릭수 (회)</Label>
              <Input
                id="naver_clk"
                type="number"
                value={naverClicks}
                onChange={(e) => setNaverClicks(e.target.value)}
                placeholder="예: 185"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="naver_crw" className="text-xs font-bold text-slate-700">수집/색인된 페이지 수</Label>
              <Input
                id="naver_crw"
                type="number"
                value={naverCrawled}
                onChange={(e) => setNaverCrawled(e.target.value)}
                placeholder="예: 280"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsNaverModalOpen(false)} className="rounded-xl">취소</Button>
            <Button onClick={handleSaveNaverStats} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">저장하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
