

import { Button } from "@/components/ui/button";
import { reviews } from "@/data/reviews";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ReviewCard } from "./ReviewCard";

const ReviewSection = () => {
    return (
        <section className="py-2 bg-[#F8FAFC]">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-2 md:mb-8 gap-2 md:gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                            고객님들의 생생한 후기
                        </h2>
                        <p className="text-gray-600">
                            이가이버 부동산을 통해 내 집 마련과 투자를 성공하신 분들의 이야기입니다.
                        </p>
                    </div>
                    <Link href="/reviews">
                        <Button variant="outline" className="hidden md:flex items-center gap-2 hover:text-orange-600 hover:border-orange-600">
                            후기 더 보기 <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>

                {/* Desktop: Grid / Mobile: Horizontal Scroll Slider */}
                <div className="flex overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 md:pb-0 md:mx-0 md:px-0 md:overflow-visible [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="w-[85vw] flex-none snap-center md:w-auto md:flex-initial">
                            <ReviewCard review={review} />
                        </div>
                    ))}
                </div>

                <div className="mt-2 text-center md:hidden">
                    <Link href="/reviews">
                        <Button variant="outline" className="w-full">
                            후기 더 보기 <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default ReviewSection;
