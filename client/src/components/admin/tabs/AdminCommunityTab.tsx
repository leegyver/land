import { useState, useMemo } from "react";
import { Post } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminTabWrapper } from "../AdminShared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Pin, PinOff, ExternalLink, PenLine, Plus, Search, Eye, MessageSquare } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Link } from "wouter";

interface PostWithAuthor extends Post {
  author?: {
    id: number;
    username: string;
    nickname?: string;
  } | null;
}

interface AdminCommunityTabProps {
  posts: PostWithAuthor[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
}

const CATEGORY_NAMES: Record<string, { label: string; color: string }> = {
  qa: { label: "궁금해요 부동산", color: "bg-blue-100 text-blue-800 border-blue-200" },
  architecture: { label: "건축과 리모델링", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  stories: { label: "강화도 이야기", color: "bg-amber-100 text-amber-800 border-amber-200" },
  free: { label: "자유게시판", color: "bg-purple-100 text-purple-800 border-purple-200" },
};

export default function AdminCommunityTab({ posts, isLoading, isError, error, refetch }: AdminCommunityTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // 필터링된 게시글
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchCategory = categoryFilter === "all" || post.category === categoryFilter;
      const matchKeyword = !searchKeyword.trim() || 
        post.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (post.authorName && post.authorName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (post.author?.nickname && post.author.nickname.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        (post.author?.username && post.author.username.toLowerCase().includes(searchKeyword.toLowerCase()));
      return matchCategory && matchKeyword;
    });
  }, [posts, categoryFilter, searchKeyword]);

  // Pagination Logic
  const itemsPerPage = 15;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage) || 1;
  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredPosts.slice(start, start + itemsPerPage);
  }, [filteredPosts, page]);

  // 상단 공지 고정 토글
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: number; isPinned: boolean }) => {
      return apiRequest("PATCH", `/api/posts/${id}`, { isPinned });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: variables.isPinned ? "공지 고정 완료" : "고정 해제 완료",
        description: variables.isPinned ? "게시글이 커뮤니티 상단에 고정되었습니다." : "게시글 고정이 해제되었습니다.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "설정 변경 실패",
        description: err.message || "고정 상태를 변경하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  // 게시글 삭제
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "삭제 성공", description: "게시글이 성공적으로 삭제되었습니다." });
    },
    onError: (err: any) => {
      toast({
        title: "삭제 실패",
        description: err.message || "게시글을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  const handleDelete = (id: number, title: string) => {
    if (window.confirm(`"${title}" 게시글을 정말로 삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
      {/* Tab Header */}
      <div className="p-4 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">커뮤니티 게시판 관리</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              총 {posts.length}개
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            강화도 이야기, 부동산 질의응답, 건축/리모델링 게시글을 모니터링하고 공지 고정 및 삭제를 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link
            href="/community/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 text-sm font-bold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>새 칼럼/공지 작성</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 md:px-8 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select 
            value={categoryFilter} 
            onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}
          >
            <SelectTrigger className="w-[180px] rounded-xl border-slate-200">
              <SelectValue placeholder="카테고리 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">카테고리 전체</SelectItem>
              <SelectItem value="qa">궁금해요 부동산</SelectItem>
              <SelectItem value="architecture">건축과 리모델링</SelectItem>
              <SelectItem value="stories">강화도 이야기</SelectItem>
              <SelectItem value="free">자유게시판</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="제목 또는 작성자 검색..."
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* Posts Table */}
      <AdminTabWrapper
        isLoading={isLoading}
        isError={isError}
        error={error}
        isEmpty={filteredPosts.length === 0}
        emptyMessage="조건에 맞는 커뮤니티 게시글이 없습니다."
        onRetry={refetch}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/60">
              <TableRow>
                <TableHead className="w-16 text-center">고정</TableHead>
                <TableHead className="w-36">카테고리</TableHead>
                <TableHead>게시글 제목</TableHead>
                <TableHead className="w-32">작성자</TableHead>
                <TableHead className="w-24 text-center">조회수</TableHead>
                <TableHead className="w-28 text-center hidden md:table-cell">등록일</TableHead>
                <TableHead className="w-32 text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPosts.map((post) => {
                const catInfo = post.category ? CATEGORY_NAMES[post.category] : null;
                const authorDisplay = post.author?.nickname || post.authorName || post.author?.username || "회원";
                
                return (
                  <TableRow key={post.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* 상단 공지 고정 토글 */}
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePinMutation.mutate({ id: post.id, isPinned: !post.isPinned })}
                        title={post.isPinned ? "공지 고정 해제" : "상단 공지로 고정"}
                        className={`h-8 w-8 rounded-lg ${post.isPinned ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-300 hover:text-slate-600'}`}
                      >
                        {post.isPinned ? <Pin className="h-4 w-4 fill-amber-500" /> : <PinOff className="h-4 w-4" />}
                      </Button>
                    </TableCell>

                    {/* 카테고리 뱃지 */}
                    <TableCell>
                      <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${catInfo?.color || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                        {catInfo?.label || post.category || "일반"}
                      </Badge>
                    </TableCell>

                    {/* 제목 */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {post.isPinned && (
                          <Badge className="bg-rose-500 text-white text-[11px] px-1.5 py-0">공지</Badge>
                        )}
                        <a
                          href={`/community/${post.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-slate-900 hover:text-primary transition-colors line-clamp-1 flex items-center gap-1.5"
                        >
                          <span>{post.title}</span>
                          <ExternalLink className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                        </a>
                      </div>
                    </TableCell>

                    {/* 작성자 */}
                    <TableCell className="text-sm text-slate-600 font-medium">
                      {authorDisplay}
                    </TableCell>

                    {/* 조회수 */}
                    <TableCell className="text-center text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        {post.viewCount || 0}
                      </span>
                    </TableCell>

                    {/* 등록일 */}
                    <TableCell className="text-center text-xs text-slate-400 hidden md:table-cell">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString("ko-KR") : "-"}
                    </TableCell>

                    {/* 관리 액션 버튼들 */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/community/edit/${post.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="수정하기"
                        >
                          <PenLine className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post.id, post.title)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="삭제하기"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={page === p}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </AdminTabWrapper>
    </div>
  );
}
