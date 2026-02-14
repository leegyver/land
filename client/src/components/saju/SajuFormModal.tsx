
import SajuForm from './SajuForm';
import { useSaju } from '@/contexts/SajuContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const SajuFormModal = () => {
    const { isModalOpen, closeSajuModal, saveUserSaju } = useSaju();

    const handleSubmit = (date: Date, time: string, isLunar: boolean) => {
        saveUserSaju(date, time, isLunar);
        closeSajuModal();
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={closeSajuModal}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>내 사주 정보 입력</DialogTitle>
                    <DialogDescription>
                        생년월일시를 입력하면 나와 맞는 부동산을 찾아드립니다.<br />
                        (입력된 정보는 브라우저에만 저장됩니다)
                    </DialogDescription>
                </DialogHeader>
                <SajuForm onSubmit={handleSubmit} buttonText="운세 보기" />
            </DialogContent>
        </Dialog>
    );
};

export default SajuFormModal;
