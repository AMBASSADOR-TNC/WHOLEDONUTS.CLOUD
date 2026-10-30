import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const sourceTool = await readFile(new URL("./triage.mjs", import.meta.url), "utf8");

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "wd-protocol-"));
  const metadataRoot = path.join(root, ".bathroom-door");
  const inputDirectory = path.join(metadataRoot, "WD.INPUT");
  const archiveDirectory = path.join(metadataRoot, "WD.ARCHIVE", "records");
  const toolDirectory = path.join(root, "tools", "wd-protocol");
  await Promise.all([
    mkdir(inputDirectory, { recursive: true }),
    mkdir(toolDirectory, { recursive: true })
  ]);
  await writeFile(path.join(toolDirectory, "triage.mjs"), sourceTool);

  return {
    root,
    inputDirectory,
    archiveDirectory,
    ledgerPath: path.join(metadataRoot, "WD.ARCHIVE", "ledger.jsonl"),
    toolPath: path.join(toolDirectory, "triage.mjs")
  };
}

function blockedManifest(id) {
  return {
    id,
    kind: "learning",
    title: `Test ${id}`,
    createdAt: "2026-10-30T00:00:00.000Z",
    availability: "missing",
    status: "blocked",
    blocker: "Test confirms automatic archival"
  };
}

async function writeManifest(fixture, fileName, manifest) {
  await writeFile(path.join(fixture.inputDirectory, fileName), JSON.stringify(manifest));
}

function run(fixture, ...arguments_) {
  return spawnSync(process.execPath, [fixture.toolPath, ...arguments_], {
    cwd: fixture.root,
    encoding: "utf8"
  });
}

const fixtures = [];

try {
  const fixture = await createFixture();
  fixtures.push(fixture);
  await writeManifest(fixture, "blocked-record.json", blockedManifest("blocked-record"));

  const result = run(fixture);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Archived blocked-record/);
  const archived = JSON.parse(await readFile(path.join(fixture.archiveDirectory, "blocked-record.json"), "utf8"));
  assert.equal(archived.status, "blocked");
  assert.equal(archived.availability, "missing");
  const ledger = await readFile(fixture.ledgerPath, "utf8");
  assert.match(ledger, /"id":"blocked-record"/);
  assert.match(ledger, /"availability":"missing"/);

  const repeatedRun = run(fixture);
  assert.equal(repeatedRun.status, 0, repeatedRun.stderr);
  assert.match(repeatedRun.stdout, /Checked 0 manifest\(s\); archived 0/);
  assert.equal(await readFile(fixture.ledgerPath, "utf8"), ledger);

  const collisionFixture = await createFixture();
  fixtures.push(collisionFixture);
  const firstManifest = JSON.stringify(blockedManifest("first-record"));
  const secondManifest = JSON.stringify(blockedManifest("second-record"));
  await writeFile(path.join(collisionFixture.inputDirectory, "a-first.json"), firstManifest);
  await writeFile(path.join(collisionFixture.inputDirectory, "b-second.json"), secondManifest);
  await mkdir(collisionFixture.archiveDirectory, { recursive: true });
  const existingArchive = "{\"existing\":true}\n";
  const initialLedger = "{\"existing\":\"ledger\"}\n";
  await writeFile(path.join(collisionFixture.archiveDirectory, "b-second.json"), existingArchive);
  await writeFile(collisionFixture.ledgerPath, initialLedger);

  const collisionRun = run(collisionFixture);
  assert.notEqual(collisionRun.status, 0);
  assert.match(collisionRun.stderr, /b-second\.json: archive destination already exists/);
  assert.equal(await readFile(path.join(collisionFixture.inputDirectory, "a-first.json"), "utf8"), firstManifest);
  assert.equal(await readFile(path.join(collisionFixture.inputDirectory, "b-second.json"), "utf8"), secondManifest);
  await assert.rejects(readFile(path.join(collisionFixture.archiveDirectory, "a-first.json"), "utf8"));
  assert.equal(await readFile(path.join(collisionFixture.archiveDirectory, "b-second.json"), "utf8"), existingArchive);
  assert.equal(await readFile(collisionFixture.ledgerPath, "utf8"), initialLedger);

  const checkFixture = await createFixture();
  fixtures.push(checkFixture);
  const checkManifest = JSON.stringify(blockedManifest("check-record"));
  await writeFile(path.join(checkFixture.inputDirectory, "check-record.json"), checkManifest);

  const checkRun = run(checkFixture, "--check");
  assert.equal(checkRun.status, 0, checkRun.stderr);
  assert.match(checkRun.stdout, /Would archive check-record/);
  assert.equal(await readFile(path.join(checkFixture.inputDirectory, "check-record.json"), "utf8"), checkManifest);
  await assert.rejects(readFile(path.join(checkFixture.archiveDirectory, "check-record.json"), "utf8"));
  await assert.rejects(readFile(checkFixture.ledgerPath, "utf8"));
} finally {
  await Promise.all(fixtures.map(({ root }) => rm(root, { recursive: true, force: true })));
}
