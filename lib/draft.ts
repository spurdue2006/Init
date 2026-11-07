import { EvidenceSchema, type Evidence } from "@/lib/types";

/** sessionStorage draft between Upload → Confirm (not persisted long-term). */
export const DRAFT_STORAGE_KEY = "eighty-hours:draft";

function canUseSession(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function saveDraftEvidence(evidence: Evidence): void {
  if (!canUseSession()) return;
  const parsed = EvidenceSchema.parse(evidence);
  window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(parsed));
}

export function loadDraftEvidence(): Evidence | null {
  if (!canUseSession()) return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const result = EvidenceSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function clearDraftEvidence(): void {
  if (!canUseSession()) return;
  window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}
