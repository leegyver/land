import { useQuery } from "@tanstack/react-query";
import { Youtube, ArrowRight, Play } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt?: string;
}

const YoutubeSection = () => {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: "200px" });
  
  const { data: latestVideos, isLoading: isVideosLoading } = useQuery<YouTubeVideo[]>({
    queryKey: ["/api/youtube/latest"],
    enabled: inView,
  });

  return (
    <section className="py-2 bg-slate-900 text-white" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="flex flex-row justify-between items-center mb-2">
          <div>
            <h2 className="text-2xl font-bold mb-0 flex items-center">
              <Youtube className="h-6 w-6 text-red-600 mr-2" />
              이가이버 유튜브
            </h2>
          </div>
          <a
            href="https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0 text-gray-300 hover:text-white transition-colors flex items-center text-sm"
          >
            더보기 <ArrowRight className="ml-1 h-3 w-3" />
          </a>
        </div>

        {isVideosLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-800 h-64 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative group px-1">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4 py-2">
                {latestVideos?.map((video) => (
                  <CarouselItem key={video.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-[45%] md:basis-[33.33%] xl:basis-[20%]">
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group h-full block"
                    >
                      <div className="bg-slate-800 rounded-xl overflow-hidden hover:transform hover:-translate-y-2 transition-all duration-300 shadow-lg border border-slate-700 h-full flex flex-col">
                        <div className="relative aspect-video overflow-hidden shrink-0 bg-slate-700">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-red-600 p-3 rounded-full text-white">
                              <Play className="h-6 w-6 fill-current" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3 flex-grow bg-slate-800">
                          <h3 className="font-semibold line-clamp-2 text-gray-100 group-hover:text-red-400 transition-colors text-sm">
                            {video.title}
                          </h3>
                        </div>
                      </div>
                    </a>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <CarouselPrevious className="absolute left-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-slate-800/80 hover:bg-slate-700 text-white border-slate-600 shadow-md" />
                <CarouselNext className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-slate-800/80 hover:bg-slate-700 text-white border-slate-600 shadow-md" />
              </div>
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
};

export default YoutubeSection;
