import React from "react";
import {
    Loader2,
    Trash2,
    FileSpreadsheet
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
import { NewsletterSubscription } from "@shared/schema";

interface NewsletterTabProps {
    selectedNewsletterSubscriptions: number[];
    setSelectedNewsletterSubscriptions: (ids: number[]) => void;
    openDeleteConfirm: (type: 'newsletter') => void;
    newsletterSubscriptions: NewsletterSubscription[] | undefined;
    isLoadingNewsletter: boolean;
    ITEMS_PER_PAGE: number;
    adminNewsletterPage: number;
    setAdminNewsletterPage: (page: number) => void;
    safeFormatDate: (dateStr: string | Date | null | undefined, includeTime?: boolean) => string;
    handleIndividualDelete: (id: number, type: 'newsletter') => void;
    SmartPagination: React.ComponentType<{
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    }>;
}

export const NewsletterTab: React.FC<NewsletterTabProps> = ({
    selectedNewsletterSubscriptions,
    setSelectedNewsletterSubscriptions,
    openDeleteConfirm,
    newsletterSubscriptions,
    isLoadingNewsletter,
    ITEMS_PER_PAGE,
    adminNewsletterPage,
    setAdminNewsletterPage,
    safeFormatDate,
    handleIndividualDelete,
    SmartPagination
}) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">뉴스레터 구독자 관리</h2>
                <div className="flex space-x-2">
                    {selectedNewsletterSubscriptions.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => openDeleteConfirm('newsletter')}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            선택 삭제 ({selectedNewsletterSubscriptions.length})
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (!newsletterSubscriptions) return;
                            const csvContent = "data:text/csv;charset=utf-8,"
                                + "Email,Subscribed At\n"
                                + newsletterSubscriptions.map(s => `${s.email},${s.createdAt}`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "newsletter_leads.csv");
                            document.body.appendChild(link);
                            link.click();
                        }}
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel 내보내기
                    </Button>
                </div>
            </div>

            {isLoadingNewsletter ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedNewsletterSubscriptions.length === (newsletterSubscriptions?.length || 0) && (newsletterSubscriptions?.length || 0) > 0}
                                        onCheckedChange={(checked) => {
                                            if (checked && newsletterSubscriptions) {
                                                setSelectedNewsletterSubscriptions(newsletterSubscriptions.map(s => s.id));
                                            } else {
                                                setSelectedNewsletterSubscriptions([]);
                                            }
                                        }}
                                    />
                                </TableHead>
                                <TableHead>이메일 주소</TableHead>
                                <TableHead>구독 일시</TableHead>
                                <TableHead className="text-right">작업</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!newsletterSubscriptions || newsletterSubscriptions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        구독자가 없습니다.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                newsletterSubscriptions
                                    .slice((adminNewsletterPage - 1) * ITEMS_PER_PAGE, adminNewsletterPage * ITEMS_PER_PAGE)
                                    .map((sub) => (
                                        <TableRow key={sub.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedNewsletterSubscriptions.includes(sub.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedNewsletterSubscriptions([...selectedNewsletterSubscriptions, sub.id]);
                                                        } else {
                                                            setSelectedNewsletterSubscriptions(selectedNewsletterSubscriptions.filter(id => id !== sub.id));
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="font-semibold">{sub.email}</TableCell>
                                            <TableCell>{safeFormatDate(sub.createdAt, true)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700"
                                                    onClick={() => handleIndividualDelete(sub.id, 'newsletter' as any)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                    {newsletterSubscriptions && newsletterSubscriptions.length > ITEMS_PER_PAGE && (
                        <div className="mt-6 flex justify-center border-t pt-4">
                            <SmartPagination
                                currentPage={adminNewsletterPage}
                                totalPages={Math.ceil(newsletterSubscriptions.length / ITEMS_PER_PAGE)}
                                onPageChange={setAdminNewsletterPage}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
