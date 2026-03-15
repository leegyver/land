import { Sparkles, MessageSquare, Home, BookOpen } from "lucide-react";

export const CATEGORY_ALL = "all";
export const CATEGORY_QA = "qa";
export const CATEGORY_ARCHITECTURE = "architecture";
export const CATEGORY_STORIES = "stories";

export const categories = [
    { id: CATEGORY_ALL, name: "전체", icon: Sparkles, color: "bg-slate-900", desc: "모든 게시글을 한눈에 확인하세요." },
    { id: CATEGORY_QA, name: "궁금해요 부동산", icon: MessageSquare, color: "bg-blue-600", desc: "부동산 관련 궁금증을 전문가에게 물어보세요." },
    { id: CATEGORY_ARCHITECTURE, name: "건축과 리모델링", icon: Home, color: "bg-emerald-600", desc: "아름다운 집짓기와 리모델링 비법을 공유합니다." },
    { id: CATEGORY_STORIES, name: "강화도 이야기", icon: BookOpen, color: "bg-amber-600", desc: "정겨운 강화도 생활과 숨은 명소 이야기입니다." },
];

export const getCategoryInfo = (id: string) => categories.find(c => c.id === id) || categories[0];
