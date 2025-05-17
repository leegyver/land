import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ImportFromSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportFromSheetModal({ isOpen, onClose }: ImportFromSheetModalProps) {
  const { toast } = useToast();
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [range, setRange] = useState("Sheet1!A2:Z");

  const importMutation = useMutation({
    mutationFn: async (data: { spreadsheetId: string; apiKey: string; range: string }) => {
      const res = await apiRequest("POST", "/api/admin/import-from-sheet", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "데이터 가져오기 성공",
          description: `${data.count}개의 매물 데이터를 가져왔습니다.`,
        });
        
        // 성공 후 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
        queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
        
        // 모달 닫기
        onClose();
      } else {
        toast({
          title: "데이터 가져오기 실패",
          description: data.error || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "데이터 가져오기 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!spreadsheetId || !apiKey) {
      toast({
        title: "필수 정보 누락",
        description: "스프레드시트 ID와 API 키는 필수입니다.",
        variant: "destructive",
      });
      return;
    }
    
    importMutation.mutate({ spreadsheetId, apiKey, range });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>구글 스프레드시트에서 데이터 가져오기</DialogTitle>
            <DialogDescription>
              구글 스프레드시트에서 부동산 매물 데이터를 직접 가져옵니다. 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="spreadsheetId" className="text-right">
                스프레드시트 ID
              </Label>
              <Input
                id="spreadsheetId"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="col-span-3"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                Google API 키
              </Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="col-span-3"
                type="password"
                placeholder="AIzaSyD..."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="range" className="text-right">
                데이터 범위
              </Label>
              <Input
                id="range"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="col-span-3"
                placeholder="Sheet1!A2:Z"
              />
            </div>
            
            <div className="col-span-4">
              <DialogDescription className="text-xs">
                <p className="mt-2 font-semibold">시트 포맷 안내:</p>
                <p>열 구성: A:제목, B:설명, C:유형, D:가격, E:주소, F:지역, G:면적, H:침실수, I:욕실수, J:층수, K:총층수, L:이미지URL</p>
                <p>
                  유형은 다음 중 하나여야 합니다: 토지, 주택, 아파트연립다세대, 원투룸, 상가공장창고펜션
                </p>
              </DialogDescription>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={importMutation.isPending}
            >
              취소
            </Button>
            <Button 
              type="submit"
              disabled={importMutation.isPending || !spreadsheetId || !apiKey}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가져오는 중...
                </>
              ) : (
                "데이터 가져오기"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}