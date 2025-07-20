import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { OrganizerTabPanel } from './OrganizerTabPanel';

// Tournament status flow: Created → Approved → Ongoing → Completed → Processed
const TAB_STATUSES = ['approved', 'ongoing', 'completed', 'processed'];

export function OrganizerTabs({
  activeTab,
  setActiveTab,
  getTournamentsByStatus,
  onCreateTournament,
  onViewDetails,
  onManage,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getTournamentsByStatus: (status: string) => any[];
  onCreateTournament: () => void;
  onViewDetails: (id: string) => void;
  onManage: (id: string) => void;
}) {
  // Debug logging to track if we're getting data
  console.log('OrganizerTabs - Active Tab:', activeTab);
  TAB_STATUSES.forEach((status) => {
    const tournamentCount = getTournamentsByStatus(status).length;
    console.log(`Tab ${status}: ${tournamentCount} tournaments`);
  });

  return (
    <div className="w-full space-y-6">
      {/* Header with Create Tournament Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tournament Organizer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your chess tournaments and track their progress
          </p>
        </div>
        <Button
          onClick={onCreateTournament}
          className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Tournament
        </Button>
      </div>

      <Tabs
        defaultValue={activeTab}
        className="w-full"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
          <TabsTrigger
            value="approved"
            className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
          >
            Ready to Start
          </TabsTrigger>
          <TabsTrigger
            value="ongoing"
            className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
          >
            Ongoing
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
          >
            Completed
          </TabsTrigger>
          <TabsTrigger
            value="processed"
            className="nigeria-tab data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
          >
            Rated
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
    </div>
  );
}
