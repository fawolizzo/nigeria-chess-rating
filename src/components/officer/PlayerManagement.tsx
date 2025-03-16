
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllPlayers, Player, deletePlayer } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Pencil, Trash2 } from "lucide-react";
import CreatePlayerDialog from "./CreatePlayerDialog";
import EditPlayerDialog from "./EditPlayerDialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

const PlayerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const players = getAllPlayers();
  
  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(search.toLowerCase()) ||
    (player.state && player.state.toLowerCase().includes(search.toLowerCase()))
  );

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setIsEditDialogOpen(true);
  };
  
  const handleDeletePlayer = (player: Player) => {
    setSelectedPlayer(player);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeletePlayer = () => {
    if (selectedPlayer) {
      deletePlayer(selectedPlayer.id);
      toast({
        title: "Player deleted",
        description: `${selectedPlayer.name} has been removed from the system.`,
      });
      setIsDeleteDialogOpen(false);
      setRefreshTrigger(prev => prev + 1);
    }
  };
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Players Management</CardTitle>
            <CardDescription>
              Create, edit and manage players in the Nigerian Chess Rating system
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-1 bg-nigeria-green hover:bg-nigeria-green-dark text-white"
          >
            <UserPlus size={16} /> Create Player
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search players by name or state..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              {players.length === 0 ? (
                <div>
                  <p className="mb-2 text-lg">No players in the system yet</p>
                  <p>Create a new player to get started</p>
                </div>
              ) : (
                <p>No players match your search criteria</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        {player.title && `${player.title} `}{player.name}
                      </TableCell>
                      <TableCell>{player.rating}</TableCell>
                      <TableCell>{player.gender === 'M' ? 'Male' : 'Female'}</TableCell>
                      <TableCell>{player.state || '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/player/${player.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlayer(player)}
                          >
                            <Pencil size={14} className="mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeletePlayer(player)}
                          >
                            <Trash2 size={14} className="mr-1" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <CreatePlayerDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleRefresh}
      />
      
      <EditPlayerDialog
        player={selectedPlayer}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleRefresh}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this player?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the player
              {selectedPlayer && ` ${selectedPlayer.name}`} and remove their records from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlayer}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlayerManagement;
