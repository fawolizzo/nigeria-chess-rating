
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Player } from "@/lib/mockData";
import { generateUniquePlayerID } from "@/lib/playerDataUtils";
import { FLOOR_RATING } from "@/lib/ratingCalculation";
import StateSelector from "@/components/selectors/StateSelector";
import CitySelector from "@/components/selectors/CitySelector";

interface PlayerFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerCreated: (player: Player) => void;
}

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  isOpen,
  onOpenChange,
  onPlayerCreated
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "M" as "M" | "F",
    rating: FLOOR_RATING,
    state: "",
    city: ""
  });
  const [selectedState, setSelectedState] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setFormData(prev => ({ ...prev, state, city: "" }));
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
  };

  const handleGenderChange = (gender: "M" | "F") => {
    setFormData(prev => ({ ...prev, gender }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const playerId = generateUniquePlayerID();
      
      const newPlayer: Player = {
        id: playerId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        rating: formData.rating,
        gamesPlayed: 0,
        ratingStatus: 'provisional',
        state: formData.state,
        city: formData.city,
        country: "Nigeria",
        status: 'approved',
        rapidRating: FLOOR_RATING,
        blitzRating: FLOOR_RATING,
        rapidGamesPlayed: 0,
        blitzGamesPlayed: 0,
        rapidRatingStatus: 'provisional',
        blitzRatingStatus: 'provisional',
        ratingHistory: [{
          date: new Date().toISOString(),
          rating: formData.rating,
          reason: "Initial rating"
        }],
        rapidRatingHistory: [{
          date: new Date().toISOString(),
          rating: FLOOR_RATING,
          reason: "Initial rating"
        }],
        blitzRatingHistory: [{
          date: new Date().toISOString(),
          rating: FLOOR_RATING,
          reason: "Initial rating"
        }],
        tournamentResults: [],
        achievements: []
      };

      onPlayerCreated(newPlayer);
      
      toast({
        title: "Player added",
        description: `${formData.name} has been added to the tournament.`,
        duration: 3000,
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        gender: "M",
        rating: FLOOR_RATING,
        state: "",
        city: ""
      });
      setSelectedState("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating player:", error);
      toast({
        title: "Error",
        description: "There was an error adding the player.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Player name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="player@email.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select 
              value={formData.gender} 
              onValueChange={handleGenderChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Rating</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              placeholder="Rating"
              value={formData.rating}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                rating: parseInt(e.target.value) || FLOOR_RATING 
              }))}
              min={FLOOR_RATING}
            />
          </div>

          <div className="space-y-2">
            <Label>State</Label>
            <StateSelector
              selectedState={selectedState}
              onStateChange={handleStateChange}
            />
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <CitySelector
              selectedState={selectedState}
              selectedCity={formData.city}
              onCityChange={handleCityChange}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Player"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerFormModal;
