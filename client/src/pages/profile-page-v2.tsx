import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileEditTab } from "@/components/profile/ProfileEditTab";
import { PasswordChangeTab } from "@/components/profile/PasswordChangeTab";
import { FavoritesTab } from "@/components/profile/FavoritesTab";
import { SubscriptionTab } from "@/components/profile/SubscriptionTab";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, isLoading: isUserLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 font-medium text-slate-500">Loading...</span>
      </div>
    );
  }

  if (!user) {
    // Return empty while redirecting
    setTimeout(() => setLocation("/auth"), 0);
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <Helmet>
        <title>내 프로필 | 이가이버 부동산</title>
        <meta name="description" content="회원 정보 관리, 비밀번호 변경 등 계정 설정을 할 수 있습니다." />
      </Helmet>

      <h1 className="text-3xl font-bold mb-8">
        내 프로필
        {user.provider && (
          <span className="ml-2 text-xl font-medium text-slate-400">
            ({user.provider === 'naver' ? '네이버 로그인' : user.provider === 'kakao' ? '카카오 로그인' : user.provider + ' 로그인'})
          </span>
        )}
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">기본 정보</TabsTrigger>
          <TabsTrigger value="password">비밀번호 변경</TabsTrigger>
          <TabsTrigger value="subscription">구독 관리</TabsTrigger>
          <TabsTrigger value="favorites">관심매물</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileEditTab user={user} />
        </TabsContent>

        <TabsContent value="password">
          <PasswordChangeTab />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionTab user={user} />
        </TabsContent>
        <TabsContent value="favorites">
          <FavoritesTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}