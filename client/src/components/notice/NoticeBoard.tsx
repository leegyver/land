
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Notice, insertNoticeSchema, InsertNotice } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Pencil, Trash2, Pin, Megaphone, Calendar, User, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";

export default function NoticeBoard() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

    const { data: notices, isLoading } = useQuery<Notice[]>({
        queryKey: ["/api/notices"],
    });

    const handleCreate = () => {
        setEditingNotice(null);
        setIsFormOpen(true);
    };

    const handleEdit = (notice: Notice, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNotice(notice);
        setIsFormOpen(true);
    };

    const handleRowClick = (notice: Notice) => {
        setSelectedNotice(notice);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">공지사항</h2>
                </div>
                {isAdmin && (
                    <Button onClick={handleCreate} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        공지 작성
                    </Button>
                )}
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px] text-center">번호</TableHead>
                            <TableHead>제목</TableHead>
                            <TableHead className="w-[100px] text-center">작성일</TableHead>
                            <TableHead className="w-[80px] text-center">조회수</TableHead>
                            {isAdmin && <TableHead className="w-[100px] text-center">관리</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {notices && notices.length > 0 ? (
                            notices.map((notice, index) => (
                                <TableRow
                                    key={notice.id}
                                    className={`cursor-pointer hover:bg-muted/50 ${notice.isPinned ? "bg-muted/30" : ""}`}
                                    onClick={() => handleRowClick(notice)}
                                >
                                    <TableCell className="text-center font-medium">
                                        {notice.isPinned ? (
                                            <Pin className="h-4 w-4 mx-auto text-primary fill-primary" />
                                        ) : (
                                            notices.length - index
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {notice.isPinned && <Badge variant="secondary" className="text-xs">공지</Badge>}
                                            <span className="font-medium">{notice.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground text-sm">
                                        {notice.createdAt && format(new Date(notice.createdAt), "yyyy-MM-dd")}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground text-sm">
                                        {notice.viewCount}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:text-blue-600"
                                                    onClick={(e) => handleEdit(notice, e)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <DeleteNoticeButton id={notice.id} />
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center text-muted-foreground">
                                    등록된 공지사항이 없습니다.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Detail Dialog */}
            <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            {selectedNotice?.isPinned && <Pin className="h-4 w-4 text-primary fill-primary" />}
                            {selectedNotice?.title}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {selectedNotice?.createdAt && format(new Date(selectedNotice.createdAt), "yyyy.MM.dd HH:mm")}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {selectedNotice?.viewCount}
                            </span>
                        </DialogDescription>
                    </DialogHeader>



                    <div className="py-6 min-h-[200px] space-y-6">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedNotice?.content || ""}
                            </ReactMarkdown>
                        </div>

                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedNotice(null)}>
                            닫기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create/Edit Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingNotice ? "공지사항 수정" : "새 공지사항 작성"}</DialogTitle>
                    </DialogHeader>
                    <NoticeForm
                        notice={editingNotice}
                        onSuccess={() => setIsFormOpen(false)}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function NoticeForm({ notice, onSuccess, onCancel }: { notice: Notice | null, onSuccess: () => void, onCancel: () => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<InsertNotice>({
        resolver: zodResolver(insertNoticeSchema),
        defaultValues: notice ? {
            title: notice.title,
            content: notice.content,
            imageUrls: notice.imageUrls || [],
            isPinned: notice.isPinned ?? false,
        } : {
            title: "",
            content: "",
            imageUrls: [],
            isPinned: false,
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: InsertNotice) => {
            if (notice) {
                await apiRequest("PATCH", `/api/notices/${notice.id}`, data);
            } else {
                await apiRequest("POST", "/api/notices", data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notices"] });
            toast({
                title: notice ? "공지사항 수정 완료" : "공지사항 등록 완료",
                description: "공지사항이 성공적으로 저장되었습니다.",
            });
            onSuccess();
        },
        onError: (error) => {
            toast({
                title: "오류 발생",
                description: "공지사항 저장 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>제목</FormLabel>
                            <FormControl>
                                <Input placeholder="공지사항 제목을 입력하세요" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="imageUrls"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>이미지 첨부</FormLabel>
                            <FormControl>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="image-upload"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                const formData = new FormData();
                                                formData.append("file", file);

                                                try {
                                                    const res = await fetch("/api/upload", {
                                                        method: "POST",
                                                        body: formData,
                                                    });
                                                    if (!res.ok) throw new Error("Upload failed");
                                                    const data = await res.json();
                                                    const current = field.value || [];
                                                    field.onChange([...current, data.url]);
                                                } catch (error) {
                                                    toast({
                                                        title: "이미지 업로드 실패",
                                                        variant: "destructive",
                                                    });
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById("image-upload")?.click()}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            이미지 추가
                                        </Button>
                                    </div>

                                    {field.value && field.value.length > 0 && (
                                        <div className="grid grid-cols-3 gap-4">
                                            {field.value.map((url, index) => (
                                                <div key={index} className="relative group aspect-video bg-muted rounded-lg overflow-hidden border">
                                                    <img
                                                        src={url}
                                                        alt={`첨부 이미지 ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                            onClick={() => {
                                                                const content = form.getValues("content");
                                                                const imageMarkdown = `\n![이미지](${url})\n`;
                                                                form.setValue("content", content + imageMarkdown);
                                                                toast({
                                                                    title: "본문에 추가됨",
                                                                    description: "이미지 코드가 본문 맨 끝에 추가되었습니다. 원하는 위치로 옮겨주세요.",
                                                                });
                                                            }}
                                                        >
                                                            본문 삽입
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => {
                                                                const newUrls = field.value?.filter((_, i) => i !== index);
                                                                field.onChange(newUrls);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isPinned"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    상단 고정 (메인 페이지 노출)
                                </FormLabel>
                                <DialogDescription>
                                    이 공지사항을 목록 상단과 메인 페이지 배너에 노출합니다.
                                </DialogDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <Tabs defaultValue="write" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="write">작성하기</TabsTrigger>
                        <TabsTrigger value="preview">미리보기</TabsTrigger>
                    </TabsList>
                    <TabsContent value="write" className="space-y-4">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>내용</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="공지사항 내용을 입력하세요. (마크다운 지원)"
                                            className="min-h-[200px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>
                    <TabsContent value="preview">
                        <div className="min-h-[200px] rounded-md border p-4">
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {form.watch("content") || "작성된 내용이 없습니다."}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        취소
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {notice ? "수정하기" : "등록하기"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

function DeleteNoticeButton({ id }: { id: number }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            await apiRequest("DELETE", `/api/notices/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notices"] });
            toast({
                title: "삭제 완료",
                description: "공지사항이 삭제되었습니다.",
            });
        },
        onError: () => {
            toast({
                title: "오류 발생",
                description: "공지사항 삭제 중 문제가 발생했습니다.",
                variant: "destructive",
            });
        },
    });

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 공지사항이 영구적으로 삭제됩니다.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => mutation.mutate()} className="bg-destructive hover:bg-destructive/90">
                        삭제
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
