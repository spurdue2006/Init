import { EvidenceSchema, type Evidence } from "@/lib/types";

/** localStorage key for confirmed / draft evidence (device-only; no server DB). */
export const EVIDENCE_STORAGE_KEY = "eighty-hours:evidence";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRaw(): unknown[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(EVIDENCE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(evidence: Evidence[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(evidence));
}

/** Parse and keep only schema-valid evidence rows (drops corrupt entries). */
export function listEvidence(): Evidence[] {
  const out: Evidence[] = [];
  for (const row of readRaw()) {
    const result = EvidenceSchema.safeParse(row);
    if (result.success) out.push(result.data);
  }
  return out;
}

export function getEvidence(id: string): Evidence | undefined {
  return listEvidence().find((item) => item.id === id);
}

/** Insert or replace by `id`. Validates with EvidenceSchema. */
export function upsertEvidence(evidence: Evidence): Evidence {
  const parsed = EvidenceSchema.parse(evidence);
  const next = listEvidence().filter((item) => item.id !== parsed.id);
  next.push(parsed);
  writeAll(next);
  return parsed;
}

export function deleteEvidence(id: string): boolean {
  const current = listEvidence();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) return false;
  writeAll(next);
  return true;
}

/** Privacy: wipe all evidence from this device. */
export function deleteAllEvidence(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(EVIDENCE_STORAGE_KEY);
}
