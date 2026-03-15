import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Check, X, ShieldCheck, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function RealtorTab() {
    const { toast } = useToast();
    const [editingLicense, setEditingLicense] = useState<Record<number, string>>({});

    const { data: pendingRealtors, isLoading } = useQuery<User[]>({
        queryKey: ["/api/admin/realtors/pending"],
    });

    const verifyMutation = useMutation({
        mutationFn: async ({ id, status, licenseNo }: { id: number, status: 'approved' | 'rejected', licenseNo?: string }) => {
            const res = await fetch(`/api/admin/realtors/${id}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, licenseNo }),
            });
            if (!res.ok) throw new Error("인증 처리에 실패했습니다.");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "처리 완료", description: "중개사 인증 상태가 업데이트되었습니다." });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/realtors/pending"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); // Also refresh user list
        },
        onError: (error: Error) => {
            toast({ title: "오류 발생", description: error.message, variant: "destructive" });
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">중개사 자격 심사</h2>
                        <p className="text-sm text-slate-500 font-sans">대기 중인 비즈니스 인증 요청 {pendingRealtors?.length || 0}건</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 text-sm">심사 대기 명단</h3>
                </div>
                <Table>
                    <TableHeader className="bg-slate-50/30">
                        <TableRow>
                            <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">사용자 (ID)</TableHead>
                            <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">중개사무소 정보</TableHead>
                            <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">등록번호 (수정가능)</TableHead>
                            <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">연락처</TableHead>
                            <TableHead className="text-right font-bold py-4 text-xs uppercase tracking-wider">승인 처리</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingRealtors && pendingRealtors.length > 0 ? (
                            pendingRealtors.map((realtor) => (
                                <TableRow key={realtor.id} className="hover:bg-slate-50/80 transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 p-2 rounded-lg">
                                                <UserIcon className="w-4 h-4 text-slate-500" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 leading-tight">{realtor.nickname || realtor.username}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">ID: {realtor.id}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 font-semibold text-slate-700">
                                        {realtor.businessName || "상호 미입력"}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Input
                                            className="h-8 text-xs font-mono max-w-[180px] bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner"
                                            placeholder="자격증/등록번호 입력"
                                            value={editingLicense[realtor.id] ?? realtor.businessLicenseNo ?? ""}
                                            onChange={(e) => setEditingLicense(prev => ({ ...prev, [realtor.id]: e.target.value }))}
                                        />
                                    </TableCell>
                                    <TableCell className="py-4 text-slate-600 font-medium">
                                        {realtor.phone || "연락처 없음"}
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-green-600 hover:bg-green-700 h-8 px-4 font-black shadow-lg shadow-green-100 transition-all hover:scale-105 active:scale-95"
                                                onClick={() => verifyMutation.mutate({
                                                    id: realtor.id,
                                                    status: 'approved',
                                                    licenseNo: editingLicense[realtor.id] || realtor.businessLicenseNo || undefined
                                                })}
                                                disabled={verifyMutation.isPending}
                                            >
                                                <Check className="w-3.5 h-3.5 mr-1.5" strokeWidth={4} />
                                                승인
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="h-8 px-4 font-black shadow-lg shadow-red-100 transition-all hover:scale-105 active:scale-95"
                                                onClick={() => verifyMutation.mutate({ id: realtor.id, status: 'rejected' })}
                                                disabled={verifyMutation.isPending}
                                            >
                                                <X className="w-3.5 h-3.5 mr-1.5" strokeWidth={4} />
                                                거절
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="py-24 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <Check className="w-12 h-12 mb-4 text-slate-300" />
                                        <p className="text-slate-400 font-bold text-lg">심사 대기 중인 중개사가 없습니다.</p>
                                        <p className="text-slate-400 text-sm mt-1">모든 요청이 이미 처리되었습니다.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
