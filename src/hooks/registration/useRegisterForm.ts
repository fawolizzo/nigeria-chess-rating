import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/components/register/RegisterFormSchema';
import { useRegistrationSubmit } from './useRegistrationSubmit';
import type { RegisterFormData } from '@/components/register/RegisterFormSchema';

export const useRegisterForm = () => {
  const { isSubmitting, successMessage, errorMessage, handleSubmit } =
    useRegistrationSubmit();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      state: '',
      role: 'tournament_organizer',
      password: '',
      confirmPassword: '',
    },
  });

  const selectedRole = form.watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    return handleSubmit(data);
  };

  const isSubmitDisabled = isSubmitting;

  return {
    form,
    selectedRole,
    isSubmitting,
    successMessage,
    errorMessage,
    isSubmitDisabled,
    onSubmit,
  };
};
