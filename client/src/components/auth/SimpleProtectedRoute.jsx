import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";
import { useEffect } from "react";

/**
 * SimpleProtectedRoute handles authentication and authorization.
 * Refactored in V7 to be a LOGICAL WRAPPER (no Route component inside)
 * to prevent nested route matching conflicts and Error #300.
 */
export function SimpleProtectedRoute({ component: Component, admin = false, ...rest }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log("[SimpleProtectedRoute] Mounted/Updated", { isLoading, user: !!user, admin });

    if (!isLoading) {
      if (!user) {
        console.log("[SimpleProtectedRoute] Redirecting to /auth");
        setLocation("/auth");
      } else if (admin && user.role !== "admin") {
        console.log("[SimpleProtectedRoute] Redirecting to / (not admin)");
        setLocation("/");
      }
    }
  }, [user, isLoading, admin, setLocation]);

  // Use a stable loading/blank state while redirecting or resolving auth
  if (isLoading || (!user) || (admin && user?.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen border-b bg-slate-50/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-500">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  // Authorization passed, render the component directly
  return <Component {...rest} />;
}