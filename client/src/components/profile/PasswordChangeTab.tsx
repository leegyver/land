import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: "현재 비밀번호를 입력해주세요." }),
    newPassword: z.string().min(6, { message: "새 비밀번호는 최소 6자 이상이어야 합니다." }),
    confirmPassword: z.string().min(6, { message: "비밀번호 확인을 입력해주세요." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function PasswordChangeTab() {
    const { toast } = useToast();

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: PasswordFormValues) => {
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

    const onPasswordSubmit = (data: PasswordFormValues) => {
        changePasswordMutation.mutate(data);
    };

    return (
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
    );
}
