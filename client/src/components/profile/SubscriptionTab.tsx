import { useQuery, useMutation } from "@tanstack/react-query";
import { User, RealtorSubscription } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, Clock, AlertTriangle, FileText, ArrowRight, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

interface SubscriptionTabProps {
    user: User;
}

export function SubscriptionTab({ user }: SubscriptionTabProps) {
    const { toast } = useToast();
    const { data: subData, isLoading } = useQuery<{
        tier: string;
        status: string;
        expiresAt: string | null;
        businessStatus: string;
        history: RealtorSubscription[];
    }>({
        queryKey: ["/api/subscription/me"],
    });

    const cancelSubscriptionMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/subscription/cancel");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "구독 해지 완료", description: "구독이 성공적으로 해지되었습니다. 환불은 영업일 기준 3-5일 소요될 수 있습니다." });
            queryClient.invalidateQueries({ queryKey: ["/api/subscription/me"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        },
        onError: (error: Error) => {
            toast({ title: "해지 오류", description: error.message, variant: "destructive" });
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const statusColors = {
        none: "bg-slate-100 text-slate-500",
        active: "bg-green-100 text-green-600",
        expired: "bg-red-100 text-red-600",
        canceling: "bg-orange-100 text-orange-600",
    };

    const businessStatusColors = {
        pending: "text-amber-500",
        approved: "text-green-500",
        rejected: "text-red-500",
    };

    const businessStatusLabels = {
        pending: "심사 대기 중",
        approved: "인증 완료",
        rejected: "인증 반려",
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subscription Status Card */}
                <Card className="overflow-hidden border-2 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="bg-slate-50/50 pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    구독 정보
                                </CardTitle>
                                <CardDescription>현재 이용 중인 요금제 및 상태</CardDescription>
                            </div>
                            <Badge className={statusColors[subData?.status as keyof typeof statusColors] || "bg-slate-100"}>
                                {subData?.status === 'active' ? '이용 중' : subData?.status === 'expired' ? '만료됨' : '구독 없음'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-500">현재 요금제</span>
                                <span className="text-lg font-bold text-primary uppercase">
                                    {subData?.tier || 'FREE'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Clock className="w-4 h-4" />
                                <span>만료일: {subData?.expiresAt ? format(new Date(subData.expiresAt), "yyyy년 MM월 dd일", { locale: ko }) : "해당 없음"}</span>
                            </div>

                            {subData?.status !== 'active' && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-xs text-amber-700">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <p>구독이 활성화되지 않은 경우 매물을 등록할 수 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/30 border-t flex flex-col gap-2 p-4">
                        <Link href="/pricing" className="w-full">
                            <Button className="w-full group font-bold">
                                요금제 업그레이드 / 갱신
                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>

                        {subData?.status === 'active' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="w-full text-slate-400 hover:text-red-500 hover:bg-red-50 text-xs gap-2">
                                        <XCircle className="w-3.5 h-3.5" />
                                        구독 해지 신청
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>정말 구독을 해지하시겠습니까?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            구독 해지 시 결제가 취소(환불)되며, 즉시 프리미엄 혜택(매물 무제한 등록 등)이 중단됩니다.
                                            결제 취소는 카드사에 따라 3~5 영업일이 소요될 수 있습니다.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>돌아가기</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => cancelSubscriptionMutation.mutate()}
                                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                                            disabled={cancelSubscriptionMutation.isPending}
                                        >
                                            {cancelSubscriptionMutation.isPending ? "처리 중..." : "네, 해지하겠습니다"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </CardFooter>
                </Card>

                {/* Business Verification Card */}
                <Card className="border-2 border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <CheckCircle className={`w-5 h-5 ${subData?.businessStatus === 'approved' ? 'text-green-500' : 'text-slate-400'}`} />
                            비즈니스 인증
                        </CardTitle>
                        <CardDescription>중개사 자격 및 사업자 인증 상태</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-dashed border-2 border-slate-200">
                            <div className={`text-3xl mb-2 font-black ${businessStatusColors[subData?.businessStatus as keyof typeof businessStatusColors] || "text-slate-400"}`}>
                                {businessStatusLabels[subData?.businessStatus as keyof typeof businessStatusLabels] || "미등록"}
                            </div>
                            <p className="text-sm text-slate-500 text-center">
                                {subData?.businessStatus === 'approved'
                                    ? "모든 인증 절차가 완료되었습니다."
                                    : subData?.status === 'active'
                                        ? "결제가 완료되었습니다. 현재 관리자의 최종 승인을 기다리는 중입니다."
                                        : "사업자 정보를 확인 중입니다. 영업일 기준 1-2일 소요됩니다."}
                            </p>
                        </div>

                        {subData?.status === 'active' && subData?.businessStatus !== 'approved' && (
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex gap-3 items-start animate-pulse">
                                <div className="bg-primary p-1.5 rounded-full mt-0.5">
                                    <Clock className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-primary">최종 승인 대기 중</p>
                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        요금제 구독이 확인되었습니다. 이가이버 대표님(관리자)의 최종 승인 즉시 '매물 관리' 메뉴가 활성화됩니다.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">등록번호</span>
                                <span className="font-medium">{user.businessLicenseNo || "정보 없음"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">상호명</span>
                                <span className="font-medium">{user.businessName || "정보 없음"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subscription History */}
            <Card className="border-2 border-slate-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        결제 내역
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {subData?.history && subData.history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm font-sans">
                                <thead>
                                    <tr className="border-b text-slate-400 font-medium">
                                        <th className="text-left pb-3 px-2">날짜</th>
                                        <th className="text-left pb-3 px-2">요금제</th>
                                        <th className="text-left pb-3 px-2">금액</th>
                                        <th className="text-left pb-3 px-2">상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subData.history.map((sub) => (
                                        <tr key={sub.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-2">
                                                {format(new Date(sub.startDate), "yyyy-MM-dd")}
                                            </td>
                                            <td className="py-3 px-2 font-bold text-primary uppercase">
                                                {sub.planType}
                                            </td>
                                            <td className="py-3 px-2">
                                                {sub.amount.toLocaleString()}원
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    {sub.status === 'success' ? '결제완료' : sub.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            결제 내역이 없습니다.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
