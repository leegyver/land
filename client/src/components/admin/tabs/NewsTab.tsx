import React from "react";
import {
    Loader2,
    Trash2,
    RefreshCw
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
import { News } from "@shared/schema";

interface NewsTabProps {
    news: News[] | undefined;
    isLoadingNews: boolean;
    selectedNews: number[];
    handleSelectNews: (id: number, checked: boolean) => void;
    handleSelectAllNews: (checked: boolean) => void;
    adminNewsPage: number;
    setAdminNewsPage: (page: number) => void;
    ITEMS_PER_PAGE: number;
    safeFormatDate: (dateStr: string | Date | null | undefined, includeTime?: boolean) => string;
    updateNewsMutation: any;
    handleIndividualDelete: (id: number, type: 'news') => void;
    openDeleteConfirm: (type: 'news') => void;
    SmartPagination: React.ComponentType<{
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }>;
}

export const NewsTab: React.FC<NewsTabProps> = ({
    news,
    isLoadingNews,
    selectedNews,
    handleSelectNews,
    handleSelectAllNews,
    adminNewsPage,
    setAdminNewsPage,
    ITEMS_PER_PAGE,
    safeFormatDate,
    updateNewsMutation,
    handleIndividualDelete,
    openDeleteConfirm,
    SmartPagination
}) => {
    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-bold">뉴스 관리</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    {selectedNews.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={() => openDeleteConfirm('news')} className="flex-1 sm:flex-none">
                            <Trash2 className="h-4 w-4 mr-1" /> 삭제 ({selectedNews.length})
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => updateNewsMutation.mutate()} className="flex-1 sm:flex-none">
                        <RefreshCw className="h-4 w-4 mr-1" /> 업데이트
                    </Button>
                </div>
            </div>

            {isLoadingNews ? (
                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop News Table */}
                    <div className="hidden md:block overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]"><Checkbox checked={selectedNews.length === (news?.length || 0)} onCheckedChange={handleSelectAllNews} /></TableHead>
                                    <TableHead className="w-[60px]">ID</TableHead>
                                    <TableHead>제목</TableHead>
                                    <TableHead className="w-[120px]">출처</TableHead>
                                    <TableHead className="w-[120px]">날짜</TableHead>
                                    <TableHead className="w-[80px]">작업</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {news?.slice((adminNewsPage - 1) * ITEMS_PER_PAGE, adminNewsPage * ITEMS_PER_PAGE).map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell><Checkbox checked={selectedNews.includes(item.id)} onCheckedChange={(c) => handleSelectNews(item.id, c === true)} /></TableCell>
                                        <TableCell className="text-xs">{item.id}</TableCell>
                                        <TableCell><span className="font-medium">{item.title}</span></TableCell>
                                        <TableCell className="text-xs text-slate-500">{item.source}</TableCell>
                                        <TableCell className="text-xs">{safeFormatDate(item.createdAt)}</TableCell>
                                        <TableCell>
                                            <button onClick={() => handleIndividualDelete(item.id, 'news')} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 className="h-4 w-4" /></button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile News Cards */}
                    <div className="md:hidden space-y-3">
                        {news?.slice((adminNewsPage - 1) * ITEMS_PER_PAGE, adminNewsPage * ITEMS_PER_PAGE).map((item) => (
                            <div key={item.id} className="bg-white border rounded-lg p-3 shadow-sm border-l-4 border-l-blue-500">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-400">#{item.id} | {item.source}</span>
                                    <Checkbox checked={selectedNews.includes(item.id)} onCheckedChange={(c) => handleSelectNews(item.id, c === true)} />
                                </div>
                                <h4 className="font-bold text-sm mb-2">{item.title}</h4>
                                <div className="flex justify-between items-center text-[10px] text-slate-500">
                                    <span>{safeFormatDate(item.createdAt)}</span>
                                    <Button size="sm" variant="ghost" className="text-red-500 h-6 px-1 text-[10px]" onClick={() => handleIndividualDelete(item.id, 'news')}>삭제</Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {news && news.length > ITEMS_PER_PAGE && (
                        <div className="mt-6 flex justify-center"><SmartPagination currentPage={adminNewsPage} totalPages={Math.ceil(news.length / ITEMS_PER_PAGE)} onPageChange={setAdminNewsPage} /></div>
                    )}
                </div>
            )}
        </div>
    );
};
