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
import { useEffect } from "react";

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

    return (
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
    );
}
