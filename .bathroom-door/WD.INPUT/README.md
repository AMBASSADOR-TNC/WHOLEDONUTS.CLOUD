# Bathroom Door input (`.bathroom-door/WD.INPUT`)

Put a new, structured work record here before it is acted on. This directory is
for metadata only; do not place secrets, private material, generated output, or
unverified source content here.

Each record is a JSON file with this shape:

```json
{
  "id": "lowercase-kebab-case-id",
  "kind": "file",
  "title": "Short factual description",
  "createdAt": "2026-10-30T00:00:00.000Z",
  "availability": "verified",
  "status": "ready",
  "source": "relative/path/or/public-url",
  "notes": "Optional operational context"
}
```

Allowed `kind` values are `file`, `issue`, `request`, and `learning`. Allowed
`status` values are `ready`, `in_progress`, `blocked`, and `complete`.
`availability` is either `verified`, `missing`, or `unverified`.

Only `availability: "verified"` work can advance through active programs. Set
`availability` to `missing` or `unverified`, set `status` to `blocked`, and
provide a non-empty `blocker` when work cannot proceed. Running
`node tools/wd-protocol/triage.mjs` then moves the record to
`.bathroom-door/WD.ARCHIVE/records/` and writes an event to the append-only
archive ledger.
Use `--check` to inspect the result without changing files.

GitHub issues are represented only by their public URL and metadata. The
`bathroom-door-blocker` issue label automatically receives the
`bathroom-door-archive` label through the repository workflow; it does not copy
issue content into this repository.
