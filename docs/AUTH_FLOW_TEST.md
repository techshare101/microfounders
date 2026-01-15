# MicroFounder Network — Auth Flow Test Checklist

## Test Environment
- **URL**: http://localhost:3000 (or deployed URL)
- **Supabase Project**: Ark (xshyzyewarjrpabwpdpc)

---

## 1. New User Signup Flow

### Steps:
1. Navigate to `/login`
2. Click "Sign up" to switch to signup mode
3. Enter email and password (min 6 chars)
4. Click "Create Account"
5. Check email for confirmation link
6. Click confirmation link → redirects to `/auth/callback`
7. Callback exchanges code for session
8. Redirects to `/lounge`
9. Lounge checks for passport → redirects to `/onboarding`

### Expected Result:
- User sees "Pending Review" message on `/onboarding`
- User email is stored in Supabase Auth

### Verification:
```sql
SELECT * FROM auth.users WHERE email = 'test@example.com';
```

---

## 2. Magic Link Flow

### Steps:
1. Navigate to `/login`
2. Enter email only
3. Click "Send Magic Link"
4. Check email for magic link
5. Click link → redirects to `/auth/callback`
6. Session established
7. Redirects based on passport status

### Expected Result:
- Same as signup flow

---

## 3. Pending Onboarding State

### Steps:
1. User is authenticated but has no passport
2. Navigate to `/lounge`
3. Page checks auth → user exists
4. Page checks passport → none found
5. Redirects to `/onboarding`

### Expected Result:
- User sees pending review page
- Shows their email
- Shows "What happens next" steps
- Sign out button works

---

## 4. Admin Approval Flow

### Steps:
1. Admin navigates to `/admin`
2. Admin is authenticated with admin email
3. Sees list of pending invite requests
4. Selects a request
5. Assigns tier (founding/member/resident)
6. Adds review notes (optional)
7. Clicks "Approve"

### Expected Result:
- Invite request status → "approved"
- New passport created in `mf_founder_passports`
- Passport linked to invite request
- Passport status = "pending" (needs onboarding completion)

### Verification:
```sql
SELECT * FROM mf_invite_requests WHERE email = 'test@example.com';
SELECT * FROM mf_founder_passports WHERE email = 'test@example.com';
```

---

## 5. Lounge Access After Approval

### Current Flow (Needs Adjustment):
1. User approved → passport created with status "pending"
2. User navigates to `/lounge`
3. Lounge checks passport status
4. If status !== "active" → redirects to `/onboarding`

### Issue Identified:
- Passport is created with status "pending" on approval
- But lounge requires status "active"
- Need to either:
  a. Set status to "active" on approval, OR
  b. Build onboarding stepper to complete passport and set to "active"

### Recommended Fix:
For MVP, set passport status to "active" on admin approval.

---

## 6. Admin Rejection/Waitlist

### Steps:
1. Admin selects a pending request
2. Clicks "Decline" or "Waitlist"
3. Request status updated

### Expected Result:
- Invite request status → "declined" or "waitlisted"
- No passport created
- User remains in pending state

---

## 7. Logout/Relogin

### Steps:
1. User clicks "Sign Out" on `/onboarding`
2. Session cleared
3. Redirects to `/`
4. User navigates to `/login`
5. Logs in with existing credentials
6. Redirects based on passport status

### Expected Result:
- Session properly cleared
- Relogin works
- Correct redirect based on state

---

## 8. Admin Access Control

### Steps:
1. Non-admin user tries to access `/admin`
2. Page checks auth → user exists
3. Page checks admin email → not in whitelist
4. Redirects to `/lounge`

### Expected Result:
- Non-admins cannot access admin dashboard
- Redirected to lounge (or onboarding if no passport)

---

## Issues Found During Review

### Issue 1: Passport Status on Approval
**Problem**: `createPassportFromInvite` sets status to "pending", but lounge requires "active"
**Fix**: Update to set status to "active" on approval

### Issue 2: Invite Request vs Auth User
**Problem**: Invite requests are separate from Supabase Auth users
**Current Flow**: 
1. User submits invite request (email stored in `mf_invite_requests`)
2. User signs up via Supabase Auth (email stored in `auth.users`)
3. Admin approves invite request → creates passport
4. Passport email must match auth user email

**This is correct** - the flow links them via email.

---

## Quick Fixes Needed

1. Update `createPassportFromInvite` to set `status: "active"` instead of "pending"
2. Verify admin emails in whitelist are correct

---

## Test Accounts

### Admin:
- Email: kojo@metalmindtech.com (or kesarel@metalmindtech.com)
- Must be in ADMIN_EMAILS whitelist

### Test User:
- Any email not in admin whitelist
- Must have invite request approved to access lounge
