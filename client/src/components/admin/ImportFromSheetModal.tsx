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
import { Loader2, FileSpreadsheet, Calendar, Table2, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ImportFromSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 기본 스프레드시트 ID
const DEFAULT_SPREADSHEET_ID = "1sfbhHTcrJOanlbzQbYgWC9KleLzyewsbtwYb_oE_0iQ";

export function ImportFromSheetModal({ isOpen, onClose }: ImportFromSheetModalProps) {
  const { toast } = useToast();
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_SPREADSHEET_ID);
  const [filterDate, setFilterDate] = useState("");
  const [selectedSheets, setSelectedSheets] = useState<number[]>([1, 2, 3, 4]);

  const handleSheetToggle = (sheetNum: number) => {
    setSelectedSheets(prev => 
      prev.includes(sheetNum) 
        ? prev.filter(n => n !== sheetNum)
        : [...prev, sheetNum].sort((a, b) => a - b)
    );
  };

  const importMutation = useMutation({
    mutationFn: async (data: { spreadsheetId: string; ranges: string[]; filterDate?: string }) => {
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
    
    if (!spreadsheetId) {
      toast({
        title: "필수 정보 누락",
        description: "스프레드시트 ID는 필수입니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedSheets.length === 0) {
      toast({
        title: "시트 선택 필요",
        description: "최소 하나의 시트를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    // 선택된 시트들의 범위 생성
    const ranges = selectedSheets.map(num => `Sheet${num}!A2:BA`);
    
    importMutation.mutate({ 
      spreadsheetId, 
      ranges,
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
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="스프레드시트 ID"
                className="w-full"
                data-testid="input-spreadsheet-id"
              />
              <p className="text-xs text-muted-foreground">기본값이 설정되어 있습니다.</p>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Table2 className="w-4 h-4" />
                가져올 시트 선택
              </Label>
              <div className="flex flex-wrap gap-4 pt-2">
                {[1, 2, 3, 4].map((sheetNum) => (
                  <div key={sheetNum} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sheet-${sheetNum}`}
                      checked={selectedSheets.includes(sheetNum)}
                      onCheckedChange={() => handleSheetToggle(sheetNum)}
                      data-testid={`checkbox-sheet-${sheetNum}`}
                    />
                    <Label htmlFor={`sheet-${sheetNum}`} className="cursor-pointer">
                      Sheet{sheetNum}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">선택한 시트에서 데이터를 가져옵니다 (기본: 1~4번 시트 모두).</p>
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
                data-testid="input-filter-date"
              />
              <p className="text-xs text-muted-foreground">A열의 날짜와 비교하여 선택된 날짜 이후의 데이터만 가져옵니다.</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4" />
                <span className="font-medium">API 키 안내</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Google API 키는 서버에 안전하게 저장되어 있어 별도 입력이 필요하지 않습니다.
              </p>
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
                  AB: 승강기("유"=체크) | AC: 주차
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
                  AP: 특이사항 | AQ: 담당중개사 | AR: 매물설명
                </p>
                <p className="text-muted-foreground">
                  AS: 비공개메모 | AV-AZ: 이미지1~5 | BA: 유튜브URL
                </p>
              </div>
              
              <div className="pt-2 border-t">
                <p className="font-medium">유형 값 (Y열)</p>
                <p className="text-muted-foreground">
                  토지, 단독, 근린, 아파트, 다세대, 연립, 원투룸, 다가구, 오피스텔, 기타
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
              data-testid="button-cancel"
            >
              취소
            </Button>
            <Button 
              type="submit"
              disabled={importMutation.isPending || !spreadsheetId || selectedSheets.length === 0}
              data-testid="button-import"
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
