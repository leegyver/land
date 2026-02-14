
import { Helmet } from "react-helmet";
import { ReviewCard } from "@/components/home/ReviewCard";
import { reviews } from "@/data/reviews";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const ReviewsPage = () => {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Helmet>
                <title>고객 후기 - 이가이버부동산</title>
                <meta name="description" content="이가이버 부동산을 이용해주신 고객님들의 솔직한 거래 후기를 확인하세요." />
            </Helmet>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">고객 후기</h1>
                            <p className="text-gray-600 mt-1">이가이버 부동산과 함께한 고객님들의 실제 이야기입니다.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="h-full">
                                <ReviewCard review={review} />
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold mb-2">이가이버 부동산과 거래하셨나요?</h3>
                        <p className="text-gray-600 mb-6">고객님의 소중한 후기가 더 나은 서비스를 만드는 데 큰 힘이 됩니다.</p>
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => window.open('https://map.naver.com/p/search/%EC%9D%B4%EA%B0%80%EC%9D%B4%EB%B2%84%EB%B6%80%EB%8F%99%EC%82%B0/place/13350293?c=15.00,0,0,0,dh&isCorrectAnswer=true', '_blank')}
                        >
                            네이버 리뷰 남기러 가기
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewsPage;
