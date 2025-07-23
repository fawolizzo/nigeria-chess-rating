# Alpha Release Hardening - Design Document

## Overview

This document outlines the technical design for hardening our MVP into a production-ready alpha release. The focus is on essential production features while maintaining the existing architecture.

## Architecture

### Authentication Enhancement

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Login Page    │───▶│  Supabase Auth   │───▶│  Email Service  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Password Reset  │    │ Email Templates  │    │ Confirmation    │
│     Flow        │    │   & Settings     │    │    Tracking     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### PDF Export Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Tournament Page │───▶│   PDF Service    │───▶│   File Storage  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Export Button  │    │ Template Engine  │    │  Download Link  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Deployment Pipeline

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│ GitHub Actions   │───▶│ Supabase Prod   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Code Changes   │    │  Build & Test    │    │  Live System    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. Password Reset System

#### New Components

- `ForgotPasswordForm.tsx` - Password reset request form
- `ResetPasswordForm.tsx` - New password entry form
- `PasswordResetSuccess.tsx` - Confirmation page

#### API Endpoints

- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Set new password with token

#### Supabase Configuration

```typescript
// Enable password reset in Supabase Auth settings
{
  "SITE_URL": "https://your-domain.com",
  "PASSWORD_RESET_REDIRECT_URL": "https://your-domain.com/auth/reset-password",
  "EMAIL_TEMPLATE_PASSWORD_RESET": "custom_template"
}
```

### 2. Email Confirmation System

#### Enhanced Components

- Update `RegisterOrganizerForm.tsx` to show confirmation message
- Add `EmailConfirmationPending.tsx` component
- Update `useAuth.ts` to handle email confirmation state

#### Database Changes

```sql
-- Add email confirmation tracking
ALTER TABLE users ADD COLUMN email_confirmed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN confirmation_sent_at TIMESTAMPTZ;
```

#### Supabase Configuration

```typescript
{
  "ENABLE_EMAIL_CONFIRMATIONS": true,
  "EMAIL_CONFIRM_REDIRECT_URL": "https://your-domain.com/auth/confirmed",
  "EMAIL_TEMPLATE_CONFIRMATION": "custom_template"
}
```

### 3. Responsive Design System

#### Breakpoint Strategy

```css
/* Mobile First Approach */
.container {
  @apply px-4;
}

@screen sm {
  .container {
    @apply px-6;
  }
}

@screen md {
  .container {
    @apply px-8;
  }
}

@screen lg {
  .container {
    @apply px-12;
  }
}
```

#### Component Updates

- Update all form layouts for mobile stacking
- Implement responsive tables with horizontal scroll
- Add mobile-friendly navigation patterns
- Optimize touch targets for mobile (44px minimum)

### 4. PDF Export System

#### PDF Service Architecture

```typescript
interface PDFExportService {
  generatePairingsPDF(tournamentId: string): Promise<Buffer>;
  generateStandingsPDF(tournamentId: string): Promise<Buffer>;
}

interface PDFTemplate {
  header: TournamentInfo;
  content: PairingData[] | StandingData[];
  footer: GenerationInfo;
}
```

#### PDF Templates

- **Pairings Template**: Board number, White player, Black player, Result
- **Standings Template**: Rank, Player name, Score, Tie-breaks
- **Common Elements**: Tournament name, date, round, generation timestamp

#### Implementation Options

1. **Client-side**: `@react-pdf/renderer` for browser-based generation
2. **Server-side**: Supabase Edge Function with `puppeteer-core`

### 5. Production Deployment

#### Environment Configuration

```typescript
// Production environment variables
{
  "VITE_SUPABASE_URL": "https://prod-project.supabase.co",
  "VITE_SUPABASE_ANON_KEY": "prod-anon-key",
  "SUPABASE_SERVICE_ROLE_KEY": "prod-service-role-key",
  "VITE_APP_URL": "https://ncrs.your-domain.com",
  "NODE_ENV": "production"
}
```

#### GitHub Actions Workflow

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Supabase
        run: |
          supabase db push --linked
          npm run build
          supabase functions deploy
```

### 6. Health Check System

#### Health Check Endpoint

```typescript
interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  services: {
    database: 'ok' | 'down';
    auth: 'ok' | 'down';
  };
}
```

#### Implementation

- Check database connectivity
- Verify auth service availability
- Return appropriate HTTP status codes
- Include response time metrics

## Data Models

### Email Confirmation Tracking

```typescript
interface EmailConfirmation {
  user_id: string;
  email: string;
  confirmed_at: Date | null;
  confirmation_sent_at: Date;
  confirmation_token: string;
  expires_at: Date;
}
```

### PDF Export Metadata

```typescript
interface PDFExport {
  id: string;
  tournament_id: string;
  type: 'pairings' | 'standings';
  generated_by: string;
  generated_at: Date;
  file_size: number;
  download_count: number;
}
```

## Error Handling

### Authentication Errors

- Invalid reset token → Clear error message with option to request new token
- Expired confirmation link → Option to resend confirmation
- Email not found → Generic message for security

### PDF Generation Errors

- Tournament not found → 404 with clear message
- No data to export → Informative message with guidance
- Generation timeout → Retry option with progress indicator

### Mobile Responsiveness

- Graceful degradation for unsupported features
- Touch-friendly error messages
- Accessible error states for screen readers

## Testing Strategy

### Authentication Testing

- Password reset flow end-to-end
- Email confirmation process
- Token expiration handling
- Security edge cases

### Responsive Testing

- Cross-device compatibility testing
- Touch interaction testing
- Performance testing on mobile networks
- Accessibility testing with screen readers

### PDF Export Testing

- Template rendering accuracy
- Large dataset handling
- File size optimization
- Cross-platform PDF compatibility

### Deployment Testing

- Staging environment validation
- Production deployment verification
- Rollback procedure testing
- Health check monitoring

## Security Considerations

### Authentication Security

- Rate limiting on password reset requests
- Secure token generation and validation
- Email confirmation token security
- Session management improvements

### PDF Security

- Access control for PDF generation
- Rate limiting on export requests
- File size limits and validation
- Secure temporary file handling

### Deployment Security

- Environment variable protection
- Secure secrets management
- HTTPS enforcement
- Security headers configuration
