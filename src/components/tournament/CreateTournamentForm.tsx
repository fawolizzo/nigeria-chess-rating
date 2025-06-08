
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCreateTournamentForm } from "@/hooks/useCreateTournamentForm";
import CreateTournamentFormUI from "./form/CreateTournamentFormUI";
import { TournamentFormData } from "./form/TournamentFormSchema";

interface CreateTournamentFormProps {
  onSuccess?: () => void;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ onSuccess }) => {
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useCreateTournamentForm({
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      location: "",
      state: "",
      city: "",
      rounds: 5,
      timeControl: "",
      registrationOpen: true,
    },
  });

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity("");
    form.setValue("state", state);
    form.setValue("city", "");
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    form.setValue("city", city);
  };

  const onSubmit = async (data: TournamentFormData) => {
    setIsSubmitting(true);
    try {
      // Convert dates to ISO strings for storage
      const tournamentData = {
        ...data,
        startDate: data.startDate.toISOString().split('T')[0],
        endDate: data.endDate.toISOString().split('T')[0],
      };

      console.log("Creating tournament:", tournamentData);
      
      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully.",
      });
      
      form.reset();
      setSelectedState("");
      setSelectedCity("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <CreateTournamentFormUI
        form={form}
        onSubmit={onSubmit}
        selectedState={selectedState}
        selectedCity={selectedCity}
        onStateChange={handleStateChange}
        onCityChange={handleCityChange}
        isSubmitting={isSubmitting}
      />
      
      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            form.reset();
            setSelectedState("");
            setSelectedCity("");
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Tournament"}
        </Button>
      </div>
    </div>
  );
};

export default CreateTournamentForm;
