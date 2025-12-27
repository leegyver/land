import { useState, useEffect } from "react";
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
import { Loader2, FileSpreadsheet, Calendar, Key, Table2 } from "lucide-react";

interface ImportFromSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SPREADSHEET_ID_KEY = "leegyver_spreadsheet_id";

export function ImportFromSheetModal({ isOpen, onClose }: ImportFromSheetModalProps) {
  const { toast } = useToast();
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [range, setRange] = useState("Sheet1!A2:BA");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const savedSpreadsheetId = localStorage.getItem(SPREADSHEET_ID_KEY);
    if (savedSpreadsheetId) {
      setSpreadsheetId(savedSpreadsheetId);
    }
  }, []);

  const handleSpreadsheetIdChange = (value: string) => {
    setSpreadsheetId(value);
    localStorage.setItem(SPREADSHEET_ID_KEY, value);
  };

  const importMutation = useMutation({
    mutationFn: async (data: { spreadsheetId: string; apiKey: string; range: string; filterDate?: string }) => {
      const res = await apiRequest("POST", "/api/admin/import-from-sheet", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "데이터 가져오기 성공",
          description: `${data.count}개의 매물 데이터를 가져왔습니다.`,
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
        queryClient.invalidateQueries({ queryKey: ["/api/properties/featured"] });
        
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
    
    importMutation.mutate({ 
      spreadsheetId, 
      apiKey, 
      range,
      filterDate: filterDate || undefined
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              구글 스프레드시트에서 데이터 가져오기
            </DialogTitle>
            <DialogDescription>
              구글 스프레드시트에서 부동산 매물 데이터를 직접 가져옵니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="spreadsheetId" className="flex items-center gap-2">
                <Table2 className="w-4 h-4" />
                스프레드시트 ID
              </Label>
              <Input
                id="spreadsheetId"
                value={spreadsheetId}
                onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">저장된 ID는 다음에 자동으로 불러옵니다.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Google API 키
              </Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                placeholder="AIzaSyD..."
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="range" className="flex items-center gap-2">
                <Table2 className="w-4 h-4" />
                데이터 범위
              </Label>
              <Input
                id="range"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="Sheet1!A2:BA"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filterDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                날짜 필터 (선택)
              </Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">A열의 날짜와 비교하여 선택된 날짜 이후의 데이터만 가져옵니다.</p>
            </div>
            
            <div className="bg-muted rounded-lg p-4 space-y-3 text-sm">
              <p className="font-semibold text-base">시트 열 매핑 안내</p>
              
              <div>
                <p className="font-medium text-primary">필수 필드</p>
                <p className="text-muted-foreground">
                  A: 날짜 | B: 지역 | C: 주소 | Y: 유형 | AE: 가격 | AT: 제목 | AU: 설명
                </p>
                <p className="text-muted-foreground">
                  J: 면적(㎡) | P: 방개수 | Q: 욕실개수
                </p>
              </div>
              
              <div>
                <p className="font-medium text-primary">위치/건물 정보</p>
                <p className="text-muted-foreground">
                  G: 건물명 | H: 동호수 | M: 전용면적 | O: 평형
                </p>
                <p className="text-muted-foreground">
                  S: 층수 | T: 총층 | U: 방향 | V: 난방방식 | X: 사용승인일
                </p>
                <p className="text-muted-foreground">
                  AB: 승강기(true/false) | AC: 주차
                </p>
              </div>
              
              <div>
                <p className="font-medium text-primary">토지/금액 정보</p>
                <p className="text-muted-foreground">
                  D: 지목 | E: 용도지역 | AD: 거래종류 | AF: 전세금 | AG: 보증금
                </p>
                <p className="text-muted-foreground">
                  AH: 월세 | AI: 관리비
                </p>
              </div>
              
              <div>
                <p className="font-medium text-primary">연락처 정보</p>
                <p className="text-muted-foreground">
                  AJ: 소유자 | AK: 소유자전화 | AL: 임차인 | AM: 임차인전화
                </p>
                <p className="text-muted-foreground">
                  AN: 의뢰인 | AO: 의뢰인전화
                </p>
              </div>
              
              <div>
                <p className="font-medium text-primary">추가 정보</p>
                <p className="text-muted-foreground">
                  AP: 특이사항 | AQ: 공동중개(true/false) | AR: 매물설명
                </p>
                <p className="text-muted-foreground">
                  AS: 비공개메모 | BA: 유튜브URL
                </p>
              </div>
              
              <div className="pt-2 border-t">
                <p className="font-medium">유형 값 (Y열)</p>
                <p className="text-muted-foreground">
                  토지, 주택, 아파트연립다세대, 원투룸, 상가공장창고펜션
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
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
