"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
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
import { useI18n } from "@/lib/i18n";
import { ProofPacket } from "@/lib/pdf";
import {
  EARNINGS_THRESHOLD,
  HOURS_THRESHOLD,
  computeMonthStatus,
} from "@/lib/rules";
import {
  deleteAllEvidence,
  deleteEvidence,
  listEvidence,
} from "@/lib/storage";
import type { Evidence, MetBy, MonthStatus } from "@/lib/types";

const emptySubscribe = () => () => {};

/** Stable empty status for SSR / first paint — no `new Date()`. */
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

/** Calendar months (YYYY-MM) overlapped by confirmed evidence periods. */
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [tick, setTick] = useState(0);
  const [monthOverride, setMonthOverride] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [smsBusy, setSmsBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDanger, setShowDanger] = useState(false);

  void tick;
  const items = mounted ? listEvidence() : [];
  const evidenceMonths = monthsFromEvidence(items);
  const suggestedMonth =
    evidenceMonths.length > 0
      ? evidenceMonths[evidenceMonths.length - 1]
      : "2026-11";
  const month = monthOverride ?? suggestedMonth;

  useEffect(() => {
    if (!mounted) return;
    if (searchParams.get("saved") !== "1") return;
    const savedMonth = searchParams.get("month");
    if (savedMonth && /^\d{4}-\d{2}$/.test(savedMonth)) {
      setMonthOverride(savedMonth);
      setMessage(
        t("dashboard.savedToMonth", {
          month: monthLabel(savedMonth, locale),
        }),
      );
    } else {
      setMessage(t("dashboard.savedGeneric"));
    }
    router.replace("/dashboard", { scroll: false });
  }, [mounted, searchParams, locale, router, t]);

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

  function metByLabel(metBy: MetBy): string {
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
    <AppShell title={t("nav.progress")}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </header>

      {message ? (
        <p
          className="rounded-md border border-primary/20 bg-accent/60 px-3 py-2 text-sm font-medium text-foreground"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">{t("dashboard.month")}</span>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonthOverride(e.target.value)}
          className="h-11 bg-card"
        />
        {evidenceMonths.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {evidenceMonths.map((m) => {
              const active = m === month;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonthOverride(m)}
                  className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
                  }`}
                >
                  {shortMonthLabel(m, locale)}
                </button>
              );
            })}
          </div>
        ) : null}
      </label>

      {selectedEmpty && otherMonthsWithData.length > 0 ? (
        <div className="rounded-md border border-amber-700/25 bg-amber-50/80 px-3 py-3 text-sm text-amber-950 dark:bg-amber-950/25 dark:text-amber-50">
          <p>
            {t("dashboard.wrongMonthBody", {
              months: otherMonthsWithData
                .map((m) => shortMonthLabel(m, locale))
                .join(", "),
              selected: monthLabel(month, locale),
            })}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {otherMonthsWithData.map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
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
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive"
          role="alert"
        >
          {t("dashboard.atRisk", {
            month: monthLabel(month, locale),
            days: status.daysLeft,
          })}
        </div>
      ) : null}

      <Card size="sm" className="overflow-hidden bg-card shadow-none">
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
              <CardDescription className="mt-1.5">
                {t("dashboard.daysLeft", { n: status.daysLeft })} ·{" "}
                {metByLabel(status.metBy)}
              </CardDescription>
            </div>
            <Badge
              variant={status.metBy !== "none" ? "default" : "secondary"}
              className="shrink-0"
            >
              {status.metBy !== "none"
                ? t("dashboard.metVia", { path: status.metBy })
                : t("dashboard.hrsLeft", { n: status.hoursRemaining })}
            </Badge>
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
            <Progress value={hoursPct} className="h-1.5" />
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
            <Progress value={earningsPct} className="h-1.5" />
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

      <div className="flex flex-col gap-2">
        <Button asChild className="h-11 w-full">
          <Link href="/upload">{t("dashboard.uploadMore")}</Link>
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full"
          onClick={onDownloadPdf}
          disabled={pdfBusy || items.length === 0}
        >
          {pdfBusy ? t("dashboard.buildingPdf") : t("dashboard.downloadPdf")}
        </Button>
      </div>

      <Card size="sm" className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.smsTitle")}</CardTitle>
          <CardDescription>{t("dashboard.smsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">
              {t("dashboard.smsPhone")}
            </span>
            <Input
              className="h-11 bg-card"
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

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            {t("dashboard.evidenceTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("dashboard.evidenceDesc")}
          </p>
        </div>

        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-card/60 px-3 py-6 text-center text-sm text-muted-foreground">
            {t("dashboard.noEvidence")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => {
              const rowMonth = primaryMonthForRow(item);
              const inView = rowMonth === month;
              return (
                <li key={item.id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => setMonthOverride(rowMonth)}
                    className={`min-w-0 flex-1 rounded-md border bg-card px-3 py-3 text-left text-sm transition-colors ${
                      inView
                        ? "border-foreground/25"
                        : "border-border hover:border-foreground/15"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.source}</p>
                        <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                          {item.type}
                          {item.userConfirmed
                            ? ""
                            : ` · ${t("dashboard.notConfirmed")}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {shortMonthLabel(rowMonth, locale)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                      {item.periodStart} → {item.periodEnd}
                      {item.hours !== undefined ? ` · ${item.hours} hrs` : ""}
                      {item.grossPay !== undefined
                        ? ` · $${item.grossPay}`
                        : ""}
                    </p>
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-auto min-h-11 w-11 shrink-0 self-stretch border-border"
                    aria-label={t("dashboard.deleteOne")}
                    title={t("dashboard.deleteOne")}
                    onClick={() => {
                      deleteEvidence(item.id);
                      refresh(t("dashboard.deletedOne"));
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 ? (
          <div className="pt-2">
            {!showDanger ? (
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setShowDanger(true)}
              >
                {t("dashboard.dataPrivacy")}
              </button>
            ) : (
              <div className="rounded-md border border-border bg-card px-3 py-3">
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.deleteHint")}
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  className="mt-3 h-10 w-full"
                  onClick={() => {
                    deleteAllEvidence();
                    setMonthOverride(null);
                    setShowDanger(false);
                    refresh(t("dashboard.deleted"));
                  }}
                >
                  {t("dashboard.deleteAll")}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading…
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
