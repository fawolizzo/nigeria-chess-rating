import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type LoginButtonProps = {
  isLoading: boolean;
};

const LoginButton = ({ isLoading }: LoginButtonProps) => {
  return (
    <Button
      type="submit"
      className="w-full bg-nigeria-green hover:bg-nigeria-green-dark dark:bg-nigeria-green-light dark:hover:bg-nigeria-green"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing In...
        </>
      ) : (
        'Sign In'
      )}
    </Button>
  );
};

export default LoginButton;
