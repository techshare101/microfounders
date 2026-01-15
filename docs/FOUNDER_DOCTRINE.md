# MicroFounder Network — Founder Doctrine

## INTERNAL DOCUMENT — NOT FOR PUBLIC DISTRIBUTION

---

## Founder Override

Certain system operators possess permanent override access to the MicroFounder Network. This is a governance mechanism, not a privilege.

### Override Holders

| Email | Role | Status |
|-------|------|--------|
| kojo@metalmindtech.com | System Architect | Active |
| kesarel@metalmindtech.com | System Architect | Active |
| valentin2v2000@gmail.com | System Architect | Active |

### What Founder Override Bypasses

| System | Bypassed |
|--------|----------|
| Onboarding requirements | ✅ |
| Passport status checks | ✅ |
| Trust decay | ✅ |
| Match limits | ✅ |
| Circle rotation rules | ✅ |
| Access gates | ✅ |
| Admin access | ✅ |

### What Founder Override Does NOT Bypass

| System | Still Enforced |
|--------|----------------|
| Authentication (must be logged in) | ✅ |
| Database RLS (service key required for admin ops) | ✅ |
| Rate limiting (if implemented) | ✅ |

---

## Rationale

Founder override exists to ensure:

1. **System Continuity** — Operators can always access and maintain the system
2. **Governance** — Operators can observe without participating
3. **Evolution** — Operators can test changes without friction
4. **Emergency Access** — Operators can intervene if the system misbehaves

---

## Implementation

Founder override is implemented at the lowest level of the system:

```
lib/auth/founder-override.ts
```

All access checks respect this flag:
- `/admin` page
- `/lounge` page
- Trust decay job
- Match generation job
- Circle rotation job

---

## Non-Transferable

Founder override is:
- **Non-transferable** — Cannot be granted to others via UI
- **Code-locked** — Requires code change to modify
- **Auditable** — List is explicit in source code

To add a new founder override holder:
1. Edit `lib/auth/founder-override.ts`
2. Add email to `FOUNDER_OVERRIDE_EMAILS` array
3. Deploy

---

## Governance Notes

Founder override holders should:
- Use override access responsibly
- Not interfere with normal user experience
- Document any manual interventions
- Avoid using override for personal advantage in matching/circles

---

## Future Considerations

If the network grows significantly:
- Consider database-backed override flag
- Add audit logging for override usage
- Implement time-limited override grants for trusted operators

---

*This document is part of the MicroFounder Network internal doctrine.*
*Last updated: January 2026*
