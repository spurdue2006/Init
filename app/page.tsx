"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { mariaEvidence } from "@/lib/seed/maria";
import { listEvidence, replaceAllEvidence } from "@/lib/storage";

const emptySubscribe = () => () => {};

function HomeContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [tick, setTick] = useState(0);
  const [demoNote, setDemoNote] = useState<string | null>(null);
  const saved = searchParams.get("saved") === "1";

  void tick;
  const items = mounted ? listEvidence() : [];
  const hasData = items.length > 0;

  function onLoadMaria() {
    replaceAllEvidence(mariaEvidence);
    setTick((n) => n + 1);
    setDemoNote(t("home.mariaLoaded"));
  }

  const progressLabel = hasData
    ? items.length === 1
      ? t("home.openProgressWithCount", { count: items.length })
      : t("home.openProgressWithCount_plural", { count: items.length })
    : t("home.openDashboard");

  return (
    <AppShell title={t("nav.home")}>
      <header className="flex flex-col gap-2.5 pt-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("home.title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("home.subtitle")}
        </p>
      </header>

      {saved ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium">
          {t("home.saved")}
        </p>
      ) : null}

      {demoNote ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium">
          {demoNote}
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <Button asChild size="lg" className="h-12 w-full text-base font-semibold">
          <Link href="/upload">
            {hasData ? t("home.uploadMore") : t("nav.upload")}
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="secondary"
          className="h-12 w-full text-base font-semibold"
        >
          <Link href="/dashboard">{progressLabel}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 w-full font-semibold"
        >
          <Link href="/exempt">{t("nav.exempt")}</Link>
        </Button>
      </div>

      {!hasData ? (
        <Card size="sm" className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              {t("home.trySampleTitle")}
            </CardTitle>
            <CardDescription className="text-sm">
              {t("home.trySampleDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full font-semibold"
              onClick={onLoadMaria}
            >
              {t("home.loadMaria")}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </AppShell>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading…
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
