# Production Deployment Checklist

## 🚀 Deploy to nigeriachessrating.com

### Prerequisites

- [ ] Domain `nigeriachessrating.com` is registered and accessible
- [ ] Cloudflare account with Pages access
- [ ] GitHub repository with admin access
- [ ] Supabase account for production project

### Step 1: Supabase Production Setup

- [ ] Create Supabase project: `nigeriachessrating-prod`
- [ ] Apply all database migrations from `supabase/migrations/`
- [ ] Run seed data script from `supabase/seed/`
- [ ] Configure authentication settings:
  - [ ] Enable email/password authentication
  - [ ] Set redirect URLs:
    - `https://nigeriachessrating.com/auth/confirm-email`
    - `https://nigeriachessrating.com/auth/reset-password`
- [ ] Set up email templates:
  - [ ] Email confirmation template
  - [ ] Password reset template
- [ ] Copy production Supabase URL and anon key

### Step 2: DNS Configuration

Add these DNS records to your domain registrar:

| Type  | Name | Value                                    | TTL   |
| ----- | ---- | ---------------------------------------- | ----- |
| CNAME | @    | `nigerian-chess-rating-system.pages.dev` | 1 min |
| CNAME | www  | `nigerian-chess-rating-system.pages.dev` | 1 min |

**Note**: Replace with your actual Cloudflare Pages domain

### Step 3: GitHub Secrets Setup

Add these secrets to GitHub repository (Settings → Secrets and variables → Actions):

```
VITE_SUPABASE_URL=https://nigeriachessrating-prod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
```

### Step 4: Cloudflare Pages Setup

- [ ] Create new Pages project: `nigerian-chess-rating-system`
- [ ] Connect to GitHub repository
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Root directory: `nigeria-chess-rating`
- [ ] Add custom domains:
  - [ ] `nigeriachessrating.com`
  - [ ] `www.nigeriachessrating.com`
- [ ] Set environment variables:
  ```
  VITE_SUPABASE_URL=https://nigeriachessrating-prod.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  VITE_APP_ENV=production
  VITE_APP_DOMAIN=nigeriachessrating.com
  ```

### Step 5: Deploy to Production

- [ ] Push to main branch:
  ```bash
  git checkout main
  git push origin main
  ```
- [ ] Monitor GitHub Actions deployment
- [ ] Verify Cloudflare Pages build success
- [ ] Check SSL certificate is issued (automatic)

### Step 6: Post-Deployment Verification

#### Functional Testing

- [ ] **Homepage**: `https://nigeriachessrating.com` loads correctly
- [ ] **Registration**: `/register-organizer` → email confirmation flow works
- [ ] **Login**: Authentication with test accounts works
- [ ] **Password Reset**: Forgot password flow works
- [ ] **Tournament Management**: Create tournament, add players, generate pairings
- [ ] **PDF Export**: Download pairings and standings sheets
- [ ] **Mobile Experience**: Test on mobile devices
- [ ] **Health Check**: `/health` endpoint returns healthy status

#### Performance Testing

- [ ] Page load times < 3 seconds
- [ ] PDF generation < 10 seconds
- [ ] Mobile performance acceptable
- [ ] Health check response < 1 second

#### Security Testing

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present
- [ ] Authentication flows secure
- [ ] RLS policies enforced in database
- [ ] No sensitive data exposed in client

### Step 7: Monitoring Setup

- [ ] Set up uptime monitoring:
  - Monitor: `https://nigeriachessrating.com/health`
  - Expected: 200 response within 2 seconds
- [ ] Configure alerts for downtime
- [ ] Set up error tracking (optional)

### Step 8: Documentation Update

- [ ] Update README.md with production URL
- [ ] Update any hardcoded URLs in documentation
- [ ] Create user onboarding guide
- [ ] Prepare admin documentation

### Step 9: User Onboarding

- [ ] Create initial Rating Officer account
- [ ] Test complete user journey:
  1. TO registers → email confirmation
  2. RO approves TO account
  3. TO creates tournament
  4. TO adds players and generates pairings
  5. TO enters results and completes rounds
  6. RO processes ratings
  7. Export PDF reports
- [ ] Prepare demo data for training

### Step 10: Go-Live

- [ ] Announce to Nigerian Chess Federation
- [ ] Provide training to initial users
- [ ] Monitor system performance
- [ ] Gather user feedback
- [ ] Plan future enhancements

## 🎯 Success Criteria

The deployment is successful when:

- ✅ `https://nigeriachessrating.com` loads the application
- ✅ Complete user registration and tournament management flow works
- ✅ PDF export functionality works
- ✅ Mobile experience is fully functional
- ✅ Health monitoring shows all systems green
- ✅ SSL certificate is active and secure
- ✅ All authentication flows work correctly

## 🚨 Rollback Plan

If issues occur:

1. **Immediate**: Revert to previous GitHub commit
2. **DNS**: Point domain back to maintenance page
3. **Database**: Restore from Supabase backup if needed
4. **Monitoring**: Check health endpoint and logs
5. **Communication**: Notify users of temporary issues

## 📞 Support Contacts

- **Technical Issues**: Check GitHub Actions logs and Cloudflare Pages logs
- **Database Issues**: Check Supabase project logs
- **DNS Issues**: Check domain registrar settings
- **SSL Issues**: Cloudflare automatically manages SSL certificates

---

**🎉 Once complete, the Nigerian Chess Rating System will be live at https://nigeriachessrating.com!**
