// Environment configuration
export const config = {
  // App information
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Nigerian Chess Rating System',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.VITE_APP_ENV || 'development',
  },

  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // Feature flags
  features: {
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    devMode: import.meta.env.VITE_DEV_MODE === 'true',
  },

  // API configuration
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
  },

  // PDF export configuration
  pdf: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    timeout: 30000, // 30 seconds
  },

  // UI configuration
  ui: {
    pageSize: 20,
    maxUploadSize: 5 * 1024 * 1024, // 5MB
  },
} as const;

// Environment checks
export const isDevelopment = config.app.environment === 'development';
export const isProduction = config.app.environment === 'production';
export const isTest = config.app.environment === 'test';

// Validation
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }

  if (!config.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }

  if (!config.supabase.url.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must be a valid HTTPS URL');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Debug logging (only in development)
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    app: config.app,
    features: config.features,
    supabaseUrl: config.supabase.url,
    hasSupabaseKey: !!config.supabase.anonKey,
  });

  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.error('❌ Environment validation failed:', validation.errors);
  } else {
    console.log('✅ Environment validation passed');
  }
}
