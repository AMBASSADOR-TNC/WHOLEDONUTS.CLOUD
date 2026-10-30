# Bathroom Door protocol

The Bathroom Door protocol keeps active work, completed work, and operational blockers
separate without losing the trail that explains a decision.

| Location | Purpose | Counted by |
|---|---|---|
| `.bathroom-door/WD.INPUT/` | Structured work awaiting action | JSON manifest |
| `.bathroom-door/WD.OUTPUT/` | Reviewed, verified results | JSON manifest |
| `.bathroom-door/WD.ARCHIVE/records/` | Explicitly blocked work | Archive ledger event |

## Cloud adoption

WHOLEDONUTS.CLOUD already uses lowercase public `wd.input`, `wd.output`, and
`wd.archive` routes. The uppercase protocol directories therefore live under
`.bathroom-door/` as repository-only metadata, leaving those public static
routes untouched.

The archive ledger and records were preserved from the prior reviewed workspace
without changing their timestamps, paths, or blocker statements. They describe
legacy workspace conditions at the time they were recorded; Cloud adoption
supersedes those conditions as the active integration location, but does not
rewrite history or assert that the historical blockers have been resolved.

## Automatic blocker handling

An input manifest is automatically archived when, and only when, it has:

```json
{
  "availability": "missing",
  "status": "blocked",
  "blocker": "A specific, factual reason work cannot continue"
}
```

`availability: "verified"` is required before an item can move forward as
active work. `missing` and `unverified` are not failures to hide: they must use
the blocked form above so Bathroom Door preserves their reason, count, and
source metadata without letting them slow active programs.

Run the following command locally or in automation:

```sh
node tools/wd-protocol/triage.mjs
```

Before moving anything, the command validates every candidate, checks every
archive destination, and verifies that the ledger can be opened for appending.
It rejects malformed manifests, duplicate IDs, a blocked record without a
reason, and archive-name collisions. After each successful move, it appends
that record's event immediately to the ledger. If appending that event fails,
the command attempts to restore that current record and then stops. `--check`
reports the archive plan without writing it.

This is deliberate failure handling, not crash-atomic storage. An operating
system or filesystem failure can still interrupt a process between a move and
its ledger append; recover such an interruption through a human review of the
record and ledger rather than assuming an automated repair occurred.

The GitHub workflow separately treats an issue carrying
`bathroom-door-blocker` as an archived operational item by applying
`bathroom-door-archive`. It does not close the
issue, mutate its text, or copy its untrusted contents into the repository.
That preserves a human-readable issue history while keeping it out of the
active queue. The workflow initializes these two labels on its first push to
the default branch, pull request validation run, or manual dispatch.

## Learning records

Use `kind: "learning"` for a factual creation or operations lesson. Keep
personal, private, health, financial, and credential information out of every
Bathroom Door manifest. A learning record stays counted even after archival; its archive
event records the original ID, kind, reason, and timestamp.

## Operational boundary

This protocol is a repository workflow, not an operator dashboard, task
management service, issue backup system, or automatic decision maker. It does
not collect external data, call third-party services, remove source files, or
claim that a public program capability is live.
