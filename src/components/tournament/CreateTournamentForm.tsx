
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TournamentFormValues } from "@/hooks/useTournamentManager";
import { format } from "date-fns";

import { tournamentSchema, TournamentFormSchemaType } from "./form/TournamentFormSchema";
import { TournamentBasicDetails } from "./form/TournamentBasicDetails";
import { TournamentDateSelection } from "./form/TournamentDateSelection";
import { TournamentLocationFields } from "./form/TournamentLocationFields";
import { TournamentConfigFields } from "./form/TournamentConfigFields";
import { useCustomTimeControl } from "./form/useCustomTimeControl";

interface CreateTournamentFormProps {
  onSubmit: (data: TournamentFormValues, customTimeControl: string, isCustomTimeControl: boolean) => void;
  onCancel: () => void;
}

export function CreateTournamentForm({ onSubmit, onCancel }: CreateTournamentFormProps) {
  const form = useForm<TournamentFormSchemaType>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      location: "",
      city: "",
      state: "",
      rounds: 9,
      timeControl: ""
    },
    mode: "onChange"
  });

  const {
    isCustomTimeControl,
    setIsCustomTimeControl,
    customTimeControl,
    setCustomTimeControl,
    customTimeControlError,
    setCustomTimeControlError,
    isFormValid
  } = useCustomTimeControl(form);

  const handleSubmit = (data: TournamentFormSchemaType) => {
    if (!isFormValid) return;
    
    console.log("Creating tournament with data:", {
      ...data, 
      timeControl: isCustomTimeControl ? customTimeControl : data.timeControl,
      isCustomTimeControl
    });
    
    // Since data is fully validated by zod, we know all required fields are present
    onSubmit(data as TournamentFormValues, customTimeControl, isCustomTimeControl);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <TournamentBasicDetails form={form} />
        <TournamentDateSelection form={form} />
        <TournamentLocationFields form={form} />
        <TournamentConfigFields 
          form={form}
          isCustomTimeControl={isCustomTimeControl}
          setIsCustomTimeControl={setIsCustomTimeControl}
          customTimeControl={customTimeControl}
          setCustomTimeControl={setCustomTimeControl}
          customTimeControlError={customTimeControlError}
          setCustomTimeControlError={setCustomTimeControlError}
        />

        <div className="mt-6 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!isFormValid || form.formState.isSubmitting}
          >
            Create Tournament
          </Button>
        </div>
      </form>
    </Form>
  );
}
