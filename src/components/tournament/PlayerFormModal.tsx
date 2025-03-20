
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Player, addPlayer } from "@/lib/mockData";
import PlayerFormFields from "@/components/player/PlayerFormFields";
import { FLOOR_RATING } from "@/lib/ratingCalculation";
import { supabase } from "@/lib/supabase";

interface PlayerFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerCreated: (player: Player) => void;
  currentUserId: string;
}

const sendEmailNotification = async (player: Player, organizerId: string) => {
  try {
    const { data: organizer } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', organizerId)
      .single();
      
    if (!organizer) {
      console.error("Could not find organizer information");
      return;
    }

    // Get rating officer email
    const { data: ratingOfficers } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'rating_officer')
      .limit(1);
      
    if (!ratingOfficers || ratingOfficers.length === 0) {
      console.error("No rating officer found in the system");
      return;
    }
    
    const officerEmail = ratingOfficers[0].email;
    
    // Send email notification using edge function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to: officerEmail,
        subject: "New Player Needs Approval - Nigerian Chess Rating System",
        html: `
          <h1>New Player Registration Needs Approval</h1>
          <p>Hello Rating Officer,</p>
          <p>A new player has been registered by organizer ${organizer.name} and requires your approval:</p>
          <ul>
            <li><strong>Player Name:</strong> ${player.name}</li>
            <li><strong>Rating:</strong> ${player.rating}</li>
            <li><strong>Gender:</strong> ${player.gender}</li>
            <li><strong>State:</strong> ${player.state || 'Not specified'}</li>
          </ul>
          <p>Please log in to the Nigerian Chess Rating System to review and approve this player.</p>
          <p>Thank you,<br>Nigerian Chess Rating System</p>
        `
      })
    });
    
    const result = await response.json();
    console.log("Email notification sent:", result);
    
    // Log email status in database for audit
    await supabase.from('email_logs').insert({
      recipient: officerEmail,
      subject: "New Player Needs Approval - Nigerian Chess Rating System",
      status: response.ok ? 'delivered' : 'failed',
      related_entity: 'player',
      entity_id: player.id
    });
    
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
};

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  isOpen,
  onOpenChange,
  onPlayerCreated,
  currentUserId
}) => {
  const [formData, setFormData] = useState<Partial<Player>>({
    name: "",
    gender: "M",
    birthYear: 2000,
    state: "",
    city: "",
    club: "",
    rating: FLOOR_RATING,
    title: "",
    ratingStatus: "provisional",
    status: "pending",
    gamesPlayed: 0,
    ratingHistory: [],
    rapidRating: null,
    rapidGamesPlayed: null,
    rapidRatingHistory: [],
    blitzRating: null,
    blitzGamesPlayed: null,
    blitzRatingHistory: [],
    federationId: "",
    tournamentResults: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validation checks
      if (!formData.name) {
        toast({
          title: "Missing information",
          description: "Player name is required",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      const newPlayer: Player = {
        ...formData as Player,
        id: crypto.randomUUID(),
        organizerId: currentUserId,
        createdAt: new Date().toISOString(),
      };
      
      addPlayer(newPlayer);
      
      // Send email notification to rating officer
      await sendEmailNotification(newPlayer, currentUserId);
      
      onPlayerCreated(newPlayer);
      onOpenChange(false);
      
      toast({
        title: "Player created",
        description: "New player has been created and is awaiting approval. A notification has been sent to the Rating Officer.",
      });
    } catch (error) {
      console.error("Error creating player:", error);
      toast({
        title: "Error",
        description: "Failed to create player. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleChange = (field: keyof Player, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Create a new player record in the system. Players are subject to approval by the Rating Officer before participating in tournaments.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <PlayerFormFields 
            player={formData as Player} 
            onChange={handleChange}
          />
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="relative"
          >
            {isSubmitting ? (
              <>
                <span className="opacity-0">Create Player</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </>
            ) : (
              "Create Player"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerFormModal;
