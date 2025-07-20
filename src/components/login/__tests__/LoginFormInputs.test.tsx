import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import LoginFormInputs, {
  loginSchema,
  LoginFormData,
} from '../LoginFormInputs';

// Create a wrapper component to provide the form context
const LoginFormWrapper = ({
  showPassword = false,
  togglePasswordVisibility = jest.fn(),
  selectedRole = 'tournament_organizer' as LoginFormData['role'], // Fix the type here
}) => {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: selectedRole,
    },
  });

  return (
    <Form {...form}>
      <form>
        <LoginFormInputs
          control={form.control}
          showPassword={showPassword}
          togglePasswordVisibility={togglePasswordVisibility}
          selectedRole={selectedRole}
        />
      </form>
    </Form>
  );
};

describe('LoginFormInputs', () => {
  // Test for tournament organizer
  describe('Tournament Organizer Role', () => {
    it('renders email input field', () => {
      render(<LoginFormWrapper selectedRole="tournament_organizer" />);

      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('renders password field for tournament organizer role', () => {
      render(<LoginFormWrapper selectedRole="tournament_organizer" />);

      const passwordInput = screen.getByLabelText(/Password/i, {
        selector: 'input',
      });
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  // Test for rating officer
  describe('Rating Officer Role', () => {
    it('renders email input field', () => {
      render(<LoginFormWrapper selectedRole="rating_officer" />);

      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('renders access code field for rating officer role', () => {
      render(<LoginFormWrapper selectedRole="rating_officer" />);

      const accessCodeInput = screen.getByLabelText(/Access Code/i);
      expect(accessCodeInput).toBeInTheDocument();
      expect(accessCodeInput).toHaveAttribute('type', 'password');
    });
  });

  it('toggles password visibility when the eye button is clicked', () => {
    const togglePasswordVisibility = jest.fn();
    render(
      <LoginFormWrapper
        showPassword={false}
        togglePasswordVisibility={togglePasswordVisibility}
      />
    );

    const visibilityButton = screen.getByRole('button', {
      name: /show password/i,
    });
    visibilityButton.click();

    expect(togglePasswordVisibility).toHaveBeenCalledTimes(1);
  });

  it('shows password in plain text for both roles when showPassword is true', () => {
    render(
      <LoginFormWrapper
        selectedRole="tournament_organizer"
        showPassword={true}
      />
    );
    render(
      <LoginFormWrapper selectedRole="rating_officer" showPassword={true} />
    );

    const passwordInputs = screen.getAllByLabelText(/Password|Access Code/i, {
      selector: 'input',
    });
    passwordInputs.forEach((input) => {
      expect(input).toHaveAttribute('type', 'text');
    });
  });
});
