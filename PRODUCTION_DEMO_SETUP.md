# Production Demo Accounts Setup Guide

## Overview

This guide provides step-by-step instructions for creating demo accounts in the production Nigerian Chess Rating System.

## Demo Accounts

The following demo accounts will be created:

| Role                 | Email                           | Password      | Purpose                                      |
| -------------------- | ------------------------------- | ------------- | -------------------------------------------- |
| Rating Officer       | `rating.officer@ncrs.org`       | `password123` | Full system administration and demonstration |
| Tournament Organizer | `tournament.organizer@ncrs.org` | `password123` | Tournament management demonstration          |

## Prerequisites

- Access to the production Supabase project
- Supabase CLI installed locally
- Administrative permissions for the Nigerian Chess Rating System

## Setup Instructions

### Step 1: Connect to Production Database

1. **Login to Supabase CLI**

   ```bash
   supabase login
   ```

2. **Link to Production Project**

   ```bash
   supabase link --project-ref nigeriachessrating-prod
   ```

3. **Verify Connection**
   ```bash
   supabase status
   ```

### Step 2: Create Demo Accounts

#### Option A: Using Supabase SQL Editor (Recommended)

1. Open the Supabase Dashboard: https://app.supabase.com/project/nigeriachessrating-prod
2. Navigate to the SQL Editor
3. Copy and paste the contents of `create-demo-accounts.sql`
4. Execute the script
5. Verify the results in the query output

#### Option B: Using Supabase CLI

1. **Execute the SQL script**
   ```bash
   supabase db reset --linked
   cat create-demo-accounts.sql | supabase db psql --linked
   ```

### Step 3: Verify Account Creation

1. **Check in Supabase Dashboard**
   - Go to Authentication > Users
   - Verify both demo accounts appear in the user list
   - Confirm email addresses and creation timestamps

2. **Test Login Functionality**
   - Navigate to https://nigeriachessrating.com/login
   - Test login with Rating Officer credentials
   - Test login with Tournament Organizer credentials

### Step 4: Validate Permissions

1. **Rating Officer Account**
   - Should have access to admin dashboard
   - Can approve/manage organizers
   - Has full system permissions

2. **Tournament Organizer Account**
   - Should have access to organizer dashboard
   - Can create and manage tournaments
   - Can add players and enter results

## Security Considerations

### Password Security

- Demo passwords are simple for ease of demonstration
- Passwords are properly hashed using bcrypt
- Consider changing passwords if accounts will be used long-term

### Access Control

- Demo accounts have standard permissions for their roles
- No elevated privileges beyond normal user roles
- All actions are logged through standard system audit trails

### Account Management

- Demo accounts can be easily identified by their email domains
- Accounts can be disabled or removed if no longer needed
- Usage is tracked through standard system logs

## Troubleshooting

### Common Issues

1. **"User already exists" Error**
   - Demo accounts may already be created
   - Check the Users table in Supabase Dashboard
   - Skip creation if accounts already exist

2. **Login Failures**
   - Verify accounts are marked as email_confirmed
   - Check that organizer records were created properly
   - Ensure accounts have 'approved' status

3. **Permission Issues**
   - Verify role assignments in organizers table
   - Check that user_id links correctly between auth.users and organizers
   - Confirm status is set to 'approved'

### Verification Queries

```sql
-- Check demo accounts exist
SELECT email, email_confirmed_at, created_at
FROM auth.users
WHERE email LIKE '%@ncrs.org';

-- Check organizer records
SELECT name, email, role, status
FROM organizers
WHERE email LIKE '%@ncrs.org';

-- Check user-organizer linkage
SELECT u.email, o.name, o.role, o.status
FROM auth.users u
JOIN organizers o ON u.id = o.user_id
WHERE u.email LIKE '%@ncrs.org';
```

## Cleanup (If Needed)

To remove demo accounts:

```sql
-- Remove organizer records first
DELETE FROM organizers WHERE email LIKE '%@ncrs.org';

-- Remove auth users
DELETE FROM auth.users WHERE email LIKE '%@ncrs.org';
```

## Support

For issues with demo account setup:

1. Check Supabase project logs
2. Verify database connection
3. Review error messages in SQL Editor
4. Contact system administrator if problems persist
