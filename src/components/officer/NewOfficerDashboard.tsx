import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Trophy, UserCheck, Upload, RefreshCw } from 'lucide-react';
import { useOfficerDashboardData } from '@/hooks/dashboard/useOfficerDashboardData';
import { syncPlayersToLocalStorage } from '@/services/player/playerCoreService';
import PendingTournamentApprovals from './PendingTournamentApprovals';
import ApprovedTournaments from './ApprovedTournaments';
import PlayerManagement from './PlayerManagement';
import OrganizerApprovals from './OrganizerApprovals';
import SupabaseConnectionTest from '@/components/debug/SupabaseConnectionTest';

const NewOfficerDashboard = () => {
  const {
    pendingTournaments,
    completedTournaments,
    pendingPlayers,
    pendingOrganizers,
    isLoading,
    hasError,
    errorMessage,
    refreshData,
  } = useOfficerDashboardData();

  // Add debugging
  useEffect(() => {
    console.log('🔍 NewOfficerDashboard Debug Info:', {
      isLoading,
      hasError,
      errorMessage,
      pendingTournaments: pendingTournaments.length,
      completedTournaments: completedTournaments.length,
      pendingPlayers: pendingPlayers.length,
      pendingOrganizers: pendingOrganizers.length,
    });
  }, [
    isLoading,
    hasError,
    errorMessage,
    pendingTournaments,
    completedTournaments,
    pendingPlayers,
    pendingOrganizers,
  ]);

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    refreshData();
  };

  const handleSyncPlayers = async () => {
    console.log('🔄 Manual player sync triggered');
    try {
      await syncPlayersToLocalStorage();
      handleRefresh(); // Refresh the dashboard data
    } catch (error) {
      console.error('❌ Error syncing players:', error);
    }
  };

  console.log('🎯 NewOfficerDashboard rendering with state:', {
    isLoading,
    hasError,
    errorMessage,
  });

  if (isLoading) {
    console.log('⏳ Showing loading state');
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    console.log('❌ Showing error state:', errorMessage);
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Dashboard Error
          </h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-nigeria-green text-white rounded hover:bg-nigeria-green-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering main dashboard content');
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Rating Officer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage tournaments, players, and organizer approvals
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncPlayers}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Players
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tournaments
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedTournaments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for rating processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Players
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPlayers.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Organizers
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrganizers.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="completed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="completed">Rating Processing</TabsTrigger>
          <TabsTrigger value="players">Player Management</TabsTrigger>
          <TabsTrigger value="organizers">Organizer Approvals</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="space-y-6">
          <ApprovedTournaments
            completedTournaments={completedTournaments}
            onTournamentProcessed={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          <PlayerManagement onPlayerApproval={handleRefresh} />
        </TabsContent>

        <TabsContent value="organizers" className="space-y-6">
          <OrganizerApprovals onApprovalUpdate={handleRefresh} />
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">
                System Debug & Testing
              </h2>
              <p className="text-gray-600 mb-6">
                Use these tools to test and debug the system connections and
                data flow.
              </p>
            </div>

            <SupabaseConnectionTest />

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common debugging and maintenance tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleSyncPlayers}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync Players from Supabase
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Dashboard Data
                  </Button>
                </div>

                <div className="text-sm text-gray-500">
                  <p>
                    <strong>Tip:</strong> If players aren't showing up after
                    upload, try the "Test Connection" button above to check
                    Supabase connectivity.
                  </p>
                  <p>
                    <strong>Note:</strong> After the recent fixes, you may need
                    to clear existing players and re-upload to get proper NCR
                    IDs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewOfficerDashboard;
