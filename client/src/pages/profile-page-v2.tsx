import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Heart, MapPin, Home } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

// 프로필 수정 폼 스키마
const profileSchema = z.object({
  email: z.string().email({ message: "유효한 이메일을 입력해주세요." }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  birthTime: z.string().optional().or(z.literal("")),
  isLunar: z.boolean().optional(), // Added
});

// 비밀번호 변경 폼 스키마
const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "현재 비밀번호를 입력해주세요." }),
  newPassword: z.string().min(6, { message: "새 비밀번호는 최소 6자 이상이어야 합니다." }),
  confirmPassword: z.string().min(6, { message: "비밀번호 확인을 입력해주세요." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user } = useAuth();
  const { toast } = useToast();

  // 관심 매물 조회
  const { data: favoriteProperties, isLoading: isFavoritesLoading } = useQuery<Property[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user,
  });

  // 프로필 폼 설정
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || "",
      phone: user?.phone || "",
      birthDate: user?.birthDate || "",
      birthTime: user?.birthTime || "",
      isLunar: (user as any)?.isLunar || false, // Added
    },
  });

  // 사용자가 데이터가 로드되거나 변경될 때 폼 값을 동기화
  useEffect(() => {
    if (user) {
      profileForm.reset({
        email: user.email || "",
        phone: user.phone || "",
        birthDate: user.birthDate || "",
        birthTime: user.birthTime || "",
        isLunar: (user as any).isLunar || false, // Added
      });
    }
  }, [user, profileForm]);

  // 비밀번호 폼 설정
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // 프로필 업데이트 뮤테이션
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/users/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "프로필 업데이트 성공",
        description: "회원 정보가 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "프로필 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 비밀번호 변경 뮤테이션
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      // confirmPassword 필드는 서버로 보내지 않고 currentPassword와 newPassword만 전송
      const { confirmPassword, ...requestData } = data;
      const res = await apiRequest("PATCH", "/api/users/password", requestData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "비밀번호 변경 성공",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 프로필 폼 제출 처리
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // 비밀번호 폼 제출 처리
  const onPasswordSubmit = (data: PasswordFormValues) => {
    console.log("비밀번호 변경 요청:", data);
    changePasswordMutation.mutate(data);
  };

  if (!user) {
    return <div>Loading...</div>;
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">기본 정보</TabsTrigger>
          <TabsTrigger value="password">비밀번호 변경</TabsTrigger>
          <TabsTrigger value="favorites">관심매물</TabsTrigger>
        </TabsList>

        {/* 프로필 정보 탭 */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>
                회원님의 기본 정보를 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form id="profile-form" onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <FormControl>
                          <Input placeholder="이메일 주소" {...field} />
                        </FormControl>
                        <FormDescription>
                          알림 및 연락에 사용됩니다.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>연락처</FormLabel>
                        <FormControl>
                          <Input placeholder="연락처" {...field} />
                        </FormControl>
                        <FormDescription>
                          중개사와의 연락에 사용됩니다.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>생년월일</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="date" {...field} className="flex-1" />
                            </FormControl>
                            <FormField
                              control={profileForm.control}
                              name="isLunar"
                              render={({ field: isLunarField }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0 rounded-md border p-2">
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          className="w-4 h-4 text-blue-600"
                                          checked={!isLunarField.value}
                                          onChange={() => isLunarField.onChange(false)}
                                        />
                                        <span className="text-sm">양력</span>
                                      </label>
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          className="w-4 h-4 text-blue-600"
                                          checked={isLunarField.value === true}
                                          onChange={() => isLunarField.onChange(true)}
                                        />
                                        <span className="text-sm">음력</span>
                                      </label>
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormDescription>
                            사주 분석에 사용됩니다.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="birthTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>태어난 시간</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormDescription>
                            정확한 사주 분석을 위해 필요합니다.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                form="profile-form"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    업데이트 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    저장하기
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 비밀번호 변경 탭 */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>비밀번호 변경</CardTitle>
              <CardDescription>
                계정 보안을 위해 정기적으로 비밀번호를 변경해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form id="password-form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>현재 비밀번호</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="현재 비밀번호" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>새 비밀번호</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="새 비밀번호" {...field} />
                        </FormControl>
                        <FormDescription>
                          최소 6자 이상 입력해주세요.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호 확인</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="비밀번호 확인" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                form="password-form"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    변경 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    변경하기
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 관심매물 탭 */}
        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>내 관심매물</CardTitle>
              <CardDescription>
                관심있는 매물을 모아서 볼 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isFavoritesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !favoriteProperties || favoriteProperties.length === 0 ? (
                <div className="py-8 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">관심매물이 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    관심있는 매물을 찾아보고 하트 아이콘을 클릭하여 관심매물로 등록해보세요.
                  </p>
                  <Button asChild>
                    <Link href="/properties">매물 둘러보기</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoriteProperties.map(property => (
                    <div
                      key={property.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <Link href={`/properties/${property.id}`}>
                        <div className="relative h-40 bg-gray-100">
                          <img
                            src={
                              Array.isArray(property.imageUrls) && property.imageUrls.length > 0 &&
                                typeof property.featuredImageIndex === 'number'
                                ? property.imageUrls[property.featuredImageIndex]
                                : (property.imageUrls && property.imageUrls.length > 0
                                  ? property.imageUrls[0]
                                  : property.imageUrl || "https://via.placeholder.com/400x300?text=No+Image")
                            }
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold mb-1 line-clamp-1">{property.title}</h3>
                          <div className="flex items-center text-gray-500 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="text-sm">{property.district}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-gray-700">
                              <Home className="w-4 h-4 mr-1" />
                              <span className="text-sm">{property.type}</span>
                            </div>
                            <div className="font-bold text-primary">
                              {property.price && Number(property.price) > 0 ? (
                                Number(property.price) >= 100000000 ?
                                  `${(Number(property.price) / 100000000).toFixed(2)}억원` :
                                  Number(property.price) >= 10000 ?
                                    `${(Number(property.price) / 10000).toFixed(2)}만원` :
                                    `${Number(property.price).toLocaleString()}원`
                              ) : '가격 협의'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}