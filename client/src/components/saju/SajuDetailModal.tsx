
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SajuData } from '@/lib/saju';
import { Badge } from '@/components/ui/badge';
import { TEN_GOD_DESCRIPTIONS, SPIRIT_DESCRIPTIONS, ELEMENT_DESCRIPTIONS, REAL_ESTATE_TIPS, SHINSAL_REAL_ESTATE, LUCKY_STYLING, getCoreTerm } from '@/lib/saju_desc';

interface SajuDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    sajuData: SajuData | null;
    username?: string;
}

const SajuDetailModal = ({ isOpen, onClose, sajuData, username }: SajuDetailModalProps) => {
    if (!sajuData) return null;

    // Helper to get element color
    const getElementColor = (element: string) => {
        if (element.includes('목')) return 'bg-green-100 text-green-800 border-green-200';
        if (element.includes('화')) return 'bg-red-100 text-red-800 border-red-200';
        if (element.includes('토')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (element.includes('금')) return 'bg-slate-100 text-slate-800 border-slate-200';
        if (element.includes('수')) return 'bg-blue-100 text-blue-800 border-blue-200';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        📜 {username || '나'}의 사주 상세 분석
                    </DialogTitle>
                    <DialogDescription>
                        입력하신 생년월일시를 바탕으로 정밀 분석한 결과입니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* 0. Easy Interpretation (Summary) */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                        <h3 className="font-bold text-lg text-purple-800 mb-2 flex items-center gap-2">
                            💡 한줄 요약
                        </h3>
                        <p className="text-slate-700 leading-relaxed">
                            당신은 <span className="font-bold text-slate-900">{sajuData.day.heavenlyStem}({(sajuData as any).dayElement?.stem})</span>의 기운,
                            즉 <span className="font-bold text-purple-700">{ELEMENT_DESCRIPTIONS[(sajuData as any).dayElement?.stem]?.trait}</span>을(를) 타고났습니다.
                            <br />
                            {ELEMENT_DESCRIPTIONS[(sajuData as any).dayElement?.stem]?.advice}
                        </p>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded border border-purple-100 shadow-sm">
                                <span className="text-xs font-bold text-slate-500 block mb-1">나의 핵심 성향 (월지 십성)</span>
                                <div className="font-medium text-slate-800">
                                    {TEN_GOD_DESCRIPTIONS[getCoreTerm(sajuData.tenGods.monthBranch)]?.keyword || getCoreTerm(sajuData.tenGods.monthBranch)}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {TEN_GOD_DESCRIPTIONS[getCoreTerm(sajuData.tenGods.monthBranch)]?.desc}
                                </div>
                            </div>
                            {(sajuData.spirits && sajuData.spirits.length > 0) && (
                                <div className="bg-white p-3 rounded border border-purple-100 shadow-sm">
                                    <span className="text-xs font-bold text-slate-500 block mb-1">특별한 매력 (신살)</span>
                                    {sajuData.spirits.map((spirit, idx) => {
                                        const core = getCoreTerm(spirit);
                                        return (
                                            <div key={idx} className="mb-1 last:mb-0">
                                                <span className="font-bold text-slate-700">{core}</span>
                                                <span className="text-xs text-slate-500 block">{SPIRIT_DESCRIPTIONS[core] || spirit}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 1. Saju Property Guide (Investment/Location/Style) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            🏠 사주 맞춤 부동산 가이드
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Investment Style */}
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <span className="text-sm font-bold text-orange-700 block mb-2">💰 투자 & 구매 성향</span>
                                <div className="text-sm font-semibold text-slate-800 mb-1">
                                    {REAL_ESTATE_TIPS[getCoreTerm(sajuData.tenGods.monthBranch)]?.style || '안정적인 투자'}
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    {REAL_ESTATE_TIPS[getCoreTerm(sajuData.tenGods.monthBranch)]?.advice}
                                </p>
                            </div>

                            {/* Preferred Location (Shinsal base) */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <span className="text-sm font-bold text-blue-700 block mb-2">📍 추천 입지 특징</span>
                                <p className="text-xs text-slate-600 leading-normal">
                                    {sajuData.spirits && sajuData.spirits.length > 0 ? (
                                        SHINSAL_REAL_ESTATE[getCoreTerm(sajuData.spirits[0])] || '교통이 편리하고 인프라가 갖춰진 도심형 입지를 추천합니다.'
                                    ) : (
                                        '안정적인 주거 환경과 학군이 갖춰진 지역이 유리합니다.'
                                    )}
                                </p>
                            </div>

                            {/* Lucky Styling */}
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <span className="text-sm font-bold text-green-700 block mb-2">🎨 풍수 인테리어 팁</span>
                                <div className="text-xs font-semibold text-slate-800 mb-1">
                                    추천 컬러: <span className="text-green-800">
                                        {LUCKY_STYLING[(sajuData as any).dayElement?.stem || sajuData.dominantElement]?.colors}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-normal">
                                    {LUCKY_STYLING[(sajuData as any).dayElement?.stem || sajuData.dominantElement]?.tip}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 1. Basic Info & Elements */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-semibold text-slate-500 mb-1">본원 (나의 기운)</h4>
                            <div className="text-2xl font-bold text-slate-800">
                                {sajuData.day.heavenlyStem} <span className="text-sm font-normal text-slate-500">
                                    ({(sajuData as any).dayElement?.stem || sajuData.dominantElement})
                                </span>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-semibold text-slate-500 mb-1">부족한 기운</h4>
                            <div className="text-2xl font-bold text-red-500">
                                {sajuData.lackingElement || '없음'}
                            </div>
                        </div>
                    </div>

                    {/* 2. Four Pillars Table */}
                    <div>
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            🏛️ 사주팔자 (Four Pillars)
                        </h3>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-slate-100 p-2 rounded text-xs font-bold text-slate-500">시주(시간)</div>
                            <div className="bg-slate-100 p-2 rounded text-xs font-bold text-slate-500">일주(나)</div>
                            <div className="bg-slate-100 p-2 rounded text-xs font-bold text-slate-500">월주(환경)</div>
                            <div className="bg-slate-100 p-2 rounded text-xs font-bold text-slate-500">연주(조상)</div>

                            {/* Heavenly Stems */}
                            <div className="border rounded p-3 bg-white shadow-sm flex flex-col gap-1 items-center justify-center">
                                <span className="text-xs text-slate-400">천간</span>
                                <span className="text-xl font-bold">{sajuData.hour?.heavenlyStem || '-'}</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                    {sajuData.tenGods?.timeStem?.split('(')[0] || '-'}
                                </Badge>
                            </div>
                            <div className="border-2 border-primary/20 rounded p-3 bg-primary/5 shadow-sm flex flex-col gap-1 items-center justify-center">
                                <span className="text-xs text-slate-400">천간</span>
                                <span className="text-xl font-bold text-primary">{sajuData.day.heavenlyStem}</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1 bg-primary text-white">
                                    본원
                                </Badge>
                            </div>
                            <div className="border rounded p-3 bg-white shadow-sm flex flex-col gap-1 items-center justify-center">
                                <span className="text-xs text-slate-400">천간</span>
                                <span className="text-xl font-bold">{sajuData.month.heavenlyStem}</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                    {sajuData.tenGods?.monthStem?.split('(')[0]}
                                </Badge>
                            </div>
                            <div className="border rounded p-3 bg-white shadow-sm flex flex-col gap-1 items-center justify-center">
                                <span className="text-xs text-slate-400">천간</span>
                                <span className="text-xl font-bold">{sajuData.year.heavenlyStem}</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                    {sajuData.tenGods?.yearStem?.split('(')[0]}
                                </Badge>
                            </div>

                            {/* Earthly Branches */}
                            <div className="border rounded p-3 bg-white shadow-sm flex flex-col gap-1 items-center justify-center">
                                <span className="text-xs text-slate-400">지지</span>
                                <span className="text-xl font-bold">{sajuData.hour?.earthlyBranch || '-'}</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                    {sajuData.tenGods?.timeBranch?.split('(')[0] || '-'}
                                </Badge>
                            </div>
                            <div className="border rounded p-3 bg-white shadow-sm flex flex-col gap-1 items-center justify-center">
                                <span className="text-xs text-slate-400">지지</span>
                                <span className="text-xl font-bold">{sajuData.day.earthlyBranch}</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                    {sajuData.tenGods?.dayBranch?.split('(')[0]}
                                </Badge>
                            </div>
                            <div className="border rounded p-3 bg-white shadow-sm flex flex-col gap-1 items-center justify-center">
                                <span className="text-xs text-slate-400">지지</span>
                                <span className="text-xl font-bold">{sajuData.month.earthlyBranch}</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                    {sajuData.tenGods?.monthBranch?.split('(')[0]}
                                </Badge>
                            </div>
                            <div className="border rounded p-3 bg-white shadow-sm flex flex-col gap-1 items-center justify-center">
                                <span className="text-xs text-slate-400">지지</span>
                                <span className="text-xl font-bold">{sajuData.year.earthlyBranch}</span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                    {sajuData.tenGods?.yearBranch?.split('(')[0]}
                                </Badge>
                            </div>

                            {/* 12 Stages */}
                            <div className="text-xs text-slate-500 font-medium py-1">{sajuData.twelveStages?.time || '-'}</div>
                            <div className="text-xs text-slate-500 font-medium py-1">{sajuData.twelveStages?.day}</div>
                            <div className="text-xs text-slate-500 font-medium py-1">{sajuData.twelveStages?.month}</div>
                            <div className="text-xs text-slate-500 font-medium py-1">{sajuData.twelveStages?.year}</div>
                        </div>
                    </div>

                    {/* 3. Spirits (Sinsal) */}
                    <div>
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            ✨ 신살 (Spirits)
                        </h3>
                        {sajuData.spirits && sajuData.spirits.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {sajuData.spirits.map((spirit, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1 text-sm">
                                        {spirit}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">특이한 신살이 발견되지 않았습니다. (무난한 사주)</p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                            * 신살은 사주의 특수한 기운을 나타내며, 길흉화복의 참고자료입니다.
                        </p>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SajuDetailModal;
