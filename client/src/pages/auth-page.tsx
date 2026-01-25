import { useState, useEffect } from "react";
import { useAuth, registerSchema } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, LogIn, Home, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// SVG 로고 가져오기
import kakaoLogo from "../assets/kakao-logo.svg";
import naverLogo from "../assets/naver-logo.svg";

// 로그인 폼 스키마
const loginSchema = z.object({
  username: z.string().min(3, "사용자 이름은 최소 3자 이상이어야 합니다"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();

  // URL에서 에러 파라미터 확인
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // URL 에러 파라미터 확인
    const params = new URLSearchParams(search);
    const errorParam = params.get("error");

    if (errorParam === "naver_login_failed") {
      const details = params.get("details");
      setError(`네이버 로그인 실패: ${details ? decodeURIComponent(details) : "다시 시도해주세요."}`);
    } else if (errorParam === "kakao_login_failed") {
      setError("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
    } else if (errorParam) {
      setError(errorParam);
    } else {
      setError(null);
    }
  }, [search]);

  // 로그인 폼
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // 회원가입 폼
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      phone: "",
      role: "user",
    },
  });

  // 로그인 제출 핸들러
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // 회원가입 제출 핸들러
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  // 이미 로그인되어 있으면 홈으로 리다이렉트
  if (user) {
    // useEffect를 사용하지 않고 리다이렉트할 때는 다음 렌더링에서 처리되므로 
    // 빈 페이지를 잠시 보여주는 게 안전합니다.
    setTimeout(() => setLocation("/"), 0);
    return <div className="flex min-h-screen items-center justify-center">리다이렉트 중...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* 왼쪽: 폼 */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-800 bg-clip-text text-transparent">이가이버 부동산</h1>
            <Button variant="outline" onClick={() => setLocation("/")} className="flex items-center gap-2 rounded-full">
              <Home size={16} />
              홈으로
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 rounded-lg p-1 bg-gray-100">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">로그인</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">회원가입</TabsTrigger>
            </TabsList>

            {/* 로그인 폼 */}
            <TabsContent value="login">
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">로그인</CardTitle>
                  <CardDescription>
                    계정 정보를 입력하여 로그인하세요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 오류 메시지 표시 */}
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">사용자 이름</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="사용자 이름"
                                {...field}
                                className="h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">비밀번호</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="비밀번호"
                                {...field}
                                className="h-11 rounded-lg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 text-base rounded-lg bg-gradient-to-r from-blue-600 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 transition-all"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            로그인 중...
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-5 w-5" />
                            로그인
                          </>
                        )}
                      </Button>

                      {/* 소셜 로그인 구분선 */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-white px-4 text-sm text-gray-500">소셜 계정으로 로그인</span>
                        </div>
                      </div>

                      {/* 소셜 로그인 버튼 */}
                      <div className="grid grid-cols-2 gap-4">
                        <a href="/api/auth/kakao" className="w-full">
                          <Button
                            variant="outline"
                            type="button"
                            className="w-full h-11 text-base rounded-lg hover:bg-yellow-50 border-[#FEE500] bg-[#FEE500]"
                          >
                            <img src={kakaoLogo} alt="Kakao" className="w-5 h-5 mr-2" />
                            카카오 로그인
                          </Button>
                        </a>
                        <a href="/api/auth/naver" className="w-full">
                          <Button
                            variant="outline"
                            type="button"
                            className="w-full h-11 text-base rounded-lg text-white hover:bg-green-600 border-[#03C75A] bg-[#03C75A]"
                          >
                            <img src={naverLogo} alt="Naver" className="w-5 h-5 mr-2" />
                            네이버 로그인
                          </Button>
                        </a>
                      </div>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col pt-0">
                  <p className="text-sm text-muted-foreground">
                    계정이 없으신가요?{" "}
                    <Button variant="link" className="p-0 text-blue-600" onClick={() => setActiveTab("register")}>
                      회원가입
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* 회원가입 폼 */}
            <TabsContent value="register">
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
                  <CardDescription>
                    새 계정을 만들어 이가이버 부동산 서비스를 이용하세요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="text-base">사용자 이름</FormLabel>
                              <FormControl>
                                <Input placeholder="사용자 이름" {...field} className="h-11 rounded-lg" />
                              </FormControl>
                              <FormDescription>
                                3자 이상의 사용자 이름을 입력하세요.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">비밀번호</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="비밀번호" {...field} className="h-11 rounded-lg" />
                              </FormControl>
                              <FormDescription>
                                6자 이상의 비밀번호를 설정하세요.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base">비밀번호 확인</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="비밀번호 확인" {...field} className="h-11 rounded-lg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="text-base">이메일</FormLabel>
                              <FormControl>
                                <Input placeholder="example@email.com" {...field} className="h-11 rounded-lg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="text-base">연락처</FormLabel>
                              <FormControl>
                                <Input placeholder="010-1234-5678" {...field} className="h-11 rounded-lg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input type="hidden" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 text-base rounded-lg mt-4 bg-gradient-to-r from-blue-600 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 transition-all"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            회원가입 중...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-5 w-5" />
                            회원가입
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col pt-0">
                  <p className="text-sm text-muted-foreground">
                    이미 계정이 있으신가요?{" "}
                    <Button variant="link" className="p-0 text-blue-600" onClick={() => setActiveTab("login")}>
                      로그인
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 오른쪽: 히어로 섹션 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-12 flex-col justify-center relative overflow-hidden">
        {/* 배경 패턴 효과 */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute w-96 h-96 rounded-full bg-white/20 -top-10 -right-10"></div>
          <div className="absolute w-96 h-96 rounded-full bg-white/20 bottom-0 left-1/4"></div>
          <div className="absolute w-60 h-60 rounded-full bg-white/20 top-1/3 left-10"></div>
        </div>

        <div className="max-w-xl relative z-10">
          <h2 className="text-4xl font-bold mb-6 leading-tight">이가이버 부동산과 함께<br />당신의 꿈의 집을 찾으세요</h2>
          <p className="text-lg mb-10 text-blue-100">
            회원가입을 통해 다양한 부동산 정보를 확인하고, 관심 매물을 저장하거나 부동산 중개사와 상담 예약을 할 수 있습니다.
          </p>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-white/20 rounded-full p-2 mr-4 backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white">다양한 매물 정보</h3>
                <p className="text-blue-100">아파트, 주택, 오피스텔 등 다양한 부동산 매물 정보를 확인하세요.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 rounded-full p-2 mr-4 backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white">전문 중개사 상담</h3>
                <p className="text-blue-100">지역별 전문 부동산 중개사와 상담하여 최적의 매물을 찾아보세요.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 rounded-full p-2 mr-4 backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white">실시간 알림 서비스</h3>
                <p className="text-blue-100">관심 지역의 새로운 매물이 등록되면 실시간으로 알림을 받아보세요.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}