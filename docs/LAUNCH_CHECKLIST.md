# MicroFounder Network — Controlled Launch Checklist

## Pre-Launch Verification

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- [ ] `JOB_SECRET` - Secret key for job API authorization

### Database Tables
- [ ] `mf_invite_requests` - Invite request storage
- [ ] `mf_founder_passports` - Founder profiles
- [ ] `mf_passport_skills` - Skills per passport
- [ ] `mf_passport_needs` - Needs per passport
- [ ] `mf_matches` - Match suggestions
- [ ] `mf_circles` - Circle definitions
- [ ] `mf_circle_members` - Circle memberships
- [ ] `mf_activity` - Activity log

### RLS Policies
- [ ] All tables have appropriate RLS policies enabled
- [ ] Service role key bypasses RLS for job execution
- [ ] Users can only read/write their own data

---

## Admin Setup

### Admin Emails
Add admin emails to `lib/auth/types.ts`:
```typescript
export const ADMIN_EMAILS = [
  "admin@microfounders.network",
  "kojo@metalmindtech.com",
  "kesarel@metalmindtech.com",
];
```

### First Admin Login
1. Navigate to `/login`
2. Sign up with admin email
3. Confirm email via magic link
4. Access `/admin` to review invites

---

## Invite First Founders

### Invite Process
1. Founder visits landing page (`/`)
2. Submits invite request (email + reason)
3. Admin reviews at `/admin`
4. Admin approves → Passport created
5. Founder receives approval (checks `/onboarding`)
6. Founder completes stepper (`/onboarding/stepper`)
7. Founder accesses lounge (`/lounge`)

### Recommended First Cohort
- 5-10 trusted founders
- Mix of archetypes (builder, strategist, connector)
- Mix of stages (idea, building, launched)
- Diverse timezones if possible

---

## Job Scheduling

### Vercel Cron (Recommended)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/jobs/matches",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/jobs/circles",
      "schedule": "0 3 * * 0"
    },
    {
      "path": "/api/jobs/trust",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### Manual Trigger
```bash
# Match generation
curl -X POST https://your-domain.com/api/jobs/matches \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-job-secret"}'

# Circle rotation
curl -X POST https://your-domain.com/api/jobs/circles \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-job-secret"}'

# Trust decay
curl -X POST https://your-domain.com/api/jobs/trust \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-job-secret"}'
```

---

## Monitoring

### Health Endpoints
- `GET /api/jobs/matches` - Match job status
- `GET /api/jobs/circles` - Circle health stats
- `GET /api/jobs/trust` - Trust distribution

### Key Metrics to Watch
- **Passports created** - Growth rate
- **Matches generated** - System activity
- **Match acceptance rate** - Quality signal
- **Circle health** - Cohort stability
- **Trust distribution** - Community health

---

## Launch Day Sequence

1. **T-1 day**: Final build verification
2. **T-0**: Enable production environment
3. **T+1 hour**: Invite first 5 founders
4. **T+24 hours**: Run first match generation
5. **T+48 hours**: Check match acceptance
6. **T+7 days**: Review system behavior
7. **T+14 days**: Expand to 10-20 founders

---

## Rollback Plan

If critical issues arise:
1. Pause invite approvals (stop new passports)
2. Disable job crons (stop automation)
3. Investigate via Supabase logs
4. Fix and redeploy
5. Resume operations

---

## Post-Launch Tuning

### Match Quality
- Adjust `MIN_MATCH_SCORE` in `lib/jobs/match-generator.ts`
- Review `MATCH_WEIGHTS` in `lib/matching/types.ts`

### Circle Health
- Adjust `CIRCLE_CONFIG` in `lib/matching/circle-rules.ts`
- Monitor rotation cadence effectiveness

### Trust Decay
- Adjust decay rates in `lib/jobs/trust-decay.ts`
- Monitor distribution for imbalances

---

## Success Criteria

### Week 1
- [ ] 5+ founders onboarded
- [ ] 10+ matches generated
- [ ] 0 critical bugs

### Week 2
- [ ] 50%+ match acceptance rate
- [ ] First circle formed (if 4+ founders)
- [ ] Trust scores stable

### Month 1
- [ ] 20+ active founders
- [ ] 3+ circles active
- [ ] Community self-sustaining

---

## Contact

For issues during launch:
- Technical: Check Vercel logs, Supabase logs
- Product: Review this checklist
- Emergency: Pause all jobs, investigate

---

*MicroFounder Network — Built for founders, by founders.*
