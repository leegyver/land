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

    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/user/delete");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "회원 탈퇴 완료", description: "성공적으로 회원 탈퇴 처리되었습니다." });
            window.location.href = "/";
        },
        onError: (error: Error) => {
            toast({ title: "탈퇴 오류", description: error.message, variant: "destructive" });
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

    const getKoreanTierName = (tier: string | undefined, userTier: string | null, role: string) => {
        if (role === 'master') return "👑 마스터 (모든 권한 무제한)";
        if (role === 'admin') return "🛠️ 관리자 (매물 무제한 등록 가능)";
        
        const activeTier = tier || userTier || 'free';
        switch (activeTier) {
            case 'lifetime': return "🔥 평생회원";
            case 'approved': return "✨ 특강 우수중개사 (승인됨)";
            case 'yearly': return "💎 공인중개사 (연결제)";
            case 'monthly': return "💎 공인중개사 (월결제)";
            case 'free': return "🌱 무료회원";
            default: return "🌱 무료회원";
        }
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
                                {user.role === 'admin' || user.role === 'master' ? '관리자 권한' : (subData?.status === 'active' || user.subscriptionTier === 'lifetime' || user.subscriptionTier === 'approved' ? '이용 중' : subData?.status === 'expired' ? '만료됨' : '구독 없음')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                <span className="text-sm font-medium text-slate-500">현재 요금제</span>
                                <span className="text-base md:text-lg font-bold text-primary">
                                    {getKoreanTierName(subData?.tier, user.subscriptionTier, user.role)}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {subData?.history && subData.history.length > 0 && (
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <Clock className="w-4 h-4 text-emerald-500" />
                                        <span>결제(승인)일: {format(new Date((subData.history[0].createdAt || subData.history[0].startDate) as string), "yyyy년 MM월 dd일", { locale: ko })}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span>만료일: {subData?.expiresAt ? format(new Date(subData.expiresAt as string), "yyyy년 MM월 dd일", { locale: ko }) : 
                                        (user.role === 'admin' || user.role === 'master' ? "만료일 없음 (최고 관리자)" :
                                        (subData?.tier === 'lifetime' ? "만료일 없음 (평생회원)" : 
                                         (subData?.tier === 'free' || !subData?.tier ? "해당 없음" : "기한 없음 (관리자 특별 승인)")))
                                    }</span>
                                </div>
                            </div>

                            {(subData?.status !== 'active' && user.role !== 'admin' && user.role !== 'master') && (
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

                        <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
                            {user.realtorPhoto && (
                                <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-2 sm:gap-4 pb-3 border-b border-slate-50/50">
                                    <span className="text-slate-500 whitespace-nowrap">제출 서류</span>
                                    <div className="flex justify-end pr-1 pb-1">
                                        <div className="relative group overflow-hidden rounded-lg border border-slate-200 hover:border-primary/50 transition-colors shadow-sm">
                                            <img 
                                                src={user.realtorPhoto} 
                                                alt="사업자/자격증명" 
                                                className="w-32 h-auto object-cover hover:scale-105 transition-transform duration-300" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-4">
                                <span className="text-slate-500 whitespace-nowrap">상호명</span>
                                <span className="font-medium text-right break-words">{user.businessName || "정보 없음"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-4">
                                <span className="text-slate-500 whitespace-nowrap">대표 공인중개사</span>
                                <span className="font-medium text-right break-words">{user.realtorName || "정보 없음"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-4">
                                <span className="text-slate-500 whitespace-nowrap">연락처</span>
                                <span className="font-medium text-right break-words">{user.realtorPhone || "정보 없음"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-4">
                                <span className="text-slate-500 whitespace-nowrap">사무실 주소</span>
                                <span className="font-medium text-right break-words">{user.realtorAddress || "정보 없음"}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-4">
                                <span className="text-slate-500 whitespace-nowrap">등록번호</span>
                                <span className="font-medium text-right break-words">{user.businessLicenseNo || "정보 없음"}</span>
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
                                                {sub.startDate ? format(new Date(sub.startDate as string), "yyyy-MM-dd") : "-"}
                                            </td>
                                            <td className="py-3 px-2 font-bold text-primary uppercase">
                                                {sub.planType}
                                            </td>
                                            <td className="py-3 px-2">
                                                {sub.amount.toLocaleString()}원
                                            </td>
                                            <td className="py-3 px-2">
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    {sub.status === 'success' || sub.status === 'active' ? '결제완료' : sub.status === 'expired' ? '만료됨' : sub.status}
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

            {/* Account Deletion */}
            <div className="flex justify-end pt-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="text-xs text-slate-400 hover:text-red-500 hover:bg-transparent">
                            회원 탈퇴
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>
                                탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다. 계속하시겠습니까?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => deleteAccountMutation.mutate()}
                                className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                                disabled={deleteAccountMutation.isPending}
                            >
                                {deleteAccountMutation.isPending ? "처리 중..." : "탈퇴하기"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
