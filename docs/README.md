# Documentation Index

**Gateway** to all Overbound technical documentation. Start here to find what you need.

---

## 🎯 Quick Start

**New to the project?**  
→ Read [docs/product/vision.md](./product/vision.md) (what we're building)  
→ Then [docs/architecture/overview.md](./architecture/overview.md) (how it's organized)

**Need to implement a feature?**  
→ Start with [AGENTS.md](../AGENTS.md) (task routing)

**Debugging or fixing a bug?**  
→ Check [docs/guides/critical-operations.md](./guides/critical-operations.md) (dangerous operations)  
→ Or [docs/guides/rpc-reference.md](./guides/rpc-reference.md) (RPC issues)

---

## 📖 Documentation Categories

### [Functional Decision Records (FDR)](./fdr/README.md)
**Covers**: Business logic, rules, workflows, data models

| FDR | Topic | Status |
|-----|-------|--------|
| [FDR-0001](./fdr/FDR-0001-pipeline-stages-and-transitions.md) | Partner pipeline stages | ✅ Production |
| [FDR-0002](./fdr/FDR-0002-follow-up-reminders-and-prioritization.md) | Follow-up reminders | ✅ Production |
| [FDR-0003](./fdr/FDR-0003-email-drafting-and-sending-workflow.md) | Email drafting | ✅ Production |
| [FDR-0004](./fdr/FDR-0004-wave-assignment-open-vs-ranked.md) | Wave assignment (OPEN/RANKED) | ✅ Production |
| [FDR-0005](./fdr/FDR-0005-group-membership-and-wave-anchoring.md) | Groups & wave anchoring | ✅ Production |
| [FDR-0006](./fdr/FDR-0006-ambassador-program-points-and-rewards.md) | Ambassador program | ✅ Production |
| [FDR-0007](./fdr/FDR-0007-email-distribution-and-preferences.md) | Email distribution & prefs | ✅ Production |

### [Architecture Decision Records (ADR)](./adr/README.md)
**Covers**: Technical architecture, technology choices, system design

| ADR | Topic | Status |
|-----|-------|--------|
| [ADR-0001](./adr/ADR-0001-hexagonal-architecture-baseline.md) | Hexagonal architecture | ✅ Target state |
| [ADR-0002](./adr/ADR-0002-supabase-organization-rls.md) | Supabase + org RLS | ✅ Production |
| [ADR-0003](./adr/ADR-0003-resend-transactional-email.md) | Resend email | ✅ Production |
| [ADR-0004](./adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md) | Reality vs theory | ✅ Clarification |

### [Implementation Guides](./guides/README.md)
**Covers**: Code patterns, API routes, SQL snippets, workflows

- [implementation-guide-wave-assignment.md](./guides/implementation-guide-wave-assignment.md) — Slot assignment patterns
- [implementation-guide-groups.md](./guides/implementation-guide-groups.md) — Group + anchor workflows
- [implementation-guide-ambassador.md](./guides/implementation-guide-ambassador.md) — Points & rewards
- [implementation-guide-email.md](./guides/implementation-guide-email.md) — Email system (4 phases)

### [Operations & References](./guides/README.md)
**Covers**: Dangerous operations, RPC reference, deployment procedures

- [critical-operations.md](./guides/critical-operations.md) — Safe procedures for manual data changes
- [rpc-reference.md](./guides/rpc-reference.md) — PostgreSQL RPC signatures & usage

### [Architecture](./architecture/README.md)
- [overview.md](./architecture/overview.md) — Codebase structure, layers, organization

### [Guidelines](./guidelines/README.md)
- [engineering.md](./guidelines/engineering.md) — Clean code, conventions, naming, responsibility matrix

### [Quality](./quality/README.md)
- [testing-strategy.md](./quality/testing-strategy.md) — TDD approach, test pyramid, validation criteria

### [Security](./security/README.md)
- [data-and-rls.md](./security/data-and-rls.md) — Multi-user model, RLS policies, GDPR minimum

### [Product](./product/README.md)
- [vision.md](./product/vision.md) — Product goals, actors, V1/V2 scope

### [Operations](./operations/README.md)
- [runbooks.md](./operations/runbooks.md) — Local setup, environment variables, deployment workflows

### [Roadmap](./roadmap/README.md)
- [mvp-plan.md](./roadmap/mvp-plan.md) — V1/V2 implementation plan, priorities

---

## 🗺️ Task Routing

**"I need to..."** → **Start here**

| Task | Primary | Secondary |
|------|---------|-----------|
| Understand the business | [vision.md](./product/vision.md) | [AGENTS.md](../AGENTS.md) |
| Learn the architecture | [overview.md](./architecture/overview.md) → [ADR-0004](./adr/ADR-0004-architecture-reality-vs-hexagonal-theory.md) | [engineering.md](./guidelines/engineering.md) |
| Implement wave assignment | [FDR-0004](./fdr/FDR-0004-wave-assignment-open-vs-ranked.md) → [guide](./guides/implementation-guide-wave-assignment.md) | [rpc-reference.md](./guides/rpc-reference.md) |
| Implement groups | [FDR-0005](./fdr/FDR-0005-group-membership-and-wave-anchoring.md) → [guide](./guides/implementation-guide-groups.md) | [critical-operations.md](./guides/critical-operations.md) |
| Build ambassador feature | [FDR-0006](./fdr/FDR-0006-ambassador-program-points-and-rewards.md) → [guide](./guides/implementation-guide-ambassador.md) | — |
| Set up email system | [FDR-0007](./fdr/FDR-0007-email-distribution-and-preferences.md) → [guide](./guides/implementation-guide-email.md) | — |
| Transfer RANKED → OPEN | [critical-operations.md](./guides/critical-operations.md) | [FDR-0004](./fdr/FDR-0004-wave-assignment-open-vs-ranked.md) |
| Debug RPC issue | [rpc-reference.md](./guides/rpc-reference.md) | Relevant FDR + guide |
| Set up dev environment | [runbooks.md](./operations/runbooks.md) | — |
| Write tests | [testing-strategy.md](./quality/testing-strategy.md) | — |
| Understand RLS | [data-and-rls.md](./security/data-and-rls.md) | [ADR-0002](./adr/ADR-0002-supabase-organization-rls.md) |

---

## 📋 Reading Order (First Time)

1. [AGENTS.md](../AGENTS.md) — Gateway, rules, domain mapping (5 min)
2. [vision.md](./product/vision.md) — What we're building (10 min)
3. [overview.md](./architecture/overview.md) — How it's organized (10 min)
4. [engineering.md](./guidelines/engineering.md) — Code standards (10 min)
5. Then pick your domain:
   - Wave assignment → [FDR-0004](./fdr/FDR-0004-wave-assignment-open-vs-ranked.md) + [guide](./guides/implementation-guide-wave-assignment.md)
   - Groups → [FDR-0005](./fdr/FDR-0005-group-membership-and-wave-anchoring.md) + [guide](./guides/implementation-guide-groups.md)
   - Ambassadors → [FDR-0006](./fdr/FDR-0006-ambassador-program-points-and-rewards.md) + [guide](./guides/implementation-guide-ambassador.md)
   - Email → [FDR-0007](./fdr/FDR-0007-email-distribution-and-preferences.md) + [guide](./guides/implementation-guide-email.md)

---

## ✅ Definition of Done

Before marking any feature complete, verify:

- ✅ Relevant FDR read and understood
- ✅ Implementation guide followed (code patterns used)
- ✅ Tests added (unit + integration)
- ✅ Code review checklist passed
- ✅ No `any` type, Zod at boundaries
- ✅ RLS policies verified (organization_id filtering)
- ✅ Documentation updated (if applicable)

---

## 🔗 Cross-References

- **[AGENTS.md](../AGENTS.md)** — AI agent gateway, rules, collaboration cadence
- **[CLAUDE.md](../CLAUDE.md)** — Overbound CRM context, stack overview, common pitfalls

---

**Last updated**: May 12, 2026  
**Total files**: 20+ markdown files across categories  
**Coverage**: All 8 major business domains + architecture + quality + operations
