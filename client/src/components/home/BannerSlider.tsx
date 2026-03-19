import { useQuery } from "@tanstack/react-query";
import { Banner } from "@shared/schema";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";

interface BannerSliderProps {
    location: string;
    description?: string;
}

const BannerSlider = ({ location, description }: BannerSliderProps) => {
    const { data: banners, isLoading } = useQuery<Banner[]>({
        queryKey: [`/api/banners?location=${location}`],
    });


    const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));

    if (isLoading) {
        return <Skeleton className="w-full h-48 rounded-xl" />;
    }

    if (!banners || banners.length === 0) {
        // If no banners, render nothing or a placeholder?
        // User said "manage in admin", so initially might be empty.
        // Better return null to not break layout if empty.
        return null;
    }

    return (
        <div className="w-full relative group">
            {description && <h3 className="text-sm font-semibold text-gray-500 mb-2">{description}</h3>}
            <Carousel
                className="w-full"
                opts={{ loop: true }}
                plugins={[plugin.current]}
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
                <CarouselContent>
                    {banners.map((banner) => (
                        <CarouselItem key={banner.id}>
                            <div className="p-1">
                                <a
                                    href={banner.linkUrl || "#"}
                                    target={banner.openNewWindow ? "__blank" : "_self"}
                                    rel={banner.openNewWindow ? "noopener noreferrer" : undefined}
                                    className="block relative aspect-[16/9] md:aspect-[2/1] overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.01]"
                                >
                                    <img
                                        src={banner.imageUrl}
                                        alt={banner.title || "Banner"}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {(banner.title || banner.description) && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6">
                                            {banner.title && (
                                                <h3 className="text-white font-bold text-lg md:text-xl mb-1 shadow-sm">
                                                    {banner.title}
                                                </h3>
                                            )}
                                            {banner.description && (
                                                <p className="text-gray-200 text-xs md:text-sm font-medium line-clamp-2 shadow-sm">
                                                    {banner.description}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </a>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CarouselNext className="right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Carousel>
        </div>
    );
};

export default BannerSlider;
