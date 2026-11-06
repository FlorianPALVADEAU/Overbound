---
target: ambassadors
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/florianpalvadeau/Projects/Overbound/src/app/ambassadors"
timestamp: 2026-11-05T18-41-28Z
slug: src-app-ambassadors
---
# Critique: ambassadors (public /ambassadors + dashboard)

Method: dual-agent. Score 25/40. P0: 0. P1: 2. P2: 2. P3: 1.

Priority issues
- [P1] Public page does not sell: no discount amount, no how-to-become-ambassador, dead-end empty state, two CTAs per card.
- [P1] AmbassadorPublicCard consent UX: master switch last, no preview, recruit count not disclosed, public group invite code, leaderboard exposes first name + points to all ambassadors regardless of opt-in while copy says points never shown.
- [P2] Dashboard flat hierarchy (9 same-weight cards, 576px column on desktop), reward claim moment wasted.
- [P2] Dashboard error/loading/copy hygiene: unaccented FR copy, raw error.message, em dash in admin banner, silent clipboard failure.
- [P3] Public card edge cases: group-hover without group class, raw img, 1-card layout left-aligned, lorem ipsum test bio.

Detector: static scan 0 findings; browser: hero-eyebrow-chip, nested-cards, skipped-heading (h1 to h3 on /ambassadors), straggler, kicker-above-heading.

Correction (2026-11-05, after fixes): the group-hover finding was wrong. The Card `feature` variant already carries the `group` class, so the hover fired. The heuristic total (24 or 25) could not be re-summed from this file: its row table is absent. Left unresolved.
