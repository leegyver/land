import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import PropertyCard from "@/components/property/PropertyCard";
import { Property } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedProperties = () => {
  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
  });

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">추천 매물</h2>
            <div className="w-36 h-6">
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <Skeleton className="h-60 w-full" />
                <div className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">추천 매물</h2>
          <div className="bg-red-50 p-4 rounded-md text-red-500">
            매물을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="properties" className="pt-3 pb-0">
      <div className="container mx-auto px-4">
        <div className="text-left mb-2">
          <h2 className="text-2xl font-bold text-slate-900">추천 매물</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {properties && properties.slice(0, 4).map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
