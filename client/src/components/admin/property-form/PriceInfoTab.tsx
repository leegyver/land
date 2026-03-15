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

    return (
        <Card>
            <CardHeader>
                <CardTitle>거래 정보</CardTitle>
                <CardDescription>거래 유형과 가격 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="mb-2 block">거래 유형</Label>
                    <div className="flex flex-wrap gap-4">
                        {dealTypeOptions.map(type => (
                            <div key={type} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`dealType-${type}`}
                                    checked={formData.dealType.includes(type)}
                                    onCheckedChange={(checked) => handleDealTypeChange(type, checked as boolean)}
                                />
                                <Label htmlFor={`dealType-${type}`}>{type}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="deposit">전세금</Label>
                        <Input
                            id="deposit"
                            name="deposit"
                            type="text"
                            value={formData.deposit || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="depositAmount">보증금</Label>
                        <Input
                            id="depositAmount"
                            name="depositAmount"
                            type="text"
                            value={formData.depositAmount || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="monthlyRent">월세</Label>
                        <Input
                            id="monthlyRent"
                            name="monthlyRent"
                            type="text"
                            value={formData.monthlyRent || ""}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="maintenanceFee">관리비</Label>
                    <Input
                        id="maintenanceFee"
                        name="maintenanceFee"
                        type="text"
                        value={formData.maintenanceFee || ""}
                        onChange={handleChange}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
