import React from "react";
import {
    Loader2,
    Trash2,
    MessageSquare,
    Eye
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
import { Post } from "@shared/schema";

interface CommunityTabProps {
    selectedPosts: number[];
    openDeleteConfirm: (type: 'posts') => void;
    isLoadingPosts: boolean;
    adminPostsPageItems: Post[];
    handleSelectAllPosts: (checked: boolean) => void;
    handleSelectPost: (id: number, checked: boolean) => void;
    safeFormatDate: (dateStr: string | Date | null | undefined, includeTime?: boolean) => string;
    handleIndividualDelete: (id: number, type: 'post') => void;
    totalPostPages: number;
    adminPostsPage: number;
    setAdminPostsPage: (page: number) => void;
    SmartPagination: React.ComponentType<{
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }>;
}

export const CommunityTab: React.FC<CommunityTabProps> = ({
    selectedPosts,
    openDeleteConfirm,
    isLoadingPosts,
    adminPostsPageItems,
    handleSelectAllPosts,
    handleSelectPost,
    safeFormatDate,
    handleIndividualDelete,
    totalPostPages,
    adminPostsPage,
    setAdminPostsPage,
    SmartPagination
}) => {
    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    커뮤니티 관리
                </h2>
                {selectedPosts.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={() => openDeleteConfirm('posts')}>
                        <Trash2 className="h-4 w-4 mr-1" /> 선택 삭제 ({selectedPosts.length})
                    </Button>
                )}
            </div>

            {isLoadingPosts ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]"><Checkbox checked={selectedPosts.length === (adminPostsPageItems?.length || 0) && adminPostsPageItems.length > 0} onCheckedChange={handleSelectAllPosts} /></TableHead>
                                    <TableHead className="w-[60px]">ID</TableHead>
                                    <TableHead className="w-[100px]">분류</TableHead>
                                    <TableHead>제목</TableHead>
                                    <TableHead className="w-[100px]">작성자명</TableHead>
                                    <TableHead className="w-[120px]">작성일</TableHead>
                                    <TableHead className="w-[80px]">조회수</TableHead>
                                    <TableHead className="w-[60px]">관리</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adminPostsPageItems.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center py-8">등록된 게시글이 없습니다.</TableCell></TableRow>
                                ) : (
                                    adminPostsPageItems.map((post) => (
                                        <TableRow key={post.id}>
                                            <TableCell><Checkbox checked={selectedPosts.includes(post.id)} onCheckedChange={(c) => handleSelectPost(post.id, c === true)} /></TableCell>
                                            <TableCell className="text-xs">{post.id}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={post.category === 'qa' ? 'text-blue-600 border-blue-200' : post.category === 'architecture' ? 'text-emerald-600 border-emerald-200' : 'text-amber-600 border-amber-200'}>
                                                    {post.category === 'qa' ? '궁금해요' : post.category === 'architecture' ? '건축/리모델링' : '강화도이야기'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-sm max-w-[200px] truncate">
                                                <a href={`/community/${post.id}`} target="_blank" rel="noreferrer" className="hover:underline hover:text-blue-600 flex items-center gap-1">
                                                    {post.title}
                                                    <Eye className="w-3 h-3 text-slate-400" />
                                                </a>
                                            </TableCell>
                                            <TableCell className="text-xs">{(post as any).author?.nickname || (post as any).author?.username || '알 수 없음'}</TableCell>
                                            <TableCell className="text-xs">{safeFormatDate(post.createdAt)}</TableCell>
                                            <TableCell className="text-xs text-center font-medium bg-slate-50">{post.viewCount}</TableCell>
                                            <TableCell>
                                                <button onClick={() => handleIndividualDelete(post.id, 'post')} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-4 w-4" /></button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                        {adminPostsPageItems.map((post) => (
                            <div key={post.id} className="bg-white border rounded-xl p-3 shadow-sm flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400">#{post.id}</span>
                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${post.category === 'qa' ? 'text-blue-600 border-blue-200' : post.category === 'architecture' ? 'text-emerald-600 border-emerald-200' : 'text-amber-600 border-amber-200'}`}>
                                            {post.category === 'qa' ? '궁금해요' : post.category === 'architecture' ? '건축/리모델링' : '강화도이야기'}
                                        </Badge>
                                    </div>
                                    <Checkbox checked={selectedPosts.includes(post.id)} onCheckedChange={(c) => handleSelectPost(post.id, c === true)} />
                                </div>
                                <h4 className="font-bold text-sm line-clamp-2">
                                    <a href={`/community/${post.id}`} target="_blank" rel="noreferrer">{post.title}</a>
                                </h4>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                                    <div className="flex items-center gap-2">
                                        <span>{(post as any).author?.nickname || (post as any).author?.username}</span>
                                        <span className="text-slate-300">|</span>
                                        <span>{safeFormatDate(post.createdAt)}</span>
                                        <span className="text-slate-300">|</span>
                                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {post.viewCount}</span>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-red-500 h-6 px-1 text-[10px]" onClick={() => handleIndividualDelete(post.id, 'post')}>삭제</Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPostPages > 1 && (
                        <div className="mt-6 flex justify-center"><SmartPagination currentPage={adminPostsPage} totalPages={totalPostPages} onPageChange={setAdminPostsPage} /></div>
                    )}
                </div>
            )}
        </div>
    );
};
