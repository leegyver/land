import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PropertyFormProps } from "./types";

interface AdditionalInfoTabProps extends PropertyFormProps {
    user: any;
}

export const AdditionalInfoTab: React.FC<AdditionalInfoTabProps> = ({
    formData,
    handleChange,
    handleCheckboxChange,
    setFormData,
    user,
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>추가 정보</CardTitle>
                <CardDescription>부동산 관련 메모와 추가 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="specialNote">특이사항</Label>
                    <Textarea
                        id="specialNote"
                        name="specialNote"
                        value={formData.specialNote || ""}
                        onChange={handleChange}
                        rows={3}
                    />
                </div>

                <div className="flex items-center space-x-2 pt-2 gap-4">


                    {user?.role === 'admin' && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isLongTerm"
                                checked={formData.isLongTerm}
                                onCheckedChange={(checked) => handleCheckboxChange("isLongTerm", checked as boolean)}
                            />
                            <Label htmlFor="isLongTerm">장기투자</Label>
                        </div>
                    )}

                    <div className="flex items-center space-x-2 flex-1">
                        <Label htmlFor="agentName" className="whitespace-nowrap">담당중개사</Label>
                        <Input
                            id="agentName"
                            name="agentName"
                            value={formData.agentName || ""}
                            onChange={handleChange}
                            placeholder="담당중개사 이름 입력"
                            className="flex-1"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="privateNote">비공개 메모</Label>
                    <Textarea
                        id="privateNote"
                        name="privateNote"
                        value={formData.privateNote || ""}
                        onChange={handleChange}
                        rows={4}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
