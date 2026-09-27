# Agent Teams — Master Reference Guide

Source: https://code.claude.com/docs/en/agent-teams (fetched 2026-09-27)

Status: experimental, disabled by default.

---

## 1. What it is

Multiple Claude Code instances working together. One session = **team lead**
(coordinates, assigns tasks, synthesizes). **Teammates** work independently,
own context window each, message each other directly. You can talk to any
teammate directly, not just through lead.

Not the same as subagents:

| | Subagents | Agent teams |
|---|---|---|
| Context | Own window, result returns to caller | Own window, fully independent |
| Communication | Return result to caller | Message each other directly |
| Coordination | Main agent manages all work | Self-coordinate via messages + shared task list |
| Best for | Focused task, only result matters | Complex work needing discussion/collaboration |
| Token cost | Lower (summarized back) | Higher (each teammate = full instance) |

Use subagents for quick focused workers. Use teams when teammates need to
share findings, challenge each other, coordinate on own.

---

## 2. Enable

```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Already set in this project's `.claude/settings.json`.

Side effect: Claude may name a subagent on its own — while teams enabled,
that named subagent launches as **teammate**, not subagent. Teams can form
even when not explicitly asked. Disable by setting var to `"0"`.

Requires **interactive session**. In non-interactive (`-p` flag, Agent SDK),
no teammates spawn — named subagent runs as ordinary subagent even with
teams enabled.

---

## 3. When to use

Best for:
- Research/review: teammates investigate different aspects, share/challenge findings
- New modules/features: each teammate owns separate piece, no stepping on each other
- Debugging with competing hypotheses: parallel theories converge faster
- Cross-layer coordination: frontend/backend/tests each owned by different teammate

Avoid for: sequential tasks, same-file edits, work with many dependencies —
single session or subagents more effective. Coordination overhead + token
cost is real.

---

## 4. Starting a team

Natural language, describe task + teammates wanted:

```
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Spawn three teammates to explore this from different angles:
one on UX, one on technical architecture, one playing devil's advocate.
```

Claude populates shared task list, spawns teammates, synthesizes findings.

Claude may use subagents instead of forming team — panel alone doesn't
confirm team formed. If subagents spawned instead, explicitly ask for
"agent team".

Panel controls (lead terminal, below prompt input):
- Up/down arrows: select teammate
- Enter: open teammate transcript, message directly
- Escape: clear selection / interrupt viewed teammate's turn

Idle rows: stay visible while any agent still working; hide 30s after ALL
idle, reappear on next turn (teammate stays running while hidden). >3 idle
collapse into one row (`2 idle agents`), Enter expands.

---

## 5. Controlling the team

### Display modes

- **in-process** (default): all teammates in main terminal, arrow-key select
- **split panes**: each teammate own pane, requires tmux or iTerm2 (`it2` CLI)

Set globally:
```json
// ~/.claude/settings.json
{ "teammateMode": "auto" }
```
Or per-session: `claude --teammate-mode auto` (experimental flag, not in `--help`)

`"auto"` = split panes if already in tmux or iTerm2+it2, else in-process.
`"tmux"` = force split-pane, auto-detect tmux vs iTerm2.
`"iterm2"` = force iTerm2 native split panes.

### Specify teammates and models

```
Spawn 4 teammates to refactor these modules in parallel. Use Sonnet for
each teammate.
```

Model selection priority:
1. Model named in spawn prompt
2. Subagent definition's `model` field (`inherit` = lead's model)
3. `CLAUDE_CODE_SUBAGENT_MODEL` env var (if not `inherit`)
4. Lead's current model

`CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` skips 1-2, forces `CLAUDE_CODE_SUBAGENT_MODEL`
or lead's model for every teammate (v2.1.257+).

Teammates inherit lead's effort level.

### Plan before implementing

Switch lead to plan mode, then ask for teammate — teammate works read-only
in plan mode until plan ready, sends plan approval to lead. **Lead
auto-approves without review** (designed exception). Teammate's actual
edits/commands still go through normal permission prompts.

### Talk to teammates directly

- In-process: arrow-select, Enter to view, type to message; `x` stops
  selected teammate; Ctrl+T toggles task list
- Split-pane: click into pane

Plain text/skills to viewed teammate go to that teammate; built-in commands
still run in lead's session. `/model`, `/fast` only affect lead (fixed at
spawn for teammate). `/effort` still applies to viewed teammate.

### Task list

Shared list, states: pending / in progress / completed. Tasks can depend on
others — blocked until dependency completes. File-locked claiming avoids
race conditions.

- Lead assigns explicitly, or
- Teammate self-claims next unblocked task after finishing its own

### Shutdown

```
Ask the researcher teammate to shut down
```

Sends shutdown request; teammate can approve (exits) or reject (with reason).
Team directories auto-cleaned on session end.

### Quality gate hooks

- `TeammateIdle`: fires before teammate goes idle; exit 2 = feedback + keep working
- `TaskCreated`: fires on task creation; exit 2 = block + feedback
- `TaskCompleted`: fires on task completion; exit 2 = block + feedback

---

## 6. Architecture

| Component | Role |
|---|---|
| Team lead | Main session, spawns + coordinates |
| Teammates | Separate instances, assigned tasks |
| Task list | Shared work items |
| Mailbox | Inter-agent messaging |

Mailbox: JSON file at `~/.claude/teams/{team-name}/inboxes/{agent-name}.json`.
Malformed entries reported + removed, valid ones still delivered (fixed
v2.1.207+, was blocking before).

Storage:
- Team config: `~/.claude/teams/{team-name}/config.json` — removed on session end
- Task list: `~/.claude/tasks/{team-name}/` — persists locally (never uploaded),
  survives session resume, subject to `cleanupPeriodDays` retention

Team name = `session-` + first 8 chars of session ID. **Don't hand-edit
config.json** — overwritten on next state update.

No project-level team config equivalent — a `.claude/teams/teams.json` in
project dir is NOT recognized, treated as ordinary file.

### Subagent definitions as teammate roles

Reuse a subagent definition (project/user/managed scope) as teammate role:

```
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

Applied parts:
- `tools`: teammate limited to list + `SendMessage` (+ Task tools if lead has them)
- `model`: used if spawn prompt doesn't name one
- Body: appended to default system prompt (in-process) or replaces it (split-pane)
- `skills`: NOT applied — teammate loads from project/user settings normally
- `mcpServers`: applied for split-pane only (per subagent scoping rules); in-process ignores, loads from project/user settings

Bringing back a stopped in-process teammate mid-session re-applies definition
only if its folder (`.claude/agents/` or `--add-dir`) is trusted. Otherwise
comes back bare (no tools/instructions from definition). Not restored at all
after session `/resume`.

### Permissions

Teammates start with lead's permission mode, EXCEPT `dontAsk` mode (not
inherited). If lead runs `--dangerously-skip-permissions`, teammates do too.
Can change individual teammate's mode after spawn, not at spawn time.

Teammate permission prompts surface in **lead session** — approve there.

Inter-agent messages: receiving agent told message is from another Claude
session, not from user. Teammate can't approve permission prompts or supply
consent on your behalf; denied action can't be relayed through another
teammate to bypass check.

Auto mode: classifier treats relayed "approval" as untrusted input, reviews
every inter-agent message before delivery (can block).

### Context and communication

Teammate loads on spawn: CLAUDE.md, MCP servers, skills (same as regular
session) + the spawn prompt. **Does NOT get lead's conversation history.**

- Messages auto-delivered, no polling needed
- Idle teammate auto-notifies lead with final answer; API-error turn notifies with error text
- Shared task list visible to Task-tool-enabled agents
- Message one teammate by name; broadcast = one message per recipient

### Token usage

Scales with number of active teammates — significantly more than single
session. In-process teammate's cache TTL defaults to 5 min (outside main
conversation's TTL bucket) even on subscription; set `subagentPromptCacheTtl: "1h"`
to extend (API bills 1h writes at higher rate).

---

## 7. Best practices

1. **Give teammates full context in spawn prompt** — they don't inherit
   conversation history. Name files, constraints, focus areas explicitly.
2. **Team size**: start 3-5 teammates. Token cost scales linearly,
   coordination overhead grows, diminishing returns beyond a point. 15
   independent tasks → 3 teammates is a reasonable start.
3. **Task sizing**: not too small (overhead > benefit), not too large
   (long silent runs = wasted-effort risk). Aim self-contained deliverable
   (a function, a test file, a review). ~5-6 tasks per teammate.
4. **Wait for teammates** — if lead starts doing the work itself instead of
   delegating, explicitly tell it to wait.
5. **Start with research/review tasks** (no code writes) before trying
   parallel implementation — lower coordination risk.
6. **Avoid file conflicts** — assign disjoint file sets per teammate.
7. **Monitor and steer actively** — don't let team run unattended long;
   redirect early, synthesize as findings arrive.

---

## 8. Use case patterns

### Parallel code review, different lenses

```
Spawn three teammates to review PR #142:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

### Adversarial root-cause investigation

```
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

Key mechanism: explicit adversarial framing counters anchoring bias that a
single sequential investigator falls into.

---

## 9. Troubleshooting

- **Teammates not appearing**: check agent panel below prompt (in-process);
  hidden idle row ≠ stopped, message by name to bring back; task may not
  have been complex enough for Claude to spawn team; split-pane requires
  `which tmux` or iTerm2 + `it2` CLI + Python API enabled.
- **Claude keeps spawning teammates instead of subagents**: set
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=0` (no restart needed — reread on
  next spawn). Check no higher-precedence settings file or managed settings
  re-enables it.
- **Too many permission prompts**: pre-approve common ops in permission
  settings before spawning.
- **Agents stopping early on errors**: select in panel, review transcript,
  give more instructions or spawn replacement.
- **Lead stops team too early**: tell it explicitly to keep going.
- **Orphaned tmux sessions**: `tmux ls` then `tmux kill-session -t <name>`.

---

## 10. Known limitations (experimental)

- No session resumption for in-process teammates (`/resume`, `/rewind` lose them)
- Task status can lag — teammate forgets to mark complete, blocks dependents
- Shutdown can be slow — teammate finishes current tool call first
- One team per session, no additional named teams, no cross-session sharing
- No nested teams — only lead manages team, teammates can't spawn teammates
- No background subagents from in-process teammates (foreground only,
  errors on `background: true` definitions or `run_in_background: true`)
- Lead is fixed for session lifetime — no promotion/leadership transfer
- Per-teammate permission mode not settable at spawn time (only after)
- Split panes unsupported in VS Code integrated terminal, Windows Terminal, Ghostty

---

## 11. Related tools (decision guide)

| Need | Use |
|---|---|
| Quick helper, only need result, no ongoing coordination | Subagents |
| Pass findings between sessions you run yourself manually | Cross-session messaging |
| Manual parallel work, own process management | Git worktrees |
| Teammates must discuss, challenge, self-coordinate | Agent teams |
