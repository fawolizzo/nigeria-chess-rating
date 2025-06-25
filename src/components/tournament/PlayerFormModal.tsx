import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Player } from "@/lib/mockData";

interface PlayerFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (player: Partial<Player>) => void;
  isProcessing: boolean;
}

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  isOpen,
  onOpenChange,
  onCreate,
  isProcessing
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "M",
    state: "",
    city: "",
    rating: 1200,
    rapidRating: 1200,
    blitzRating: 1200
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createPlayer = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Name and email are required.",
        variant: "destructive"
      });
      return;
    }

    const newPlayer: Partial<Player> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender as "M" | "F",
      state: formData.state,
      city: formData.city,
      rating: formData.rating,
      rapidRating: formData.rapidRating,
      blitzRating: formData.blitzRating,
      status: "approved",
      gamesPlayed: 0,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
      created_at: new Date().toISOString(),
      ratingHistory: [{
        date: new Date().toISOString(),
        rating: formData.rating,
        change: 0,
        reason: "Initial rating"
      }],
      rapidRatingHistory: [{
        date: new Date().toISOString(),
        rating: formData.rapidRating,
        change: 0,
        reason: "Initial rapid rating"
      }],
      blitzRatingHistory: [{
        date: new Date().toISOString(),
        rating: formData.blitzRating,
        change: 0,
        reason: "Initial blitz rating"
      }],
      tournamentResults: []
    };

    try {
      onCreate(newPlayer);
      onOpenChange(false);
      toast({
        title: "Player Created",
        description: "New player has been added successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create player.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Player</DialogTitle>
          <DialogDescription>
            Fill in the form to create a new player.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gender" className="text-right">
              Gender
            </Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="state" className="text-right">
              State
            </Label>
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              City
            </Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rating" className="text-right">
              Classical Rating
            </Label>
            <Input
              type="number"
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rapidRating" className="text-right">
              Rapid Rating
            </Label>
            <Input
              type="number"
              id="rapidRating"
              name="rapidRating"
              value={formData.rapidRating}
              onChange={(e) => setFormData(prev => ({ ...prev, rapidRating: parseInt(e.target.value) }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="blitzRating" className="text-right">
              Blitz Rating
            </Label>
            <Input
              type="number"
              id="blitzRating"
              name="blitzRating"
              value={formData.blitzRating}
              onChange={(e) => setFormData(prev => ({ ...prev, blitzRating: parseInt(e.target.value) }))}
              className="col-span-3"
            />
          </div>
        </div>
        <Button type="submit" onClick={createPlayer} disabled={isProcessing}>
          Create player
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerFormModal;
