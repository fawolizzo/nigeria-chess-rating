
import { useCreateTournamentForm } from '@/hooks/useCreateTournamentForm';
import { CreateTournamentFormUI } from '@/components/tournament/form/CreateTournamentFormUI';

export default function CreateTournament() {
  const {
    form,
    isCustomTimeControl,
    isSubmitting,
    errorMsg,
    validateCustomTimeControl,
    handleSubmit,
    updateCustomTimeControlState,
    navigate,
    watchTimeControl,
  } = useCreateTournamentForm();

  const handleCancel = () => {
    navigate('/organizer-dashboard');
  };

  return (
    <div className="container mx-auto py-8">
      <CreateTournamentFormUI 
        form={form}
        isCustomTimeControl={isCustomTimeControl}
        watchTimeControl={watchTimeControl}
        isSubmitting={isSubmitting}
        errorMsg={errorMsg}
        validateCustomTimeControl={validateCustomTimeControl}
        updateCustomTimeControlState={updateCustomTimeControlState}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
