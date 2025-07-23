# Legacy Code Cleanup Log - WP1

## Objective

Clean up legacy code that doesn't align with Brief v0.2 from-scratch build approach.

## Files to Remove (Legacy)

### Debug/Testing Components

- [ ] src/components/CrossPlatformTester.tsx
- [ ] src/components/LoginDebug.tsx
- [ ] src/components/LoginSystemDiagnostic.tsx
- [ ] src/components/SystemTestRunner.tsx
- [ ] src/components/debug/
- [ ] src/pages/CrossPlatformTesting.tsx
- [ ] src/pages/SystemTesting.tsx
- [ ] src/pages/TestStorage.tsx

### Complex Sync/Storage Components

- [ ] src/components/SyncStatusIndicator.tsx
- [ ] src/components/ResetSystemData.tsx
- [ ] src/utils/storageSync.ts
- [ ] src/utils/deviceSync.ts
- [ ] src/utils/device/
- [ ] src/utils/storage/
- [ ] src/hooks/sync/
- [ ] src/hooks/useDataSync.ts
- [ ] src/hooks/useProductionSync.ts
- [ ] src/hooks/useSilentSync.ts
- [ ] src/hooks/useSyncFunctions.ts
- [ ] src/hooks/useSyncListeners.ts

### Complex Dashboard Components

- [ ] src/components/dashboard/
- [ ] src/components/officer/ (keep basic structure)
- [ ] src/components/organizer/ (keep basic structure)
- [ ] src/hooks/dashboard/
- [ ] src/hooks/officer-dashboard/

### Unused/Complex Components

- [ ] src/components/GenerateReportDialog.tsx
- [ ] src/components/HomeReset.tsx
- [ ] src/components/PerformanceChart.tsx
- [ ] src/components/RatingChart.tsx
- [ ] src/components/RatingSystemRules.tsx
- [ ] src/services/mockServices.ts
- [ ] src/services/fide/ (not in MVP)

## Files to Keep & Simplify

### Core UI Components

- ✅ src/components/ui/ (shadcn components)
- ✅ src/components/Logo.tsx
- ✅ src/components/Navbar.tsx (simplify)
- ✅ src/components/theme-provider.tsx

### Core Pages (Simplify)

- ✅ src/pages/Home.tsx
- ✅ src/pages/Login.tsx
- ✅ src/pages/Register.tsx
- ✅ src/pages/Tournaments.tsx
- ✅ src/pages/TournamentDetails.tsx
- ✅ src/pages/Players.tsx
- ✅ src/pages/PlayerProfile.tsx

### Core Services

- ✅ src/integrations/supabase/
- ✅ src/services/auth/ (simplify)
- ✅ src/services/tournament/ (simplify)
- ✅ src/services/player/ (simplify)

### Utilities

- ✅ src/lib/utils.ts
- ✅ src/data/nigeriaStates.ts
- ✅ src/utils/debugLogger.ts (keep for audit logging)

## Status

- [x] Cleanup started
- [x] Legacy files removed
- [x] Core files simplified
- [x] Package.json updated
- [x] Environment configured

## WP1 Completion Status

- [x] Repository setup and configuration
- [x] Supabase project configuration
- [x] CI pipeline placeholder
- [x] Environment variables template

## WP2 Completion Status

- [x] Database migrations for core tables
- [x] RLS policies implementation
- [x] Seed data script creation
- [x] Database setup automation
- [x] TypeScript types updated

## Next Steps (WP3)

1. Implement authentication system
2. Create user registration flow
3. Add role-based access control
