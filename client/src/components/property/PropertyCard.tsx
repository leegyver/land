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
        <Badge 
          className={cn(
            "absolute top-3 left-3 z-10",
            property.type === "아파트" ? "bg-primary" : 
            property.type === "주택" ? "bg-secondary" : 
            property.type === "오피스텔" ? "bg-accent" : 
            property.type === "빌라" ? "bg-secondary" : 
            property.type === "펜트하우스" ? "bg-accent" : "bg-primary"
          )}
        >
          {property.type}
        </Badge>
        <img 
          src={property.imageUrl} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      </div>
      <div className="p-6">
        <Link href={`/properties/${property.id}`}>
          <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors cursor-pointer">
            {property.title}
          </h3>
        </Link>
        <p className="text-gray-medium mb-4">{property.address}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center text-sm">
            <Maximize className="w-4 h-4 mr-1" /> {property.size}m²
          </span>
          <span className="flex items-center text-sm">
            <Bed className="w-4 h-4 mr-1" /> {property.bedrooms}
          </span>
          <span className="flex items-center text-sm">
            <Bath className="w-4 h-4 mr-1" /> {property.bathrooms}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-primary">{formatPrice(property.price)}</span>
          <button className="text-dark hover:text-primary transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default PropertyCard;
