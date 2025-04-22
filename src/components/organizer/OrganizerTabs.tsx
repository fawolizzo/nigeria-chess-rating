
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { OrganizerTabPanel } from "./OrganizerTabPanel";

const TAB_STATUSES = ["upcoming", "pending", "ongoing", "completed", "rejected"];

export function OrganizerTabs({
  activeTab,
  setActiveTab,
  getTournamentsByStatus,
  onCreateTournament,
  onViewDetails,
  onManage
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getTournamentsByStatus: (status: string) => any[];
  onCreateTournament: () => void;
  onViewDetails: (id: string) => void;
  onManage: (id: string) => void;
}) {
  // Debug logging to track if we're getting data
  console.log("OrganizerTabs - Active Tab:", activeTab);
  TAB_STATUSES.forEach(status => {
    const tournamentCount = getTournamentsByStatus(status).length;
    console.log(`Tab ${status}: ${tournamentCount} tournaments`);
  });

  return (
    <Tabs 
      defaultValue={activeTab} 
      className="w-full" 
      onValueChange={setActiveTab}
      value={activeTab}
    >
      <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
        <TabsTrigger value="upcoming" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
          Upcoming
        </TabsTrigger>
        <TabsTrigger value="pending" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
          Pending Approval
        </TabsTrigger>
        <TabsTrigger value="ongoing" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
          Ongoing
        </TabsTrigger>
        <TabsTrigger value="completed" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
          Completed
        </TabsTrigger>
        <TabsTrigger value="rejected" className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
          Rejected
        </TabsTrigger>
      </TabsList>
      {TAB_STATUSES.map((status) => (
        <TabsContent key={status} value={status} className="space-y-4">
          <OrganizerTabPanel
            tournaments={getTournamentsByStatus(status)}
            status={status}
            onCreateTournament={onCreateTournament}
            onViewDetails={onViewDetails}
            onManage={onManage}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
