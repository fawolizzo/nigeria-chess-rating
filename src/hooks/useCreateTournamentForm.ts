
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { createTournamentSchema, TournamentFormData } from "@/components/tournament/form/TournamentFormSchema";
import { useToast } from "@/hooks/use-toast";

export const useCreateTournamentForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCustomTimeControl, setIsCustomTimeControl] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(createTournamentSchema),
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

  const watchTimeControl = form.watch("timeControl");

  const validateCustomTimeControl = (value: string): string | null => {
    const timeControlPattern = /^\d+\+\d+$/;
    if (!timeControlPattern.test(value)) {
      return "Time control must be in format: minutes+increment (e.g., 90+30)";
    }
    return null;
  };

  const updateCustomTimeControlState = (value: string) => {
    setIsCustomTimeControl(value === "custom");
  };

  const handleSubmit = async (data: TournamentFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // Validate custom time control if selected
      if (isCustomTimeControl && data.customTimeControl) {
        const error = validateCustomTimeControl(data.customTimeControl);
        if (error) {
          setErrorMsg(error);
          return;
        }
      }

      console.log("Creating tournament with data:", data);
      
      toast({
        title: "Tournament Created",
        description: "Your tournament has been created successfully.",
      });

      navigate("/organizer-dashboard");
    } catch (error) {
      console.error("Error creating tournament:", error);
      setErrorMsg("Failed to create tournament. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isCustomTimeControl,
    isSubmitting,
    errorMsg,
    validateCustomTimeControl,
    handleSubmit,
    updateCustomTimeControlState,
    navigate,
    watchTimeControl,
  };
};
