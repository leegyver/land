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

export const DetailInfoTab: React.FC<PropertyFormProps> = ({
    formData,
    handleChange,
    handleCheckboxChange,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>위치 정보</CardTitle>
                    <CardDescription>건물 및 상세 위치 정보를 입력하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="buildingName">건물명</Label>
                        <Input
                            id="buildingName"
                            name="buildingName"
                            value={formData.buildingName || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="unitNumber">동호수</Label>
                        <Input
                            id="unitNumber"
                            name="unitNumber"
                            value={formData.unitNumber || ""}
                            onChange={handleChange}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>면적 정보</CardTitle>
                    <CardDescription>상세 면적 정보를 입력하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="supplyArea">공급(평)</Label>
                        <Input
                            id="supplyArea"
                            name="supplyArea"
                            type="text"
                            value={formData.supplyArea || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="privateArea">전용(평)</Label>
                        <Input
                            id="privateArea"
                            name="privateArea"
                            type="text"
                            value={formData.privateArea || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="areaSize">평형</Label>
                        <Input
                            id="areaSize"
                            name="areaSize"
                            value={formData.areaSize || ""}
                            onChange={handleChange}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>건물 정보</CardTitle>
                    <CardDescription>건물에 대한 상세 정보를 입력하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="floor">층수</Label>
                            <Input
                                id="floor"
                                name="floor"
                                type="text"
                                value={formData.floor || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="totalFloors">총층</Label>
                            <Input
                                id="totalFloors"
                                name="totalFloors"
                                type="number"
                                value={formData.totalFloors || ""}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="direction">방향</Label>
                        <Input
                            id="direction"
                            name="direction"
                            value={formData.direction || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="elevator"
                            checked={formData.elevator}
                            onCheckedChange={(checked) => handleCheckboxChange("elevator", checked as boolean)}
                        />
                        <Label htmlFor="elevator">승강기 있음</Label>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="parking">주차</Label>
                        <Input
                            id="parking"
                            name="parking"
                            value={formData.parking || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="heatingSystem">난방방식</Label>
                        <Input
                            id="heatingSystem"
                            name="heatingSystem"
                            value={formData.heatingSystem || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="approvalDate">사용승인</Label>
                        <Input
                            id="approvalDate"
                            name="approvalDate"
                            value={formData.approvalDate || ""}
                            onChange={handleChange}
                            placeholder="YYYY-MM-DD"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
