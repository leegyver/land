import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SajuProvider } from "@/contexts/SajuContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// import FloatingContactButtons from "@/components/layout/FloatingContactButtons"; // Deprecated
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import FloatingCTA from "@/components/layout/FloatingCTA";
import { SwipeHandler } from "@/components/layout/SwipeHandler";
import { PageTransition } from "@/components/layout/PageTransition";
import HomePage from "@/pages/HomePage";
import PropertiesPage from "@/pages/PropertiesPage";
import PropertyDetailPage from "@/pages/PropertyDetailPage";
import NewsPage from "@/pages/NewsPage";
import NewsDetailPage from "@/pages/NewsDetailPage";
import AboutPage from "@/pages/AboutPage";
import YoutubePage from "@/pages/YoutubePage";
import SajuPage from "@/pages/SajuPage";
import ContactPage from "@/pages/ContactPage";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page-v2";
import ProfilePage from "@/pages/profile-page-v2";
import ReviewsPage from "@/pages/ReviewsPage";
// @ts-ignore
import PropertyForm from "@/pages/PropertyForm";
import DiagnosisPage from "@/pages/DiagnosisPage";
// @ts-ignore
import { SimpleProtectedRoute } from "@/components/auth/SimpleProtectedRoute";
import RoadviewPopupPage from "@/pages/RoadviewPopupPage";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/news/:id" component={NewsDetailPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/youtube" component={YoutubePage} />
      <Route path="/reviews" component={ReviewsPage} />
      <Route path="/saju" component={SajuPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/properties/new" component={PropertyForm} />
      <Route path="/admin/properties/edit/:id" component={PropertyForm} />
      <Route path="/diagnosis" component={DiagnosisPage} />
      <Route path="/popup/roadview" component={RoadviewPopupPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import ScrollToTop from "@/components/layout/ScrollToTop";

import { Building, Loader2 } from "lucide-react";

import { useLocation } from "wouter";

function AppContent() {
  // No root-level isLoading check to prevent tree flickering and Hook mismatch (#300, #310)
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-grow pb-16 md:pb-0 pt-0 mt-0 overflow-x-hidden relative z-0">
        <AppRouter />
      </main>
      <Footer />
      <MobileBottomNav />
      <FloatingCTA />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <SajuProvider>
            <TooltipProvider>
              <AppContent />
              <Toaster />
            </TooltipProvider>
          </SajuProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
