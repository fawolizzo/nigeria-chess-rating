
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trophy, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TournamentBasicDetails } from "./TournamentBasicDetails";
import TournamentLocationFields from "./TournamentLocationFields";
import TournamentDateSelection from "./TournamentDateSelection";
import { TournamentConfigFields } from "./TournamentConfigFields";

interface CreateTournamentFormUIProps {
  form: UseFormReturn<any>;
  onSubmit?: (data: any) => void;
  handleSubmit: (data: any) => void;
  isSubmitting: boolean;
  errorMsg: string | null;
  isCustomTimeControl: boolean;
  validateCustomTimeControl: (value: string) => string | null;
  updateCustomTimeControlState: (value: string) => void;
  watchTimeControl: string;
}

const CreateTournamentFormUI: React.FC<CreateTournamentFormUIProps> = ({
  form,
  onSubmit,
  handleSubmit,
  isSubmitting,
  errorMsg,
  isCustomTimeControl,
  validateCustomTimeControl,
  updateCustomTimeControlState,
  watchTimeControl,
}) => {
  const submitHandler = onSubmit || handleSubmit;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Tournament
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Set up a new chess tournament for the Nigerian Chess Rating system
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-nigeria-green" />
                Tournament Details
              </CardTitle>
              <CardDescription>
                Enter the basic information about your tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TournamentBasicDetails form={form} />
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-nigeria-green" />
                Location
              </CardTitle>
              <CardDescription>
                Where will the tournament take place?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TournamentLocationFields form={form} />
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-nigeria-green" />
                Tournament Schedule
              </CardTitle>
              <CardDescription>
                Set the start and end dates for your tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TournamentDateSelection form={form} />
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-nigeria-green" />
                Tournament Configuration
              </CardTitle>
              <CardDescription>
                Configure the tournament format and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TournamentConfigFields 
                form={form}
                isCustomTimeControl={isCustomTimeControl}
                validateCustomTimeControl={validateCustomTimeControl}
                updateCustomTimeControlState={updateCustomTimeControlState}
                watchTimeControl={watchTimeControl}
              />
            </CardContent>
          </Card>

          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-nigeria-green hover:bg-nigeria-green-dark"
            >
              {isSubmitting ? "Creating..." : "Create Tournament"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateTournamentFormUI;
export { CreateTournamentFormUI };
