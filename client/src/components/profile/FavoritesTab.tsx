import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { Link } from "wouter";
import { Loader2, Heart, MapPin, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface FavoritesTabProps {
    user: any;
}

export function FavoritesTab({ user }: FavoritesTabProps) {
    const { data: favoriteProperties, isLoading: isFavoritesLoading } = useQuery<Property[]>({
        queryKey: ['/api/favorites'],
        enabled: !!user,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>내 관심매물</CardTitle>
                <CardDescription>
                    관심있는 매물을 모아서 볼 수 있습니다.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isFavoritesLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !favoriteProperties || favoriteProperties.length === 0 ? (
                    <div className="py-8 text-center">
                        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">관심매물이 없습니다</h3>
                        <p className="text-muted-foreground mb-4">
                            관심있는 매물을 찾아보고 하트 아이콘을 클릭하여 관심매물로 등록해보세요.
                        </p>
                        <Button asChild>
                            <Link href="/properties">매물 둘러보기</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {favoriteProperties.map(property => (
                            <div
                                key={property.id}
                                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <Link href={`/properties/${property.id}`}>
                                    <div className="relative h-40 bg-gray-100">
                                        <img
                                            src={
                                                Array.isArray(property.imageUrls) && property.imageUrls.length > 0 &&
                                                    typeof property.featuredImageIndex === 'number'
                                                    ? property.imageUrls[property.featuredImageIndex]
                                                    : (property.imageUrls && property.imageUrls.length > 0
                                                        ? property.imageUrls[0]
                                                        : property.imageUrl || "https://via.placeholder.com/400x300?text=No+Image")
                                            }
                                            alt={property.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold mb-1 line-clamp-1">{property.title}</h3>
                                        <div className="flex items-center text-gray-500 mb-2">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            <span className="text-sm">{property.district}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center text-gray-700">
                                                <Home className="w-4 h-4 mr-1" />
                                                <span className="text-sm">{property.type}</span>
                                            </div>
                                            <div className="font-bold text-primary">
                                                {property.price && Number(property.price) > 0 ? (
                                                    Number(property.price) >= 100000000 ?
                                                        `${(Number(property.price) / 100000000).toFixed(2)}억원` :
                                                        Number(property.price) >= 10000 ?
                                                            `${(Number(property.price) / 10000).toFixed(2)}만원` :
                                                            `${Number(property.price).toLocaleString()}원`
                                                ) : '가격 협의'}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
