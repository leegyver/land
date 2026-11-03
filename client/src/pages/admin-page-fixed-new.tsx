import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Modular Components
import { useAdminQuery } from "@/components/admin/AdminShared";
import { ImportFromSheetModal } from "@/components/admin/ImportFromSheetModal";
import AdminNotifications from "@/components/admin/AdminNotifications";

// 탭 지연 로딩 (초기 번들 크기 대폭 감소 및 진입 속도 최적화)
const AdminPropertyTab = lazy(() => import("@/components/admin/tabs/AdminPropertyTab"));
const AdminNewsTab = lazy(() => import("@/components/admin/tabs/AdminNewsTab"));
const AdminUsersTab = lazy(() => import("@/components/admin/tabs/AdminUsersTab"));
const AdminNewsletterTab = lazy(() => import("@/components/admin/tabs/AdminNewsletterTab"));
const AdminBannerTab = lazy(() => import("@/components/admin/tabs/AdminBannerTab"));
const AdminPopupTab = lazy(() => import("@/components/admin/tabs/AdminPopupTab"));
const AdminAuctionsTab = lazy(() => import("@/components/admin/tabs/AdminAuctionsTab"));
const AdminCareTab = lazy(() => import("@/components/admin/AdminCareTab"));

const TabLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
    <p className="text-sm font-medium">화면을 불러오는 중입니다...</p>
  </div>
);

// Types
import { Property, News, User, NewsletterSubscription } from "@shared/schema";

export default function AdminPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("properties");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 방문한 탭만 추적하여 필요 시에만 백엔드 API 요청 (초기 진입 부하 대폭 감소)
  // 기본적으로 '매물 관리'만 로드하며, 무거운 '통계'는 클릭 시에만 지연 로드
  const [visitedTabs, setVisitedTabs] = useState<string[]>(() => ["properties"]);

  // URL의 ?tab= 파라미터를 읽어 활성 탭 동기화
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab");
    const targetTab = tabParam || "properties";
    setActiveTab(targetTab);
    setVisitedTabs(prev => prev.includes(targetTab) ? prev : [...prev, targetTab]);
  }, [location, user]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setVisitedTabs(prev => prev.includes(newTab) ? prev : [...prev, newTab]);
  };

  // 모바일 가로 스크롤 시 선택된 탭이 뷰포트 내에 잘 보이도록 자동 스크롤
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeTabEl = document.querySelector(`[role="tab"][data-state="active"]`);
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // 해당 탭을 열었을 때만 쿼리 활성화 (불필요한 동시 호출 방지)
  const { 
    data: properties = [], 
    isLoading: isLoadingProperties, 
    isError: isErrorProperties, 
    error: errorProperties, 
    refetch: refetchProperties 
  } = useAdminQuery<Property>(["/api/admin/properties"], { 
    enabled: visitedTabs.includes("properties") 
  });

  const { 
    data: news = [], 
    isLoading: isLoadingNews, 
    isError: isErrorNews, 
    error: errorNews, 
    refetch: refetchNews 
  } = useAdminQuery<News>(["/api/news"], { 
    enabled: visitedTabs.includes("news") 
  });

  const { 
    data: users = [], 
    isLoading: isLoadingUsers, 
    isError: isErrorUsers, 
    error: errorUsers, 
    refetch: refetchUsers 
  } = useAdminQuery<User>(["/api/admin/users"], { 
    enabled: visitedTabs.includes("users") && ["admin", "master"].includes(user?.role as string) 
  });

  const {
    data: subscriptions = [],
    isLoading: isLoadingSubs,
    isError: isErrorSubs,
    error: errorSubs,
    refetch: refetchSubs
  } = useAdminQuery<NewsletterSubscription>(["/api/admin/newsletter"], { 
    enabled: visitedTabs.includes("newsletter") && ["admin", "master"].includes(user?.role as string) 
  });

  const { toast } = useToast();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  // 전역 백그라운드 폴링(알림 5초 주기 등)과 분리하여 실제 새로고침 시에만 동기화 중 표시
  const isRefreshing = isManualRefreshing;

  // 현재 활성화된 탭에 맞춰 효율적으로 데이터 새로고침
  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      // 1. 백엔드 메모리 캐시 강제 무효화
      await apiRequest("POST", "/api/admin/clear-cache").catch((cacheErr) => {
        console.warn("Backend cache clear notice:", cacheErr);
      });

      // 2. 현재 활성화된 탭에 맞춰 쿼리 강제 재조회 (predicate 매칭)
      if (activeTab === "stats") {
        await queryClient.refetchQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === "string" && key.startsWith("/api/admin/stats");
          },
        });
      } else if (activeTab === "properties") {
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["/api/admin/properties"] }),
          queryClient.invalidateQueries({
            predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/properties"),
          }),
        ]);
      } else if (activeTab === "news") {
        await queryClient.refetchQueries({
          predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/news"),
        });
      } else if (activeTab === "users") {
        await queryClient.refetchQueries({ queryKey: ["/api/admin/users"] });
      } else if (activeTab === "newsletter") {
        await queryClient.refetchQueries({
          predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/admin/newsletter"),
        });
      } else if (activeTab === "auctions") {
        await queryClient.refetchQueries({
          predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/auctions"),
        });
      } else if (activeTab === "config") {
        await queryClient.refetchQueries({ queryKey: ["/api/admin/config"] });
      } else if (activeTab === "banners") {
        await queryClient.refetchQueries({
          predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/banners"),
        });
      } else if (activeTab === "popups") {
        await queryClient.refetchQueries({
          predicate: (query) => typeof query.queryKey[0] === "string" && (query.queryKey[0].startsWith("/api/admin/popups") || query.queryKey[0].startsWith("/api/popups")),
        });
      } else {
        await queryClient.refetchQueries({
          predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api"),
        });
      }

      toast({
        title: "새로고침 완료",
        description: "최신 데이터가 성공적으로 반영되었습니다.",
      });
    } catch (error: any) {
      console.error("Refresh failed:", error);
      toast({
        title: "새로고침 실패",
        description: error.message || "데이터를 새로고침하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsManualRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto py-4 sm:py-8 md:py-10 px-3 sm:px-4 min-h-screen pb-24 max-w-7xl overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1">Admin Portal</Badge>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-400 font-medium">관리자 전용 제어센터</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-1.5 sm:mb-2">대시보드</h1>
          <p className="text-slate-500 max-w-lg">강화도의 소중한 매물과 소식을 정교하게 관리하세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {(user?.role === "admin" || user?.role === "master") && (
            <Link
              href="/admin/stats"
              className="rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <span>통계 분석실</span>
            </Link>
          )}
          <AdminNotifications />
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '데이터 동기화 중...' : '데이터 새로고침'}
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        {/* Tabs: 2-col on mobile portrait, 4-col on landscape, row on wide screen. Zero horizontal scroll. */}
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-row gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner h-auto w-full lg:w-auto max-w-full overflow-hidden">
          <TabsTrigger value="properties" className="rounded-xl px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 h-10 sm:h-11 lg:h-12 font-bold transition-all text-xs sm:text-xs md:text-sm text-center flex items-center justify-center whitespace-nowrap touch-manipulation truncate">부동산 매물 관리</TabsTrigger>
          {(user?.role === "admin" || user?.role === "master") && (
            <>
              <TabsTrigger value="care" className="rounded-xl px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 h-10 sm:h-11 lg:h-12 font-bold transition-all text-xs sm:text-xs md:text-sm text-center flex items-center justify-center whitespace-nowrap touch-manipulation truncate text-orange-950 bg-orange-100/80 data-[state=active]:bg-orange-500 data-[state=active]:text-white">🛠️ 토탈케어 접수</TabsTrigger>
              <TabsTrigger value="auctions" className="rounded-xl px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 h-10 sm:h-11 lg:h-12 font-bold transition-all text-xs sm:text-xs md:text-sm text-center flex items-center justify-center whitespace-nowrap touch-manipulation truncate text-amber-900 bg-amber-100/60 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950">🔨 경매·공매 관리</TabsTrigger>
              <TabsTrigger value="news" className="rounded-xl px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 h-10 sm:h-11 lg:h-12 font-bold transition-all text-xs sm:text-xs md:text-sm text-center flex items-center justify-center whitespace-nowrap touch-manipulation truncate">뉴스 소식</TabsTrigger>
              <TabsTrigger value="newsletter" className="rounded-xl px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 h-10 sm:h-11 lg:h-12 font-bold transition-all text-xs sm:text-xs md:text-sm text-center flex items-center justify-center whitespace-nowrap touch-manipulation truncate">구독자 관리</TabsTrigger>
              <TabsTrigger value="banners" className="rounded-xl px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 h-10 sm:h-11 lg:h-12 font-bold transition-all text-xs sm:text-xs md:text-sm text-center flex items-center justify-center whitespace-nowrap touch-manipulation truncate">배너 관리</TabsTrigger>
              <TabsTrigger value="popups" className="rounded-xl px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 h-10 sm:h-11 lg:h-12 font-bold transition-all text-xs sm:text-xs md:text-sm text-center flex items-center justify-center whitespace-nowrap touch-manipulation truncate">팝업 관리</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl px-1.5 sm:px-2 md:px-3 py-2 sm:py-2.5 h-10 sm:h-11 lg:h-12 font-bold transition-all text-xs sm:text-xs md:text-sm text-center flex items-center justify-center whitespace-nowrap touch-manipulation truncate">사용자 권한</TabsTrigger>
            </>
          )}
        </TabsList>

        <Suspense fallback={<TabLoadingFallback />}>
          <TabsContent value="properties" className="mt-0 focus-visible:outline-none">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="p-4 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">부동산 매물 관리</h2>
                <div className="flex gap-2 w-full md:w-auto">
                  {(user?.role === "admin" || user?.role === "master") && (
                    <Button variant="outline" size="sm" className="rounded-xl flex-1 md:flex-none" onClick={() => setIsImportModalOpen(true)}>스프레드시트 로드</Button>
                  )}
                  {(["admin", "master"].includes(user?.role as string) || (user?.role === 'realtor' && ["monthly", "yearly", "approved", "lifetime"].includes(user?.subscriptionTier as string))) && (
                    <a href="/admin/properties/new" className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-bold shadow-lg shadow-primary/20 text-center flex-1 md:flex-none">새 매물 등록</a>
                  )}
                </div>
              </div>
              <div className="p-2 sm:p-4 md:p-6">
                <AdminPropertyTab properties={properties} isLoading={isLoadingProperties} isError={isErrorProperties} error={errorProperties} refetch={refetchProperties} />
              </div>
            </div>
          </TabsContent>

          {(user?.role === "admin" || user?.role === "master") && (
            <>
              <TabsContent value="care" className="mt-0">
                <AdminCareTab />
              </TabsContent>

              <TabsContent value="auctions" className="mt-0">
                <AdminAuctionsTab />
              </TabsContent>

              <TabsContent value="news" className="mt-0">
                <AdminNewsTab news={news} isLoading={isLoadingNews} isError={isErrorNews} error={errorNews} refetch={refetchNews} />
              </TabsContent>

              <TabsContent value="newsletter" className="mt-0">
                <AdminNewsletterTab subscriptions={subscriptions} isLoading={isLoadingSubs} isError={isErrorSubs} error={errorSubs} refetch={refetchSubs} />
              </TabsContent>

              <TabsContent value="banners" className="mt-0">
                <AdminBannerTab />
              </TabsContent>

              <TabsContent value="popups" className="mt-0">
                <AdminPopupTab />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <AdminUsersTab users={users} currentUser={user} isLoading={isLoadingUsers} isError={isErrorUsers} error={errorUsers} refetch={refetchUsers} />
              </TabsContent>
            </>
          )}
        </Suspense>
      </Tabs>

      <ImportFromSheetModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  );
}