import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { BarChart3, TrendingUp, Users, Eye, ArrowUpRight, ArrowDownRight, Home, UserPlus, Award, Mail, Send, Smartphone, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminStatsTab() {
  const [metric, setMetric] = useState<"both" | "visitors" | "views">("both");
  const { toast } = useToast();

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

  if (isLoadingOverview || isLoadingDaily || isLoadingPopular || isLoadingDetailed) {
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
          <CardHeader className="p-8 pb-2">
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
          <CardContent className="p-8 h-[350px]">
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
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              인기 콘텐츠
            </CardTitle>
            <CardDescription>가장 많이 본 매물과 게시글</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
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
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-lg font-bold text-slate-900">매물 유형별 분포</CardTitle>
            <CardDescription>전체 매물의 카테고리별 비중</CardDescription>
          </CardHeader>
          <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
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
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-slate-400" />
              기기별 접속
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4">
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
          <CardHeader className="p-8 pb-2">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-400" />
              유입 경로 (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="space-y-4">
              {detailed?.topReferrers?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">{item.referer}</span>
                  <span className="text-xs font-medium text-slate-400">{item.count.toLocaleString()}회</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
