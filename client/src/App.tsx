import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { SajuProvider } from "@/contexts/SajuContext";
import FloatingCTA from "@/components/layout/FloatingCTA";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import GlobalPopups from "@/components/common/GlobalPopups";
import { lazy, Suspense, useEffect } from "react";

// 코드 분할: 각 페이지를 필요할 때만 로드 (초기 번들 크기 대폭 감소)
const HomePage = lazy(() => import("@/pages/HomePage"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const PropertiesPage = lazy(() => import("@/pages/PropertiesPage"));
const PropertyDetailPage = lazy(() => import("@/pages/PropertyDetailPage"));
const AuctionsPage = lazy(() => import("@/pages/AuctionsPage"));
const NewsPage = lazy(() => import("@/pages/NewsPage"));
const NewsDetailPage = lazy(() => import("@/pages/NewsDetailPage"));
const ReviewsPage = lazy(() => import("@/pages/ReviewsPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const YoutubePage = lazy(() => import("@/pages/YoutubePage"));
const SajuPage = lazy(() => import("@/pages/SajuPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const ProfilePage = lazy(() => import("@/pages/profile-page-v2"));
const AdminPage = lazy(() => import("@/pages/admin-page-fixed-new"));
// @ts-ignore
const PropertyForm = lazy(() => import("@/pages/PropertyForm"));
const CommunityPage = lazy(() => import("@/pages/CommunityPage"));
const PostDetailPage = lazy(() => import("@/pages/PostDetailPage"));
const PostFormPage = lazy(() => import("@/pages/PostFormPage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const NotFound = lazy(() => import("@/pages/not-found"));
const RoadviewPopupPage = lazy(() => import("@/pages/RoadviewPopupPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));

// 페이지 로딩 중 표시할 최소한의 스켈레톤
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary"></div>
  </div>
);

function Router({ user }: { user: any }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/properties" component={PropertiesPage} />
        <Route path="/properties/:id" component={PropertyDetailPage} />
        <Route path="/auctions" component={AuctionsPage} />
        <Route path="/news" component={NewsPage} />
        <Route path="/news/:id" component={NewsDetailPage} />
        <Route path="/reviews" component={ReviewsPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/youtube" component={YoutubePage} />
        <Route path="/saju" component={SajuPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/admin">
          {() => (
            user ? (
              (["admin", "master"].includes(user.role) || (user.role === "realtor" && ["monthly", "yearly", "approved", "lifetime"].includes(user.subscriptionTier as string))) ? (
                <AdminPage />
              ) : (
                <Redirect to="/" />
              )
            ) : (
              <Redirect to="/auth" />
            )
          )}
        </Route>
        <Route path="/admin/properties/new" component={PropertyForm} />
        <Route path="/admin/properties/edit/:id" component={PropertyForm} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/community/new" component={PostFormPage} />
        <Route path="/community/edit/:id" component={PostFormPage} />
        <Route path="/community/:id" component={PostDetailPage} />
        <Route path="/popup/roadview" component={RoadviewPopupPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isPopup = location.startsWith("/popup");

  if (isPopup) {
    return (
      <main className="h-screen w-screen overflow-hidden">
        <Router user={user} />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans theme-transition bg-slate-50">
      <GlobalPopups />
      <ScrollToTop />
      <Header />
      <main className="flex-grow">
        <Router user={user} />
      </main>
      <Footer />
      <FloatingCTA />
      <MobileBottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SajuProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
            <Toaster />
          </TooltipProvider>
        </SajuProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

