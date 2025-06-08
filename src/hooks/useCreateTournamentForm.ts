
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTournamentSchema, TournamentFormData } from "@/components/tournament/form/TournamentFormSchema";

interface UseCreateTournamentFormProps {
  defaultValues?: Partial<TournamentFormData>;
}

export const useCreateTournamentForm = ({ defaultValues }: UseCreateTournamentFormProps = {}) => {
  return useForm<TournamentFormData>({
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
      ...defaultValues,
    },
  });
};
