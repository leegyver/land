import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SajuProvider } from "@/contexts/SajuContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingContactButtons from "@/components/layout/FloatingContactButtons";
import { SwipeHandler } from "@/components/layout/SwipeHandler";
import { PageTransition } from "@/components/layout/PageTransition";
import HomePage from "@/pages/HomePage";
import PropertiesPage from "@/pages/PropertiesPage";
import PropertyDetailPage from "@/pages/PropertyDetailPage";
import NewsPage from "@/pages/NewsPage";
import NewsDetailPage from "@/pages/NewsDetailPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page-v2";
import ProfilePage from "@/pages/profile-page-v2";
// @ts-ignore
import PropertyForm from "@/pages/PropertyForm";
import DiagnosisPage from "@/pages/DiagnosisPage";
// @ts-ignore
import { SimpleProtectedRoute } from "@/components/auth/SimpleProtectedRoute";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/properties" component={PropertiesPage} />
      <Route path="/properties/:id" component={PropertyDetailPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/news/:id" component={NewsDetailPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/auth" component={AuthPage} />
      <SimpleProtectedRoute path="/profile" component={ProfilePage} />
      <SimpleProtectedRoute path="/admin" component={AdminPage} admin={true} />
      <SimpleProtectedRoute path="/admin/properties/new" component={PropertyForm} admin={true} />
      <SimpleProtectedRoute path="/admin/properties/edit/:id" component={PropertyForm} admin={true} />
      <Route path="/diagnosis" component={DiagnosisPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

import ScrollToTop from "@/components/layout/ScrollToTop";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <SajuProvider>
            <TooltipProvider>
              <SwipeHandler>
                <div className="flex flex-col min-h-screen">
                  <ScrollToTop />
                  <Header />
                  <main className="flex-grow pb-0 pt-0 mt-0 overflow-x-hidden relative z-0">
                    <PageTransition>
                      <AppRouter />
                    </PageTransition>
                  </main>
                  <Footer />
                  <FloatingContactButtons />
                </div>
              </SwipeHandler>
              <Toaster />
            </TooltipProvider>
          </SajuProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
