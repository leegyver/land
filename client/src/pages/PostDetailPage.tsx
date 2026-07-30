import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Post, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, Eye, User as UserIcon, Edit, Trash2, MessageSquare, Sparkles, Smile, Image as ImageIcon, X, Loader2 } from "lucide-react";
import DOMPurify from "dompurify";
import { parseYouTubeLinks } from "@/lib/youtube";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";

const categories = {
    qa: { name: "궁금해요 부동산", color: "bg-blue-600" },
    architecture: { name: "건축과 리모델링", color: "bg-emerald-600" },
    stories: { name: "강화도 이야기", color: "bg-amber-600" },
};

const PostDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: post, isLoading } = useQuery<Post>({
        queryKey: [`/api/posts/${id}`],
        queryFn: async () => {
            const res = await fetch(`/api/posts/${id}`);
            if (!res.ok) throw new Error("게시글을 찾을 수 없습니다.");
            return res.json();
        }
    });

    const { data: categoryPosts } = useQuery<Post[]>({
        queryKey: ["/api/posts", post?.category],
        queryFn: async () => {
            const res = await fetch(`/api/posts?category=${post?.category}`);
            if (!res.ok) throw new Error("게시글을 불러올 수 없습니다.");
            return res.json();
        },
        enabled: !!post?.category
    });

    // Increment view count on mount
    useEffect(() => {
        if (id) {
            fetch(`/api/posts/${id}/view`, { method: "POST" }).catch(() => { });
        }
    }, [id]);

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("DELETE", `/api/posts/${id}`);
        },
        onSuccess: () => {
            toast({ title: "삭제 완료", description: "게시글이 삭제되었습니다." });
            queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
            setLocation("/community");
        },
        onError: () => {
            toast({ title: "삭제 실패", description: "오류가 발생했습니다.", variant: "destructive" });
        }
    });

    const [commentContent, setCommentContent] = useState("");
    const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const emojis = ["😊", "😂", "🤣", "😍", "👍", "🙌", "🔥", "😮", "😢", "👏", "🧡", "✨", "💯", "🙏"];

    const { data: comments, isLoading: isLoadingComments } = useQuery<any[]>({
        queryKey: [`/api/posts/${id}/comments`],
        queryFn: async () => {
            const res = await fetch(`/api/posts/${id}/comments`);
            if (!res.ok) throw new Error("댓글을 불러올 수 없습니다.");
            return res.json();
        },
        enabled: !!id
    });

    const commentMutation = useMutation({
        mutationFn: async (content: string) => {
            await apiRequest("POST", `/api/posts/${id}/comments`, {
                content,
                imageUrl: commentImageUrl
            });
        },
        onSuccess: () => {
            setCommentContent("");
            setCommentImageUrl(null);
            toast({ title: "작성 완료", description: "댓글이 등록되었습니다." });
            queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}/comments`] });
        },
        onError: () => {
            toast({ title: "오류", description: "댓글 작성에 실패했습니다.", variant: "destructive" });
        }
    });

    const deleteCommentMutation = useMutation({
        mutationFn: async (commentId: number) => {
            await apiRequest("DELETE", `/api/comments/${commentId}`);
        },
        onSuccess: () => {
            toast({ title: "삭제 완료", description: "댓글이 삭제되었습니다." });
            queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}/comments`] });
        }
    });

    if (isLoading) return (
        <div className="container mx-auto px-4 py-12">
            <Skeleton className="h-10 w-48 mb-8" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-64 mb-12" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    );

    if (!post) return (
        <div className="container mx-auto px-4 py-24 text-center">
            <h2 className="text-2xl font-black">게시글을 찾을 수 없습니다.</h2>
            <Button onClick={() => setLocation("/community")} className="mt-4">목록으로 돌아가기</Button>
        </div>
    );

    const category = (categories as any)[post.category] || { name: post.category, color: "bg-slate-600" };
    const isAuthor = user?.id === post.authorId || user?.role === "admin" || user?.role === "master";

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            <div className="bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 py-12">
                    <Link href="/community" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-bold mb-8 gap-2 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        커뮤니티 목록으로
                    </Link>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Badge className={`${category.color} text-white px-4 py-1 font-black border-none rounded-full`}>
                                {category.name}
                            </Badge>
                            <span className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {post.createdAt ? format(new Date(post.createdAt), "yyyy년 MM월 dd일 HH:mm", { locale: ko }) : ""}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex items-center justify-between pt-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-400 font-bold">작성자</div>
                                    <div className="font-black text-slate-900">{(post as any).author?.nickname || (post as any).author?.username || "익명 이웃"}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-xs text-slate-400 font-bold mb-1">조회수</div>
                                    <div className="flex items-center justify-center gap-1 font-black text-slate-700">
                                        <Eye className="w-4 h-4 text-slate-400" />
                                        {post.viewCount}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Navigation - Top */}
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <Button 
                            variant="outline" 
                            className="rounded-full border-slate-200 hover:bg-slate-50 font-bold"
                            onClick={() => setLocation("/community")}
                        >
                            전체보기
                        </Button>
                        <Button 
                            variant="outline" 
                            className="rounded-full border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 font-bold"
                            onClick={() => setLocation("/community?category=qa")}
                        >
                            궁금해요 부동산
                        </Button>
                        <Button 
                            variant="outline" 
                            className="rounded-full border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 font-bold"
                            onClick={() => setLocation("/community?category=architecture")}
                        >
                            건축과 리모델링
                        </Button>
                        <Button 
                            variant="outline" 
                            className="rounded-full border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 font-bold"
                            onClick={() => setLocation("/community?category=stories")}
                        >
                            강화도 이야기
                        </Button>
                    </div>
                    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
                        <CardContent className="p-8 md:p-12">
                            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-strong:text-blue-600 prose-a:text-blue-600 no-underline"
                                dangerouslySetInnerHTML={{ 
                                    __html: DOMPurify.sanitize(parseYouTubeLinks(post.content), {
                                        ADD_TAGS: ["iframe"],
                                        ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "style"]
                                    }) 
                                }}
                            />



                            {isAuthor && (
                                <div className="flex justify-end gap-3 mt-16 pt-8 border-t border-slate-50">
                                    <Button
                                        variant="outline"
                                        onClick={() => setLocation(`/community/edit/${id}`)}
                                        className="h-12 px-6 rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        수정하기
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            if (confirm("정말로 게시글을 삭제하시겠습니까?")) {
                                                deleteMutation.mutate();
                                            }
                                        }}
                                        className="h-12 px-6 rounded-xl font-bold bg-red-500 hover:bg-red-600"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        삭제하기
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Comments Section */}
                    <Card className="mt-8 rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                        <CardContent className="p-8 md:p-12">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                댓글 <span className="text-blue-600">{comments?.length || 0}</span>
                            </h3>

                            {user ? (
                                <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                                    <Textarea
                                        placeholder="바르고 고운 말로 이웃과 소통해보세요."
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        className="min-h-[100px] border-none bg-transparent focus-visible:ring-0 resize-none p-0"
                                    />
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                    className="h-10 w-10 p-0 rounded-xl hover:bg-slate-200"
                                                >
                                                    <Smile className="w-5 h-5 text-slate-500" />
                                                </Button>
                                                {showEmojiPicker && (
                                                    <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-wrap gap-2 w-48">
                                                        {emojis.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => {
                                                                    setCommentContent(prev => prev + emoji);
                                                                    setShowEmojiPicker(false);
                                                                }}
                                                                className="text-xl hover:scale-125 transition-transform"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-10 w-10 p-0 rounded-xl hover:bg-slate-200"
                                                disabled={isUploading}
                                            >
                                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5 text-slate-500" />}
                                            </Button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
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
                                                        setCommentImageUrl(data.url);
                                                        toast({ title: "사진 첨부 완료", description: "댓글에 사진이 첨부되었습니다." });
                                                    } catch (error) {
                                                        toast({ title: "업로드 실패", description: "사진 첨부 중 오류가 발생했습니다.", variant: "destructive" });
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <Button
                                            onClick={() => {
                                                if (!commentContent.trim() && !commentImageUrl) return;
                                                commentMutation.mutate(commentContent);
                                            }}
                                            disabled={commentMutation.isPending || (!commentContent.trim() && !commentImageUrl)}
                                            className="bg-slate-900 hover:bg-blue-600 text-white font-bold px-6 rounded-xl"
                                        >
                                            등록하기
                                        </Button>
                                    </div>
                                    {commentImageUrl && (
                                        <div className="mt-4 relative inline-block">
                                            <img src={commentImageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                                            <button
                                                onClick={() => setCommentImageUrl(null)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-slate-500 font-medium mb-3">로그인 후 댓글을 남길 수 있습니다.</p>
                                    <Button onClick={() => setLocation("/auth")} variant="outline" className="font-bold">
                                        로그인하기
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-6">
                                {isLoadingComments ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-20 w-full rounded-2xl" />
                                        <Skeleton className="h-20 w-full rounded-2xl" />
                                    </div>
                                ) : comments && comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="group relative pr-10">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                                    <UserIcon className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-bold text-slate-900">{comment.author?.nickname || comment.author?.username || '익명'}</span>
                                                        <span className="text-xs text-slate-400 font-medium">
                                                            {format(new Date(comment.createdAt), "yyyy.MM.dd HH:mm", { locale: ko })}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                                                        {comment.content}
                                                    </p>
                                                    {comment.imageUrl && (
                                                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 max-w-sm">
                                                            <img src={comment.imageUrl} alt="Comment Attachment" className="w-full h-auto cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(comment.imageUrl, '_blank')} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {(user?.role === 'admin' || user?.id === comment.authorId) && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm("댓글을 삭제하시겠습니까?")) deleteCommentMutation.mutate(comment.id);
                                                    }}
                                                    className="absolute top-0 right-0 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="삭제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-slate-400">
                                        아직 등록된 댓글이 없습니다.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation & Other Posts */}
                    <div className="mt-8 space-y-6">
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <Button 
                                variant="outline" 
                                className="rounded-full border-slate-200 hover:bg-slate-50 font-bold"
                                onClick={() => setLocation("/community")}
                            >
                                전체보기
                            </Button>
                            <Button 
                                variant="outline" 
                                className="rounded-full border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 font-bold"
                                onClick={() => setLocation("/community?category=qa")}
                            >
                                궁금해요 부동산
                            </Button>
                            <Button 
                                variant="outline" 
                                className="rounded-full border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 font-bold"
                                onClick={() => setLocation("/community?category=architecture")}
                            >
                                건축과 리모델링
                            </Button>
                            <Button 
                                variant="outline" 
                                className="rounded-full border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 font-bold"
                                onClick={() => setLocation("/community?category=stories")}
                            >
                                강화도 이야기
                            </Button>
                        </div>

                        {categoryPosts && categoryPosts.length > 0 && (
                            <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                                <CardContent className="p-6 md:p-8">
                                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                        이 카테고리의 다른 글
                                    </h3>
                                    <div className="space-y-0">
                                        {categoryPosts.filter(p => p.id !== Number(id)).slice(0, 5).map(p => (
                                            <div key={p.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                <Link href={`/community/${p.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-slate-900 font-bold truncate group-hover:text-blue-600 transition-colors">
                                                            {p.title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-400 font-medium shrink-0">
                                                        <span>{(p as any).author?.nickname || (p as any).author?.username || '익명'}</span>
                                                        <span>{p.createdAt ? format(new Date(p.createdAt), "MM.dd", { locale: ko }) : ''}</span>
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                        {categoryPosts.filter(p => p.id !== Number(id)).length === 0 && (
                                            <div className="p-4 text-center text-slate-500 font-medium">
                                                다른 글이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2 text-center md:text-left">
                                <h3 className="text-2xl font-black flex items-center gap-2 justify-center md:justify-start">
                                    <Sparkles className="w-6 h-6 text-blue-400" />
                                    이가이버 전문가의 도움이 필요하신가요?
                                </h3>
                                <p className="text-slate-300 font-bold">
                                    궁금한 점이 있다면 언제든 1:1 문의를 남겨주세요. 친절히 답변해 드립니다.
                                </p>
                            </div>
                            <Button
                                onClick={() => setLocation("/contact")}
                                className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105"
                            >
                                상담 신청하기
                            </Button>
                        </div>
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetailPage;
