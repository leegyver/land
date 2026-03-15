import { Link } from "wouter";
import { MapPin, Phone, ChevronRight } from "lucide-react";
import { type Property } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatKoreanPrice } from "@/lib/formatter";
import { siteConfig } from "@/config/siteConfig";

interface CompactPropertyItemProps {
    property: Property;
}

const hasValidPrice = (value: string | number | null | undefined): boolean => {
    if (value === null || value === undefined || value === '' || value === '0' || value === 0) {
        return false;
    }
    const numValue = Number(value);
    return !isNaN(numValue) && numValue > 0;
};

const CompactPropertyItem = ({ property }: CompactPropertyItemProps) => {
    const phoneNumber = siteConfig.phoneNumber;

    return (
        <div className="bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/50 transition-all p-3 group relative h-full flex flex-col justify-between">
            <div className="space-y-2">
                {/* 메인 정보 영역 */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-1.5 py-0 rounded-[4px] text-[9px] font-bold shrink-0">
                        수집
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-200 bg-white text-[9px] h-4 px-1 rounded-[4px] shrink-0 font-medium">
                        {property.type}
                    </Badge>
                    <div className="flex items-center text-[10px] text-slate-400 font-medium shrink-0 ml-auto">
                        <MapPin className="h-2.5 w-2.5 mr-0.5" />
                        {property.district}
                    </div>
                </div>

                <Link href={`/properties/${property.id}`}>
                    <h3 className="text-sm md:text-base font-black text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer leading-tight tracking-tight h-10">
                        {property.title}
                    </h3>
                </Link>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                    {property.dealType && Array.isArray(property.dealType) && property.dealType
                        .filter(type => ['매매', '전세', '월세'].includes(type))
                        .map((type, index) => (
                            <div key={index} className="flex items-baseline gap-1.5">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{type}</span>
                                <span className="text-sm font-black text-blue-600">
                                    {type === '매매' ? formatKoreanPrice(property.price) :
                                        type === '전세' ? formatKoreanPrice(property.deposit || property.depositAmount) :
                                            `${formatKoreanPrice(property.depositAmount || property.deposit)}${hasValidPrice(property.monthlyRent) ? `/${formatKoreanPrice(property.monthlyRent)}` : ''}`}
                                </span>
                            </div>
                        ))}
                </div>
            </div>

            {/* 액션 영역 */}
            <div className="flex items-center gap-1.5 pt-3 mt-2 border-t border-slate-50">
                {property.source === 'naver' ? (
                    <Link
                        href={`/contact?tab=inquiry&atclNo=${property.atclNo || ''}&title=${encodeURIComponent(property.title)}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-all text-[11px] font-black shadow-sm active:scale-95"
                    >
                        <span>상담문의</span>
                    </Link>
                ) : (
                    <a
                        href={`tel:${phoneNumber}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 text-white py-2 rounded-xl hover:bg-slate-800 transition-all text-[11px] font-black shadow-sm active:scale-95"
                    >
                        <Phone className="w-3 h-3 fill-current" />
                        <span>전화상담</span>
                    </a>
                )}
                <Link href={`/properties/${property.id}`}>
                    <div className="p-2 rounded-xl bg-slate-50 text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer active:scale-95">
                        <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default CompactPropertyItem;
