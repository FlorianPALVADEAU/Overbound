# ADR-0004: Architecture Reality vs Hexagonal Theory

**Date**: May 12, 2026  
**Status**: ACCEPTED  
**Severity**: Medium (clarity concern, not blocking)

## Problem Statement

[ADR-0001](ADR-0001-hexagonal-architecture-baseline.md) documents the Overbound codebase as following **strict hexagonal architecture**:

```
domain/          ← Pure business entities, value objects
  ├─ entities
  ├─ value-objects
  └─ services

application/     ← Use-cases, command handlers
  ├─ use-cases
  └─ ports

infrastructure/  ← Adapters (Supabase, Resend, email)
  ├─ adapters
  └─ repositories

presentation/    ← HTTP routes, DTOs, Zod validation
  ├─ api
  └─ ui
```

**Reality**: The codebase uses a **lib-based organization** instead:

```
src/lib/         ← Grouped by domain (but NOT hexagonal separation)
  ├─ ambassadors/
  │   ├─ program.ts           (business rules + calculation)
  │   ├─ leaderboard.ts       (query helper)
  │   └─ ... (mixed concerns)
  ├─ groups/
  ├─ registration.ts          (domain + adapter logic mixed)
  ├─ pricing.ts
  ├─ openSas.ts               (wave assignment)
  ├─ email/
  ├─ slotAssignment.ts        (generic bin-packing)
  └─ ...

src/app/api/     ← Routes (some contain business logic)

src/types/       ← Entities (correct location)
```

**Consequence**: 

- Some files contain both domain rules + infrastructure (e.g., `registration.ts` has discount logic + Supabase calls)
- No strict port/adapter separation
- Use-case layer not explicit
- Boundary violations (routes containing business logic)

## Decision

**Accept the lib-based organization as the actual architecture, and treat ADR-0001 as a "target state" document, not a description of current reality.**

### Rationale

1. **Pragmatism**: Lib-based organization works well for small teams and MVP scope. Forcing strict hexagonal would require major refactoring for little ROI at V1.

2. **Trade-off Clarity**: Lib-based organization prioritizes:
   - **Fast prototyping** (business logic lives where it's used)
   - **Colocation** (related code = same folder)
   - Over strict layer separation (hexagonal ideal)

3. **Refactoring Path**: If we grow to multi-team scale, transition to hexagonal is possible via gradual extraction, not a breaking rewrite.

4. **Documentation Honesty**: Better to document what we actually do than maintain a false ideal.

## Current Architecture Reality

### Layer 1: Business Entities (src/types/)

**Located in**: `src/types/*.ts`  
**Responsibility**: Type definitions, Zod schemas  
**RLS-Safe**: Yes (all declare `organization_id` field)

Examples:
- `src/types/Registration.ts` (complete with all fields)
- `src/types/Group.ts` (captain_id, anchor_wave_index, etc.)
- `src/types/Ambassador.ts` (total_points, tier calculation)

### Layer 2: Domain Logic + Queries (src/lib/)

**Located in**: `src/lib/{domain}/*.ts`  
**Responsibility**: Business rules, calculations, query helpers  
**Mixed Concerns**: ⚠️ Some files also contain infrastructure calls (Supabase direct)

Examples:
- `src/lib/ambassadors/program.ts` — Pure business: AMBASSADOR_REWARD_LEVELS, getExtraTicketsEarned()
- `src/lib/registration.ts` — Mixed: Discount calculation (domain) + Supabase calls (infrastructure)
- `src/lib/groups/resolveGroupAnchor.ts` — Query helper + business logic
- `src/lib/slotAssignment.ts` — Pure algorithm (reusable)
- `src/lib/email/marketingList.ts` — Business rules for distribution lists

### Layer 3: API Routes (src/app/api/)

**Located in**: `src/app/api/{resource}/{action}/route.ts`  
**Responsibility**: HTTP handling, Zod validation, routing  
**Boundary Violations**: ⚠️ Some routes contain business logic (should be in lib/)

Examples:
- `src/app/api/registrations/create/route.ts` — Calls libs correctly ✅
- `src/app/api/groups/join/route.ts` — Contains anchor resolution logic ⚠️ (should be extracted to lib)
- `src/app/api/ambassadors/dashboard/route.ts` — Data aggregation (okay, query layer)

### Layer 4: UI Components (src/components/, src/app/)

**Located in**: `src/components/`, `src/app/` pages  
**Responsibility**: Rendering, user interaction  
**Concern**: ⚠️ Some components contain server-side logic (should use API routes)

## Improvement Roadmap

### Short-term (Preventive, no refactoring)

- [ ] Add linting rule: `src/lib/*.ts` must NOT import from `src/app/api/`
- [ ] Add linting rule: Business logic in `src/lib/`, not in `src/app/api/`
- [ ] Document where domain logic lives (this ADR + AGENTS.md)
- [ ] Code review checklist: "Is this domain logic or routing?"

### Medium-term (Opportunistic refactoring)

- [ ] Extract **ports layer**: Define input/output interfaces for infrastructure calls
  - Port: `AmbassadorRepository` (abstract)
  - Adapter: `SupabaseAmbassadorRepository` (concrete Supabase implementation)
  
- [ ] Extract **use-case layer**: Explicit commands
  - Example: `CreateRegistrationCommand` → encapsulates full registration flow
  - Benefit: Clear input/output, testable without database

- [ ] Move infrastructure out of `src/lib/`:
  - Before: `src/lib/registration.ts` has both domain + Supabase
  - After: `src/lib/registration/domain.ts` (pure logic) + `src/infrastructure/adapters/supabaseRegistrationRepo.ts` (Supabase calls)

### Long-term (If team scales)

- Full hexagonal separation
- Multi-repo (domain library separate from API)
- Alternative adapter implementations (PostgreSQL → MongoDB, Resend → SendGrid)

## Implications

### For Today's Developers

1. **Use `src/lib/` for business logic**, not `src/app/api/`
2. **Keep infrastructure calls near use** (for now), but mark them with `// TODO: extract to adapter`
3. **Types in `src/types/`**, domain logic in `src/lib/`, routes in `src/app/api/`
4. **RLS first**: Always add `organization_id` filtering, regardless of layer

### For Code Review

Accept:
- Business logic in `src/lib/` alongside query helpers (pragmatic colocation)
- Supabase calls in `src/lib/` files (known trade-off, documented)

Flag for refactoring:
- Business logic in `src/app/api/` routes (wrong layer)
- Missing organization_id filter (RLS violation)
- Direct database calls without RLS wrapper

### For Testing

- Test domain logic in `src/lib/` independently (with mocks for infrastructure)
- Infrastructure calls tested at integration level
- Routes tested end-to-end (call RPC, verify response)

## Relationship to Other ADRs

- **ADR-0001** (Hexagonal Baseline): Describes the target state, remains valid as goal but not current state
- **ADR-0002** (Organization RLS): Orthogonal (applies regardless of architecture)
- **ADR-0003** (Resend Email): Orthogonal (infrastructure choice, independent of layers)

## Example: Wave Assignment

### Hexagonal Ideal (if we refactored)

```
domain/
  └─ WaveAssignmentService
    ├─ assignWave(registration, event, groupAnchor): Wave
    └─ (pure algorithm, no DB)

application/
  └─ AssignWaveUseCase
    ├─ execute(registrationId, eventId)
    └─ (orchestration)

infrastructure/
  └─ adapters/SupabaseWaveAdapter
    ├─ getRegistration(id)
    ├─ saveRegistration(id, wave)
    └─ (Supabase calls)

presentation/
  └─ POST /api/registrations/assign
    └─ (HTTP routing only)
```

### Current Reality

```
src/lib/
  ├─ slotAssignment.ts       ← Pure algorithm ✅
  └─ openSas.ts              ← Format detection + Supabase query ⚠️

src/types/
  └─ Event.ts, Registration.ts ← Entities ✅

src/app/api/
  └─ registrations/create    ← Calls libs + RPC ✅
```

**Pragmatic**: Works for MVP. Refactor if multi-team scales.

## Decision Record

| Aspect | Hexagonal (ADR-0001) | Actual (ADR-0004) | Trade-off |
|--------|----------------------|-------------------|-----------|
| **Testability** | High (pure logic isolated) | Medium (mixed logic) | Acceptable for MVP |
| **Changeability** | High (swap adapters) | Medium (would need refactoring) | Okay, unlikely to swap |
| **Clarity** | High (strict boundaries) | Medium (boundaries soft) | Worth accepting for speed |
| **Onboarding** | Medium (must learn hexagon) | Low (intuitive colocation) | ✅ Better for small teams |
| **Refactoring Ease** | N/A | Medium (gradual extraction possible) | Can improve incrementally |

---

## Acceptance Criteria

- ✅ ADR-0004 documents the gap between theory (ADR-0001) and reality
- ✅ Developers understand current architecture is lib-based, not strictly hexagonal
- ✅ Improvement roadmap exists (short/medium/long-term)
- ✅ Code review criteria updated (know what to flag)
- ✅ No breaking changes (this is a documentation decision, not a code change)

---

## References

- ADR-0001: Hexagonal Architecture Baseline
- AGENTS.md: Architecture section (updated with reality)
- CLAUDE.md: Architecture conventions
- Implementation guides: Reference src/lib/{domain}/ organization
