import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { CheckCircle, Users, Award, Briefcase, Quote, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SuccessStory = ({ title, category, description, result }: { title: string, category: string, description: string, result: string }) => (
    <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="bg-slate-900 p-4">
            <Badge className="bg-primary text-white mb-2">{category}</Badge>
            <h3 className="text-white font-bold text-lg">{title}</h3>
        </div>
        <CardContent className="p-6 bg-white">
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                {description}
            </p>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>결과: {result}</span>
            </div>
        </CardContent>
    </Card>
);

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Helmet>
                <title>부동산소개 | 이가이버부동산</title>
                <meta
                    name="description"
                    content="강화도에서 10년, 고객과 함께한 이가이버 부동산의 이야기와 철학을 소개합니다."
                />
            </Helmet>

            {/* Hero Section */}
            <section className="relative h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-slate-900">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&q=80')] bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Badge className="mb-4 bg-primary text-white border-none py-1 px-4 text-sm font-bold">Since 2014</Badge>
                        <h1 className="text-3xl md:text-6xl font-black text-white mb-6 leading-tight">
                            강화도에서 10년,<br />고객과 함께한 이야기
                        </h1>
                        <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto font-light">
                            진심을 담은 한 번의 인연이 평생의 신뢰로 이어질 수 있도록,<br className="hidden md:block" />
                            강화도의 가치를 누구보다 깊이 이해하는 전문가가 함께합니다.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* CEO Profile & Philosophy */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl relative z-10">
                                <img
                                    src="/brain/2454dd71-e38a-4ac3-b7fc-ee99f0794c2e/ceo_profile_image.png"
                                    alt="이가이버 대표"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-full h-full border-4 border-primary rounded-2xl -z-0 opacity-20" />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-primary font-bold mb-2 flex items-center gap-2 tracking-widest uppercase">
                                    <span className="w-10 h-[2px] bg-primary"></span>
                                    CEO PHILOSOPHY
                                </h2>
                                <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
                                    "부동산은 건물이 아니라<br />사람의 삶을 담는 그릇입니다"
                                </h3>
                                <div className="space-y-4 text-lg text-slate-600 leading-relaxed font-light">
                                    <p>
                                        강화도라는 섬이 가진 매력과 가치는 단순히 평당 가격으로 환산될 수 없습니다. 누군가에게는 새로운 시작의 터전이고, 누군가에게는 평온한 노후의 안식처이며, 또 누군가에게는 성공을 위한 기회의 땅이기 때문입니다.
                                    </p>
                                    <p>
                                        지난 10년간 강화도 곳곳을 발로 뛰며 배운 것은 '정직한 정보'와 '깊은 통찰'의 중요성입니다. 저는 단순히 매물을 매칭하는 중개인이 아니라, 고객의 꿈이 실현될 수 있도록 돕는 파트너가 되고자 합니다.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-slate-900">신뢰와 정직</h4>
                                        <p className="text-sm text-slate-500">객관적인 데이터와 투명한 정보 제공</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-slate-900">현장 중심</h4>
                                        <p className="text-sm text-slate-500">강화도 10년, 깊이 있는 지역 전문성</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-slate-900 text-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl md:text-5xl font-black text-primary mb-2">10+</div>
                            <p className="text-slate-400 text-sm uppercase tracking-widest">강화도 경력</p>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-black text-primary mb-2">1,500+</div>
                            <p className="text-slate-400 text-sm uppercase tracking-widest">누적 계약 건수</p>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-black text-primary mb-2">98%</div>
                            <p className="text-slate-400 text-sm uppercase tracking-widest">고객 만족도</p>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-black text-primary mb-2">300+</div>
                            <p className="text-slate-400 text-sm uppercase tracking-widest">보유 매물</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Success Stories */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-primary font-bold mb-4 tracking-widest uppercase">REAL SUCCESS CASES</h2>
                        <h3 className="text-3xl md:text-4xl font-black text-slate-900">이가이버가 만든 실제 성공 사례</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <SuccessStory
                            category="전원주택"
                            title="은퇴 후 꿈꾸던 강화도 삶"
                            description="서울에서 평생을 보내신 노부부께서 조용하고 전망 좋은 터를 찾으셨습니다. 단순한 땅이 아니라, 향후 관리의 편의성과 주변 이웃과의 조화를 고려해 6개월간 함께 발품을 팔아 최적의 전원주택지를 찾아드렸습니다."
                            result="완공 후 현재 행복한 귀촌 생활 중"
                        />
                        <SuccessStory
                            category="상가/빌딩"
                            title="유동인구 분석을 통한 카페 입지"
                            description="강화도 관광객 유입 데이터를 분석하여, 주말 유동인구가 가장 많으면서도 조망이 확보된 폐가를 추천드렸습니다. 리모델링 컨설팅까지 함께 진행하여 현재는 강화도의 핫플레이스로 자리 잡았습니다."
                            result="오픈 1년 만에 매출 300% 달성"
                        />
                        <SuccessStory
                            category="토지/투자"
                            title="개발 호재를 미리 내다본 안목"
                            description="강화도 북단 개발 계획과 도로 확충 사업을 면밀히 검토하여, 저평가되었던 토지를 안내해 드렸습니다. 단순 투자가 아니라 실질적인 활용 가치를 높일 수 있는 형질 변경 가이드까지 제공해 드렸습니다."
                            result="매입가 대비 현재 가치 2.5배 상승"
                        />
                    </div>
                </div>
            </section>

            {/* Philosophy Details */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50 p-8 rounded-3xl border border-slate-100">
                            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                                <Quote className="text-white w-10 h-10" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">전문성은 경험에서 나옵니다</h4>
                                <p className="text-slate-600 leading-relaxed">
                                    책상에 앉아 데이터만 보는 것은 반쪽짜리 정보입니다. 직접 땅을 밟고, 마을 주민들과 대화하며 매물의 숨겨진 이야기까지 파악하는 것이 저의 원칙입니다. 강화도의 흙 냄새, 바람의 방향까지 아는 전문가와 함께하십시오.
                                </p>
                            </div>
                        </div>

                        <div className="text-center space-y-6">
                            <h3 className="text-2xl md:text-3xl font-black text-slate-900">당신의 소중한 자산, 진심을 다해 지키겠습니다.</h3>
                            <p className="text-slate-500 max-w-2xl mx-auto">
                                이가이버 부동산은 단순한 중개를 넘어 강화도에서의 새로운 시작을 위한 든든한 동반자가 되어 드릴 것을 약속합니다.
                            </p>
                            <div className="pt-6">
                                <Button
                                    className="btn-primary-cta h-14 px-10 text-lg group"
                                    onClick={() => window.location.href = '/contact'}
                                >
                                    지금 상담 신청하기
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
