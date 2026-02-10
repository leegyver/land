
import React, { useState } from 'react';
import { useSaju } from '@/contexts/SajuContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const SajuFormModal = () => {
    const { isModalOpen, closeSajuModal, saveUserSaju } = useSaju();
    const [dateStr, setDateStr] = useState('');
    const [timeStr, setTimeStr] = useState('');
    const [isLunar, setIsLunar] = useState(false); // Added

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dateStr) return;

        saveUserSaju(new Date(dateStr), timeStr, isLunar); // Pass isLunar
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
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="birthdate" className="text-right">
                            생년월일
                        </Label>
                        <div className="col-span-3 flex gap-2">
                            <Input
                                id="birthdate"
                                type="date"
                                value={dateStr}
                                onChange={(e) => setDateStr(e.target.value)}
                                className="flex-1"
                                required
                            />
                            <div className="flex items-center space-x-2 border rounded-md p-2 bg-gray-50">
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="calendarType"
                                        className="w-4 h-4 text-blue-600"
                                        checked={!isLunar}
                                        onChange={() => setIsLunar(false)}
                                    />
                                    <span className="text-sm text-gray-700">양력</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="calendarType"
                                        className="w-4 h-4 text-blue-600"
                                        checked={isLunar}
                                        onChange={() => setIsLunar(true)}
                                    />
                                    <span className="text-sm text-gray-700">음력</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="birthtime" className="text-right">
                            태어난 시간
                        </Label>
                        <Input
                            id="birthtime"
                            type="time"
                            value={timeStr}
                            onChange={(e) => setTimeStr(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">운세 보기</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SajuFormModal;
