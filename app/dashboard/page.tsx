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
import type { MetBy, MonthStatus } from "@/lib/types";

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

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function metByLabel(metBy: MetBy): string {
  switch (metBy) {
    case "hours":
      return "Hours path (80+)";
    case "earnings":
      return "Earnings path ($580+)";
    case "school":
      return "School / apprenticeship (half-time)";
    default:
      return "Not yet met for this month";
  }
}

function DashboardContent() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [tick, setTick] = useState(0);
  // Default to Maria demo month so SSR never reads the system clock.
  const [month, setMonth] = useState("2026-11");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  void tick;
  const items = mounted ? listEvidence() : [];
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

  function refresh(note?: string) {
    setTick((t) => t + 1);
    setError(null);
    setMessage(note ?? null);
  }

  function onLoadMaria() {
    replaceAllEvidence(mariaEvidence);
    setMonth("2026-11");
    refresh("Loaded Maria demo (~62/80 hrs for November 2026). Fake data only.");
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
      setMessage(
        "Proof packet downloaded. Prep aid only — not an official filing.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Home
        </Link>
        <Link
          href="/exempt"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Exemption check
        </Link>
      </div>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Progress toward HIP’s 80 hours or $580 for the month you select. Soft
          estimate only — confirm with FSSA.
        </p>
      </header>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Month</span>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </label>

      {status.atRisk ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          At risk for {monthLabel(month)}: pathway not met yet and only{" "}
          {status.daysLeft} day{status.daysLeft === 1 ? "" : "s"} left. This is
          not an official determination.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>
                {status.hours}/{HOURS_THRESHOLD} hrs · {monthLabel(month)}
              </CardTitle>
              <CardDescription>
                {status.daysLeft} day{status.daysLeft === 1 ? "" : "s"} left ·{" "}
                {metByLabel(status.metBy)}
              </CardDescription>
            </div>
            {status.metBy !== "none" ? (
              <Badge>Path: {status.metBy}</Badge>
            ) : (
              <Badge variant="secondary">{status.hoursRemaining} hrs left</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Hours</span>
              <span>
                {status.hours} / {HOURS_THRESHOLD}
              </span>
            </div>
            <Progress value={hoursPct} className="h-2" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Earnings</span>
              <span>
                ${status.earnings} / ${EARNINGS_THRESHOLD}
              </span>
            </div>
            <Progress value={earningsPct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full"
          onClick={onLoadMaria}
        >
          Load Maria demo
        </Button>
        <Button
          type="button"
          className="h-11 w-full"
          onClick={onDownloadPdf}
          disabled={pdfBusy || items.length === 0}
        >
          {pdfBusy ? "Building PDF…" : "Download PDF"}
        </Button>
      </div>

      <Button asChild variant="outline" className="h-11 w-full">
        <Link href="/upload">Upload more proof</Link>
      </Button>

      {message ? (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
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
          <CardTitle>Evidence this device</CardTitle>
          <CardDescription>
            Only confirmed rows count toward the month total.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No evidence yet. Upload a document or load Maria.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <p className="font-medium">
                  {item.source}{" "}
                  <span className="text-muted-foreground">({item.type})</span>
                </p>
                <p className="text-muted-foreground">
                  {item.periodStart} → {item.periodEnd}
                  {item.hours !== undefined ? ` · ${item.hours} hrs` : ""}
                  {item.grossPay !== undefined ? ` · $${item.grossPay}` : ""}
                  {item.userConfirmed ? " · confirmed" : " · not confirmed"}
                </p>
              </div>
            ))
          )}

          {items.length > 0 ? (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => {
                deleteAllEvidence();
                refresh("All local evidence deleted.");
              }}
            >
              Delete all my data
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Not an official FSSA tool. PDF packets help you prepare to report — they
        are not filings.
      </p>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading dashboard…
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
