"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import { deleteAllEvidence, listEvidence } from "@/lib/storage";

const emptySubscribe = () => () => {};

function HomeContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [tick, setTick] = useState(0);
  const saved = searchParams.get("saved") === "1";

  const items = mounted ? listEvidence() : [];
  void tick;

  const countLabel =
    items.length === 1
      ? t("home.evidenceCount", { count: items.length })
      : t("home.evidenceCount_plural", { count: items.length });

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex justify-end">
        <LanguageToggle />
      </div>

      <header className="flex flex-col gap-2 text-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {t("brand")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("home.title")}
        </h1>
        <p className="text-muted-foreground">{t("home.subtitle")}</p>
      </header>

      {saved ? (
        <p className="rounded-lg bg-secondary px-3 py-2 text-center text-sm text-secondary-foreground">
          {t("home.saved")}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="h-12 w-full text-base">
          <Link href="/upload">{t("nav.upload")}</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="secondary"
          className="h-12 w-full text-base"
        >
          <Link href="/dashboard">{t("home.openDashboard")}</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 w-full">
          <Link href="/exempt">{t("nav.exempt")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("home.savedTitle")}</CardTitle>
          <CardDescription>
            {items.length === 0 ? t("home.nothingSaved") : countLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border px-3 py-2 text-left text-sm"
            >
              <p className="font-medium">
                {item.source}{" "}
                <span className="text-muted-foreground">({item.type})</span>
              </p>
              <p className="text-muted-foreground">
                {item.periodStart} → {item.periodEnd}
                {item.hours !== undefined ? ` · ${item.hours} hrs` : ""}
                {item.grossPay !== undefined ? ` · $${item.grossPay}` : ""}
                {item.userConfirmed
                  ? ` · ${t("home.confirmed")}`
                  : ` · ${t("home.draft")}`}
              </p>
            </div>
          ))}

          {items.length > 0 ? (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => {
                deleteAllEvidence();
                setTick((n) => n + 1);
              }}
            >
              {t("home.deleteAll")}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        {t("home.disclaimer")}
      </p>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          …
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
