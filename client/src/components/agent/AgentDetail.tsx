import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Agent, Property } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/property/PropertyCard";
import { Phone, Mail, MapPin, BriefcaseBusiness } from "lucide-react";

interface AgentDetailProps {
  agentId: string;
}

const AgentDetail = ({ agentId }: AgentDetailProps) => {
  const { data: agent, isLoading: agentLoading, error: agentError } = useQuery<Agent>({
    queryKey: [`/api/agents/${agentId}`],
  });
  
  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    select: (data) => data.filter(property => property.agentId === Number(agentId))
  });
  
  if (agentLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
          <div className="md:w-2/3">
            <Skeleton className="h-10 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-6" />
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 p-6 rounded-lg text-red-600">
          <h2 className="text-2xl font-bold mb-2">중개사를 찾을 수 없습니다</h2>
          <p>요청하신 중개사 정보를 불러오는 데 실패했습니다. 다시 시도해주세요.</p>
          <Link href="/agents">
            <Button className="mt-4">중개사 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="md:w-1/3">
          <div className="rounded-lg overflow-hidden shadow-md h-auto">
            <img 
              src={agent.imageUrl} 
              alt={agent.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold mb-1">{agent.name}</h1>
          <p className="text-primary font-medium text-lg mb-4">{agent.title}</p>
          
          <div className="flex items-center mb-2">
            <BriefcaseBusiness className="text-primary mr-2" />
            <span>{agent.specialization} 전문가</span>
          </div>
          
          <div className="flex items-center mb-6">
            <MapPin className="text-primary mr-2" />
            <span>서울특별시 강남구</span>
          </div>
          
          <p className="text-gray-medium mb-6">{agent.description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button className="flex items-center justify-center">
              <Phone className="mr-2 h-4 w-4" /> {agent.phone}
            </Button>
            <Button variant="outline" className="flex items-center justify-center">
              <Mail className="mr-2 h-4 w-4" /> {agent.email}
            </Button>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6">담당 매물</h2>
        
        {propertiesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-80 w-full" />
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-light p-8 rounded-lg text-center text-gray-medium">
            <p>현재 담당하는 매물이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;
