
import { normalizeCredentials } from '../authUtils';

describe('authUtils', () => {
  describe('normalizeCredentials', () => {
    it('should trim and lowercase email', () => {
      const result = normalizeCredentials('  Test@Example.com  ', 'password123');
      expect(result.normalizedEmail).toBe('test@example.com');
    });

    it('should preserve password as is', () => {
      const password = 'ComplexP@ssw0rd!';
      const result = normalizeCredentials('email@example.com', password);
      expect(result.normalizedPassword).toBe(password);
    });

    it('should handle empty email and password', () => {
      const result = normalizeCredentials('', '');
      expect(result.normalizedEmail).toBe('');
      expect(result.normalizedPassword).toBe('');
    });

    it('should handle email with leading/trailing whitespace', () => {
      const result = normalizeCredentials('  user@domain.com  ', 'pass');
      expect(result.normalizedEmail).toBe('user@domain.com');
    });

    it('should handle mixed case emails', () => {
      const result = normalizeCredentials('User.Name@Domain.COM', 'pass');
      expect(result.normalizedEmail).toBe('user.name@domain.com');
    });
  });
});
