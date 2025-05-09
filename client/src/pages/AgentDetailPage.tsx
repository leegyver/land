import { useParams } from "wouter";
import AgentDetail from "@/components/agent/AgentDetail";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Agent } from "@shared/schema";

const AgentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: agent } = useQuery<Agent>({
    queryKey: [`/api/agents/${id}`],
    enabled: !!id,
  });

  return (
    <div className="pt-16"> {/* Offset for fixed header */}
      <Helmet>
        <title>
          {agent ? `${agent.name} | 중개사 소개 | 한국부동산` : "중개사 상세 | 한국부동산"}
        </title>
        <meta 
          name="description" 
          content={agent ? 
            `${agent.description} - 한국부동산 ${agent.title} ${agent.name}의 상세 프로필입니다.` : 
            "한국부동산의 전문 중개사 프로필을 확인하세요. 풍부한 경험과 노하우를 바탕으로 최상의 부동산 서비스를 제공합니다."
          }
        />
        <meta property="og:title" content={agent ? `${agent.name} | 중개사 소개 | 한국부동산` : "중개사 상세 | 한국부동산"} />
        <meta property="og:type" content="website" />
        <meta 
          property="og:description" 
          content={agent ? 
            `${agent.description} - 한국부동산 ${agent.title} ${agent.name}의 상세 프로필입니다.` : 
            "한국부동산의 전문 중개사 프로필을 확인하세요. 풍부한 경험과 노하우를 바탕으로 최상의 부동산 서비스를 제공합니다."
          }
        />
        {agent && <meta property="og:image" content={agent.imageUrl} />}
      </Helmet>
      
      <AgentDetail agentId={id} />
    </div>
  );
};

export default AgentDetailPage;
