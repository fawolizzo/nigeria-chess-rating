# Context C5 – Tournament CRUD

**Spec Ref**: Requirements 1, 3, 7, 10 - Tournament creation, management, and lifecycle

## Capability Assessment

| Capability                   | Status | Existing Component(s)                    | Action   | Notes                                    |
| ---------------------------- | ------ | ---------------------------------------- | -------- | ---------------------------------------- |
| Tournament Creation          | D      | CreateTournament.tsx, tournamentService  | Keep     | Working creation form                    |
| Tournament Listing           | D      | Tournaments.tsx, OrganizerTabs           | Keep     | Both public and organizer views          |
| Tournament Details View      | P      | TournamentDetails.tsx                    | Refactor | Recently fixed but needs testing         |
| Tournament Management        | P      | TournamentManagement.tsx                 | Refactor | Core functionality works                 |
| Player Registration          | P      | AddPlayersDialog, SimpleAddPlayersDialog | Refactor | Working but needs cleanup                |
| Tournament Status Management | P      | Status updates work                      | Refactor | Missing some status transitions          |
| Tournament Editing           | M      | No edit functionality                    | Create   | Cannot modify tournaments after creation |
| Tournament Deletion          | M      | No delete functionality                  | Create   | No way to remove tournaments             |

## Current Issues Found

1. **No tournament editing**: Cannot modify tournament details after creation
2. **Player management inconsistent**: Multiple dialog implementations causing confusion
3. **Status workflow incomplete**: Missing some status transitions (pending → approved)
4. **Tournament deletion missing**: No way to remove tournaments
5. **Validation gaps**: Some tournament fields not properly validated
6. **Mock data fallbacks**: Still using mock data when database fails

## Refactor Plan

- **Keep**: Core tournament service, creation form, listing components
- **Fix**: Consolidate player dialogs, add editing capability, improve status workflow
- **Add**: Tournament editing, deletion, better validation

## Tickets

### C5-T1: Tournament Editing Capability

**DoD**: Tournament organizers can edit their tournament details
**Est**: 1 day

- Add edit tournament form (reuse creation form)
- Implement update tournament service method
- Add edit button to tournament management page
- Validate that only organizer can edit their tournaments
- Prevent editing of started/completed tournaments

### C5-T2: Player Management Cleanup

**DoD**: Single, consistent player management interface
**Est**: 1 day

- Remove duplicate AddPlayersDialog implementations
- Keep SimpleAddPlayersDialog as the primary interface
- Improve player search and filtering
- Add bulk player operations (add multiple, remove multiple)
- Fix player status handling (pending vs approved)

### C5-T3: Tournament Status Workflow

**DoD**: Complete tournament lifecycle management
**Est**: 0.5 day

- Implement all status transitions (pending → approved → ongoing → completed → processed)
- Add proper validation for status changes
- Update UI to reflect current status appropriately
- Add status change audit logging

### C5-T4: Tournament Deletion & Archive

**DoD**: Safe tournament removal with data preservation
**Est**: 0.5 day

- Add soft delete functionality (archive tournaments)
- Implement hard delete for organizers (with confirmations)
- Preserve tournament data for rating history
- Add undelete capability for archived tournaments

## Dependencies

- C1 (Core Schema) for proper status enums
- C2 (Auth) for role-based permissions

## Acceptance Criteria

- [ ] Tournament organizers can create, edit, and manage their tournaments
- [ ] Player management is intuitive and consistent
- [ ] Tournament status workflow is complete and validated
- [ ] Tournament deletion preserves necessary data
- [ ] All operations properly secured by role-based access
