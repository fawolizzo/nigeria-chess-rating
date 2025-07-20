import { useState, useEffect } from 'react';

// This is the access code for rating officers
const RATING_OFFICER_ACCESS_CODE = 'RNCR25';

export const useAccessCode = () => {
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isAccessCodeValid, setIsAccessCodeValid] = useState(false);

  // Show access code field when role is rating officer
  const handleShowAccessCode = (role: string) => {
    setShowAccessCode(role === 'rating_officer');

    // Reset access code when role changes
    if (role !== 'rating_officer') {
      setAccessCode('');
      setIsAccessCodeValid(false);
    }
  };

  // Validate access code whenever it changes
  useEffect(() => {
    const isValid = accessCode === RATING_OFFICER_ACCESS_CODE;
    setIsAccessCodeValid(isValid);
  }, [accessCode]);

  return {
    showAccessCode,
    accessCode,
    isAccessCodeValid,
    handleShowAccessCode,
    setAccessCode,
    RATING_OFFICER_ACCESS_CODE,
  };
};
