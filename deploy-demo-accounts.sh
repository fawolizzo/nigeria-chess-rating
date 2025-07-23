#!/bin/bash

# Nigerian Chess Rating System - Demo Accounts Deployment Script
# This script automatically deploys demo accounts to production

echo "🚀 Deploying Demo Accounts to Production..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're linked to the project
echo "🔗 Linking to production project..."
supabase link --project-ref nigeriachessrating-prod

# Run the migration
echo "📦 Running demo accounts migration..."
supabase db push

# Verify the deployment
echo "✅ Verifying demo accounts..."
supabase db psql --command "SELECT * FROM verify_demo_accounts();"

echo ""
echo "🎉 Demo Accounts Deployment Complete!"
echo ""
echo "📋 Demo Account Details:"
echo "   Rating Officer:"
echo "     Email: rating.officer@ncrs.org"
echo "     Access Code: RO2024!"
echo "     URL: https://nigeriachessrating.com/login"
echo ""
echo "   Tournament Organizer:"
echo "     Email: tournament.organizer@ncrs.org"
echo "     Password: password123"
echo "     URL: https://nigeriachessrating.com/login"
echo ""
echo "🔧 Test the accounts now at: https://nigeriachessrating.com/login"