
import { useState, useRef, useMemo, useCallback } from "react";
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
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";

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
    const isAdmin = user?.role === "admin" || user?.role === "master";
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

    if (isFormOpen) {
        return (
            <div className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary" />
                        {editingNotice ? "공지사항 수정" : "새 공지사항 작성"}
                    </h2>
                    <Button variant="ghost" onClick={() => setIsFormOpen(false)}>
                        <X className="h-4 w-4 mr-2" />
                        취소 및 돌아가기
                    </Button>
                </div>
                <NoticeForm
                    notice={editingNotice}
                    onSuccess={() => setIsFormOpen(false)}
                    onCancel={() => setIsFormOpen(false)}
                />
            </div>
        );
    }

    if (selectedNotice && !isFormOpen) {
        return (
            <div className="bg-white rounded-lg border shadow-sm p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="border-b pb-4">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {selectedNotice.isPinned && <Pin className="h-5 w-5 text-primary fill-primary" />}
                            {selectedNotice.title}
                        </h2>
                        <Button variant="ghost" onClick={() => setSelectedNotice(null)}>
                            <X className="h-4 w-4 mr-2" />
                            목록으로 돌아가기
                        </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {selectedNotice.createdAt && format(new Date(selectedNotice.createdAt), "yyyy.MM.dd HH:mm")}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            조회 {selectedNotice.viewCount}
                        </span>
                    </div>
                </div>

                <div className="py-6 min-h-[300px]">
                    <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedNotice.content || "") }}
                    />
                </div>

                <div className="border-t pt-4 flex justify-between items-center">
                    <div className="space-x-2">
                         {isAdmin && (
                            <Button 
                                variant="outline" 
                                onClick={(e) => handleEdit(selectedNotice, e)}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                수정
                            </Button>
                         )}
                    </div>
                    <Button variant="default" onClick={() => setSelectedNotice(null)}>
                        목록으로
                    </Button>
                </div>
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



        </div>
    );
}

function NoticeForm({ notice, onSuccess, onCancel }: { notice: Notice | null, onSuccess: () => void, onCancel: () => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const quillRef = useRef<ReactQuill>(null);

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

    const quillImageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files ? input.files[0] : null;
            if (!file) return;

            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                if (!res.ok) throw new Error("업로드 실패");
                const data = await res.json();

                const quill = quillRef.current?.getEditor();
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', data.url);
                    quill.setSelection(range.index + 1, 0);
                }

                // Add to thumbnails
                const current = form.getValues("imageUrls") || [];
                form.setValue("imageUrls", [...current, data.url]);

                toast({ title: "사진 첨부 완료", description: "본문에 사진이 삽입되었습니다." });
            } catch (error) {
                toast({ title: "업로드 실패", description: "사진 첨부 중 오류가 발생했습니다.", variant: "destructive" });
            }
        };
    }, [toast, form]);

    const quillModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: quillImageHandler
            }
        }
    }), [quillImageHandler]);

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
                                                                const quill = quillRef.current?.getEditor();
                                                                if (quill) {
                                                                    const range = quill.getSelection(true) || { index: quill.getLength() };
                                                                    quill.insertEmbed(range.index, 'image', url);
                                                                    quill.setSelection(range.index + 1, 0);
                                                                }
                                                                toast({
                                                                    title: "본문에 추가됨",
                                                                    description: "에디터 커서 위치에 사진이 삽입되었습니다.",
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
                                <p className="text-sm text-muted-foreground mt-1">
                                    이 공지사항을 목록 상단과 메인 페이지 배너에 노출합니다.
                                </p>
                            </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between items-end mb-2">
                                <FormLabel>본문 내용</FormLabel>
                                <div className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full tracking-tighter">
                                    상단 툴바의 아이콘을 눌러 사진을 본문에 바로 넣을 수 있습니다.
                                </div>
                            </div>
                            <FormControl>
                                <div className="bg-background rounded-md overflow-hidden border [&_.ql-container]:min-h-[300px] [&_.ql-editor]:text-base [&_.ql-editor]:p-4 [&_.ql-toolbar]:bg-muted/50 [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-container]:border-none">
                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={field.value}
                                        onChange={field.onChange}
                                        modules={quillModules}
                                        placeholder="공지사항 내용을 자유롭게 작성해주세요."
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-6 border-t mt-8">
                    <Button type="button" variant="outline" size="lg" onClick={onCancel}>
                        취소
                    </Button>
                    <Button type="submit" size="lg" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {notice ? "수정하기" : "등록하기"}
                    </Button>
                </div>
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
