import { appendFile, mkdir, open, readFile, readdir, rename, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..", "..");
const metadataRoot = path.join(root, ".bathroom-door");
const inputDirectory = path.join(metadataRoot, "WD.INPUT");
const archiveDirectory = path.join(metadataRoot, "WD.ARCHIVE", "records");
const ledgerPath = path.join(metadataRoot, "WD.ARCHIVE", "ledger.jsonl");
const dryRun = process.argv.includes("--check");
const allowedKinds = new Set(["file", "issue", "request", "learning"]);
const allowedStatuses = new Set(["ready", "in_progress", "blocked", "complete"]);
const allowedAvailability = new Set(["verified", "missing", "unverified"]);

function assertManifest(manifest, fileName) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error(`${fileName}: manifest must be an object`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.id ?? "")) {
    throw new Error(`${fileName}: id must be lowercase kebab-case`);
  }

  if (!allowedKinds.has(manifest.kind)) {
    throw new Error(`${fileName}: kind must be file, issue, request, or learning`);
  }

  if (typeof manifest.title !== "string" || !manifest.title.trim()) {
    throw new Error(`${fileName}: title is required`);
  }

  if (Number.isNaN(Date.parse(manifest.createdAt))) {
    throw new Error(`${fileName}: createdAt must be an ISO timestamp`);
  }

  if (!allowedAvailability.has(manifest.availability)) {
    throw new Error(`${fileName}: availability must be verified, missing, or unverified`);
  }

  if (!allowedStatuses.has(manifest.status)) {
    throw new Error(`${fileName}: status is invalid`);
  }

  if (manifest.status === "blocked" && (typeof manifest.blocker !== "string" || !manifest.blocker.trim())) {
    throw new Error(`${fileName}: blocked records require a blocker`);
  }

  if (manifest.availability !== "verified" && manifest.status !== "blocked") {
    throw new Error(`${fileName}: missing or unverified records must be blocked`);
  }
}

async function loadManifests() {
  const entries = await readdir(inputDirectory, { withFileTypes: true });
  const seenIds = new Set();
  const manifests = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const filePath = path.join(inputDirectory, entry.name);
    const manifest = JSON.parse(await readFile(filePath, "utf8"));
    assertManifest(manifest, entry.name);

    if (seenIds.has(manifest.id)) {
      throw new Error(`${entry.name}: duplicate id ${manifest.id}`);
    }

    seenIds.add(manifest.id);
    manifests.push({ filePath, fileName: entry.name, manifest });
  }

  return manifests;
}

async function preflightArchive(blocked) {
  await mkdir(archiveDirectory, { recursive: true });

  for (const { fileName } of blocked) {
    const destination = path.join(archiveDirectory, fileName);

    try {
      await stat(destination);
      throw new Error(`${fileName}: archive destination already exists`);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  const ledger = await open(ledgerPath, "a");
  await ledger.close();
}

function archiveEvent(manifest, destination) {
  return JSON.stringify({
    archivedAt: new Date().toISOString(),
    id: manifest.id,
    kind: manifest.kind,
    availability: manifest.availability,
    blocker: manifest.blocker.trim(),
    record: path.relative(root, destination).replaceAll(path.sep, "/")
  });
}

async function archiveRecord({ filePath, fileName, manifest }) {
  const destination = path.join(archiveDirectory, fileName);
  await rename(filePath, destination);

  try {
    await appendFile(ledgerPath, `${archiveEvent(manifest, destination)}\n`);
  } catch (error) {
    try {
      await rename(destination, filePath);
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        `${fileName}: ledger append failed and the record could not be restored`
      );
    }

    throw new Error(`${fileName}: ledger append failed; the record was restored`, { cause: error });
  }

  console.log(`Archived ${manifest.id}`);
}

async function archiveBlockedRecords() {
  const manifests = await loadManifests();
  const blocked = manifests.filter(({ manifest }) => manifest.status === "blocked");

  if (dryRun) {
    for (const { manifest } of blocked) {
      console.log(`Would archive ${manifest.id}: ${manifest.blocker.trim()}`);
    }
    console.log(`Checked ${manifests.length} manifest(s); ${blocked.length} would be archived.`);
    return;
  }

  await preflightArchive(blocked);

  for (const record of blocked) {
    await archiveRecord(record);
  }

  console.log(`Checked ${manifests.length} manifest(s); archived ${blocked.length}.`);
}

await archiveBlockedRecords();
