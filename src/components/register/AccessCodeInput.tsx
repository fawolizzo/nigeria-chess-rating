import { Shield, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormLabel } from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AccessCodeInputProps {
  accessCode: string;
  isAccessCodeValid: boolean;
  onChange: (value: string) => void;
}

const AccessCodeInput = ({
  accessCode,
  isAccessCodeValid,
  onChange,
}: AccessCodeInputProps) => {
  return (
    <div>
      <FormLabel className="flex items-center gap-1">
        <span>Access Code</span>
        <span className="text-red-500">*</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Required for Rating Officer registration</p>
              <p className="text-xs opacity-75 mt-1">For testing use: RNCR25</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </FormLabel>
      <div className="relative">
        <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Enter Rating Officer access code"
          className={`pl-10 ${isAccessCodeValid ? 'border-green-500 focus:ring-green-500' : ''}`}
          type="password"
          value={accessCode}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="mt-1 flex justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Required for Rating Officer registration
        </p>
        {isAccessCodeValid && (
          <p className="text-xs text-green-500">✓ Valid access code</p>
        )}
      </div>
    </div>
  );
};

export default AccessCodeInput;
