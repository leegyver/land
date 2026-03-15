import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, ShieldCheck, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";

export default function PricingPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const subscribeMutation = useMutation({
        mutationFn: async (planType: string) => {
            return new Promise((resolve, reject) => {
                const { IMP, PortOne } = window as any;
                const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID || "imp31646628";
                const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY;

                const isV2 = STORE_ID.startsWith('store-');

                if (isV2 && !PortOne) {
                    return reject(new Error("포트원 V2 결제 모듈을 불러오지 못했습니다."));
                }
                if (isV2 && !CHANNEL_KEY) {
                    return reject(new Error("V2 결제를 위한 '채널 키(Channel Key)'가 설정되지 않았습니다. 관리자에게 문의하세요."));
                }
                if (!isV2 && !IMP) {
                    return reject(new Error("포트원 V1 결제 모듈을 불러오지 못했습니다."));
                }

                const amount = planType === 'monthly' ? 5000 : 50000;
                const merchant_uid = `ORD_${Date.now()}`;
                const orderName = `이가이버 부동산 ${planType === 'monthly' ? '월간' : '연간'} 멤버십`;

                if (isV2) {
                    // PortOne V2 결제 요청
                    PortOne.requestPayment({
                        storeId: STORE_ID,
                        channelKey: CHANNEL_KEY,
                        paymentId: merchant_uid,
                        orderName: orderName,
                        totalAmount: amount,
                        currency: "CURRENCY_KRW",
                        payMethod: "CARD",
                        customer: {
                            fullName: user?.nickname || user?.username || '고객',
                            phoneNumber: user?.phone || '',
                            email: user?.email || '',
                        },
                    }).then(async (rsp: any) => {
                        if (rsp.code != null) {
                            // 오류 발생
                            return reject(new Error(`결제 실패: ${rsp.message}`));
                        }
                        
                        try {
                            const res = await fetch("/api/subscription/subscribe", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                    planType, 
                                    imp_uid: rsp.paymentId, // V2에서는 paymentId가 imp_uid 역할을 함 (백엔드 호환을 위해 유지)
                                    merchant_uid: rsp.paymentId 
                                }),
                            });

                            if (!res.ok) {
                                const errorData = await res.json();
                                throw new Error(errorData.message || "결제 검증에 실패했습니다.");
                            }

                            const result = await res.json();
                            resolve(result);
                        } catch (err: any) {
                            reject(err);
                        }
                    }).catch(reject);
                } else {
                    // PortOne V1 (IMP) 결제 요청
                    IMP.init(STORE_ID);
                    IMP.request_pay({
                        pg: "html5_inicis",
                        pay_method: "card",
                        merchant_uid: merchant_uid,
                        name: orderName,
                        amount: amount,
                        buyer_email: user?.email || '',
                        buyer_name: user?.nickname || user?.username || '',
                        buyer_tel: user?.phone || '',
                    }, async (rsp: any) => {
                        if (rsp.success) {
                            try {
                                const res = await fetch("/api/subscription/subscribe", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ 
                                        planType, 
                                        imp_uid: rsp.imp_uid, 
                                        merchant_uid: rsp.merchant_uid 
                                    }),
                                });

                                if (!res.ok) {
                                    const errorData = await res.json();
                                    throw new Error(errorData.message || "결제 검증에 실패했습니다.");
                                }

                                const result = await res.json();
                                resolve(result);
                            } catch (err: any) {
                                reject(err);
                            }
                        } else {
                            reject(new Error(`결제 실패: ${rsp.error_msg}`));
                        }
                    });
                }
            });
        },
        onSuccess: () => {
            toast({ title: "구독 성공", description: "프리미엄 서비스 이용이 시작되었습니다! 대박 나세요!" });
            queryClient.invalidateQueries({ queryKey: ["/api/subscription/me"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            setLocation("/admin"); // 관리자 페이지(매물 등록)로 이동
        },
        onError: (error: Error) => {
            toast({ title: "결제 오류", description: error.message, variant: "destructive" });
        },
    });

    const plans = [
        {
            id: "monthly",
            name: "월간 멤버십",
            price: "5,000",
            period: "/ 월",
            description: "부담 없는 월간 구독으로 시작하는 실속형 중개 전문 서비스",
            features: [
                "무제한 매물 등록",
                "기본 노출 순위 지원",
                "실시간 상담 버튼 제공",
                "공인중개사 인증 마크",
                "매물 관리 대시보드",
                "유튜브 영상 다이렉트 연동",
                "인기/추천 매물 큐레이션"
            ],
            icon: <Zap className="w-8 h-8 text-blue-500" />,
            color: "border-blue-200 hover:shadow-blue-100",
            buttonColor: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
            info: "결제일로부터 30일간 이용 / 기간 만료 시 자동 연장",
            delay: 0.1,
        },
        {
            id: "annual",
            name: "연간 멤버십",
            price: "50,000",
            period: "/ 년",
            description: "연간 구독으로 17% 할인 혜택과 강력한 홍보 효과를 동시에",
            features: [
                "무제한 매물 등록",
                "최상단 노출 순위 지원",
                "프리미엄 상담 버튼 제공",
                "공인중개사 골드 인증 마크",
                "고급 매물 관리 대시보드",
                "유튜브 영상 다이렉트 연동",
                "추천 매물 상단 고정 서비스"
            ],
            icon: <Crown className="w-8 h-8 text-amber-500" />,
            color: "border-amber-200 shadow-amber-50 md:scale-105 z-10",
            buttonColor: "bg-amber-600 hover:bg-amber-700 shadow-amber-200",
            info: "결제일로부터 1년간 이용 / 기간 만료 시 자동 연장",
            isPopular: true,
            delay: 0.2,
        }
    ];

    return (
        <div className="relative min-h-screen w-full pt-32 pb-24 bg-gradient-to-b from-slate-50 to-white">
            <Helmet>
                <title>비즈니스 요금제 | 이가이버 부동산</title>
            </Helmet>

            {/* Decorative Background Elements - Wrapped to prevent overflow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-100/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="container mx-auto px-4 max-w-6xl">
                {/* 신규 중개사 환영 메시지 */}
                {user?.role === "realtor" && (!user.subscriptionTier || user.subscriptionTier === "free") && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto mb-10"
                    >
                        <Alert className="bg-blue-600 border-none text-white shadow-2xl py-8 px-10 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-110 duration-1000"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

                            <div className="flex items-start gap-6 relative z-10">
                                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
                                    <ShieldCheck className="w-10 h-10 text-white" />
                                </div>
                                <div className="flex-grow">
                                    <AlertTitle className="text-3xl font-black mb-3 tracking-tight">가입을 진심으로 환영합니다! 🤝</AlertTitle>
                                    <AlertDescription className="text-blue-50 text-lg font-medium leading-relaxed opacity-95">
                                        이가이버 부동산의 매물 등록 서비스를 이용하시려면 먼저 구독 플랜을 선택해 주세요.<br />
                                        구독 즉시 <span className="text-white font-bold underline underline-offset-4 decoration-white/40">무제한 매물 등록</span>과 <span className="text-white font-bold underline underline-offset-4 decoration-white/40">유튜브 연동</span> 등 모든 프리미엄 기능을 사용하실 수 있습니다.
                                    </AlertDescription>
                                </div>
                            </div>
                        </Alert>
                    </motion.div>
                )}

                <div className="text-center mb-16 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge className="px-4 py-1.5 bg-primary/10 text-primary border-primary/20 text-sm font-black mb-4 uppercase tracking-[0.2em]">
                            Professional Solution
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                            성공적인 중개를 위한<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">압도적 경쟁력</span>을 구독하세요
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
                    >
                        강화도 최대 매물 플랫폼 이가이버 부동산과 함께하면<br className="hidden md:block" />
                        신속한 매칭과 높은 계약 성공률을 경험하실 수 있습니다.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: plan.delay, duration: 0.6, type: "spring" }}
                            className="flex h-full"
                        >
                            <Card className={`relative overflow-hidden transition-all duration-300 border-2 rounded-[2.5rem] flex flex-col w-full shadow-2xl hover:shadow-3xl ${plan.color}`}>
                                {plan.isPopular && (
                                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-bl-2xl uppercase tracking-[0.2em] shadow-lg">
                                        추천 / 베스트
                                    </div>
                                )}

                                <CardHeader className="pb-8 pt-12 px-8">
                                    <div className="mb-6 p-4 bg-slate-50 rounded-2xl w-fit shadow-inner">
                                        {plan.icon}
                                    </div>
                                    <CardTitle className="text-3xl font-black uppercase text-slate-900 tracking-tight">{plan.name}</CardTitle>
                                    <CardDescription className="text-slate-500 font-medium text-base mt-2 line-clamp-2">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-10 px-8 flex-grow">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-5xl font-black text-slate-900 tracking-tighter">₩{plan.price}</span>
                                        <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">{plan.period}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 font-inter">Core Benefits</p>
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-4 text-[15px] font-semibold text-slate-700">
                                                <div className="bg-green-500 p-1 rounded-full shadow-sm">
                                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                                                </div>
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-10 pb-12 px-8 flex flex-col gap-4">
                                    <Button
                                        className={`w-full h-16 text-xl font-black rounded-2xl shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all active:shadow-md ${plan.buttonColor} text-white`}
                                        onClick={() => subscribeMutation.mutate(plan.id)}
                                        disabled={subscribeMutation.isPending}
                                    >
                                        {subscribeMutation.isPending ? "결제 처리 중..." : `${plan.name} 지금 시작하기`}
                                    </Button>
                                    {plan.info && (
                                        <p className="text-center text-xs font-bold text-slate-400 mt-2 bg-slate-50 py-2 px-4 rounded-xl border border-slate-100 italic">
                                            {plan.info}
                                        </p>
                                    )}
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mt-24 p-10 bg-white/80 backdrop-blur-md border-2 border-slate-100 rounded-[3rem] shadow-sm max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8 relative overflow-hidden text-center md:text-left"
                >
                    <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl -z-10 rotate-12" />

                    <div className="bg-blue-600 p-6 rounded-[1.5rem] shadow-2xl shadow-blue-200 shrink-0">
                        <ShieldCheck className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">강화군 공인중개사의 <span className="text-blue-600">든든한 동반자</span></h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            모든 중개 회원은 철저한 사업자 인증 과정을 거칩니다.<br className="hidden md:block" />
                            검증된 전문가들만 활동할 수 있는 건강한 커뮤니티를 구축합니다.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
