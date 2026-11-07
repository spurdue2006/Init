"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
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
import { LanguageToggle, useI18n } from "@/lib/i18n";
import { upsertEvidence } from "@/lib/storage";
import {
  EvidenceTypeSchema,
  type Evidence,
  type EvidenceType,
} from "@/lib/types";

const TYPES = EvidenceTypeSchema.options;
const emptySubscribe = () => () => {};

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
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save evidence");
    }
  }

  if (!mounted) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 items-center justify-center px-4 py-16 text-sm text-muted-foreground">
        {t("confirm.loadingDraft")}
      </main>
    );
  }

  if (!effective) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center gap-4 px-4 py-16 text-center">
        <LanguageToggle />
        <p className="text-muted-foreground">{t("confirm.noDraft")}</p>
        <Button asChild>
          <Link href="/upload">{t("confirm.goUpload")}</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/upload"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("confirm.uploadAgain")}
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {t("confirm.step")}
          </p>
          <LanguageToggle />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>{t("confirm.title")}</CardTitle>
              <CardDescription>{t("confirm.description")}</CardDescription>
            </div>
            <Badge variant="secondary">
              {t("confirm.confidence", {
                pct: Math.round(effective.confidence * 100),
              })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t("confirm.type")}</span>
            <select
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={effective.type}
              onChange={(e) => update("type", e.target.value as EvidenceType)}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t("confirm.source")}</span>
            <Input
              value={effective.source}
              onChange={(e) => update("source", e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">
                {t("confirm.periodStart")}
              </span>
              <Input
                type="date"
                value={effective.periodStart}
                onChange={(e) => update("periodStart", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">
                {t("confirm.periodEnd")}
              </span>
              <Input
                type="date"
                value={effective.periodEnd}
                onChange={(e) => update("periodEnd", e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">{t("confirm.hours")}</span>
              <Input
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
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">
                {t("confirm.grossPay")}
              </span>
              <Input
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

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t("confirm.notes")}</span>
            <Input
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
            {t("confirm.save")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {t("confirm.saveHint")}
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
