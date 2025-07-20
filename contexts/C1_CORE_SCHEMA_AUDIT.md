# Context C1 – Core Schema & Roles

**Spec Ref**: Requirements 1, 2, 5, 8 - Database foundation for tournaments, players, users, and roles

## Capability Assessment

| Capability                                | Status | Existing Component(s)                 | Action   | Notes                                  |
| ----------------------------------------- | ------ | ------------------------------------- | -------- | -------------------------------------- |
| Base Tables (players, tournaments, users) | P      | Supabase schema partially defined     | Refactor | Tables exist but need RLS policies     |
| Tournament-Player Relationships           | P      | tournament_players table exists       | Refactor | Missing proper constraints             |
| User Roles & Profiles                     | P      | user_profiles table, auth integration | Refactor | Role claims need proper implementation |
| Rating History Tracking                   | M      | No rating_history table               | Create   | Critical for rating calculations       |
| Audit Logging Schema                      | M      | No audit_log table                    | Create   | Required for compliance                |
| RLS Policies                              | M      | Basic policies exist                  | Create   | Need comprehensive security rules      |
| Database Migrations                       | P      | Some migrations exist                 | Refactor | Need organized migration system        |

## Current Issues Found

1. **Players table missing required fields**: `gamesPlayed`, `country`, proper status enum
2. **No rating_history table**: Cannot track rating changes over time
3. **Incomplete RLS policies**: Security gaps in data access
4. **Missing audit_log table**: No compliance tracking
5. **Tournament status enum incomplete**: Missing all required statuses

## Refactor Plan

- **Keep**: Basic table structure, existing relationships
- **Fix**: Add missing columns, create proper enums, implement RLS
- **Add**: rating_history, audit_log, proper indexes

## Tickets

### C1-T1: Database Schema Cleanup & Missing Tables

**DoD**: All required tables exist with proper columns, constraints, and indexes
**Est**: 1 day

- Add missing columns to players table (gamesPlayed, country, proper status enum)
- Create rating_history table (player_id, rating_type, old_rating, new_rating, change_date, tournament_id)
- Create audit_log table (id, occurred_at, actor_user, action, entity_type, entity_id, before, after)
- Add proper foreign key constraints and indexes

### C1-T2: Row Level Security Implementation

**DoD**: Comprehensive RLS policies implemented and tested
**Est**: 1 day

- Public read access to players (limited fields: name, rating, state, status)
- Tournament organizers can only modify their own tournaments
- Rating officers have elevated permissions for player management
- Audit log entries are append-only with proper access controls

### C1-T3: Database Migration System

**DoD**: Clean migration system with rollback capability
**Est**: 0.5 day

- Organize existing migrations into proper sequence
- Create migration for schema fixes from T1 and T2
- Document migration process and rollback procedures

## Dependencies

- Supabase project access
- Current schema backup before changes

## Acceptance Criteria

- [ ] All MVP tables exist with proper structure
- [ ] RLS policies prevent unauthorized access
- [ ] Migration system allows clean deployments
- [ ] Audit logging captures all required events
- [ ] Performance acceptable for 1000+ players, 100+ tournaments
