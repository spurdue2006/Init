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
import { mariaEvidence } from "@/lib/seed/maria";
import { listEvidence, replaceAllEvidence } from "@/lib/storage";

const emptySubscribe = () => () => {};

function HomeContent() {
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
    setTick((t) => t + 1);
    setDemoNote("Loaded Maria sample data (~62/80 hrs for Nov 2026). Fake data only.");
  }

  return (
    <AppShell title="Home">
      <header className="flex flex-col gap-2 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          HIP proof on your phone
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upload mixed evidence, confirm what was read, track the month toward
          80 hours or $580, then download a prep packet.
        </p>
      </header>

      {saved ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          Evidence saved on this device.
        </p>
      ) : null}

      {demoNote ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          {demoNote}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="h-12 w-full text-base">
          <Link href="/upload">
            {hasData ? "Upload more proof" : "Upload proof"}
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="secondary"
          className="h-12 w-full text-base"
        >
          <Link href="/dashboard">
            {hasData
              ? `Open progress (${items.length} item${items.length === 1 ? "" : "s"})`
              : "Open progress"}
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 w-full">
          <Link href="/exempt">Exemption check</Link>
        </Button>
      </div>

      {!hasData ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Try with sample data</CardTitle>
            <CardDescription>
              Optional for demos. Loads fake Maria evidence — never use real
              pay stubs here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full"
              onClick={onLoadMaria}
            >
              Load Maria sample
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
