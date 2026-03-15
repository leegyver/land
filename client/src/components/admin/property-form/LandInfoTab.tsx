import React from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { PropertyFormProps } from "./types";
import { landTypeOptions, zoneTypeOptions } from "./constants";

export const LandInfoTab: React.FC<PropertyFormProps> = ({
    formData,
    handleSelectChange,
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>토지 정보</CardTitle>
                <CardDescription>토지 관련 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="landType">지목</Label>
                        <Select
                            value={formData.landType}
                            onValueChange={(value) => handleSelectChange("landType", value)}
                        >
                            <SelectTrigger id="landType">
                                <SelectValue placeholder="지목 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="선택 안함">선택 안함</SelectItem>
                                {landTypeOptions.map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zoneType">용도지역</Label>
                        <Select
                            value={formData.zoneType}
                            onValueChange={(value) => handleSelectChange("zoneType", value)}
                        >
                            <SelectTrigger id="zoneType">
                                <SelectValue placeholder="용도지역 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="선택 안함">선택 안함</SelectItem>
                                {zoneTypeOptions.map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
