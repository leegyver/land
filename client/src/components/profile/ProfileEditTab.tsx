import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { useEffect, useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, UserX } from "lucide-react";

const profileSchema = z.object({
    email: z.string().email({ message: "유효한 이메일을 입력해주세요." }).optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    birthDate: z.string().optional().or(z.literal("")),
    birthTime: z.string().optional().or(z.literal("")),
    isLunar: z.boolean().optional(),
    nickname: z.string().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditTabProps {
    user: any;
}

export function ProfileEditTab({ user }: ProfileEditTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            email: user?.email || "",
            phone: user?.phone || "",
            birthDate: user?.birthDate || "",
            birthTime: user?.birthTime || "",
            isLunar: user?.isLunar || false,
            nickname: user?.nickname || "",
        },
    });

    useEffect(() => {
        if (user) {
            profileForm.reset({
                email: user.email || "",
                phone: user.phone || "",
                birthDate: user.birthDate || "",
                birthTime: user.birthTime || "",
                isLunar: user.isLunar || false,
                nickname: user.nickname || "",
            });
        }
    }, [user, profileForm]);

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

    const onProfileSubmit = (data: ProfileFormValues) => {
        updateProfileMutation.mutate(data);
    };

    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("DELETE", "/api/users/me");
            return await res.json();
        },
        onSuccess: () => {
            toast({
                title: "회원 탈퇴 완료",
                description: "그동안 이용해 주셔서 감사합니다. 안전하게 로그아웃되었습니다.",
            });
            // 홈으로 리다이렉트 (서버에서 이미 세션이 파기됨)
            window.location.href = "/";
        },
        onError: (error: Error) => {
            toast({
                title: "탈퇴 처리 중 오류",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
    <>
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
                            name="nickname"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>별명</FormLabel>
                                    <FormControl>
                                        <Input placeholder="별명" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        커뮤니티 활동 시 노출되는 이름입니다.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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

        <Card className="mt-8 border-destructive/20 bg-destructive/5">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    계정 관리 (Danger Zone)
                </CardTitle>
                <CardDescription>
                    회원 탈퇴 시 모든 정보가 영구적으로 삭제되며 복구할 수 없습니다.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    회원 탈퇴를 하시면 지금까지 등록한 관심 매물, 작성한 게시글 등의 정보가 모두 삭제되거나 익명화됩니다.
                </p>
            </CardContent>
            <CardFooter className="bg-destructive/10 border-t border-destructive/10 py-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex items-center gap-2">
                            <UserX className="h-4 w-4" />
                            회원 탈퇴하기
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                정말로 탈퇴하시겠습니까?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3 pt-2">
                                <p>
                                    계정을 삭제하면 프로필, 관심 목록 및 기타 계정 정보가 **영구적으로 삭제**됩니다.
                                    이 작업은 취소할 수 없습니다.
                                </p>
                                <p className="font-semibold text-foreground">
                                    탈퇴 확인을 위해 정말로 동의하신다면 아래 [탈퇴 확인] 버튼을 눌러주세요.
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => deleteAccountMutation.mutate()}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleteAccountMutation.isPending}
                            >
                                {deleteAccountMutation.isPending ? "처리 중..." : "탈퇴 확인"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    </>
    );
}
