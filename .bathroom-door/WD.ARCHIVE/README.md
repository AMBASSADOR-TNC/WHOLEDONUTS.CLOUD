# Bathroom Door archive (`.bathroom-door/WD.ARCHIVE`)

This directory is the non-blocking history for Bathroom Door protocol records. It contains:

- `records/`: input manifests that were explicitly marked `blocked`.
- `ledger.jsonl`: one append-only JSON event for each automatic archive action.

The archive preserves operational context without presenting blocked work as
active. It does not erase the underlying source, issue, or learning record.

Only the Bathroom Door triage command writes archival events. A record is archived only
when its structured manifest has both `status: "blocked"` and a non-empty
`blocker`; this avoids classifying ordinary work or untrusted issue text by
guesswork.
