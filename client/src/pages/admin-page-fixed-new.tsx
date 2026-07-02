import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

// Modular Components
import { useAdminQuery } from "@/components/admin/AdminShared";
import { ImportFromSheetModal } from "@/components/admin/ImportFromSheetModal";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminPropertyTab from "@/components/admin/tabs/AdminPropertyTab";
import AdminNewsTab from "@/components/admin/tabs/AdminNewsTab";
import AdminUsersTab from "@/components/admin/tabs/AdminUsersTab";
import AdminNewsletterTab from "@/components/admin/tabs/AdminNewsletterTab";
import AdminStatsTab from "@/components/admin/tabs/AdminStatsTab";
import AdminConfigTab from "@/components/admin/tabs/AdminConfigTab";

import AdminBannerTab from "@/components/admin/tabs/AdminBannerTab";
import AdminPopupTab from "@/components/admin/tabs/AdminPopupTab";

// Types
import { Property, News, User, NewsletterSubscription } from "@shared/schema";

export default function AdminPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("stats");
  const [skipCache, setSkipCache] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // URL의 ?tab= 파라미터를 읽어 활성 탭 동기화
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (user && user.role !== "admin" && user.role !== "master") {
      setActiveTab("properties");
    }
  }, [location, user]);

  const { 
    data: properties = [], 
    isLoading: isLoadingProperties, 
    isError: isErrorProperties, 
    error: errorProperties, 
    refetch: refetchProperties 
  } = useAdminQuery<Property>(["/api/admin/properties", { skipCache }]);

  const { 
    data: news = [], 
    isLoading: isLoadingNews, 
    isError: isErrorNews, 
    error: errorNews, 
    refetch: refetchNews 
  } = useAdminQuery<News>(["/api/news"]);

  const { 
    data: users = [], 
    isLoading: isLoadingUsers, 
    isError: isErrorUsers, 
    error: errorUsers, 
    refetch: refetchUsers 
  } = useAdminQuery<User>(["/api/admin/users"], { enabled: ["admin", "master"].includes(user?.role as string) });

  const {
    data: subscriptions = [],
    isLoading: isLoadingSubs,
    isError: isErrorSubs,
    error: errorSubs,
    refetch: refetchSubs
  } = useAdminQuery<NewsletterSubscription>(["/api/admin/newsletter"], { enabled: ["admin", "master"].includes(user?.role as string) });

  const handleRefresh = () => {
    setSkipCache(true);
    refetchProperties();
    refetchNews();
    refetchUsers();
    refetchSubs();
  };

  return (
    <div className="container mx-auto py-10 px-4 min-h-screen pb-20 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1">Admin Portal</Badge>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-400 font-medium">관리자 전용 제어센터</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">대시보드</h1>
          <p className="text-slate-500 max-w-lg">강화도의 소중한 매물과 소식을 정교하게 관리하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          <AdminNotifications />
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            onClick={handleRefresh}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingProperties ? 'animate-spin' : ''}`} />
            데이터 새로고침
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 rounded-2xl border border-slate-200 shadow-inner h-14 w-full md:w-auto flex overflow-x-auto whitespace-nowrap">
          {(user?.role === "admin" || user?.role === "master") && (
            <TabsTrigger value="stats" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 h-full font-semibold transition-all">통계 요약</TabsTrigger>
          )}
          <TabsTrigger value="properties" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 h-full font-semibold transition-all">부동산 매물 관리</TabsTrigger>
          {(user?.role === "admin" || user?.role === "master") && (
            <>
              <TabsTrigger value="news" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 h-full font-semibold transition-all">뉴스 소식</TabsTrigger>
              <TabsTrigger value="newsletter" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 h-full font-semibold transition-all">구독자 관리</TabsTrigger>
              <TabsTrigger value="banners" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 h-full font-semibold transition-all">배너 관리</TabsTrigger>
              <TabsTrigger value="popups" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 h-full font-semibold transition-all">팝업 관리</TabsTrigger>
              <TabsTrigger value="users" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 h-full font-semibold transition-all">사용자 권한</TabsTrigger>
              <TabsTrigger value="config" className="flex-1 md:flex-none rounded-xl px-4 md:px-8 h-full font-semibold transition-all">사이트 설정</TabsTrigger>
            </>
          )}
        </TabsList>

        {(user?.role === "admin" || user?.role === "master") && (
          <TabsContent value="stats" className="mt-0">
            <AdminStatsTab />
          </TabsContent>
        )}

        <TabsContent value="properties" className="mt-0 focus-visible:outline-none">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
              <h2 className="text-2xl font-bold text-slate-900">부동산 매물 관리</h2>
              <div className="flex gap-2">
                {(user?.role === "admin" || user?.role === "master") && (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsImportModalOpen(true)}>스프레드시트 로드</Button>
                )}
                {(["admin", "master"].includes(user?.role as string) || (user?.role === 'realtor' && ["monthly", "yearly", "approved", "lifetime"].includes(user?.subscriptionTier as string))) && (
                  <a href="/admin/properties/new" className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-bold shadow-lg shadow-primary/20">새 매물 등록</a>
                )}
              </div>
            </div>
            <div className="p-8">
              <AdminPropertyTab properties={properties} isLoading={isLoadingProperties} isError={isErrorProperties} error={errorProperties} refetch={refetchProperties} />
            </div>
          </div>
        </TabsContent>


        {(user?.role === "admin" || user?.role === "master") && (
          <>

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

            <TabsContent value="config" className="mt-0">
              <AdminConfigTab />
            </TabsContent>
          </>
        )}
      </Tabs>

      <ImportFromSheetModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  );
}