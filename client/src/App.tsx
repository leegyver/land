import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/auth-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import PropertyDetailPage from "@/pages/PropertyDetailPage";
import PropertiesPage from "@/pages/PropertiesPage";
import ProfilePage from "@/pages/profile-page-v2";
import AdminPage from "@/pages/admin-page-v2";
import AboutPage from "@/pages/AboutPage";
import NewsPage from "@/pages/NewsPage";
import NewsDetailPage from "@/pages/NewsDetailPage";
import YoutubePage from "@/pages/YoutubePage";
import SajuPage from "@/pages/SajuPage";
import ContactPage from "@/pages/ContactPage";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { SajuProvider } from "@/contexts/SajuContext";
import FloatingCTA from "@/components/layout/FloatingCTA";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { SwipeHandler } from "@/components/layout/SwipeHandler";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

import PropertyForm from "@/pages/PropertyForm";
import ReviewsPage from "@/pages/ReviewsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/news/:id" component={NewsDetailPage} />
      <Route path="/reviews" component={ReviewsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/youtube" component={YoutubePage} />
      <Route path="/saju" component={SajuPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/properties/new" component={PropertyForm} />
      <Route path="/admin/properties/edit/:id" component={PropertyForm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col font-sans theme-transition bg-slate-50">
      <ScrollToTop />
      <SwipeHandler />
      <Header />
      <main className="flex-grow">
        <Router />
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
