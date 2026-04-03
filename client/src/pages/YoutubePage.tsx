import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Play, ExternalLink, Loader2, Youtube } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt?: string;
}

const CHANNEL_1_ID = "UCCG3_JlKhgalqhict7tKkbA";
const CHANNEL_1_URL = "https://www.youtube.com/channel/UCCG3_JlKhgalqhict7tKkbA";

const CHANNEL_2_ID = "UChvA8_nrczWDBYdHUum7Amw";
const CHANNEL_2_URL = "https://youtube.com/channel/UChvA8_nrczWDBYdHUum7Amw?si=K45xaU3foR1mSPFE";

const YoutubePage = () => {
  // 이가이버 유튜브 채널
  const { data: channel1Videos, isLoading: loading1 } = useQuery<YouTubeVideo[]>({
    queryKey: ["/api/youtube/channel", CHANNEL_1_ID, "12"],
    queryFn: async () => {
      const response = await fetch(`/api/youtube/channel/${CHANNEL_1_ID}?limit=12`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
  });

  // 강화도 부동산이야기 채널
  const { data: channel2Videos, isLoading: loading2 } = useQuery<YouTubeVideo[]>({
    queryKey: ["/api/youtube/channel", CHANNEL_2_ID, "12"],
    queryFn: async () => {
      const response = await fetch(`/api/youtube/channel/${CHANNEL_2_ID}?limit=12`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const VideoCard = ({ video }: { video: YouTubeVideo }) => (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="relative aspect-video">
          <img
            src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          {video.publishedAt && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(video.publishedAt)}
            </p>
          )}
        </CardContent>
      </Card>
    </a>
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(12)].map((_, i) => (
        <Card key={i} className="overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200" />
          <CardContent className="p-3">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="pt-0 pb-10 min-h-screen bg-gray-50">
      <Helmet>
        <title>유튜브채널 | 이가이버부동산</title>
        <meta
          name="description"
          content="강화도 부동산 이야기 유튜브 채널 영상을 확인하세요."
        />
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">유튜브채널</h1>
          <p className="text-gray-600">강화도 부동산 관련 영상을 확인하세요</p>
        </div>

        {/* 새 채널: 강화도부동산이야기 */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Youtube className="h-6 w-6 text-red-600" />
              강화도부동산이야기
            </h2>
            <a
              href={CHANNEL_2_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-red-600 hover:text-red-700 text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              채널 방문
            </a>
          </div>

          {loading2 ? (
            <LoadingSkeleton />
          ) : channel2Videos && channel2Videos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {channel2Videos.slice(0, 12).map((video: YouTubeVideo) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg">
              <p className="text-gray-500">등록된 영상이 없습니다.</p>
            </div>
          )}
        </section>

        {/* 기존 채널: 이가이버 유튜브 */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Youtube className="h-6 w-6 text-red-600" />
              이가이버 유튜브
            </h2>
            <a
              href={CHANNEL_1_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-red-600 hover:text-red-700 text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              채널 방문
            </a>
          </div>

          {loading1 ? (
            <LoadingSkeleton />
          ) : channel1Videos && channel1Videos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {channel1Videos.slice(0, 12).map((video: YouTubeVideo) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg">
              <p className="text-gray-500">등록된 영상이 없습니다.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default YoutubePage;
