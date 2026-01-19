import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Play, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt?: string;
}

const CHANNEL_HANDLE = "강화도부동산이야기";
const CHANNEL_URL = `https://www.youtube.com/@${CHANNEL_HANDLE}`;

const AboutPage = () => {
  const { data: channelData } = useQuery<{ channelId: string }>({
    queryKey: ["/api/youtube/handle", CHANNEL_HANDLE],
    queryFn: async () => {
      const response = await fetch(`/api/youtube/handle/${encodeURIComponent(CHANNEL_HANDLE)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch channel ID");
      }
      return response.json();
    },
    staleTime: 24 * 60 * 60 * 1000,
  });

  const channelId = channelData?.channelId;

  const { data: allVideos, isLoading } = useQuery<YouTubeVideo[]>({
    queryKey: ["/api/youtube/channel", channelId, "20"],
    queryFn: async () => {
      if (!channelId) return [];
      const response = await fetch(`/api/youtube/channel/${channelId}?limit=20&refresh=true`);
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      return response.json();
    },
    enabled: !!channelId,
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

  return (
    <div className="pt-20 pb-10 min-h-screen bg-gray-50">
      <Helmet>
        <title>유튜브채널 | 이가이버부동산</title>
        <meta 
          name="description" 
          content="강화도 부동산 이야기 유튜브 채널 영상을 확인하세요."
        />
      </Helmet>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">유튜브채널</h1>
          <p className="text-gray-600">강화도부동산이야기 채널의 최신 영상을 확인하세요</p>
          <a 
            href={CHANNEL_URL}
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center mt-4 text-red-600 hover:text-red-700"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            채널 방문하기
          </a>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">영상을 불러오는 중...</span>
          </div>
        )}

        {!isLoading && allVideos && allVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allVideos.slice(0, 10).map((video) => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    {video.publishedAt && (
                      <p className="text-sm text-gray-500 mt-2">
                        {formatDate(video.publishedAt)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}

        {!isLoading && (!allVideos || allVideos.length === 0) && (
          <div className="text-center py-20">
            <p className="text-gray-500">등록된 영상이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutPage;
