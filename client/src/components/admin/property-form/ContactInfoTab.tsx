import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PropertyFormProps } from "./types";

export const ContactInfoTab: React.FC<PropertyFormProps> = ({
    formData,
    handleChange,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>소유자 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ownerName">소유자</Label>
                        <Input
                            id="ownerName"
                            name="ownerName"
                            value={formData.ownerName || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ownerPhone">소유자 전화</Label>
                        <Input
                            id="ownerPhone"
                            name="ownerPhone"
                            value={formData.ownerPhone || ""}
                            onChange={handleChange}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>임차인 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tenantName">임차인</Label>
                        <Input
                            id="tenantName"
                            name="tenantName"
                            value={formData.tenantName || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tenantPhone">임차인 전화</Label>
                        <Input
                            id="tenantPhone"
                            name="tenantPhone"
                            value={formData.tenantPhone || ""}
                            onChange={handleChange}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>의뢰인 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="clientName">의뢰인</Label>
                        <Input
                            id="clientName"
                            name="clientName"
                            value={formData.clientName || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="clientPhone">의뢰인 전화</Label>
                        <Input
                            id="clientPhone"
                            name="clientPhone"
                            value={formData.clientPhone || ""}
                            onChange={handleChange}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
