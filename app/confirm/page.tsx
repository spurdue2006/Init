"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clearDraftEvidence, loadDraftEvidence } from "@/lib/draft";
import { upsertEvidence } from "@/lib/storage";
import {
  EvidenceTypeSchema,
  type Evidence,
  type EvidenceType,
} from "@/lib/types";

const TYPES = EvidenceTypeSchema.options;

const emptySubscribe = () => () => {};

export default function ConfirmPage() {
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [draft, setDraft] = useState<Evidence | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effective = draft ?? (mounted ? loadDraftEvidence() : null);

  function update<K extends keyof Evidence>(key: K, value: Evidence[K]) {
    setDraft((prev) => {
      const current = prev ?? loadDraftEvidence();
      if (!current) return prev;
      return { ...current, [key]: value };
    });
  }

  function onConfirm() {
    if (!effective) return;
    setError(null);
    try {
      const confirmed: Evidence = {
        ...effective,
        source: effective.source.trim(),
        notes: effective.notes?.trim() || undefined,
        userConfirmed: true,
      };
      upsertEvidence(confirmed);
      clearDraftEvidence();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save evidence");
    }
  }

  if (!mounted) {
    return (
      <AppShell title="Confirm">
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading draft…
        </p>
      </AppShell>
    );
  }

  if (!effective) {
    return (
      <AppShell title="Confirm">
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No draft found. Upload a document first.
          </p>
          <Button asChild>
            <Link href="/upload">Go to upload</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Confirm" headerRight="Step 2 of 2">
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Confirm what was read
          </h1>
          <Badge variant="secondary" className="mt-1 shrink-0">
            {Math.round(effective.confidence * 100)}% conf.
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Fix any field before it counts. AI assists — you decide.
        </p>
      </header>

      <Card size="sm" className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Evidence fields</CardTitle>
          <CardDescription>
            <Link
              href="/upload"
              className="underline-offset-4 hover:underline"
            >
              Upload again
            </Link>{" "}
            if this document is wrong.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Type</span>
            <select
              className="h-11 rounded-lg border border-input bg-card px-2.5 text-sm"
              value={effective.type}
              onChange={(e) => update("type", e.target.value as EvidenceType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Source</span>
            <Input
              className="h-11 bg-card"
              value={effective.source}
              onChange={(e) => update("source", e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Period start</span>
              <Input
                className="h-11 bg-card"
                type="date"
                value={effective.periodStart}
                onChange={(e) => update("periodStart", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Period end</span>
              <Input
                className="h-11 bg-card"
                type="date"
                value={effective.periodEnd}
                onChange={(e) => update("periodEnd", e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Hours</span>
              <Input
                className="h-11 bg-card"
                type="number"
                min={0}
                step="0.25"
                value={effective.hours ?? ""}
                onChange={(e) =>
                  update(
                    "hours",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Gross pay ($)</span>
              <Input
                className="h-11 bg-card"
                type="number"
                min={0}
                step="0.01"
                value={effective.grossPay ?? ""}
                onChange={(e) =>
                  update(
                    "grossPay",
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Notes</span>
            <Input
              className="h-11 bg-card"
              value={effective.notes ?? ""}
              onChange={(e) => update("notes", e.target.value || undefined)}
            />
          </label>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            type="button"
            className="h-11 w-full text-base"
            onClick={onConfirm}
          >
            Save & count toward month
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Saved to this device only. You can delete everything later from
            Progress.
          </p>
        </CardFooter>
      </Card>
    </AppShell>
  );
}
