
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import LoginFormInputs, { loginSchema } from '../LoginFormInputs';

// Create a wrapper component to provide the form context
const LoginFormWrapper = ({
  showPassword = false,
  togglePasswordVisibility = jest.fn(),
  selectedRole = 'tournament_organizer' as const
}) => {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: selectedRole
    }
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
  it('renders email input field', () => {
    render(<LoginFormWrapper />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('renders password field for tournament organizer role', () => {
    render(<LoginFormWrapper selectedRole="tournament_organizer" />);
    
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('renders access code field for rating officer role', () => {
    render(<LoginFormWrapper selectedRole="rating_officer" />);
    
    const accessCodeInput = screen.getByLabelText(/Access Code/i);
    expect(accessCodeInput).toBeInTheDocument();
    expect(accessCodeInput).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility when the eye button is clicked', () => {
    const togglePasswordVisibility = jest.fn();
    render(
      <LoginFormWrapper 
        showPassword={false} 
        togglePasswordVisibility={togglePasswordVisibility} 
      />
    );
    
    const visibilityButton = screen.getByRole('button', { name: '' });
    visibilityButton.click();
    
    expect(togglePasswordVisibility).toHaveBeenCalledTimes(1);
  });

  it('shows password in plain text when showPassword is true', () => {
    render(<LoginFormWrapper showPassword={true} />);
    
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});
