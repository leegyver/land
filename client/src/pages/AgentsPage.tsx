import { useQuery } from "@tanstack/react-query";
import { Agent } from "@shared/schema";
import AgentCard from "@/components/agent/AgentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";

const AgentsPage = () => {
  const { data: agents, isLoading, error } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  return (
    <div className="pt-16"> {/* Offset for fixed header */}
      <Helmet>
        <title>중개사 소개 | 이가이버 부동산</title>
        <meta 
          name="description" 
          content="이가이버 부동산의 전문 중개사를 소개합니다. 각 지역과 부동산 유형별 전문가들이 최상의 서비스를 제공합니다."
        />
        <meta property="og:title" content="중개사 소개 | 이가이버 부동산" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="이가이버 부동산의 전문 중개사를 소개합니다. 각 지역과 부동산 유형별 전문가들이 최상의 서비스를 제공합니다." />
      </Helmet>

      <div className="bg-primary/10 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">중개사 소개</h1>
          <p className="text-gray-medium mt-2">
            각 분야의 전문성을 갖춘 이가이버 부동산의 중개사들을 소개합니다.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-80 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 p-6 rounded-lg text-red-600">
            <h3 className="text-xl font-bold mb-2">중개사 정보를 불러오는 중 오류가 발생했습니다</h3>
            <p>잠시 후 다시 시도해주세요.</p>
          </div>
        ) : agents && agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-medium">중개사 정보가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsPage;
