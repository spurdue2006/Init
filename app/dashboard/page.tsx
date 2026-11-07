"use client";

import Link from "next/link";
import { Suspense, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ProofPacket } from "@/lib/pdf";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import {
  EARNINGS_THRESHOLD,
  HOURS_THRESHOLD,
  computeMonthStatus,
} from "@/lib/rules";
import { mariaEvidence } from "@/lib/seed/maria";
import {
  deleteAllEvidence,
  listEvidence,
  replaceAllEvidence,
} from "@/lib/storage";
import type { Evidence, MetBy, MonthStatus } from "@/lib/types";

const emptySubscribe = () => () => {};

const PLACEHOLDER_STATUS: MonthStatus = {
  month: "2026-11",
  hours: 0,
  earnings: 0,
  metBy: "none",
  hoursRemaining: HOURS_THRESHOLD,
  daysLeft: 0,
  atRisk: false,
};

function monthLabel(month: string, locale: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(
    locale === "es" ? "es-US" : "en-US",
    { month: "long", year: "numeric" },
  );
}

function shortMonthLabel(month: string, locale: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(
    locale === "es" ? "es-US" : "en-US",
    { month: "short", year: "numeric" },
  );
}

function monthsFromEvidence(evidence: Evidence[]): string[] {
  const months = new Set<string>();
  for (const row of evidence) {
    if (!row.userConfirmed) continue;
    const start = row.periodStart.slice(0, 7);
    const end = row.periodEnd.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end)) continue;

    let [y, m] = start.split("-").map(Number);
    const [endY, endM] = end.split("-").map(Number);
    while (y < endY || (y === endY && m <= endM)) {
      months.add(`${y}-${String(m).padStart(2, "0")}`);
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  }
  return [...months].sort();
}

function primaryMonthForRow(row: Evidence): string {
  return row.periodStart.slice(0, 7);
}

function DashboardContent() {
  const { t, locale } = useI18n();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [tick, setTick] = useState(0);
  const [monthOverride, setMonthOverride] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [smsBusy, setSmsBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  void tick;
  const items = mounted ? listEvidence() : [];
  const evidenceMonths = monthsFromEvidence(items);
  const suggestedMonth =
    evidenceMonths.length > 0
      ? evidenceMonths[evidenceMonths.length - 1]
      : "2026-11";
  const month = monthOverride ?? suggestedMonth;

  const status = mounted
    ? computeMonthStatus(items, month, new Date())
    : { ...PLACEHOLDER_STATUS, month };

  const hoursPct = Math.min(
    100,
    Math.round((status.hours / HOURS_THRESHOLD) * 100),
  );
  const earningsPct = Math.min(
    100,
    Math.round((status.earnings / EARNINGS_THRESHOLD) * 100),
  );

  const selectedEmpty =
    status.hours === 0 && status.earnings === 0 && status.metBy === "none";
  const otherMonthsWithData = evidenceMonths.filter((m) => m !== month);
  const itemsInMonth = items.filter((item) => {
    const start = item.periodStart.slice(0, 7);
    const end = item.periodEnd.slice(0, 7);
    return start <= month && end >= month;
  });

  function pathLabel(metBy: MetBy): string {
    switch (metBy) {
      case "hours":
        return t("dashboard.pathHours");
      case "earnings":
        return t("dashboard.pathEarnings");
      case "school":
        return t("dashboard.pathSchool");
      default:
        return t("dashboard.pathNone");
    }
  }

  function refresh(note?: string) {
    setTick((n) => n + 1);
    setError(null);
    setMessage(note ?? null);
  }

  function onLoadMaria() {
    replaceAllEvidence(mariaEvidence);
    setMonthOverride("2026-11");
    refresh(t("dashboard.mariaLoaded"));
  }

  async function onDownloadPdf() {
    setPdfBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(
        <ProofPacket monthStatus={status} evidence={items} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `80-hours-proof-${month}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(t("dashboard.pdfDone"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.pdfFailed"));
    } finally {
      setPdfBusy(false);
    }
  }

  async function onSendSms() {
    const to = phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(to)) {
      setError(t("dashboard.smsNeedPhone"));
      return;
    }
    setSmsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          hoursRemaining: status.hoursRemaining,
          daysLeft: status.daysLeft,
          month: monthLabel(month, locale),
          locale,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || t("dashboard.smsFail"));
      }
      setMessage(t("dashboard.smsOk"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.smsFail"));
    } finally {
      setSmsBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("nav.backHome")}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/exempt"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("nav.exempt")}
          </Link>
          <LanguageToggle />
        </div>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </header>

      {evidenceMonths.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("dashboard.monthsWithProof")}
          </p>
          <div className="flex flex-wrap gap-2">
            {evidenceMonths.map((m) => {
              const active = m === month;
              return (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setMonthOverride(m)}
                >
                  {shortMonthLabel(m, locale)}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">{t("dashboard.pickMonth")}</span>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonthOverride(e.target.value)}
        />
      </label>

      {selectedEmpty && otherMonthsWithData.length > 0 ? (
        <div className="rounded-xl border border-amber-600/30 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-50">
          <p className="font-medium">{t("dashboard.wrongMonthTitle")}</p>
          <p className="mt-1 text-amber-900/80 dark:text-amber-50/80">
            {t("dashboard.wrongMonthBody", {
              months: otherMonthsWithData
                .map((m) => monthLabel(m, locale))
                .join(", "),
              selected: monthLabel(month, locale),
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {otherMonthsWithData.map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => setMonthOverride(m)}
              >
                {t("dashboard.showMonth", {
                  month: shortMonthLabel(m, locale),
                })}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {status.atRisk ? (
        <div
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {t("dashboard.atRisk", {
            month: monthLabel(month, locale),
            days: status.daysLeft,
          })}
        </div>
      ) : null}

      <Card size="sm" className="overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {monthLabel(month, locale)}
              </p>
              <CardTitle className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                {status.hours}
                <span className="text-lg font-medium text-muted-foreground">
                  /{HOURS_THRESHOLD} hrs
                </span>
              </CardTitle>
              <CardDescription className="mt-1">
                {t("dashboard.daysLeft", { n: status.daysLeft })} ·{" "}
                {pathLabel(status.metBy)}
              </CardDescription>
            </div>
            {status.metBy !== "none" ? (
              <Badge className="shrink-0">
                {t("dashboard.metVia", { path: status.metBy })}
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                {t("dashboard.hrsLeft", { n: status.hoursRemaining })}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between gap-2">
              <span className="text-sm font-medium">
                {t("dashboard.hoursLabel")}
              </span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {status.hours} / {HOURS_THRESHOLD}
              </span>
            </div>
            <Progress value={hoursPct} className="h-2.5" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between gap-2">
              <span className="text-sm font-medium">
                {t("dashboard.earningsLabel")}
              </span>
              <span className="text-sm tabular-nums text-muted-foreground">
                ${status.earnings.toFixed(2)} / ${EARNINGS_THRESHOLD}
              </span>
            </div>
            <Progress value={earningsPct} className="h-2.5" />
            {status.earnings >= EARNINGS_THRESHOLD ? (
              <p className="text-xs text-muted-foreground">
                {t("dashboard.earningsCleared")}
              </p>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.evidenceInMonth", { count: itemsInMonth.length })}
            {items.length !== itemsInMonth.length
              ? ` · ${t("dashboard.totalOnDevice", { total: items.length })}`
              : ""}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full"
          onClick={onLoadMaria}
        >
          {t("dashboard.loadMaria")}
        </Button>
        <Button
          type="button"
          className="h-11 w-full"
          onClick={onDownloadPdf}
          disabled={pdfBusy || items.length === 0}
        >
          {pdfBusy ? t("dashboard.buildingPdf") : t("dashboard.downloadPdf")}
        </Button>
      </div>

      <Button asChild variant="outline" className="h-11 w-full">
        <Link href="/upload">{t("dashboard.uploadMore")}</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.smsTitle")}</CardTitle>
          <CardDescription>{t("dashboard.smsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">
              {t("dashboard.smsPhone")}
            </span>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="+15551234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full"
            disabled={smsBusy}
            onClick={onSendSms}
          >
            {smsBusy ? t("dashboard.smsSending") : t("dashboard.smsSend")}
          </Button>
        </CardContent>
      </Card>

      {message ? (
        <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.evidenceTitle")}</CardTitle>
          <CardDescription>{t("dashboard.evidenceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noEvidence")}
            </p>
          ) : (
            items.map((item) => {
              const rowMonth = primaryMonthForRow(item);
              const inView = rowMonth === month;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMonthOverride(rowMonth)}
                  className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    inView
                      ? "border-foreground/20 bg-muted/40"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">
                      {item.source}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({item.type})
                      </span>
                    </p>
                    <Badge variant={inView ? "default" : "outline"}>
                      {shortMonthLabel(rowMonth, locale)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {item.periodStart} → {item.periodEnd}
                    {item.hours !== undefined ? ` · ${item.hours} hrs` : ""}
                    {item.grossPay !== undefined
                      ? ` · $${item.grossPay}`
                      : ""}
                    {item.userConfirmed
                      ? ` · ${t("dashboard.confirmed")}`
                      : ` · ${t("dashboard.notConfirmed")}`}
                  </p>
                  {!inView ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("dashboard.tapToShow", {
                        month: shortMonthLabel(rowMonth, locale),
                      })}
                    </p>
                  ) : null}
                </button>
              );
            })
          )}

          {items.length > 0 ? (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => {
                deleteAllEvidence();
                setMonthOverride(null);
                refresh(t("dashboard.deleted"));
              }}
            >
              {t("dashboard.deleteAll")}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        {t("dashboard.disclaimer")}
      </p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          …
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
