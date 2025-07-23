#!/bin/bash

# Database Setup Script for Nigerian Chess Rating System
# This script runs all migrations and seeds the database

set -e

echo "🚀 Setting up Nigerian Chess Rating System database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it with your Supabase credentials."
    echo "   You can copy .env.example and fill in your values."
    exit 1
fi

echo "📋 Running database migrations..."

# Run migrations in order
echo "  → Running migration 1: Create base tables"
supabase db push --file supabase/migrations/00001_create_base_tables.sql

echo "  → Running migration 2: Add RLS policies"
supabase db push --file supabase/migrations/00002_add_rls_policies.sql

echo "  → Running migration 3: Create RPC functions"
supabase db push --file supabase/migrations/00003_create_rpc_functions.sql

echo "🌱 Seeding database with initial data..."
supabase db push --file supabase/seed/00001_seed_initial_data.sql

echo "✅ Database setup completed successfully!"
echo ""
echo "📊 Initial data created:"
echo "  • 1 Rating Officer (RO): rating.officer@ncrs.org"
echo "  • 1 Tournament Organizer (TO): tournament.organizer@ncrs.org"
echo "  • 10 Sample players with ratings"
echo "  • 1 Sample tournament: Lagos State Chess Championship 2025"
echo "  • System configuration values"
echo ""
echo "🔐 Default login credentials:"
echo "  RO: rating.officer@ncrs.org / password123"
echo "  TO: tournament.organizer@ncrs.org / password123"
echo ""
echo "🎯 Next steps:"
echo "  1. Run 'npm run dev' to start the development server"
echo "  2. Visit http://localhost:5173 to access the application"
echo "  3. Log in with the credentials above to test the system"