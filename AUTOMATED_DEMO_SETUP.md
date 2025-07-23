# 🚀 Automated Demo Accounts Setup

## One-Command Solution

Run this single command to set up everything automatically:

```bash
cd nigeria-chess-rating && ./deploy-demo-accounts.sh
```

## What This Does Automatically

1. ✅ **Links to production project**
2. ✅ **Runs migration to create demo accounts**
3. ✅ **Creates auth.users records**
4. ✅ **Creates organizers table records**
5. ✅ **Verifies everything is working**
6. ✅ **Shows you the login credentials**

## Alternative: Manual Migration

If you prefer to run the migration manually:

```bash
# Link to production
supabase link --project-ref nigeriachessrating-prod

# Push the migration
supabase db push

# Verify it worked
supabase db psql --command "SELECT * FROM verify_demo_accounts();"
```

## Demo Account Credentials

After running the setup:

| Role                     | Email                           | Credential                  | Login URL                                     |
| ------------------------ | ------------------------------- | --------------------------- | --------------------------------------------- |
| **Rating Officer**       | `rating.officer@ncrs.org`       | **Access Code**: `RO2024!`  | [Login](https://nigeriachessrating.com/login) |
| **Tournament Organizer** | `tournament.organizer@ncrs.org` | **Password**: `password123` | [Login](https://nigeriachessrating.com/login) |

## Verification

To check if the accounts are working:

```bash
supabase db psql --command "SELECT * FROM verify_demo_accounts();"
```

Expected output:

```
account_type         | email                           | auth_created | organizer_created | status
Rating Officer       | rating.officer@ncrs.org         | t            | t                 | READY
Tournament Organizer | tournament.organizer@ncrs.org   | t            | t                 | READY
```

## Troubleshooting

If something goes wrong:

1. **Check Supabase CLI**: `supabase --version`
2. **Check project link**: `supabase status`
3. **Re-run migration**: `supabase db push --force`
4. **Check logs**: `supabase logs`

## Success Criteria

✅ Both accounts show `READY` status
✅ Can login with Rating Officer access code
✅ Can login with Tournament Organizer password
✅ Both accounts redirect to appropriate dashboards

---

**The Nigerian Chess Rating System demo accounts are now fully automated!** 🎉
