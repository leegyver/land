
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Review } from "@/data/reviews";
import { Star, Quote, BadgeCheck } from "lucide-react";

export const ReviewCard = ({ review }: { review: Review }) => {
    return (
        <Card className="h-full border-none shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-orange-100 p-2 rounded-full">
                            <Quote className="w-4 h-4 text-orange-600 fill-current" />
                        </div>
                        {review.badge === "거래완료" && (
                            <Badge variant="outline" className="border-green-600 text-green-600 bg-green-50 gap-1">
                                <BadgeCheck className="w-3 h-3" /> 거래완료
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(review.rating)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-200"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <p className="text-gray-700 mb-6 flex-grow leading-relaxed break-keep">
                    "{review.content}"
                </p>

                <div className="flex items-center gap-3 mt-auto">
                    {review.imageUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <img src={review.imageUrl} alt={review.author} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold flex-shrink-0">
                            {review.author[0]}
                        </div>
                    )}
                    <div>
                        <div className="font-bold text-gray-900 text-sm">{review.author}님</div>
                        <div className="text-xs text-gray-500">
                            {review.location} | {review.transactionType}
                        </div>
                    </div>
                </div>

                {review.transactionAmount && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-right text-gray-400">
                        거래금액: {review.transactionAmount}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
