
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Player } from "@/lib/mockData";
import StateSelector from "@/components/selectors/StateSelector";
import CitySelector from "@/components/selectors/CitySelector";
import { useToast } from "@/hooks/use-toast";
import { updatePlayerInSupabase } from "@/services/playerService";

interface EditPlayerDialogProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPlayer: Player) => void;
}

const EditPlayerDialog: React.FC<EditPlayerDialogProps> = ({
  player,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: player.name,
    rating: player.rating || 800,
    gender: player.gender || "M",
    state: player.state || "",
    city: player.city || ""
  });

  const [selectedState, setSelectedState] = useState(player.state || "");
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
      const updatedPlayer = {
        ...player,
        name: formData.name,
        rating: Number(formData.rating),
        gender: formData.gender as "M" | "F",
        state: formData.state,
        city: formData.city,
      };

      const result = await updatePlayerInSupabase(updatedPlayer.id, updatedPlayer);
      
      if (result) {
        toast({
          title: "Player updated",
          description: `${formData.name}'s information has been updated.`,
          duration: 3000,
        });
        
        onSave(updatedPlayer);
        onClose();
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Error updating player:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the player information.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogDescription>
            Update the player's information. Click save when you're done.
          </DialogDescription>
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
            <Label htmlFor="rating">Rating</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              placeholder="Rating"
              value={formData.rating}
              onChange={handleInputChange}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => handleGenderChange(value as "M" | "F")}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerDialog;
