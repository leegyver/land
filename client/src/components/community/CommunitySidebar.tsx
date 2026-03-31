import { Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categories } from "./constants";

interface CommunitySidebarProps {
    activeCategory: string;
    setActiveCategory: (id: string) => void;
    sajuData: any;
}

export function CommunitySidebar({ activeCategory, setActiveCategory, sajuData }: CommunitySidebarProps) {
    return (
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 h-fit sticky top-24 w-full">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                카테고리
            </h3>
            <div className="space-y-2">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold ${activeCategory === cat.id
                                ? `${cat.color} text-white shadow-lg shadow-slate-200`
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {cat.name}
                        </button>
                    );
                })}
            </div>

            {sajuData && (
                <div className="mt-8 p-6 rounded-[2rem] bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 relative overflow-hidden group">
                    <div className="relative z-10 space-y-3">
                        <Badge className="bg-indigo-600 text-white font-bold">오늘의 한마디</Badge>
                        <p className="text-indigo-900/80 font-bold text-sm leading-relaxed">
                            "오늘은 {sajuData.tenGods.dayBranch}의 기운이 강한 날입니다. 커뮤니티에서 좋은 소통을 이어가보세요."
                        </p>
                    </div>
                    <Sparkles className="absolute -bottom-4 -right-4 w-16 h-16 text-indigo-200/50 group-hover:scale-125 transition-transform" />
                </div>
            )}
        </div>
    );
}
