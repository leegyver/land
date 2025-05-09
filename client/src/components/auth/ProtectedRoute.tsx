import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  admin?: boolean;
}

export function ProtectedRoute({ 
  path, 
  component: Component, 
  admin = false 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        if (admin && user.role !== "admin") {
          setLocation("/");
          return (
            <div className="flex items-center justify-center min-h-screen">
              <p className="text-xl text-red-500">관리자 권한이 필요합니다.</p>
            </div>
          );
        }

        return <Component />;
      }}
    </Route>
  );
}