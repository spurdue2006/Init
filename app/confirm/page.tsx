"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, FileText, Info } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearDraftEvidence, loadDraftEvidence } from "@/lib/draft";
import { useI18n } from "@/lib/i18n";
import { upsertEvidence } from "@/lib/storage";
import {
  EvidenceTypeSchema,
  type Evidence,
  type EvidenceType,
} from "@/lib/types";

const TYPES = EvidenceTypeSchema.options;

const emptySubscribe = () => () => {};

const labelClass = "text-sm font-medium text-primary";
const fieldClass =
  "h-12 rounded-lg border border-input bg-card px-3 text-sm shadow-none";

export default function ConfirmPage() {
  const { t } = useI18n();
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
      const monthKey = confirmed.periodStart.slice(0, 7);
      const monthQuery = /^\d{4}-\d{2}$/.test(monthKey)
        ? `&month=${encodeURIComponent(monthKey)}`
        : "";
      router.push(`/dashboard?saved=1${monthQuery}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save evidence");
    }
  }

  if (!mounted) {
    return (
      <AppShell title={t("confirm.title")}>
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t("confirm.loadingDraft")}
        </p>
      </AppShell>
    );
  }

  if (!effective) {
    return (
      <AppShell title={t("confirm.title")}>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("confirm.noDraft")}</p>
          <Button asChild>
            <Link href="/upload">{t("confirm.goUpload")}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={t("nav.proof")} headerRight={t("confirm.step")}>
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <div
          className="relative flex size-24 items-center justify-center rounded-full bg-accent"
          aria-hidden
        >
          <FileText className="size-12 text-primary" strokeWidth={1.5} />
          <span className="absolute -right-0.5 -bottom-0.5 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-4 ring-[var(--page)]">
            <CheckCircle2 className="size-6" strokeWidth={2} />
          </span>
        </div>
        <div className="flex max-w-sm flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("confirm.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("confirm.description")}
          </p>
        </div>
        <Badge variant="secondary" className="font-normal">
          {t("confirm.confidence", {
            pct: Math.round(effective.confidence * 100),
          })}
        </Badge>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-4 py-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {t("confirm.fieldsTitle")}
          </p>
          <Link
            href="/upload"
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            {t("confirm.uploadAgain")}
          </Link>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("confirm.type")}</span>
          <select
            className={fieldClass}
            value={effective.type}
            onChange={(e) => update("type", e.target.value as EvidenceType)}
          >
            {TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("confirm.source")}</span>
          <Input
            className={fieldClass}
            value={effective.source}
            onChange={(e) => update("source", e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>{t("confirm.periodStart")}</span>
            <Input
              className={fieldClass}
              type="date"
              value={effective.periodStart}
              onChange={(e) => update("periodStart", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>{t("confirm.periodEnd")}</span>
            <Input
              className={fieldClass}
              type="date"
              value={effective.periodEnd}
              onChange={(e) => update("periodEnd", e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>{t("confirm.hours")}</span>
            <div className="relative">
              <Input
                className={`${fieldClass} pr-12`}
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
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                {t("confirm.hoursSuffix")}
              </span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>{t("confirm.grossPay")}</span>
            <Input
              className={fieldClass}
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

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{t("confirm.notes")}</span>
          <Input
            className={fieldClass}
            value={effective.notes ?? ""}
            onChange={(e) => update("notes", e.target.value || undefined)}
          />
        </label>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div
        className="flex items-start gap-3 rounded-lg bg-muted/80 px-3.5 py-3 text-sm text-foreground"
        role="note"
      >
        <Info
          className="mt-0.5 size-5 shrink-0 text-primary"
          strokeWidth={2}
          aria-hidden
        />
        <p className="leading-snug text-muted-foreground">
          {t("confirm.infoBanner")}
        </p>
      </div>

      <div className="flex flex-col gap-2 pb-2">
        <Button
          type="button"
          className="h-12 w-full gap-2 text-base font-medium"
          onClick={onConfirm}
        >
          <Check className="size-5" strokeWidth={2.5} aria-hidden />
          {t("confirm.save")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("confirm.saveHint")}
        </p>
      </div>
    </AppShell>
  );
}
