import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PropertyFormProps } from "./types";
import { dealTypeOptions } from "./constants";
import { formatKoreanPrice } from "@/lib/formatter";

export const PriceInfoTab: React.FC<PropertyFormProps> = ({
    formData,
    handleChange,
    setFormData,
}) => {
    const handleDealTypeChange = (type: string, checked: boolean) => {
        if (checked) {
            setFormData(prev => ({
                ...prev,
                dealType: [...prev.dealType, type],
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                dealType: prev.dealType.filter(t => t !== type),
            }));
        }
    };

    const koreanPrice = formatKoreanPrice(formData.price);
    const koreanDeposit = formatKoreanPrice(formData.deposit);
    const koreanDepositAmount = formatKoreanPrice(formData.depositAmount);
    const koreanMonthlyRent = formatKoreanPrice(formData.monthlyRent);

    return (
        <Card>
            <CardHeader>
                <CardTitle>거래 정보</CardTitle>
                <CardDescription>거래 유형과 매매가, 보증금, 월세 등 가격 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="mb-2 block font-semibold text-slate-800">거래 유형</Label>
                    <div className="flex flex-wrap gap-4">
                        {dealTypeOptions.map(type => (
                            <div key={type} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`dealType-${type}`}
                                    checked={formData.dealType.includes(type)}
                                    onCheckedChange={(checked) => handleDealTypeChange(type, checked as boolean)}
                                />
                                <Label htmlFor={`dealType-${type}`} className="cursor-pointer font-medium">{type}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 매매가 입력 필드 */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="price" className="font-bold text-blue-950 flex items-center gap-1">
                            매매가 (원)
                            {formData.dealType.includes("매매") && (
                                <span className="text-xs text-blue-600 font-medium ml-1">[매매 선택됨]</span>
                            )}
                        </Label>
                        {koreanPrice && (
                            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                                {koreanPrice}
                            </span>
                        )}
                    </div>
                    <Input
                        id="price"
                        name="price"
                        type="text"
                        value={formData.price || ""}
                        onChange={handleChange}
                        placeholder="예: 350000000 (또는 3억 5천)"
                        className="bg-white text-base font-semibold border-blue-200 focus-visible:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500">
                        * 원 단위 숫자(예: 300000000) 또는 한글 금액(예: 3억 5천, 3.5억)으로 입력할 수 있습니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="deposit" className="font-medium">전세금 (원)</Label>
                            {koreanDeposit && (
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    {koreanDeposit}
                                </span>
                            )}
                        </div>
                        <Input
                            id="deposit"
                            name="deposit"
                            type="text"
                            value={formData.deposit || ""}
                            onChange={handleChange}
                            placeholder="예: 100000000 (또는 1억)"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="depositAmount" className="font-medium">보증금 (원)</Label>
                            {koreanDepositAmount && (
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    {koreanDepositAmount}
                                </span>
                            )}
                        </div>
                        <Input
                            id="depositAmount"
                            name="depositAmount"
                            type="text"
                            value={formData.depositAmount || ""}
                            onChange={handleChange}
                            placeholder="예: 20000000 (또는 2000만)"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="monthlyRent" className="font-medium">월세 (원)</Label>
                            {koreanMonthlyRent && (
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                    {koreanMonthlyRent}
                                </span>
                            )}
                        </div>
                        <Input
                            id="monthlyRent"
                            name="monthlyRent"
                            type="text"
                            value={formData.monthlyRent || ""}
                            onChange={handleChange}
                            placeholder="예: 500000 (또는 50만)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maintenanceFee" className="font-medium">관리비 (원)</Label>
                        <Input
                            id="maintenanceFee"
                            name="maintenanceFee"
                            type="text"
                            value={formData.maintenanceFee || ""}
                            onChange={handleChange}
                            placeholder="예: 50000"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
