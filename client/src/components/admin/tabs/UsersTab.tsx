import React from "react";
import {
    Loader2,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User } from "@shared/schema";

interface UsersTabProps {
    users: User[] | undefined;
    isLoadingUsers: boolean;
    selectedUsers: number[];
    handleSelectUser: (id: number, checked: boolean) => void;
    handleSelectAllUsers: (checked: boolean) => void;
    adminUsersPage: number;
    setAdminUsersPage: (page: number) => void;
    ITEMS_PER_PAGE: number;
    setTargetUser: (user: User) => void;
    setRealtorInfo: (info: any) => void;
    setIsRealtorModalOpen: (open: boolean) => void;
    handleIndividualDelete: (id: number, type: 'user') => void;
    openDeleteConfirm: (type: 'users') => void;
    SmartPagination: React.ComponentType<{
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }>;
}

export const UsersTab: React.FC<UsersTabProps> = ({
    users,
    isLoadingUsers,
    selectedUsers,
    handleSelectUser,
    handleSelectAllUsers,
    adminUsersPage,
    setAdminUsersPage,
    ITEMS_PER_PAGE,
    setTargetUser,
    setRealtorInfo,
    setIsRealtorModalOpen,
    handleIndividualDelete,
    openDeleteConfirm,
    SmartPagination
}) => {
    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">사용자 관리</h2>
                {selectedUsers.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={() => openDeleteConfirm('users')}>
                        <Trash2 className="h-4 w-4 mr-1" /> 삭제 ({selectedUsers.length})
                    </Button>
                )}
            </div>

            {isLoadingUsers ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
                <div className="space-y-4">
                    <div className="hidden md:block overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]"><Checkbox checked={selectedUsers.length === (users?.length || 0)} onCheckedChange={handleSelectAllUsers} /></TableHead>
                                    <TableHead>사용자명</TableHead>
                                    <TableHead>별명</TableHead>
                                    <TableHead>전화번호</TableHead>
                                    <TableHead>가입경로</TableHead>
                                    <TableHead>이메일</TableHead>
                                    <TableHead className="w-[80px]">역할</TableHead>
                                    <TableHead className="w-[60px]">작업</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.slice((adminUsersPage - 1) * ITEMS_PER_PAGE, adminUsersPage * ITEMS_PER_PAGE).map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell><Checkbox checked={selectedUsers.includes(user.id)} onCheckedChange={(c) => handleSelectUser(user.id, c === true)} /></TableCell>
                                        <TableCell className="font-medium text-sm">{user.username}</TableCell>
                                        <TableCell className="text-sm">{user.nickname || "-"}</TableCell>
                                        <TableCell className="text-xs">{user.phone || "-"}</TableCell>
                                        <TableCell>
                                            {user.provider ? <Badge variant="outline" className="text-[10px]">{user.provider}</Badge> : <span className="text-xs text-slate-400">일반</span>}
                                        </TableCell>
                                        <TableCell className="text-xs">{user.email}</TableCell>
                                        <TableCell><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'realtor' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{user.role}</span></TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {user.role !== 'admin' && (
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 px-2 text-[10px] text-blue-600 border border-blue-100 hover:bg-blue-50"
                                                        onClick={() => {
                                                            setTargetUser(user);
                                                            setRealtorInfo({
                                                                businessName: (user as any).businessName || "",
                                                                realtorName: (user as any).realtorName || user.username || "",
                                                                realtorPhone: (user as any).realtorPhone || user.phone || "",
                                                                realtorPhoto: (user as any).realtorPhoto || "",
                                                                realtorAddress: (user as any).realtorAddress || "",
                                                                realtorLicenseNo: (user as any).realtorLicenseNo || ""
                                                            });
                                                            setIsRealtorModalOpen(true);
                                                        }}
                                                    >
                                                        {user.role === 'realtor' ? '정보수정' : '중개사승인'}
                                                    </Button>
                                                )}
                                                <button onClick={() => handleIndividualDelete(user.id, 'user')} className="p-1 text-red-400 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="md:hidden space-y-3">
                        {users?.slice((adminUsersPage - 1) * ITEMS_PER_PAGE, adminUsersPage * ITEMS_PER_PAGE).map((user) => (
                            <div key={user.id} className="bg-white border rounded-xl p-3 shadow-sm flex justify-between items-center group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm">{user.username} {user.nickname && <span className="text-blue-500 font-normal">({user.nickname})</span>}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{user.role}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500">{user.email}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">{user.phone || "전화번호 없음"}</div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Checkbox checked={selectedUsers.includes(user.id)} onCheckedChange={(c) => handleSelectUser(user.id, c === true)} />
                                    <button onClick={() => handleIndividualDelete(user.id, 'user')} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {users && users.length > ITEMS_PER_PAGE && (
                        <div className="mt-6 flex justify-center"><SmartPagination currentPage={adminUsersPage} totalPages={Math.ceil(users.length / ITEMS_PER_PAGE)} onPageChange={setAdminUsersPage} /></div>
                    )}
                </div>
            )}
        </div>
    );
};
