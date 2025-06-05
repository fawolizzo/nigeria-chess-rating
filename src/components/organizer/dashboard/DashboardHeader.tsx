
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  organizerName: string;
}

export function DashboardHeader({ organizerName }: DashboardHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold">Welcome, {organizerName}</h1>
      <Button onClick={() => navigate('/tournament-management/new')}>
        Create Tournament
      </Button>
    </div>
  );
}
