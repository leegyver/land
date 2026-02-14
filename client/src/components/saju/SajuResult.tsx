import { SajuData, TwelveStage, getCompatibilityScore, getDailyFortune, getMonthlyFortune, getYearlyFortune, getHealthAnalysis, getDetailedRealEstateAnalysis, getGeneralPaljaSummary } from '@/lib/saju';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Sparkles, Home, Heart, User, HelpCircle, Info } from 'lucide-react';
import { SPIRIT_DESCRIPTIONS, TEN_GOD_DESCRIPTIONS, TWELVE_STAGE_DESCRIPTIONS, PILLAR_DESCRIPTIONS, STEM_BRANCH_DESCRIPTIONS, getCoreTerm } from '@/lib/saju_desc';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface SajuResultProps {
    sajuData: SajuData;
    username?: string;
}

const SajuResult = ({ sajuData, username }: SajuResultProps) => {
    const generalSummary = getGeneralPaljaSummary(sajuData);
    const daily = getDailyFortune(sajuData);
    const monthly = getMonthlyFortune(sajuData);
    const yearly = getYearlyFortune(sajuData);
    const health = getHealthAnalysis(sajuData);
    const realEstate = getDetailedRealEstateAnalysis(sajuData);

    const formatSajuDate = (d: Date, isLunar: boolean) => {
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${isLunar ? '음력' : '양력'})`;
    };

    const renderPillarCard = (label: string, pillarKey: string, charStem: string | undefined, charBranch: string | undefined, tenGodStem: string | undefined, tenGodBranch: string | undefined, twelveStage: string | undefined) => {
        const pillarDesc = PILLAR_DESCRIPTIONS[pillarKey];
        const stemDesc = charStem ? STEM_BRANCH_DESCRIPTIONS[charStem] : null;
        const branchDesc = charBranch ? STEM_BRANCH_DESCRIPTIONS[charBranch] : null;

        const coreTenGodStem = tenGodStem ? getCoreTerm(tenGodStem) : null;
        const coreTenGodBranch = tenGodBranch ? getCoreTerm(tenGodBranch) : null;

        const tenGodStemInfo = coreTenGodStem ? TEN_GOD_DESCRIPTIONS[coreTenGodStem] : null;
        const tenGodBranchInfo = coreTenGodBranch ? TEN_GOD_DESCRIPTIONS[coreTenGodBranch] : (tenGodBranch === '본원' ? TEN_GOD_DESCRIPTIONS['본원'] : null);

        const stageDesc = twelveStage ? TWELVE_STAGE_DESCRIPTIONS[twelveStage as TwelveStage] : null;

        return (
            <Card className="border-indigo-100 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50">
                <CardHeader className="py-2 px-3 bg-indigo-50/50 border-b border-indigo-100/50">
                    <CardTitle className="text-sm font-bold text-indigo-800 flex justify-between items-center">
                        {label}
                        <span className="text-[10px] font-normal text-indigo-400">{pillarDesc}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-4">
                    {/* Character Pair */}
                    <div className="flex justify-center gap-4 py-2 border-b border-dashed border-indigo-100/50">
                        <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">천간</div>
                            <div className="text-2xl font-bold text-slate-800">{charStem || '-'}</div>
                            <div className="text-[10px] text-indigo-600 mt-1">{tenGodStem || '-'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">지지</div>
                            <div className="text-2xl font-bold text-slate-800">{charBranch || '-'}</div>
                            <div className="text-[10px] text-indigo-600 mt-1">{tenGodBranch || '-'}</div>
                        </div>
                    </div>

                    {/* Detailed Analysis In-line */}
                    <div className="space-y-3">
                        {charStem && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-white">{charStem}</Badge>
                                    <span className="text-[10px] font-bold text-slate-600">천간 성향</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed pl-1 border-l-2 border-slate-100 ml-2">{stemDesc}</p>
                            </div>
                        )}

                        {(tenGodStemInfo || (tenGodStem === '본원')) && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-indigo-50 text-indigo-700 border-indigo-100">{tenGodStem}</Badge>
                                    {tenGodStemInfo?.keyword && <Badge variant="secondary" className="text-[9px] h-3 px-1">{tenGodStemInfo.keyword}</Badge>}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed pl-1 border-l-2 border-indigo-100 ml-2">{tenGodStemInfo?.desc || "사주를 해석하는 주요 도구입니다."}</p>
                            </div>
                        )}

                        {charBranch && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-white">{charBranch}</Badge>
                                    <span className="text-[10px] font-bold text-slate-600">지지 성향</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed pl-1 border-l-2 border-slate-100 ml-2">{branchDesc}</p>
                            </div>
                        )}

                        {tenGodBranchInfo && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-indigo-50 text-indigo-700 border-indigo-100">{tenGodBranch}</Badge>
                                    {tenGodBranchInfo?.keyword && <Badge variant="secondary" className="text-[9px] h-3 px-1">{tenGodBranchInfo.keyword}</Badge>}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed pl-1 border-l-2 border-indigo-100 ml-2">{tenGodBranchInfo?.desc || "사주를 해석하는 주요 도구입니다."}</p>
                            </div>
                        )}

                        {twelveStage && (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 bg-slate-50 text-slate-600">{twelveStage}</Badge>
                                    <span className="text-[10px] font-bold text-slate-400">기운의 흐름</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed pl-1 border-l-2 border-slate-100 ml-2">{stageDesc}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="h-full pr-0">
            <div className="space-y-8 pb-10">
                {/* 1. Basic Info Card */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <Card className="flex-1 w-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border-none shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                <User className="h-4 w-4" /> 기본 사주 정보
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">생년월일</span>
                                <span className="font-medium">{formatSajuDate(sajuData.birthDate, sajuData.isLunar)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-500">태어난 시간</span>
                                <span className="font-medium">{sajuData.birthTimeStr || '모름 (자시 적용)'}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-2 rounded-lg mt-2">
                                <span className="font-semibold text-slate-600">타고난 기운</span>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-indigo-700 block">{sajuData.dominantElement} 기운</span>
                                    <span className="text-[10px] text-slate-400 italic">일간: {sajuData.day.heavenlyStem}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Fortune Summary */}
                    <div className="flex-[2] w-full space-y-4">
                        <Card className="border-indigo-100 bg-indigo-50/20 dark:bg-indigo-950/10 shadow-sm border-l-4 border-l-indigo-400">
                            <CardHeader className="py-2.5 px-4">
                                <CardTitle className="text-sm flex items-center gap-2 text-indigo-800 dark:text-indigo-300 uppercase tracking-tighter">
                                    <Sparkles className="h-4 w-4" /> 타고난 성향과 운명 (팔자 총평)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4 px-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {generalSummary || "(분석된 총평 데이터가 없습니다.)"}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 3. Four Pillars - Detailed Cards (Inline Focus) */}
                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            🏛️ 사주팔자 상세 분석
                        </h3>
                        <div className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            기둥별 운명 해설
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderPillarCard("시주(시간)", "시주", sajuData.hour?.heavenlyStem, sajuData.hour?.earthlyBranch, sajuData.tenGods?.timeStem, sajuData.tenGods?.timeBranch, sajuData.twelveStages?.time)}
                        {renderPillarCard("일주(나)", "일주", sajuData.day.heavenlyStem, sajuData.day.earthlyBranch, "본원", sajuData.tenGods?.dayBranch, sajuData.twelveStages?.day)}
                        {renderPillarCard("월주(환경)", "월주", sajuData.month.heavenlyStem, sajuData.month.earthlyBranch, sajuData.tenGods?.monthStem, sajuData.tenGods?.monthBranch, sajuData.twelveStages?.month)}
                        {renderPillarCard("연주(조상)", "연주", sajuData.year.heavenlyStem, sajuData.year.earthlyBranch, sajuData.tenGods?.yearStem, sajuData.tenGods?.yearBranch, sajuData.twelveStages?.year)}
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                            <Info className="h-3 w-3 text-indigo-500" /> 사주팔자란?
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            사람이 태어난 <b>년, 월, 일, 시</b>의 네 기둥(사주)과 여덟 글자(팔자)를 의미합니다. 각 글자는 고유한 기운을 담고 있으며, 이를 통해 타고난 성향과 삶의 지향점을 분석할 수 있습니다.
                        </p>
                    </div>
                </div>

                {/* 4. Spirits (Sinsal) - List View (Inline Focus) */}
                <div className="mt-10">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            ✨ 내 사주의 신살 (Spirits)
                        </h3>
                    </div>

                    {sajuData.spirits && sajuData.spirits.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sajuData.spirits.map((spirit, idx) => {
                                const spiritName = spirit.split('(')[0].trim();
                                const description = SPIRIT_DESCRIPTIONS[spiritName] || "특수한 에너지를 가진 신살입니다.";
                                return (
                                    <div key={idx} className="flex gap-3 p-3 bg-purple-50/40 border border-purple-100 rounded-xl hover:bg-purple-50 transition-colors">
                                        <div className="shrink-0">
                                            <Badge variant="secondary" className="bg-purple-600 text-white border-none px-2 shadow-sm">
                                                {spirit}
                                            </Badge>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-purple-900 leading-normal font-medium">{description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p className="text-sm text-slate-500">특이한 신살이 발견되지 않은 평온하고 무난한 사주입니다.</p>
                        </div>
                    )}
                </div>

                {/* 5. Life Guide Tabs (Fortune, Health, Real Estate) */}
                <div className="mt-10">
                    <Tabs defaultValue="fortune" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100 p-1 rounded-xl">
                            <TabsTrigger value="fortune" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">운세 흐름</TabsTrigger>
                            <TabsTrigger value="realestate" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">부동자산 운</TabsTrigger>
                            <TabsTrigger value="health" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm">체질과 건강</TabsTrigger>
                        </TabsList>

                        <TabsContent value="fortune" className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { key: 'daily', data: daily, label: '오늘의 운세' },
                                    { key: 'monthly', data: monthly, label: '이달의 운세' },
                                    { key: 'yearly', data: yearly, label: '올해의 운세' }
                                ].map((item) => (
                                    <Card key={item.key} className="border-indigo-100 shadow-sm border-t-4 border-t-indigo-500">
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <Badge variant="outline" className="text-[10px] text-indigo-500">{item.label}</Badge>
                                                <span className="text-[10px] text-slate-400">{item.data.date}</span>
                                            </div>
                                            <CardTitle className="text-base text-slate-800">{item.data.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Progress value={item.data.score} className="h-1.5 flex-1" />
                                                <span className="text-xs font-bold text-indigo-600">{item.data.score}점</span>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                {item.data.content}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="realestate" className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-emerald-100 bg-emerald-50/30">
                                    <CardHeader className="pb-3 text-emerald-800">
                                        <CardTitle className="text-base flex items-center gap-2">🏠 매매 및 타이밍</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                                                <span className="text-[10px] text-slate-400 block mb-1">최고의 매수 기운</span>
                                                <p className="text-xs font-bold text-slate-700">{realEstate.buyingTiming}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                                                <span className="text-[10px] text-slate-400 block mb-1">최적의 매도 타이밍</span>
                                                <p className="text-xs font-bold text-slate-700">{realEstate.sellingTiming}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                                                <span className="text-[10px] text-slate-400 block mb-1">행운을 주는 방향</span>
                                                <p className="text-sm font-bold text-emerald-600">{realEstate.luckyDirection || '남향'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                                                <span className="text-[10px] text-slate-400 block mb-1">추천 거주 층수</span>
                                                <p className="text-sm font-bold text-emerald-600">{realEstate.bestFloor}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-emerald-100 bg-emerald-50/30">
                                    <CardHeader className="pb-3 text-emerald-800">
                                        <CardTitle className="text-base flex items-center gap-2">🛋️ 추천 스타일 & 투자</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {(() => {
                                            const compat = getCompatibilityScore(sajuData, { id: 0 });
                                            return (
                                                <div className="space-y-3">
                                                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                                                        <span className="text-[10px] text-slate-400 block mb-1">타고난 투자 스타일: <b>{compat.details?.investment.style}</b></span>
                                                        <p className="text-xs text-slate-600 leading-normal">{compat.details?.investment.advice}</p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                                                        <span className="text-[10px] text-slate-400 block mb-1">행운의 실내 스타일: <b>{compat.details?.styling.colors}</b></span>
                                                        <p className="text-xs text-slate-600 leading-normal">{compat.details?.styling.tip}</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="health" className="mt-6">
                            <Card className="border-rose-100 bg-rose-50/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-rose-800 flex items-center gap-2">🍎 체질적 에너지와 건강식</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white">❤️</div>
                                                <span className="text-sm font-bold text-slate-700">주의 관리 장기</span>
                                            </div>
                                            <p className="text-xl font-bold text-rose-600 mb-2">{health.weakestOrgan}</p>
                                            <p className="text-xs text-slate-500 leading-relaxed">{health.advice}</p>
                                        </div>
                                        <div className="flex-1 bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">🥗</div>
                                                <span className="text-sm font-bold text-slate-700">기운을 보강하는 음식</span>
                                            </div>
                                            <p className="text-base font-bold text-slate-800 mb-2">{health.recommendedFood}</p>
                                            <p className="text-[10px] text-slate-400 mt-2 italic">* 사주 기반 체질 분석 결과로 의학적 진단과는 무관합니다.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default SajuResult;
