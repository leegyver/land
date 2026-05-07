import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from "recharts";
import { Users, Eye, Home, MessageSquare, TrendingUp, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

export default function AdminStatsTab() {
  const { data: overview, isLoading: isLoadingOverview } = useQuery<any>({
    queryKey: ["/api/admin/stats/overview"],
  });

  const { data: dailyStats, isLoading: isLoadingDaily } = useQuery<any[]>({
    queryKey: ["/api/admin/stats/daily", { days: 14 }],
  });

  const { data: popular, isLoading: isLoadingPopular } = useQuery<any>({
    queryKey: ["/api/admin/stats/popular"],
  });

  if (isLoadingOverview || isLoadingDaily || isLoadingPopular) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  const statCards = [
    { 
      title: "오늘 방문자", 
      value: overview?.todayVisitors || 0, 
      icon: Users, 
      color: "text-blue-600", 
      bgColor: "bg-blue-50",
      description: "오늘 접속한 고유 방문자 수"
    },
    { 
      title: "누적 방문자", 
      value: overview?.totalVisitors || 0, 
      icon: TrendingUp, 
      color: "text-emerald-600", 
      bgColor: "bg-emerald-50",
      description: "전체 기간 고유 방문자 수"
    },
    { 
      title: "전체 매물", 
      value: overview?.totalProperties || 0, 
      icon: Home, 
      color: "text-orange-600", 
      bgColor: "bg-orange-50",
      description: "현재 등록된 총 매물 수"
    },
    { 
      title: "고객 문의", 
      value: overview?.totalInquiries || 0, 
      icon: MessageSquare, 
      color: "text-purple-600", 
      bgColor: "bg-purple-50",
      description: "전체 고객 상담 문의 건수"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
                  <h3 className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</h3>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visitor Trend Chart */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">방문자 추이</CardTitle>
                <CardDescription>최근 14일간의 일별 방문자 및 조회수 현황</CardDescription>
              </div>
              <div className="flex gap-4 text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5 text-blue-500">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 방문자
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" /> 조회수
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
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
                <Area 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVisitors)" 
                  name="방문자"
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#cbd5e1" 
                  strokeWidth={2}
                  fill="transparent" 
                  name="조회수"
                  strokeDasharray="5 5"
                />
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
              <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">실시간 인기 매물</h4>
              <div className="space-y-4">
                {popular?.properties?.map((item: any, i: number) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-300 w-4">{i + 1}</span>
                      <p className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-primary transition-colors cursor-default">
                        {item.title}
                      </p>
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
              <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">실시간 인기 게시글</h4>
              <div className="space-y-4">
                {popular?.posts?.map((item: any, i: number) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-300 w-4">{i + 1}</span>
                      <p className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-primary transition-colors cursor-default">
                        {item.title}
                      </p>
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
    </div>
  );
}
