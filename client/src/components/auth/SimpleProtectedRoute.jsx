// 단순화된 보호 라우트 컴포넌트 - JSX 확장자 사용, 타입 제거
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";

// 간단한 HTML을 이용한 보호 컴포넌트
export function SimpleProtectedRoute({ path, component: Component, admin = false }) {
  const { user, isLoading } = useAuth();
  
  // 보호된 컴포넌트를 간단한 래퍼로 감싸기
  const ProtectedContent = () => {
    // 로딩 중
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    // 인증되지 않은 경우
    if (!user) {
      // window 객체를 사용해 리다이렉트 (React 컴포넌트 렌더링 X)
      window.location.href = "/auth";
      return <div>인증 필요...</div>;
    }
    
    // 관리자 권한 필요하지만 일반 사용자인 경우
    if (admin && user.role !== "admin") {
      // window 객체를 사용해 리다이렉트 (React 컴포넌트 렌더링 X)
      window.location.href = "/";
      return <div>권한 체크 중...</div>;
    }
    
    // 권한 있음 - 컴포넌트 렌더링
    return <Component />;
  };
  
  return (
    <Route path={path} component={ProtectedContent} />
  );
}