import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { MapPin, TrendingUp } from "lucide-react";

export function SidebarWidget() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const items = properties?.slice(0, 3) || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2 px-1">
        <TrendingUp className="h-5 w-5 text-orange-600" />
        <h3 className="font-bold text-slate-800">오늘의 추천 매물</h3>
      </div>
      
      {items.map((property) => (
        <Link key={property.id} href={`/property/${property.id}`}>
          <Card className="overflow-hidden border-2 border-slate-100 hover:border-orange-200 transition-all cursor-pointer group shadow-sm hover:shadow-md">
            <CardContent className="p-0 flex h-24">
              <div className="w-24 h-full relative overflow-hidden">
                <img 
                  src={property.imageUrl} 
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <Badge className="absolute top-1 left-1 bg-orange-600 text-[10px] px-1.5 h-4 border-none">
                  추천
                </Badge>
              </div>
              <div className="flex-1 p-2 flex flex-col justify-between min-w-0">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                    {property.title}
                  </h4>
                  <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{property.district}</span>
                  </div>
                </div>
                <div className="text-orange-600 font-bold text-sm">
                  {property.price}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      
      {items.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 text-sm italic">업데이트 중입니다...</p>
        </div>
      )}
    </div>
  );
}
