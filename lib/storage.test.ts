import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Evidence } from "@/lib/types";
import {
  deleteAllEvidence,
  deleteEvidence,
  EVIDENCE_STORAGE_KEY,
  getEvidence,
  listEvidence,
  upsertEvidence,
} from "@/lib/storage";

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "ev-1",
    type: "paystub",
    source: "Acme Home Health",
    periodStart: "2026-11-01",
    periodEnd: "2026-11-15",
    hours: 32,
    grossPay: 420,
    confidence: 0.9,
    userConfirmed: false,
    ...overrides,
  };
}

describe("lib/storage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    });
  });

  afterEach(() => {
    deleteAllEvidence();
  });

  it("starts empty", () => {
    expect(listEvidence()).toEqual([]);
    expect(getEvidence("missing")).toBeUndefined();
  });

  it("upserts, lists, and gets by id", () => {
    const saved = upsertEvidence(makeEvidence());
    expect(saved.id).toBe("ev-1");
    expect(listEvidence()).toHaveLength(1);
    expect(getEvidence("ev-1")?.source).toBe("Acme Home Health");
  });

  it("replaces an existing id on upsert", () => {
    upsertEvidence(makeEvidence({ hours: 10, userConfirmed: false }));
    upsertEvidence(makeEvidence({ hours: 40, userConfirmed: true }));
    const all = listEvidence();
    expect(all).toHaveLength(1);
    expect(all[0]?.hours).toBe(40);
    expect(all[0]?.userConfirmed).toBe(true);
  });

  it("deletes one evidence row", () => {
    upsertEvidence(makeEvidence({ id: "a" }));
    upsertEvidence(makeEvidence({ id: "b", source: "DoorDash" }));
    expect(deleteEvidence("a")).toBe(true);
    expect(listEvidence().map((e) => e.id)).toEqual(["b"]);
    expect(deleteEvidence("a")).toBe(false);
  });

  it("deleteAllEvidence clears the storage key", () => {
    upsertEvidence(makeEvidence());
    deleteAllEvidence();
    expect(listEvidence()).toEqual([]);
    expect(localStorage.getItem(EVIDENCE_STORAGE_KEY)).toBeNull();
  });

  it("rejects invalid evidence on upsert", () => {
    expect(() =>
      upsertEvidence(
        makeEvidence({
          // @ts-expect-error intentional invalid type for runtime check
          type: "internship",
        }),
      ),
    ).toThrow();
  });

  it("skips corrupt rows when listing", () => {
    localStorage.setItem(
      EVIDENCE_STORAGE_KEY,
      JSON.stringify([
        makeEvidence({ id: "good" }),
        { id: "bad", type: "nope" },
      ]),
    );
    expect(listEvidence().map((e) => e.id)).toEqual(["good"]);
  });
});
