import { useEffect } from 'react';
import { useSaju } from '@/contexts/SajuContext';
import { useAuth } from '@/hooks/use-auth';
import SajuForm from '@/components/saju/SajuForm';
import SajuResult from '@/components/saju/SajuResult';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogIn, RefreshCcw, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

const SajuPage = () => {
    const { sajuData, saveUserSaju, openSajuModal } = useSaju();
    const { user } = useAuth();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleFormSubmit = (date: Date, time: string, isLunar: boolean) => {
        saveUserSaju(date, time, isLunar);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[80vh]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">나의 부동산 사주</h1>
                    <p className="text-gray-600">
                        나의 타고난 기운(사주)을 분석하여 가장 잘 맞는 부동산 투자 방향과 인테리어 팁을 알려드립니다.
                    </p>
                </div>
                {sajuData && (
                    <Button variant="outline" onClick={openSajuModal} className="shrink-0 gap-2">
                        <RefreshCcw size={16} />
                        정보 수정하기
                    </Button>
                )}
            </div>

            {user ? (
                sajuData ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-end mb-4">
                            <Link href="/properties?recommend=true">
                                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md animate-bounce items-center gap-2 flex">
                                    <Sparkles className="w-4 h-4" />
                                    사주 맞춤 매물 보러가기
                                </Button>
                            </Link>
                        </div>
                        <SajuResult sajuData={sajuData} username={user.username} />

                        <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                            <h3 className="font-bold text-slate-800 mb-2">더 많은 추천 매물이 궁금하신가요?</h3>
                            <p className="text-slate-600 mb-4">
                                분석된 사주 정보를 바탕으로 나에게 딱 맞는 매물을 찾아보세요.
                            </p>
                            <Link href="/properties?recommend=true">
                                <Button size="lg" className="px-8">
                                    추천 매물 보러가기
                                </Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50">
                        <CardHeader className="text-center pb-2">
                            <span className="text-4xl mb-4 block">🔮</span>
                            <CardTitle className="text-2xl">사주 정보 입력</CardTitle>
                            <CardDescription>
                                정확한 분석을 위해 태어난 생년월일시를 입력해주세요.<br />
                                <span className="text-xs text-muted-foreground mt-1 block">
                                    * 입력하신 정보는 분석 목적으로만 사용되며, 브라우저/서버 외부에 유출되지 않습니다.
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="max-w-md mx-auto">
                            <SajuForm
                                onSubmit={handleFormSubmit}
                                buttonText="무료 사주 분석 시작하기"
                            />
                        </CardContent>
                    </Card>
                )
            ) : (
                <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles size={120} />
                    </div>
                    <CardHeader className="text-center pt-10 pb-4 relative z-10">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <LogIn size={40} className="text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold mb-2">회원 전용 서비스입니다</CardTitle>
                        <CardDescription className="text-indigo-100 text-lg">
                            로그인하시면 당신의 운명에 딱 맞는<br />
                            부동산과 풍수 인테리어 리포트를 무료로 드립니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pb-12 relative z-10">
                        <ul className="text-left space-y-3 mb-10 text-indigo-50">
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</span>
                                나에게 행운을 주는 매물 위치 추천
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</span>
                                기운을 보강해주는 인테리어 & 가구 배치
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</span>
                                생년월일시 기반 정밀 사주 분석 리포트
                            </li>
                        </ul>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <Link href="/auth">
                                <Button size="lg" className="w-full sm:w-64 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-lg h-14 shadow-lg">
                                    로그인하고 사주보기
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-6 text-sm text-indigo-200">
                            네이버, 카카오 계정으로 3초만에 가입할 수 있습니다.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SajuPage;
