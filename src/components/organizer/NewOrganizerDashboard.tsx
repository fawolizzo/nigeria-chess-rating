
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const NewOrganizerDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Refreshed",
      description: "Dashboard data has been refreshed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tournament Organizer Dashboard</h1>
          <p className="text-muted-foreground">Manage your tournaments and players</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tournaments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tournaments" className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Your tournaments will appear here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="players" className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Player management will appear here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Tournament reports will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewOrganizerDashboard;
