# MicroFounder Network — Environment Variables

## Required Variables

### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=https://xshyzyewarjrpabwpdpc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Job Authorization
```env
JOB_SECRET=your-secure-job-secret
```

---

## Variable Details

### `NEXT_PUBLIC_SUPABASE_URL`
- **Required**: Yes
- **Public**: Yes (client-side)
- **Description**: Supabase project URL
- **Where to find**: Supabase Dashboard → Settings → API → Project URL

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Required**: Yes
- **Public**: Yes (client-side)
- **Description**: Supabase anonymous/public key for client-side operations
- **Where to find**: Supabase Dashboard → Settings → API → anon/public key
- **Security**: Safe to expose, RLS policies protect data

### `SUPABASE_SERVICE_ROLE_KEY`
- **Required**: Yes
- **Public**: **NO** (server-side only)
- **Description**: Supabase service role key for server-side operations
- **Where to find**: Supabase Dashboard → Settings → API → service_role key
- **Security**: **NEVER expose in client code**. Bypasses RLS.

### `JOB_SECRET`
- **Required**: Yes
- **Public**: **NO** (server-side only)
- **Description**: Secret key for authorizing job API calls
- **How to generate**: Use a strong random string (32+ characters)
- **Example**: `openssl rand -hex 32`

---

## Vercel Setup

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable with appropriate scope:
   - `NEXT_PUBLIC_*` → All environments
   - `SUPABASE_SERVICE_ROLE_KEY` → Production only
   - `JOB_SECRET` → Production only

---

## Local Development

Create `.env.local` in project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xshyzyewarjrpabwpdpc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JOB_SECRET=local-dev-secret
```

**Note**: `.env.local` is gitignored and should never be committed.

---

## Security Checklist

- [ ] Service role key is NOT in any client-side code
- [ ] Service role key is NOT in git history
- [ ] JOB_SECRET is unique per environment
- [ ] All secrets are stored in Vercel environment variables
- [ ] `.env.local` is in `.gitignore`
