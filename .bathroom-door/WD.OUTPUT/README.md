# Bathroom Door output (`.bathroom-door/WD.OUTPUT`)

Store reviewed, shareable work records here after a result is complete. These
are metadata manifests, not a replacement for source control, releases, or
private operational systems.

Each output record keeps its stable `id`, source input record, completion time,
and public destination or revision reference. Do not mark an output complete
unless its destination has been verified.

Blocked or obsolete output records must be returned to
`.bathroom-door/WD.INPUT/` with a specific blocker, then processed by the
Bathroom Door triage command. Do not delete
records to make a count look healthier.
