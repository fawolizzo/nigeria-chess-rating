
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PlusCircle } from "lucide-react";
import { StateSelector } from "@/components/selectors/StateSelector";
import { CitySelector } from "@/components/selectors/CitySelector";

interface CreatePlayerDialogProps {
  onPlayerCreated: (playerData: any) => void;
}

const CreatePlayerDialog: React.FC<CreatePlayerDialogProps> = ({ onPlayerCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    rating: "800",
    gender: "M",
    state: "",
    city: "",
    status: "pending",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (state: string) => {
    setFormData(prev => ({ ...prev, state, city: "" }));
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
  };

  const handleGenderChange = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert rating string to number
    const playerData = {
      ...formData,
      rating: parseInt(formData.rating, 10) || 800
    };

    onPlayerCreated(playerData);
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      rating: "800",
      gender: "M",
      state: "",
      city: "",
      status: "pending",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle size={16} />
          Create Player
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Player</DialogTitle>
          <DialogDescription>
            Add a new player to the system. Players will need to be approved before they can be added to tournaments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Player's full name"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Initial Rating</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              placeholder="800"
              value={formData.rating}
              onChange={handleInputChange}
              min={0}
            />
            <p className="text-xs text-gray-500">
              Default rating is 800 for new players
            </p>
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
            <Label>State</Label>
            <StateSelector
              selectedState={formData.state}
              onStateChange={handleStateChange}
            />
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <CitySelector
              selectedState={formData.state}
              selectedCity={formData.city}
              onCityChange={handleCityChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Player</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlayerDialog;
