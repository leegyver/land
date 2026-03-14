import { Link } from "wouter";
import { Agent } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Phone, Mail } from "lucide-react";

interface AgentCardProps {
  agent: Agent;
}

const AgentCard = ({ agent }: AgentCardProps) => {
  return (
    <Card className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition text-center">
      <div className="h-64 overflow-hidden">
        <img 
          src={agent.imageUrl} 
          alt={agent.name} 
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="p-6">
        <Link href={`/agents/${agent.id}`}>
          <h3 className="text-xl font-bold mb-1 hover:text-primary transition-colors cursor-pointer">
            {agent.name}
          </h3>
        </Link>
        <p className="text-primary font-medium mb-3">{agent.title}</p>
        <p className="text-gray-medium mb-4">{agent.description}</p>
        <div className="flex justify-center space-x-3">
          <a href={`tel:${agent.phone}`} className="text-dark hover:text-primary">
            <Phone className="h-5 w-5" />
          </a>
          <a href={`mailto:${agent.email}`} className="text-dark hover:text-primary">
            <Mail className="h-5 w-5" />
          </a>
        </div>
      </div>
    </Card>
  );
};

export default AgentCard;
