export const config = {
  supabaseUrl: 'http://localhost:54321',
  supabaseAnonKey: 'anon-key',
};

export const validateEnvironment = () => {
  return {
    isValid: true,
    errors: [],
  };
};
