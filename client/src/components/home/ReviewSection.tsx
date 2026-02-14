
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { reviews } from "@/data/reviews";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ReviewCard } from "./ReviewCard";

const ReviewSection = () => {
    return (
        <section className="py-16 bg-[#F8FAFC]">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
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

                <div className="relative px-2 md:px-12">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4 pb-4">
                            {reviews.map((review) => (
                                <CarouselItem key={review.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                    <ReviewCard review={review} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex -left-4" />
                        <CarouselNext className="hidden md:flex -right-4" />
                    </Carousel>
                </div>

                <div className="mt-6 text-center md:hidden">
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
