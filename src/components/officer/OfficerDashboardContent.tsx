
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizerApprovals from "./OrganizerApprovals";
import PlayerManagement from "./PlayerManagement";
import PendingTournamentApprovals from "./PendingTournamentApprovals";
import ApprovedTournaments from "./ApprovedTournaments";
import ApprovedOrganizers from "./ApprovedOrganizers";
import { useToast } from "@/components/ui/use-toast";
import { getAllTournaments, getAllPlayers } from "@/lib/mockData";

const OfficerDashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("players"); // Default to players tab to highlight import feature
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingTournaments, setPendingTournaments] = useState<any[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<any[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  
  useEffect(() => {
    // Load tournaments based on their status
    const allTournaments = getAllTournaments();
    setPendingTournaments(allTournaments.filter(t => t.status === "pending"));
    setCompletedTournaments(allTournaments.filter(t => t.status === "completed"));
    
    // Load pending players
    const allPlayers = getAllPlayers();
    setPendingPlayers(allPlayers.filter(p => p.status === "pending"));
  }, [refreshKey]);
  
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Dashboard refreshed",
      description: "The dashboard has been refreshed with the latest data.",
    });
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Refresh data when switching to the tournaments tab
    if (value === "approved-tournaments") {
      const allTournaments = getAllTournaments();
      setCompletedTournaments(allTournaments.filter(t => t.status === "completed"));
    }
    
    // Refresh data when switching to the players tab
    if (value === "players") {
      const allPlayers = getAllPlayers();
      setPendingPlayers(allPlayers.filter(p => p.status === "pending"));
    }
  };
  
  return (
    <div>
      <Tabs 
        defaultValue="players" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-0 border-b rounded-none w-full">
          <TabsTrigger value="organizers">Organizers</TabsTrigger>
          <TabsTrigger value="players">
            Players
            {pendingPlayers.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                {pendingPlayers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending-tournaments">Pending Tournaments</TabsTrigger>
          <TabsTrigger value="approved-tournaments">
            Tournaments
            {completedTournaments.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-600 text-xs font-medium">
                {completedTournaments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="organizers" className="p-4">
          <div className="space-y-8">
            <OrganizerApprovals />
            <ApprovedOrganizers />
          </div>
        </TabsContent>
        <TabsContent value="players" className="p-4">
          <PlayerManagement onPlayerApproval={refreshDashboard} />
        </TabsContent>
        <TabsContent value="pending-tournaments" className="p-4">
          <PendingTournamentApprovals 
            tournaments={pendingTournaments}
            onApprovalUpdate={refreshDashboard} 
          />
        </TabsContent>
        <TabsContent value="approved-tournaments" className="p-4">
          <ApprovedTournaments 
            completedTournaments={completedTournaments}
            onTournamentProcessed={refreshDashboard} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfficerDashboardContent;
