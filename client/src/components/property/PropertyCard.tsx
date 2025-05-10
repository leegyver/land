import { Link } from "wouter";
import { Heart, Maximize, Bed, Bath } from "lucide-react";
import { type Property } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
}

const formatPrice = (price: string | number) => {
  const numPrice = Number(price);
  if (numPrice >= 100000000) {
    return `${(numPrice / 100000000).toFixed(1)}억 원`;
  } else if (numPrice >= 10000) {
    return `${(numPrice / 10000).toFixed(0)}만원`;
  }
  return numPrice.toLocaleString() + '원';
};

const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <Card className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition group">
      <div className="relative h-60 overflow-hidden">
        {/* 부동산 유형 표시 */}
        <Badge 
          className={cn(
            "absolute top-3 left-3 z-10 font-medium text-sm",
            property.type === "아파트" || property.type === "아파트연립다세대" ? "bg-blue-500" : 
            property.type === "주택" ? "bg-green-600" : 
            property.type === "오피스텔" || property.type === "원투룸" ? "bg-purple-600" : 
            property.type === "빌라" ? "bg-orange-600" : 
            property.type === "상가공장창고펜션" ? "bg-yellow-600" :
            property.type === "토지" ? "bg-emerald-600" : "bg-primary"
          )}
        >
          {property.type}
        </Badge>
        
        {/* 거래 유형 표시: 모든 거래유형 (매매/전세/월세 등) */}
        <div className="absolute top-3 right-3 z-10 flex flex-wrap gap-1 justify-end">
          {property.dealType && Array.isArray(property.dealType) && property.dealType.map((type, index) => (
            <Badge 
              key={index}
              className={cn(
                "font-medium text-sm",
                type === "매매" ? "bg-red-600" : 
                type === "전세" ? "bg-amber-600" : 
                type === "월세" ? "bg-indigo-600" :
                type === "완료" ? "bg-gray-600" :
                type === "보류중" ? "bg-pink-600" : "bg-secondary"
              )}
            >
              {type}
            </Badge>
          ))}
        </div>
        
        <img 
          src={property.imageUrl} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      </div>
      <div className="p-6">
        <Link href={`/properties/${property.id}`}>
          <h3 className="text-xl font-bold mb-1 hover:text-primary transition-colors cursor-pointer line-clamp-1">
            {property.title}
          </h3>
        </Link>
        <p className="flex items-center text-gray-500 text-sm mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {property.district}{property.city ? `, ${property.city}` : ""}
        </p>
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-md">
          <span className="flex items-center text-sm font-medium">
            <Maximize className="w-4 h-4 mr-1 text-primary" /> 
            <span>{property.size}m²</span>
          </span>
          <span className="flex items-center text-sm font-medium">
            <Bed className="w-4 h-4 mr-1 text-primary" /> 
            <span>{property.bedrooms}개</span>
          </span>
          <span className="flex items-center text-sm font-medium">
            <Bath className="w-4 h-4 mr-1 text-primary" /> 
            <span>{property.bathrooms}개</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-medium px-2 py-0 border-primary text-primary">
                {property.type}
              </Badge>
              {property.dealType && Array.isArray(property.dealType) && property.dealType.map((type, index) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className={cn(
                    "text-xs font-medium px-2 py-0",
                    type === "매매" ? "border-red-500 text-red-500" : 
                    type === "전세" ? "border-amber-500 text-amber-500" : 
                    type === "월세" ? "border-indigo-500 text-indigo-500" :
                    "border-secondary text-secondary"
                  )}
                >
                  {type}
                </Badge>
              ))}
            </div>
            <span className="text-xl font-bold text-primary">{formatPrice(property.price)}</span>
          </div>
          <button className="text-dark hover:text-primary transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default PropertyCard;
