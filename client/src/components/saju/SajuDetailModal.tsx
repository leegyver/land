
import SajuResult from './SajuResult';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SajuData } from '@/lib/saju';

interface SajuDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    sajuData: SajuData | null;
    username?: string;
}

const SajuDetailModal = ({ isOpen, onClose, sajuData, username }: SajuDetailModalProps) => {
    if (!sajuData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        📜 {username || '나'}의 사주 상세 분석
                        {sajuData.provider && (
                            <span className="text-sm font-normal text-slate-400 ml-2">
                                ({sajuData.provider === 'naver' ? '네이버' : sajuData.provider === 'kakao' ? '카카오' : sajuData.provider})
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        입력하신 생년월일시를 바탕으로 정밀 분석한 결과입니다.
                    </DialogDescription>
                </DialogHeader>

                <SajuResult sajuData={sajuData} username={username} />
            </DialogContent>
        </Dialog>
    );
};

export default SajuDetailModal;
