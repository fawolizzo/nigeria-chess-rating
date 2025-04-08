
import { Check, Shield, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";

interface AccessCodeInputProps {
  accessCode: string;
  isAccessCodeValid: boolean;
  onChange: (value: string) => void;
}

const AccessCodeInput = ({ 
  accessCode, 
  isAccessCodeValid, 
  onChange 
}: AccessCodeInputProps) => {
  return (
    <div>
      <FormLabel className="flex items-center gap-1">
        <span>Access Code</span> 
        <Info className="h-4 w-4 text-gray-400 cursor-help" title="Required for Rating Officer" />
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
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Required for Rating Officer registration
        </p>
        {isAccessCodeValid && (
          <p className="text-xs text-green-500 flex items-center">
            <Check className="h-3 w-3 mr-1" /> Code valid - account will be auto-approved
          </p>
        )}
      </div>
      <p className="text-xs text-blue-500 mt-1">
        For testing, use code: NCR2025
      </p>
    </div>
  );
};

export default AccessCodeInput;
