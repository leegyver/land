import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Banner } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ExternalLink, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card"; // Assuming Card components are from shadcn/ui

interface BannerColumnProps {
    location: "left" | "right";
    title: string;
}

export function BannerColumn({ location, title }: BannerColumnProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [newImageUrl, setNewImageUrl] = useState(() => localStorage.getItem("draftBannerImage_" + location) || "");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [newOpenNewWindow, setNewOpenNewWindow] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // 강제 복구 (화면 깜빡임 대비)
    useEffect(() => {
        const saved = localStorage.getItem("draftBannerImage_" + location);
        if (saved && saved !== newImageUrl) {
            setNewImageUrl(saved);
        }
    }, [location]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setIsUploading(true);
        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setNewImageUrl(data.url);
                localStorage.setItem("draftBannerImage_" + location, data.url);
                toast({ title: "이미지 업로드 성공", description: `이미지가 등록되었습니다. (URL: ${data.url})` });
            } else {
                throw new Error(data.message || "업로드 실패");
            }
        } catch (error: any) {
            toast({ title: "업로드 오류", description: error.message, variant: "destructive" });
            // 실패했을 때만 초기화
            e.target.value = "";
        } finally {
            setIsUploading(false);
        }
    };

    const { data: banners, isLoading } = useQuery<Banner[]>({
        queryKey: [`/api/banners?location=${location}`],
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await apiRequest("POST", "/api/banners", {
                location,
                imageUrl: data.imageUrl,
                linkUrl: data.linkUrl,
                openNewWindow: data.openNewWindow,
                displayOrder: (banners?.length || 0) + 1,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/banners?location=${location}`] });
            setNewImageUrl("");
            localStorage.removeItem("draftBannerImage_" + location);
            setNewLinkUrl("");
            setNewOpenNewWindow(false);
            toast({ title: "배너 추가 성공", description: "배너가 추가되었습니다." });
        },
        onError: (error: Error) => {
            toast({ title: "배너 추가 실패", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/banners/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/banners?location=${location}`] });
            toast({ title: "배너 삭제 성공", description: "배너가 삭제되었습니다." });
        },
        onError: (error: Error) => {
            toast({ title: "배너 삭제 실패", description: error.message, variant: "destructive" });
        },
    });

    const handleAdd = () => {
        // 비상 대책: state가 비어있으면 localStorage에서라도 긁어옵니다.
        const effectiveImageUrl = newImageUrl || localStorage.getItem("draftBannerImage_" + location);

        if (!effectiveImageUrl) {
            toast({ title: "배너 이미지 필수", description: "배너 이미지를 먼저 업로드해주세요.", variant: "destructive" });
            return;
        }

        createMutation.mutate({
            imageUrl: effectiveImageUrl,
            linkUrl: newLinkUrl,
            openNewWindow: newOpenNewWindow
        });
    };

    const handleDelete = (id: number) => {
        deleteMutation.mutate(id);
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination || !banners) return;

        const items = Array.from(banners);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Prepare payload for API
        const reorderPayload = items.map((item, index) => ({
            id: item.id,
            displayOrder: index + 1 // Assuming displayOrder is 1-indexed
        }));

        try {
            await apiRequest("PUT", "/api/banners/order", { items: reorderPayload });
            queryClient.invalidateQueries({ queryKey: [`/api/banners?location=${location}`] });
            toast({ title: "순서 변경 완료", description: "배너 순서가 저장되었습니다." });
        } catch (error: any) {
            toast({ title: "순서 변경 실패", description: error.message || "알 수 없는 오류", variant: "destructive" });
        }
    };

    return (
        <div className="flex-1 bg-gray-50 p-4 rounded-lg">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{title}</h3>
                    <span className="text-sm text-muted-foreground">{banners?.length || 0}개</span>
                </div>

                <Card>
                    <CardContent className="p-4 space-y-4">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId={`banner-list-${location}`}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-4"
                                    >
                                        {isLoading ? (
                                            <div className="text-center py-4">로딩 중...</div>
                                        ) : banners?.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                                등록된 배너가 없습니다
                                            </div>
                                        ) : (
                                            banners?.map((banner, index) => (
                                                <Draggable key={banner.id} draggableId={String(banner.id)} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className="bg-white border rounded-lg p-3 shadow-sm group relative"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600">
                                                                    <GripVertical className="h-5 w-5" />
                                                                </div>
                                                                <div className="h-16 w-24 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                                                                    <img
                                                                        src={banner.imageUrl}
                                                                        alt="Banner"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                                                            #{index + 1}
                                                                        </span>
                                                                        {banner.linkUrl ? (
                                                                            <a
                                                                                href={banner.linkUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-sm text-blue-600 hover:underline truncate block"
                                                                            >
                                                                                {banner.linkUrl}
                                                                            </a>
                                                                        ) : (
                                                                            <span className="text-sm text-gray-400">링크 없음</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <span>{new Date(banner.createdAt!).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleDelete(banner.id);
                                                                    }}
                                                                    disabled={deleteMutation.isPending}
                                                                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium mb-3">새 배너 추가</h4>
                            <div>
                                <Label className="text-xs">이미지 업로드</Label>
                                <div className="flex gap-2 items-center mb-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                        className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-xs file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100
                  "
                                    />
                                </div>
                                {isUploading && <p className="text-xs text-blue-500 mb-2">업로드 중...</p>}

                                {newImageUrl && (
                                    <div className="mt-2 mb-2 relative aspect-[2/1] bg-gray-100 rounded overflow-hidden border">
                                        <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setNewImageUrl("");
                                                localStorage.removeItem("draftBannerImage_" + location);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs">클릭 시 이동할 링크 (선택)</Label>
                                <Input
                                    value={newLinkUrl}
                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={`new-window-${location}`}
                                    checked={newOpenNewWindow}
                                    onCheckedChange={(c) => setNewOpenNewWindow(c === true)}
                                />
                                <Label htmlFor={`new-window-${location}`} className="text-xs font-normal">새 창에서 열기</Label>
                            </div>
                            <div
                                className="w-full h-8 text-sm flex items-center justify-center bg-black text-white rounded cursor-pointer hover:bg-gray-800"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAdd();
                                }}
                            >
                                {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                                추가
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 dark:text-gray-500">
                                상태: {newImageUrl ? "준비됨" : "비어있음"} | 저장소: {localStorage.getItem("draftBannerImage_" + location) ? "있음" : "없음"}
                                <br />URL: {newImageUrl || "(없음)"}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
