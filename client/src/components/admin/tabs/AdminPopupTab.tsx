import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit } from "lucide-react";
import { Popup } from "@shared/schema";

export default function AdminPopupTab() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);

  const { data: popups = [], isLoading } = useQuery<Popup[]>({
    queryKey: ["/api/admin/popups"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/popups", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/popups"] });
      toast({ title: "성공", description: "팝업이 등록되었습니다." });
      setIsDialogOpen(false);
      setEditingPopup(null);
    },
    onError: () => toast({ variant: "destructive", title: "오류", description: "팝업 등록에 실패했습니다." })
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/admin/popups/${id}`, rest);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/popups"] });
      toast({ title: "성공", description: "팝업이 수정되었습니다." });
      setIsDialogOpen(false);
      setEditingPopup(null);
    },
    onError: () => toast({ variant: "destructive", title: "오류", description: "팝업 수정에 실패했습니다." })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/popups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/popups"] });
      toast({ title: "성공", description: "팝업이 삭제되었습니다." });
    },
    onError: () => toast({ variant: "destructive", title: "오류", description: "팝업 삭제에 실패했습니다." })
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/popups/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/popups"] });
      toast({ title: "성공", description: "상태가 변경되었습니다." });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      content: formData.get("content"),
      imageUrl: formData.get("imageUrl"),
      linkUrl: formData.get("linkUrl"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      isActive: formData.get("isActive") === "on",
      displayOrder: parseInt(formData.get("displayOrder") as string || "0", 10),
    };

    if (editingPopup) {
      updateMutation.mutate({ id: editingPopup.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (popup: Popup) => {
    setEditingPopup(popup);
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingPopup(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">팝업창 관리</h2>
          <p className="text-slate-500 mt-1">공지사항 및 이벤트 팝업을 설정합니다.</p>
        </div>
        <Button onClick={openNew} className="rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> 팝업 추가
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <p className="text-center text-slate-500 py-10">로딩 중...</p>
        ) : popups.length === 0 ? (
          <p className="text-center text-slate-500 py-10">등록된 팝업이 없습니다.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popups.map(popup => (
              <div key={popup.id} className="border rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg line-clamp-1">{popup.title}</h3>
                    <Switch 
                      checked={popup.isActive ?? false} 
                      onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: popup.id, isActive: checked })}
                    />
                  </div>
                  {popup.imageUrl && (
                    <img src={popup.imageUrl} alt={popup.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  {popup.startDate || popup.endDate ? (
                    <p className="text-xs text-slate-500 mb-2">
                      기간: {popup.startDate || '상시'} ~ {popup.endDate || '상시'}
                    </p>
                  ) : null}
                  <p className="text-sm text-slate-600 line-clamp-2">{popup.content}</p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => openEdit(popup)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => {
                    if (confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(popup.id);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPopup ? "팝업 수정" : "새 팝업 등록"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" name="title" defaultValue={editingPopup?.title || ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용 (HTML 허용)</Label>
              <Textarea id="content" name="content" defaultValue={editingPopup?.content || ""} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">이미지 URL</Label>
              <Input id="imageUrl" name="imageUrl" defaultValue={editingPopup?.imageUrl || ""} placeholder="/uploads/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkUrl">연결 링크</Label>
              <Input id="linkUrl" name="linkUrl" defaultValue={editingPopup?.linkUrl || ""} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">시작일</Label>
                <Input type="datetime-local" id="startDate" name="startDate" defaultValue={editingPopup?.startDate || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">종료일</Label>
                <Input type="datetime-local" id="endDate" name="endDate" defaultValue={editingPopup?.endDate || ""} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isActive" name="isActive" defaultChecked={editingPopup ? (editingPopup.isActive ?? true) : true} />
              <Label htmlFor="isActive">활성화</Label>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingPopup ? "수정" : "등록"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
