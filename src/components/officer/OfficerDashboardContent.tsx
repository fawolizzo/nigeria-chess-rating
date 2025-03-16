
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Trophy, MapPin, BarChart } from "lucide-react";
import OrganizerApprovals from "@/components/officer/OrganizerApprovals";
import { useUser } from "@/contexts/UserContext";

const OfficerDashboardContent: React.FC = () => {
  const { users } = useUser();
  
  // Count pending organizers
  const pendingOrganizersCount = users.filter(
    user => user.role === "tournament_organizer" && user.status === "pending"
  ).length;
  
  return (
    <Tabs defaultValue="approvals" className="w-full">
      <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
        <TabsTrigger value="approvals" className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          <span>Approvals</span>
          {pendingOrganizersCount > 0 && (
            <span className="ml-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
              {pendingOrganizersCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="tournaments" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          <span>Tournaments</span>
        </TabsTrigger>
        <TabsTrigger value="geographic" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>Geographic</span>
        </TabsTrigger>
        <TabsTrigger value="statistics" className="flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          <span>Statistics</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="approvals">
        <OrganizerApprovals />
      </TabsContent>
      
      <TabsContent value="tournaments">
        <div className="text-center py-12 text-gray-500">
          Tournament processing panel coming soon
        </div>
      </TabsContent>
      
      <TabsContent value="geographic">
        <div className="text-center py-12 text-gray-500">
          Geographic distribution panel coming soon
        </div>
      </TabsContent>
      
      <TabsContent value="statistics">
        <div className="text-center py-12 text-gray-500">
          Rating statistics panel coming soon
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default OfficerDashboardContent;
