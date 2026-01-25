import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingContactButtons from "@/components/layout/FloatingContactButtons";
import HomePage from "@/pages/HomePage";
import PropertiesPage from "@/pages/PropertiesPage";
import PropertyDetailPage from "@/pages/PropertyDetailPage";
// Agent 관련 페이지 제거됨
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page-fixed-new";
import ProfilePage from "@/pages/profile-page";
import NewsPage from "@/pages/NewsPage";
import NewsDetailPage from "@/pages/NewsDetailPage";
import PropertyForm from "@/pages/PropertyForm";
import { SimpleProtectedRoute } from "@/components/auth/SimpleProtectedRoute";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      {/* Agent 관련 라우트 제거됨 */}
      <Route path="/news" component={NewsPage} />
      <Route path="/news/:id" component={NewsDetailPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/auth" component={AuthPage} />
      <SimpleProtectedRoute path="/profile" component={ProfilePage} />
      <SimpleProtectedRoute path="/admin" component={AdminPage} admin={true} />
      <SimpleProtectedRoute path="/admin/properties/new" component={PropertyForm} admin={true} />
      <SimpleProtectedRoute path="/admin/properties/edit/:id" component={PropertyForm} admin={true} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { useEffect } from "react";

function App() {
  // 카카오 SDK 및 지도 로드
  useEffect(() => {
    const kakaoKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    if (!kakaoKey) return;

    // SDK 로드
    if (!document.getElementById("kakao-sdk")) {
      const script = document.createElement("script");
      script.id = "kakao-sdk";
      script.src = "https://developers.kakao.com/sdk/js/kakao.js";
      script.async = true;
      script.onload = () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoKey);
          console.log("Kakao SDK Initialized");
        }
      };
      document.head.appendChild(script);
    }

    // 지도 로드
    if (!document.getElementById("kakao-map-sdk")) {
      const script = document.createElement("script");
      script.id = "kakao-map-sdk";
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          console.log("Kakao Maps Loaded");
          window.kakaoMapLoaded = true;
        });
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow pb-16 md:pb-0">
                <AppRouter />
              </main>
              <Footer />
              <FloatingContactButtons />
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
