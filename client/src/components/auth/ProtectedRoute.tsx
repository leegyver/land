import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

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
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);
  
  // 사용자 인증 상태에 따라 리다이렉션 경로 결정
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setShouldRedirect("/auth");
      } else if (admin && user.role !== "admin") {
        setShouldRedirect("/");
      }
    }
  }, [user, isLoading, admin]);
  
  return (
    <Route path={path}>
      {() => {
        // 로딩 중일 때
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        // 리다이렉션 필요 시
        if (shouldRedirect) {
          return <Redirect to={shouldRedirect} />;
        }
        
        // 모든 조건 충족 시 컴포넌트 렌더링
        return <Component />;
      }}
    </Route>
  );
}