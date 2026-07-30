import { useQuery } from "@tanstack/react-query";
import PropertyCard from "@/components/property/PropertyCard";
import { Property } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface PropertySectionProps {
    title: React.ReactNode;
    queryKey: string;
    bgColor?: string;
    limit?: number;
}

const PropertySection = ({ title, queryKey, bgColor = "bg-white", limit = 12 }: PropertySectionProps) => {
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, index) => (
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

    const displayProperties = properties;

    return (
        <section className={`py-1 ${bgColor}`}>
            <div className="container mx-auto px-4">
                {title && (
                    <div className="text-left mb-6">
                        <h2 className="text-lg md:text-2xl font-bold text-slate-900">{title}</h2>
                    </div>
                )}

                <div className="relative px-0 md:px-4">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 3500,
                                stopOnInteraction: false,
                            }),
                        ]}
                        className="w-full"
                    >
                        <CarouselContent className="">
                            {displayProperties.map((property) => (
                                <CarouselItem key={property.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                                    <PropertyCard property={property} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="hidden md:flex">
                            <CarouselPrevious className="-left-4 border-slate-200 bg-white hover:bg-slate-100 shadow-md" />
                            <CarouselNext className="-right-4 border-slate-200 bg-white hover:bg-slate-100 shadow-md" />
                        </div>
                    </Carousel>
                </div>
            </div>
        </section>
    );
};

export default PropertySection;
