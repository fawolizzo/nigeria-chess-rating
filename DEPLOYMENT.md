# Deployment Guide

## Production Deployment

The Nigerian Chess Rating System is automatically deployed to production using GitHub Actions and Cloudflare Pages.

### Prerequisites

1. **Supabase Production Project**
   - Create a new Supabase project for production
   - Apply all database migrations
   - Configure authentication settings
   - Set up email templates

2. **Cloudflare Pages Project**
   - Create a new Cloudflare Pages project
   - Connect to GitHub repository
   - Configure build settings

### GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
VITE_SUPABASE_URL=https://nigeriachessrating-prod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
```

### Deployment Process

1. **Automatic Deployment**
   - Push to `main` branch triggers deployment
   - GitHub Actions builds the application
   - Cloudflare Pages serves the built application

2. **Manual Deployment**
   - Go to Actions tab in GitHub
   - Run "Deploy to Production" workflow manually

### Environment Setup

#### Supabase Production Setup

1. **Create Production Project**

   ```bash
   # Using Supabase CLI (optional)
   supabase projects create nigerian-chess-rating-prod
   ```

2. **Apply Database Schema**
   - Run all migrations from `supabase/migrations/`
   - Apply RLS policies
   - Set up seed data (rating officer account)

3. **Configure Authentication**
   - Enable email/password authentication
   - Set up email templates for:
     - Email confirmation
     - Password reset
   - Configure redirect URLs:
     - `https://nigeriachessrating.com/auth/confirm-email`
     - `https://nigeriachessrating.com/auth/reset-password`

4. **Email Templates**

   **Confirm Signup Template:**

   ```html
   <h2>Welcome to Nigerian Chess Rating System</h2>
   <p>Please confirm your email address by clicking the link below:</p>
   <a href="{{ .ConfirmationURL }}">Confirm Email</a>
   <p>This link expires in 24 hours.</p>
   ```

   **Reset Password Template:**

   ```html
   <h2>Nigerian Chess Rating System - Password Reset</h2>
   <p>Click the link below to choose a new password:</p>
   <a href="{{ .ConfirmationURL }}">Reset Password</a>
   <p>This link will expire in 1 hour.</p>
   ```

#### Cloudflare Pages Setup

1. **Create Project**
   - Go to Cloudflare Dashboard → Pages
   - Connect to GitHub repository
   - Select `nigeria-chess-rating` repository

2. **Build Configuration**

   ```
   Build command: npm run build
   Build output directory: dist
   Root directory: nigeria-chess-rating
   ```

3. **Custom Domain Setup**
   - Go to Pages project → Custom domains
   - Add custom domain: `nigeriachessrating.com`
   - Add custom domain: `www.nigeriachessrating.com`
   - Configure DNS records (see DNS Setup below)

4. **Environment Variables**
   Set in Cloudflare Pages → Settings → Environment variables:
   ```
   VITE_SUPABASE_URL=https://nigeriachessrating-prod.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_ENV=production
   VITE_APP_DOMAIN=nigeriachessrating.com
   ```

#### DNS Setup

Add these DNS records to your domain registrar:

| Type  | Name | Value                                    | TTL   |
| ----- | ---- | ---------------------------------------- | ----- |
| CNAME | @    | `nigerian-chess-rating-system.pages.dev` | 1 min |
| CNAME | www  | `nigerian-chess-rating-system.pages.dev` | 1 min |

**Note**: Replace `nigerian-chess-rating-system.pages.dev` with your actual Cloudflare Pages domain.

### Post-Deployment Verification

1. **Functional Testing**
   - [ ] Homepage loads correctly
   - [ ] User registration works
   - [ ] Email confirmation works
   - [ ] Password reset works
   - [ ] Tournament creation works
   - [ ] PDF export works

2. **Performance Testing**
   - [ ] Page load times < 3 seconds
   - [ ] Mobile responsiveness
   - [ ] PDF generation performance

3. **Security Testing**
   - [ ] Authentication flows secure
   - [ ] RLS policies enforced
   - [ ] No sensitive data exposed

### Monitoring and Maintenance

1. **Application Monitoring**
   - Cloudflare Analytics for traffic
   - Supabase Dashboard for database metrics
   - GitHub Actions for deployment status

2. **Database Maintenance**
   - Regular backups via Supabase
   - Monitor database performance
   - Apply schema updates via migrations

3. **Updates and Releases**
   - Feature updates via pull requests
   - Automatic deployment on merge to main
   - Rollback capability via Cloudflare Pages

### Troubleshooting

#### Common Issues

1. **Build Failures**
   - Check environment variables are set
   - Verify Node.js version compatibility
   - Check for TypeScript errors

2. **Authentication Issues**
   - Verify Supabase URL and keys
   - Check redirect URLs in Supabase settings
   - Confirm email templates are configured

3. **Database Connection Issues**
   - Verify Supabase project is active
   - Check RLS policies
   - Confirm migrations are applied

#### Support

For deployment issues:

1. Check GitHub Actions logs
2. Review Cloudflare Pages deployment logs
3. Check Supabase project logs
4. Contact system administrator

### Security Considerations

1. **Environment Variables**
   - Never commit secrets to repository
   - Use GitHub Secrets for sensitive data
   - Rotate API keys regularly

2. **Database Security**
   - RLS policies enforced
   - Regular security updates
   - Monitor for suspicious activity

3. **Application Security**
   - HTTPS enforced
   - Secure authentication flows
   - Input validation and sanitization
