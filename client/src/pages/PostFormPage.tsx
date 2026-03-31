import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Post, insertPostSchema, InsertPost } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Image as ImageIcon, Loader2, Save, X, Eye, Edit3, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";

const categories = [
    { id: "qa", name: "궁금해요 부동산" },
    { id: "architecture", name: "건축과 리모델링" },
    { id: "stories", name: "강화도 이야기" },
];

const PostFormPage = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const [, setLocation] = useLocation();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isPreview, setIsPreview] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const quillRef = useRef<ReactQuill>(null);

    const { data: post, isLoading: isPostLoading } = useQuery<Post>({
        queryKey: [`/api/posts/${id}`],
        queryFn: async () => {
            const res = await fetch(`/api/posts/${id}`);
            if (!res.ok) throw new Error("게시글을 찾을 수 없습니다.");
            return res.json();
        },
        enabled: isEdit,
    });

    useEffect(() => {
        if (!isAuthLoading && !user) {
            toast({
                title: "권한 없음",
                description: "회원가입 및 로그인 후 게시글을 작성할 수 있습니다.",
                variant: "destructive"
            });
            setLocation("/auth");
        }
    }, [user, isAuthLoading, setLocation, toast]);

    const form = useForm<InsertPost>({
        resolver: zodResolver(insertPostSchema),
        defaultValues: {
            category: "qa",
            title: "",
            content: "",
            imageUrls: [],
        }
    });

    useEffect(() => {
        if (post) {
            form.reset({
                category: post.category,
                title: post.title,
                content: post.content,
                imageUrls: post.imageUrls || [],
            });
            setImages(post.imageUrls || []);
        }
    }, [post, form]);

    const mutation = useMutation({
        mutationFn: async (values: InsertPost) => {
            const res = isEdit
                ? await apiRequest("PATCH", `/api/posts/${id}`, { ...values, imageUrls: images })
                : await apiRequest("POST", "/api/posts", { ...values, imageUrls: images });
            return res.json();
        },
        onSuccess: (data) => {
            toast({ title: isEdit ? "수정 완료" : "작성 완료", description: "게시글이 성공적으로 저장되었습니다." });
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            if (isEdit) queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}`] });
            setLocation(`/community/${data.id}`);
        },
        onError: () => {
            toast({ title: "저장 실패", description: "오류가 발생했습니다.", variant: "destructive" });
        }
    });

    if (isAuthLoading || (!user && !isAuthLoading)) {
        return (
            <div className="flex justify-center p-8 mt-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const quillImageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files ? input.files[0] : null;
            if (!file) return;

            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                if (!res.ok) throw new Error("업로드 실패");
                const data = await res.json();

                // 에디터 커서 위치에 이미지 태그 삽입
                const quill = quillRef.current?.getEditor();
                if (quill) {
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', data.url);
                    // 이미지가 삽입된 다음으로 커서 이동
                    quill.setSelection(range.index + 1, 0);
                }

                // 갤러리/썸네일용 배열에도 추가
                setImages(prev => [...prev, data.url]);
                toast({ title: "사진 첨부 완료", description: "본문에 사진이 삽입되었습니다." });
            } catch (error) {
                toast({ title: "업로드 실패", description: "사진 첨부 중 오류가 발생했습니다.", variant: "destructive" });
            } finally {
                setIsUploading(false);
            }
        };
    }, [toast, setImages, setIsUploading]);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error("업로드 실패");
            const data = await res.json();
            setImages(prev => [...prev, data.url]);
            toast({ title: "업로드 성공", description: "이미지가 추가되었습니다." });
        } catch (error) {
            toast({ title: "업로드 실패", description: "이미지 업로드 중 오류가 발생했습니다.", variant: "destructive" });
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = (values: InsertPost) => {
        mutation.mutate(values);
    };

    if (isEdit && isPostLoading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Skeleton className="h-12 w-48 mb-8" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 py-8">
                    <Link href="/community" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-bold mb-6 gap-2 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        커뮤니티로 돌아가기
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            게시글 <span className="text-blue-600">{isEdit ? "수정" : "작성"}</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsPreview(!isPreview)}
                                className="h-12 px-6 rounded-xl font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-2"
                            >
                                {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {isPreview ? "수정하기" : "미리보기"}
                            </Button>
                            <Button
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={mutation.isPending}
                                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2"
                            >
                                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isEdit ? "수정완료" : "작성완료"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {isPreview ? (
                        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                            <CardContent className="p-8 md:p-12">
                                <div className="mb-8 space-y-4">
                                    <Badge className="bg-blue-600 text-white px-4 py-1 font-black rounded-full border-none">
                                        {categories.find(c => c.id === form.getValues("category"))?.name}
                                    </Badge>
                                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                                        {form.getValues("title") || "제목이 없습니다"}
                                    </h1>
                                </div>
                                <Separator className="mb-12 border-slate-50" />
                                <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-strong:text-blue-600"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.getValues("content") || "*내용이 없습니다*") }}
                                />
                                {images.length > 0 && (
                                    <div className="mt-12 space-y-6">
                                        {images.map((url, i) => (
                                            <div key={i} className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
                                                <img src={url} alt={`첨부 이미지 ${i + 1}`} className="w-full h-auto" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                                    <CardContent className="p-8 md:p-12 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-1">
                                                        <FormLabel className="text-slate-400 font-black text-xs uppercase tracking-widest pl-1">분류</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-700">
                                                                    <SelectValue placeholder="카테고리 선택" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                                                                {categories.map(cat => (
                                                                    <SelectItem key={cat.id} value={cat.id} className="font-bold py-3">{cat.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="md:col-span-2 space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="title"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-slate-400 font-black text-xs uppercase tracking-widest pl-1">제목</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="제목을 입력하세요"
                                                                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-black text-slate-700 focus-visible:ring-blue-500"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {(user?.role === "admin" || user?.role === "master") && (
                                                    <FormField
                                                        control={form.control}
                                                        name="isPinned"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border rounded-2xl bg-red-50/50 border-red-100">
                                                                <FormControl>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="w-5 h-5 accent-red-600 cursor-pointer"
                                                                        checked={field.value || false}
                                                                        onChange={(e) => field.onChange(e.target.checked)}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel className="text-sm font-black text-red-700 cursor-pointer">
                                                                        [관리자 전용] 이 게시글을 상단에 고정합니다. (공지)
                                                                    </FormLabel>
                                                                </div>
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="content"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <FormLabel className="text-slate-400 font-black text-xs uppercase tracking-widest pl-1">본문 내용</FormLabel>
                                                        <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full tracking-tighter">사진과 글씨체를 자유롭게 꾸밀 수 있습니다.</div>
                                                    </div>
                                                    <FormControl>
                                                        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 [&_.ql-container]:min-h-[400px] [&_.ql-container]:text-lg [&_.ql-editor]:p-6 [&_.ql-toolbar]:bg-slate-50 [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:border-none">
                                                            <ReactQuill
                                                                ref={quillRef}
                                                                theme="snow"
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                modules={quillModules}
                                                                placeholder="내용을 작성해주세요. 위 툴바의 '사진 아이콘'을 클릭하면 원하는 위치에 사진을 넣을 수 있습니다."
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-slate-400 font-black text-xs uppercase tracking-widest pl-1">이미지 업로드</FormLabel>
                                                <span className="text-xs font-bold text-slate-400">{images.length}/5개</span>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                                {images.map((url, i) => (
                                                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group shadow-sm">
                                                        <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(i)}
                                                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {images.length < 5 && (
                                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all text-slate-400 group">
                                                        {isUploading ? (
                                                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                                        ) : (
                                                            <>
                                                                <ImageIcon className="w-6 h-6 mb-2 group-hover:text-blue-500 transition-colors" />
                                                                <span className="text-xs font-bold group-hover:text-blue-500 transition-colors">이미지 추가</span>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            disabled={isUploading}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4 mx-4 md:mx-0">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                                        <Sparkles className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-indigo-900 mb-1">작성 팁</h4>
                                        <p className="text-indigo-800/70 text-sm font-bold leading-relaxed">
                                            강화도 매물을 구하시거나 건축 고민이 있으시다면 제목에 지역명을 포함해 주세요. <br />
                                            더 많은 사람들이 관심을 가지고 유익한 정보를 공유해 드릴 것입니다.
                                        </p>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostFormPage;
