import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, User as UserIcon } from "lucide-react";
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

const profileSchema = z.object({
    email: z.string().email({ message: "유효한 이메일을 입력해주세요." }).optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    birthDate: z.string().optional().or(z.literal("")),
    birthTime: z.string().optional().or(z.literal("")),
    isLunar: z.boolean().optional(),
    nickname: z.string().optional().or(z.literal("")),
    businessName: z.string().optional().or(z.literal("")),
    realtorName: z.string().optional().or(z.literal("")),
    realtorPhone: z.string().optional().or(z.literal("")),
    realtorAddress: z.string().optional().or(z.literal("")),
    businessLicenseNo: z.string().optional().or(z.literal("")),
    realtorPhoto: z.string().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditTabProps {
    user: any;
}

export function ProfileEditTab({ user }: ProfileEditTabProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const isRealtorOrAdmin = ['admin', 'master', 'realtor'].includes(user?.role);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            email: user?.email || "",
            phone: user?.phone || "",
            birthDate: user?.birthDate || "",
            birthTime: user?.birthTime || "",
            isLunar: user?.isLunar || false,
            nickname: user?.nickname || "",
            businessName: user?.businessName || "",
            realtorName: user?.realtorName || "",
            realtorPhone: user?.realtorPhone || "",
            realtorAddress: user?.realtorAddress || "",
            businessLicenseNo: user?.businessLicenseNo || "",
            realtorPhoto: user?.realtorPhoto || "",
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
                businessName: user.businessName || "",
                realtorName: user.realtorName || "",
                realtorPhone: user.realtorPhone || "",
                realtorAddress: user.realtorAddress || "",
                businessLicenseNo: user.businessLicenseNo || "",
                realtorPhoto: user.realtorPhoto || "",
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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        
        setIsUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });
            
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            
            // 폼 필드 업데이트
            profileForm.setValue("realtorPhoto", data.url, { shouldDirty: true });
            toast({ title: "사진 첨부 완료", description: "저장하기 버튼을 눌러야 최종 반영됩니다." });
        } catch (error) {
            console.error(error);
            toast({ title: "업로드 실패", description: "사진 등록 중 오류가 발생했습니다.", variant: "destructive" });
        } finally {
            setIsUploadingPhoto(false);
        }
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

                        {/* 중개사 전용 프로필 정보 설정 영역 (어드민/마스터/중개사에게만 표시) */}
                        {isRealtorOrAdmin && (
                            <div className="pt-8 mt-8 border-t border-slate-200">
                                <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary p-1 rounded-md">
                                        <UserIcon className="w-5 h-5" />
                                    </span>
                                    공인중개사 상세 프로필 설정
                                </h3>
                                
                                <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={profileForm.control} name="businessName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>상호명 (사무소명)</FormLabel>
                                                <FormControl><Input placeholder="이가이버 공인중개사" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        
                                        <FormField control={profileForm.control} name="realtorName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>중개사 이름</FormLabel>
                                                <FormControl><Input placeholder="이민호 대표" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        
                                        <FormField control={profileForm.control} name="realtorPhone" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>중개사 연락처</FormLabel>
                                                <FormControl><Input placeholder="010-4787-3120" {...field} /></FormControl>
                                                <FormDescription>매물 상세 페이지의 'CALL NOW' 버튼에 연결됩니다.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        
                                        <FormField control={profileForm.control} name="businessLicenseNo" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>중개업 등록번호</FormLabel>
                                                <FormControl><Input placeholder="28710-2021-00012" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={profileForm.control} name="realtorAddress" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>사무실 소재지</FormLabel>
                                            <FormControl><Input placeholder="인천광역시 강화군 강화읍..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField
                                        control={profileForm.control}
                                        name="realtorPhoto"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>프로필 사진</FormLabel>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-20 h-20 rounded-full border-2 border-slate-200 overflow-hidden bg-white flex items-center justify-center shrink-0">
                                                        {field.value ? (
                                                            <img src={field.value} alt="Profile" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon className="w-8 h-8 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <FormLabel 
                                                            htmlFor="profile-photo-upload" 
                                                            className={`flex w-fit items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-medium ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'} transition-colors`}
                                                        >
                                                            {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-slate-500" />}
                                                            사진 첨부하기
                                                        </FormLabel>
                                                        <input 
                                                            id="profile-photo-upload"
                                                            type="file" 
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handlePhotoUpload}
                                                            disabled={isUploadingPhoto}
                                                        />
                                                        <FormDescription>권장 크기: 정방형 (예: 400x400). 용량 5MB 이하.</FormDescription>
                                                    </div>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}
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
