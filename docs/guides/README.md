# Implementation Guides & Operations Reference

Reference documentation paired with Functional Decision Records (FDRs).

---

## Implementation Guides

Each guide provides code patterns, API routes, SQL snippets, and edge cases for a specific domain.

| FDR | Guide | Purpose |
|-----|-------|---------|
| [FDR-0004](../fdr/FDR-0004-wave-assignment-open-vs-ranked.md) | [implementation-guide-wave-assignment.md](./implementation-guide-wave-assignment.md) | Wave assignment algorithm, format detection, slot allocation |
| [FDR-0005](../fdr/FDR-0005-group-membership-and-wave-anchoring.md) | [implementation-guide-groups.md](./implementation-guide-groups.md) | Group creation, member join, anchor initialization & sync |
| [FDR-0006](../fdr/FDR-0006-ambassador-program-points-and-rewards.md) | [implementation-guide-ambassador.md](./implementation-guide-ambassador.md) | Points calculation, 10 reward levels, dashboard data flow |
| [FDR-0007](../fdr/FDR-0007-email-distribution-and-preferences.md) | [implementation-guide-email.md](./implementation-guide-email.md) | 4-phase email system, distribution lists, preferences UI, triggers |

---

## Operations & References

### [critical-operations.md](./critical-operations.md)

**For**: Developers performing dangerous data mutations

Covers:
- **Transfer RANKED → OPEN**: Dry-run checklist, step-by-step procedure, rollback
- **Manual Ambassador Points Override**: API endpoint, impacts, approval workflow
- **Group Anchor Force Reset**: Admin anchor changes, sync impacts
- **Bulk Wave Reassignment**: High-risk event capacity adjustments

Use **before** running: `transfer_ranked_to_open.sql`, admin endpoints, or manual data changes.

### [rpc-reference.md](./rpc-reference.md)

**For**: Developers calling PostgreSQL functions from Next.js

Covers:
- `assign_open_wave_to_registration` — Slot assignment with capacity/anchor constraints
- `award_ambassador_points_for_order` — Points award on promo code use
- `sync_open_group_wave` — Group member wave synchronization
- `resolve_group_anchor` — Anchor initialization lookup
- `check_wave_full` — Capacity check utility

For each RPC:
- Signature & parameters
- Return value & side effects
- Error scenarios
- Usage patterns & testing strategies

---

## Quick Navigation

**Need to...**

| Task | Read |
|------|------|
| Implement wave assignment | [FDR-0004](../fdr/FDR-0004-wave-assignment-open-vs-ranked.md) → [guide](./implementation-guide-wave-assignment.md) |
| Add group member join flow | [FDR-0005](../fdr/FDR-0005-group-membership-and-wave-anchoring.md) → [guide](./implementation-guide-groups.md) |
| Build ambassador dashboard | [FDR-0006](../fdr/FDR-0006-ambassador-program-points-and-rewards.md) → [guide](./implementation-guide-ambassador.md) |
| Send campaign email | [FDR-0007](../fdr/FDR-0007-email-distribution-and-preferences.md) → [guide](./implementation-guide-email.md) |
| Transfer registration format | [critical-operations.md](./critical-operations.md) (use dry-run first) |
| Debug wave assignment | [rpc-reference.md](./rpc-reference.md) (assign_open_wave_to_registration) |
| Understand a specific RPC | [rpc-reference.md](./rpc-reference.md) (find RPC name, see side effects) |

---

## File Organization

```
docs/guides/
├─ README.md (this file)
├─ critical-operations.md
├─ rpc-reference.md
├─ implementation-guide-wave-assignment.md
├─ implementation-guide-groups.md
├─ implementation-guide-ambassador.md
└─ implementation-guide-email.md
```

All guides assume you've read the corresponding FDR first (decision + rationale).
