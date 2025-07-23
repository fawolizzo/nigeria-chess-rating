# Deploy Edge Function for RO Access Code

## Prerequisites

- Supabase CLI installed
- Connected to production project

## Deployment Steps

1. **Deploy the Edge Function**

   ```bash
   cd nigeria-chess-rating
   supabase functions deploy get-ro-code --project-ref nigeriachessrating-prod
   ```

2. **Set Environment Variable**

   ```bash
   supabase secrets set RO_ACCESS_CODE=RO2024! --project-ref nigeriachessrating-prod
   ```

3. **Test the Function**
   ```bash
   curl -X POST https://nigeriachessrating-prod.supabase.co/functions/v1/get-ro-code \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
   ```

## Expected Response

```json
{
  "value": "RO2024!"
}
```

## Security Notes

- The RO access code is stored as an environment variable
- Only the edge function can access this value
- The actual password for authentication remains `password123`
- Access code verification happens before authentication
