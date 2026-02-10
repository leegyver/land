import { useQuery } from "@tanstack/react-query";
import PropertyCard from "@/components/property/PropertyCard";
import { Property } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertySectionProps {
    title: React.ReactNode;
    queryKey: string;
    bgColor?: string;
    limit?: number;
}

const PropertySection = ({ title, queryKey, bgColor = "bg-white", limit = 4 }: PropertySectionProps) => {
    const { data: properties, isLoading, error } = useQuery<Property[]>({
        queryKey: [queryKey],
    });

    if (isLoading) {
        return (
            <section className={`py-8 ${bgColor}`}>
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{title}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...Array(limit)].map((_, index) => (
                            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                                <Skeleton className="h-60 w-full" />
                                <div className="p-6">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2 mb-4" />
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
            <section className={`py-8 ${bgColor}`}>
                <div className="container mx-auto px-4 text-center">
                    <div className="text-red-500 font-bold mb-2">데이터를 불러오지 못했습니다</div>
                    <p className="text-sm text-gray-500">{error.message}</p>
                </div>
            </section>
        );
    }

    if (!properties || properties.length === 0) {
        return (
            <section className={`py-8 ${bgColor}`}>
                <div className="container mx-auto px-4 text-center py-10">
                    <p className="text-gray-500">등록된 매물이 없습니다.</p>
                </div>
            </section>
        );
    }

    return (
        <section className={`pt-3 pb-3 ${bgColor}`}>
            <div className="container mx-auto px-4">
                <div className="text-left mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {properties.slice(0, limit).map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PropertySection;
