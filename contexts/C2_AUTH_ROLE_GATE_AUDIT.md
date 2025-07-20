# Context C2 – Auth & Role Gate

**Spec Ref**: Requirements 2, 8 - Authentication system with role-based access control

## Capability Assessment

| Capability                | Status | Existing Component(s)         | Action   | Notes                         |
| ------------------------- | ------ | ----------------------------- | -------- | ----------------------------- |
| Supabase Auth Integration | D      | SupabaseAuthProvider.tsx      | Keep     | Working auth integration      |
| User Registration         | P      | Register.tsx, useRegisterForm | Refactor | Missing role-based approval   |
| Login System              | D      | Login.tsx, useLoginForm       | Keep     | Working for TO and RO         |
| Role Claims               | P      | UserContext, role checking    | Refactor | Inconsistent role enforcement |
| Access Code for RO        | P      | Access code validation exists | Refactor | Needs proper security         |
| Session Management        | D      | Supabase handles sessions     | Keep     | Working properly              |
| Role-based UI Gating      | P      | Some components check roles   | Refactor | Inconsistent across app       |

## Current Issues Found

1. **Inconsistent role checking**: Some components bypass role validation
2. **User approval workflow incomplete**: Registration doesn't properly handle approval flow
3. **Access code security**: RO access codes not properly validated
4. **Role persistence**: User roles not consistently available across app
5. **Error handling**: Auth errors not properly communicated to users

## Refactor Plan

- **Keep**: Supabase auth integration, basic login/register forms
- **Fix**: Role validation consistency, approval workflow
- **Add**: Proper role gates, improved error handling

## Tickets

### C2-T1: Role Claims & Validation System

**DoD**: Consistent role checking across all components and routes
**Est**: 1 day

- Implement centralized role validation hook
- Add role-based route protection
- Ensure user roles are properly fetched and cached
- Add role validation to all sensitive operations

### C2-T2: User Approval Workflow

**DoD**: Complete registration-to-approval flow for Tournament Organizers
**Est**: 1 day

- Fix registration form to properly set pending status
- Implement RO approval interface for pending users
- Add email notifications for approval/rejection
- Update user status properly after approval

### C2-T3: Access Code Security Enhancement

**DoD**: Secure access code validation for Rating Officers
**Est**: 0.5 day

- Implement server-side access code validation
- Add rate limiting for access code attempts
- Improve access code generation and storage
- Add audit logging for access code usage

## Dependencies

- C1 (Core Schema) must be completed first
- Email service configuration for notifications

## Acceptance Criteria

- [ ] All routes properly protected by role
- [ ] Registration-approval workflow complete
- [ ] Access codes securely validated
- [ ] Role information consistently available
- [ ] Auth errors properly handled and displayed
