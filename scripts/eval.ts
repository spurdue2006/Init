/**
 * Fixture accuracy harness for Gemini `/api/extract`.
 *
 * Usage:
 *   npm run eval
 *   EXTRACT_URL=http://localhost:3000/api/extract npm run eval
 *
 * Always validates each fixture folder's expected.json against EvidenceSchema.
 * Live extract scoring runs only when the route accepts an image fixture
 * (png/jpg/webp/gif). Text-only stand-ins are schema-checked and skipped for
 * live Gemini calls (Shlok's route requires multipart form field "image").
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { EvidenceSchema, type Evidence } from "../lib/types";

const FIXTURES_ROOT = path.join(process.cwd(), "fixtures");
const EXTRACT_URL =
  process.env.EXTRACT_URL?.trim() || "http://localhost:3000/api/extract";

const IMAGE_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
]);

type FixtureCase = {
  name: string;
  dir: string;
  expectedPath: string;
  documentPath: string | null;
  imagePath: string | null;
};

type FieldKey = "type" | "source" | "periodStart" | "periodEnd" | "hours" | "grossPay";

const COMPARE_FIELDS: FieldKey[] = [
  "type",
  "source",
  "periodStart",
  "periodEnd",
  "hours",
  "grossPay",
];

async function listFixtures(): Promise<FixtureCase[]> {
  const entries = await readdir(FIXTURES_ROOT, { withFileTypes: true });
  const cases: FixtureCase[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(FIXTURES_ROOT, entry.name);
    const expectedPath = path.join(dir, "expected.json");
    try {
      await readFile(expectedPath);
    } catch {
      continue;
    }

    const files = await readdir(dir);
    const documentPath = files.includes("document.txt")
      ? path.join(dir, "document.txt")
      : null;
    const imageName = files.find((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
    const imagePath = imageName ? path.join(dir, imageName) : null;

    cases.push({
      name: entry.name,
      dir,
      expectedPath,
      documentPath,
      imagePath,
    });
  }

  return cases.sort((a, b) => a.name.localeCompare(b.name));
}

function numbersClose(
  a: number | undefined,
  b: number | undefined,
  tol = 0.51,
): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  return Math.abs(a - b) <= tol;
}

function fieldMatch(expected: Evidence, got: Evidence, key: FieldKey): boolean {
  if (key === "hours" || key === "grossPay") {
    return numbersClose(expected[key], got[key]);
  }
  const e = expected[key];
  const g = got[key];
  if (typeof e === "string" && typeof g === "string") {
    return e.trim().toLowerCase() === g.trim().toLowerCase();
  }
  return e === g;
}

async function extractReachable(): Promise<boolean> {
  try {
    const res = await fetch(EXTRACT_URL, { method: "GET" });
    // Next route may 405/404 on GET — any HTTP response means server is up.
    void res;
    return true;
  } catch {
    return false;
  }
}

async function postExtract(imagePath: string): Promise<
  | { ok: true; evidence: Evidence }
  | { ok: false; status: number; error: string }
> {
  const bytes = await readFile(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : ext === ".heic"
            ? "image/heic"
            : ext === ".heif"
              ? "image/heif"
              : "image/jpeg";

  const form = new FormData();
  form.append(
    "image",
    new Blob([bytes], { type: mime }),
    path.basename(imagePath),
  );

  const res = await fetch(EXTRACT_URL, { method: "POST", body: form });
  const body = (await res.json().catch(() => ({}))) as {
    evidence?: unknown;
    error?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: body.error ?? `HTTP ${res.status}`,
    };
  }

  const parsed = EvidenceSchema.safeParse(body.evidence);
  if (!parsed.success) {
    return {
      ok: false,
      status: res.status,
      error: "Response missing valid evidence object",
    };
  }

  return { ok: true, evidence: parsed.data };
}

async function main() {
  console.log("80 Hours — fixture eval");
  console.log(`Extract URL: ${EXTRACT_URL}`);
  console.log("");

  const fixtures = await listFixtures();
  if (fixtures.length === 0) {
    console.log("No fixtures found under fixtures/*/expected.json");
    process.exit(0);
  }

  let schemaOk = 0;
  let liveCompared = 0;
  let liveFieldHits = 0;
  let liveFieldTotal = 0;
  let liveSkipped = 0;

  const reachable = await extractReachable();
  if (!reachable) {
    console.log(
      `Live extract: SKIPPED (cannot reach ${EXTRACT_URL} — start \`npm run dev\` with Shlok’s route when ready).`,
    );
    console.log("");
  }

  for (const fx of fixtures) {
    const raw = JSON.parse(await readFile(fx.expectedPath, "utf8")) as unknown;
    const expectedParse = EvidenceSchema.safeParse(raw);
    if (!expectedParse.success) {
      console.log(`✗ ${fx.name}: expected.json failed EvidenceSchema`);
      console.log(`  ${expectedParse.error.message}`);
      continue;
    }
    schemaOk += 1;
    console.log(`✓ ${fx.name}: expected.json passes EvidenceSchema`);

    if (!reachable) {
      liveSkipped += 1;
      continue;
    }

    if (!fx.imagePath) {
      console.log(
        `  · live extract skipped (no image file; document.txt is a stand-in — add png/jpg for Gemini scoring)`,
      );
      liveSkipped += 1;
      continue;
    }

    const result = await postExtract(fx.imagePath);
    if (!result.ok) {
      if (result.status === 404) {
        console.log(`  · live extract skipped (404 — route not deployed yet)`);
        liveSkipped += 1;
        continue;
      }
      console.log(`  · live extract failed: ${result.error}`);
      liveSkipped += 1;
      continue;
    }

    liveCompared += 1;
    const mismatches: string[] = [];
    for (const key of COMPARE_FIELDS) {
      liveFieldTotal += 1;
      if (fieldMatch(expectedParse.data, result.evidence, key)) {
        liveFieldHits += 1;
      } else {
        mismatches.push(
          `${key}: expected ${JSON.stringify(expectedParse.data[key])} got ${JSON.stringify(result.evidence[key])}`,
        );
      }
    }

    if (mismatches.length === 0) {
      console.log(`  · live extract: all compared fields match`);
    } else {
      console.log(`  · live extract mismatches:`);
      for (const m of mismatches) console.log(`    - ${m}`);
      console.log(
        `  · Log overrides in DECISIONS.md (AI extract mistakes section).`,
      );
    }
  }

  console.log("");
  console.log(
    `Schema score: ${schemaOk}/${fixtures.length} expected.json files valid`,
  );
  if (liveFieldTotal > 0) {
    console.log(
      `Live field score: ${liveFieldHits}/${liveFieldTotal} fields correct across ${liveCompared} fixture(s)`,
    );
  } else {
    console.log(
      `Live field score: n/a (${liveSkipped} fixture(s) skipped for live Gemini)`,
    );
  }

  // Always exit 0 — eval is optional and must not fail CI/hackathon flow.
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  // Still non-fatal for the hackathon harness.
  process.exit(0);
});
