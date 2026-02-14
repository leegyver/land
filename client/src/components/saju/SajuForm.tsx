import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import YearMonthDayPicker from '@/components/common/YearMonthDayPicker';

interface SajuFormProps {
    onSubmit: (date: Date, time: string, isLunar: boolean) => void;
    initialDate?: string;
    initialTime?: string;
    initialIsLunar?: boolean;
    buttonText?: string;
}

const SajuForm = ({ onSubmit, initialDate = '', initialTime = '', initialIsLunar = false, buttonText = "운세 보기" }: SajuFormProps) => {
    const [dateStr, setDateStr] = useState(initialDate);
    const [timeStr, setTimeStr] = useState(initialTime);
    const [isLunar, setIsLunar] = useState(initialIsLunar);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dateStr) return;
        onSubmit(new Date(dateStr), timeStr, isLunar);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
            <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="birthdate" className="text-right font-medium">
                        생년월일
                    </Label>
                    <div className="col-span-3 flex flex-col sm:flex-row gap-2">
                        <YearMonthDayPicker
                            value={dateStr}
                            onChange={(val) => setDateStr(val)}
                            className="flex-1"
                        />
                        <div className="flex items-center space-x-4 border rounded-md p-2 bg-gray-50 shrink-0">
                            <span className="text-sm text-slate-500 sm:hidden">달력:</span>
                            <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="calendarTypeForm"
                                    className="w-4 h-4 text-blue-600"
                                    checked={!isLunar}
                                    onChange={() => setIsLunar(false)}
                                />
                                <span className="text-sm text-gray-700">양력</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="calendarTypeForm"
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
                    <Label htmlFor="birthtime" className="text-right font-medium">
                        태어난 시간
                    </Label>
                    <div className="col-span-3">
                        <Input
                            id="birthtime"
                            type="time"
                            value={timeStr}
                            onChange={(e) => setTimeStr(e.target.value)}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            * 정확한 시간을 모르면 비워두셔도 됩니다 (자시 기준으로 분석됨)
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" size="lg" className="w-full sm:w-full px-8 btn-primary-cta h-12 text-lg">
                    {buttonText}
                </Button>
            </div>
        </form>
    );
};

export default SajuForm;
