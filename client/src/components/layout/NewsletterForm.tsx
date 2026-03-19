import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

const subscribeSchema = z.object({
    email: z.string().email("유효한 이메일 주소를 입력해주세요.")
});

type SubscribeFormValues = z.infer<typeof subscribeSchema>;

const NewsletterForm = () => {
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);

    const form = useForm<SubscribeFormValues>({
        resolver: zodResolver(subscribeSchema),
        defaultValues: {
            email: ""
        }
    });

    const subscriptionMutation = useMutation({
        mutationFn: async (values: SubscribeFormValues) => {
            const res = await apiRequest("POST", "/api/newsletter/subscribe", values);
            return res.json();
        },
        onSuccess: () => {
            setIsSubscribed(true);
            toast({
                title: "구독 신청 완료!",
                description: "이가이버 부동산 뉴스레터 구독이 시작되었습니다. 환영 이메일을 확인해주세요.",
            });
            form.reset();
        },
        onError: (error: Error) => {
            toast({
                variant: "destructive",
                title: "구독 신청 실패",
                description: error.message || "이미 구독 중인 이메일이거나 오류가 발생했습니다.",
            });
        }
    });

    const onSubmit = (values: SubscribeFormValues) => {
        subscriptionMutation.mutate(values);
    };

    if (isSubscribed) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-primary/5 rounded-2xl border border-primary/20 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">구독해주셔서 감사합니다!</h3>
                <p className="text-gray-600 text-center text-sm md:text-base">
                    매주 전해드리는 강화도 부동산 소식으로 찾아뵙겠습니다.
                </p>
                <Button
                    variant="outline"
                    className="mt-6 font-semibold"
                    onClick={() => setIsSubscribed(false)}
                >
                    다른 이메일로 구독하기
                </Button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 text-white shadow-xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        매주 강화도 부동산 동향 메일 받기
                    </h2>
                    <p className="text-blue-100 text-sm md:text-lg mb-0 opacity-90 leading-relaxed">
                        이가이버가 직접 발로 뛰며 분석한 강화도 실거래 정보와 <br className="hidden md:block" />
                        단독 공개 매물 정보를 가장 먼저 받아보세요.
                    </p>
                </div>

                <div className="w-full md:w-auto min-w-[300px] lg:min-w-[400px]">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-blue-600" />
                                                <Input
                                                    placeholder="이메일 주소를 입력하세요"
                                                    className="bg-white text-gray-900 h-14 pl-12 rounded-xl focus:ring-4 focus:ring-blue-400/30 transition-all border-none shadow-lg"
                                                    {...field}
                                                    disabled={subscriptionMutation.isPending}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-200 mt-1" />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-lg rounded-xl shadow-lg transform active:scale-[0.98] transition-all"
                                disabled={subscriptionMutation.isPending}
                            >
                                {subscriptionMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        신청 중...
                                    </>
                                ) : (
                                    "무료 구독 신청하기"
                                )}
                            </Button>
                            <p className="text-xs text-blue-100/70 text-center mt-4">
                                언제든지 구독을 해지하실 수 있습니다. 개인정보는 소중히 보호됩니다.
                            </p>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default NewsletterForm;
