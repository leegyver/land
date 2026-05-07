import { useState, useMemo } from "react";
import { User } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminTabWrapper } from "../AdminShared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShieldCheck, User as UserIcon, MoreVertical, Loader2, Upload, ImageIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminUsersTabProps {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
}

export default function AdminUsersTab({ users, currentUser, isLoading, isError, error, refetch }: AdminUsersTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pagination Logic
  const itemsPerPage = 20;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return users.slice(start, start + itemsPerPage);
  }, [users, page]);

  // Upgrade Dialog State
  const [upgradeDialogState, setUpgradeDialogState] = useState<{
    isOpen: boolean;
    user: User | null;
    subscriptionTier: string;
    durationDays?: number;
    businessData: {
      businessName: string;
      realtorName: string;
      realtorPhone: string;
      realtorAddress: string;
      businessLicenseNo: string;
      realtorPhoto: string;
    };
  }>({
    isOpen: false,
    user: null,
    subscriptionTier: "",
    businessData: {
      businessName: "",
      realtorName: "",
      realtorPhone: "",
      realtorAddress: "",
      businessLicenseNo: "",
      realtorPhoto: ""
    }
  });

  const openUpgradeDialog = (user: User, subscriptionTier: string, durationDays?: number) => {
    setUpgradeDialogState({
      isOpen: true,
      user,
      subscriptionTier,
      durationDays,
      businessData: {
        businessName: user.businessName || "",
        realtorName: user.realtorName || "",
        realtorPhone: user.realtorPhone || "",
        realtorAddress: user.realtorAddress || "",
        businessLicenseNo: user.businessLicenseNo || "",
        realtorPhoto: user.realtorPhoto || ""
      }
    });
  };

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
      
      setUpgradeDialogState(prev => ({
        ...prev,
        businessData: {
          ...prev.businessData,
          realtorPhoto: data.url
        }
      }));
      toast({ title: "사진 업로드 성공", description: "프로필 사진이 성공적으로 첨부되었습니다." });
    } catch (error) {
      console.error(error);
      toast({ title: "업로드 실패", description: "사진 등록 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const closeUpgradeDialog = () => {
    setUpgradeDialogState(prev => ({ ...prev, isOpen: false }));
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "계정 삭제 성공" });
    }
  });

  const updateTierMutation = useMutation({
    mutationFn: async (payload: { id: number, subscriptionTier: string, durationDays?: number } & Partial<typeof upgradeDialogState.businessData>) => 
      apiRequest("PATCH", `/api/admin/users/${payload.id}/tier`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "등급 및 인증 정보가 변경되었습니다." });
      closeUpgradeDialog();
    },
    onError: (err: any) => {
      toast({ title: "변경 실패", description: err.message || "오류가 발생했습니다.", variant: "destructive" });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number, role: string }) => 
      apiRequest("PATCH", `/api/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "권한이 변경되었습니다." });
    }
  });

  const getTierBadge = (user: User) => {
    if (user.role === 'master') return <Badge className="bg-red-600 rounded-full px-2.5 shadow-sm text-[10px] font-bold border-none">마스터</Badge>;
    if (user.role === 'admin') return <Badge className="bg-indigo-600 rounded-full px-2.5 shadow-sm text-[10px] font-bold border-none">관리자</Badge>;
    
    if (user.role === 'realtor') {
      if (user.subscriptionTier === 'lifetime') return <Badge className="bg-purple-600 rounded-full px-2.5 shadow-sm text-[10px] font-bold border-none">평생회원</Badge>;
      if (user.subscriptionTier === 'approved') return <Badge className="bg-blue-600 rounded-full px-2.5 shadow-sm text-[10px] font-bold border-none">공인중개사(승인)</Badge>;
      if (user.subscriptionTier === 'monthly' || user.subscriptionTier === 'yearly') return <Badge className="bg-emerald-600 rounded-full px-2.5 shadow-sm text-[10px] font-bold border-none">공인중개사(결제)</Badge>;
      return <Badge className="bg-slate-500 rounded-full px-2.5 shadow-sm text-[10px] font-bold border-none">무료회원</Badge>;
    }
    
    return <Badge className="bg-slate-500 rounded-full px-2.5 shadow-sm text-[10px] font-bold border-none">무료회원</Badge>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50">
        <h2 className="text-xl font-bold text-slate-900">사용자 등급 및 권한 관리</h2>
        <p className="text-sm text-slate-500 mt-1">7단계 권한 레벨 및 등록 상태 관리</p>
      </div>

      <AdminTabWrapper isLoading={isLoading} isError={isError} error={error} isEmpty={users.length === 0} emptyMessage="사용자가 없습니다." onRetry={refetch}>
        <div id="admin-list-top" className="scroll-mt-20" />
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>사용자 정보</TableHead>
              <TableHead className="hidden md:table-cell">연락처/이메일</TableHead>
              <TableHead>권한 (등급)</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map(u => (
              <TableRow key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white">
                      {(u.nickname || u.username).substring(0,1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{u.nickname || u.username}</div>
                      <div className="text-[10px] text-slate-400">{u.nickname ? u.username : ''}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-xs text-slate-500">{u.email || '-'}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{u.phone || '-'}</div>
                </TableCell>
                <TableCell>
                  {getTierBadge(u)}
                </TableCell>
                <TableCell className="text-right">
                  {u.role !== 'master' ? (
                    <div className="flex items-center justify-end gap-1">
                        {u.id !== currentUser?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">등급 변경</div>
                              <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ id: u.id, role: 'user' })}>
                                무료회원 강등 (초기화)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                openUpgradeDialog(u, 'monthly', 30);
                              }}>
                                공인중개사 (월결제 1개월) 승인/연장
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                openUpgradeDialog(u, 'yearly', 365);
                              }}>
                                공인중개사 (연결제 1년) 승인/연장
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                openUpgradeDialog(u, 'lifetime');
                              }}>
                                👉 평생회원 영구 승급
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ id: u.id, role: 'admin' })}>
                                시스템 관리자(Admin) 권한 부여
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          if (confirm("정말 삭제하시겠습니까? 데이터가 모두 지워집니다.")) deleteMutation.mutate(u.id);
                        }} 
                        disabled={u.id === currentUser?.id}
                        className="text-slate-300 hover:text-red-500 disabled:opacity-30 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold pr-2 whitespace-nowrap">변경 불가 (Root)</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4 border-t border-slate-100 bg-slate-50/50">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => { setPage(p => Math.max(1, p - 1)); document.getElementById('admin-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} 
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = page - 2 + i;
                  if (page <= 2) pageNum = i + 1;
                  else if (page >= totalPages - 1) pageNum = totalPages - 4 + i;
                  
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          isActive={page === pageNum} 
                          onClick={() => { setPage(pageNum); document.getElementById('admin-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); document.getElementById('admin-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} 
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </AdminTabWrapper>

      {/* Upgrade & Business Verification Dialog */}
      <Dialog open={upgradeDialogState.isOpen} onOpenChange={(open) => !open && closeUpgradeDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>비즈니스 인증 및 등급 승급</DialogTitle>
            <DialogDescription>
              결제 회원으로 승급하기 전에 사용자 화면에 노출될 비즈니스 정보(중개사 프로필)를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="businessName" className="text-right">사무실명 (상호명)</Label>
              <Input 
                id="businessName" 
                value={upgradeDialogState.businessData.businessName} 
                onChange={(e) => setUpgradeDialogState(prev => ({ ...prev, businessData: { ...prev.businessData, businessName: e.target.value } }))} 
                className="col-span-3" 
                placeholder="예: 이가이버 공인중개사무소" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="realtorName" className="text-right">중개사 성명</Label>
              <Input 
                id="realtorName" 
                value={upgradeDialogState.businessData.realtorName} 
                onChange={(e) => setUpgradeDialogState(prev => ({ ...prev, businessData: { ...prev.businessData, realtorName: e.target.value } }))} 
                className="col-span-3" 
                placeholder="대표 중개사 이름" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="realtorPhone" className="text-right">연락처</Label>
              <Input 
                id="realtorPhone" 
                value={upgradeDialogState.businessData.realtorPhone} 
                onChange={(e) => setUpgradeDialogState(prev => ({ ...prev, businessData: { ...prev.businessData, realtorPhone: e.target.value } }))} 
                className="col-span-3" 
                placeholder="예: 010-1234-5678" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="realtorAddress" className="text-right">사무실 주소</Label>
              <Input 
                id="realtorAddress" 
                value={upgradeDialogState.businessData.realtorAddress} 
                onChange={(e) => setUpgradeDialogState(prev => ({ ...prev, businessData: { ...prev.businessData, realtorAddress: e.target.value } }))} 
                className="col-span-3" 
                placeholder="사무실 상세 주소" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="businessLicenseNo" className="text-right">등록번호</Label>
              <Input 
                id="businessLicenseNo" 
                value={upgradeDialogState.businessData.businessLicenseNo} 
                onChange={(e) => setUpgradeDialogState(prev => ({ ...prev, businessData: { ...prev.businessData, businessLicenseNo: e.target.value } }))} 
                className="col-span-3" 
                placeholder="중개사무소 등록번호" 
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="realtorPhoto" className="text-right mt-3">프로필 사진</Label>
              <div className="col-span-3 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                    {upgradeDialogState.businessData.realtorPhoto ? (
                      <img src={upgradeDialogState.businessData.realtorPhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label 
                      htmlFor="photo-upload" 
                      className={`flex w-fit items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-md shadow-sm text-sm font-medium ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'} transition-colors`}
                    >
                      {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4 text-slate-500" />}
                      사진 첨부하기
                    </Label>
                    <input 
                      id="photo-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                    />
                  </div>
                </div>
                <Input 
                  id="realtorPhoto" 
                  value={upgradeDialogState.businessData.realtorPhoto} 
                  onChange={(e) => setUpgradeDialogState(prev => ({ ...prev, businessData: { ...prev.businessData, realtorPhoto: e.target.value } }))} 
                  placeholder="또는 이미지 URL 직접 입력" 
                  className="text-xs text-slate-500 h-8"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUpgradeDialog}>취소</Button>
            <Button 
              disabled={updateTierMutation.isPending || updateRoleMutation.isPending} 
              onClick={async () => {
                if (upgradeDialogState.user) {
                  try {
                    await updateRoleMutation.mutateAsync({ id: upgradeDialogState.user.id, role: 'realtor' });
                    await updateTierMutation.mutateAsync({
                      id: upgradeDialogState.user.id,
                      subscriptionTier: upgradeDialogState.subscriptionTier,
                      durationDays: upgradeDialogState.durationDays,
                      ...upgradeDialogState.businessData
                    });
                  } catch (error) {
                    console.error("Mutation failed", error);
                  }
                }
              }}
            >
              {(updateTierMutation.isPending || updateRoleMutation.isPending) ? "적용 중..." : "인증 및 승급 완료!"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
