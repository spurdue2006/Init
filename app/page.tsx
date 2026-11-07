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
import { deleteAllEvidence, listEvidence } from "@/lib/storage";

const emptySubscribe = () => () => {};

function HomeContent() {
  const searchParams = useSearchParams();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [tick, setTick] = useState(0);
  const saved = searchParams.get("saved") === "1";

  const items = mounted ? listEvidence() : [];
  void tick;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          80 Hours
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          HIP proof on your phone
        </h1>
        <p className="text-muted-foreground">
          Snap mixed evidence, confirm what AI read, track the month, download a
          prep packet.
        </p>
      </header>

      {saved ? (
        <p className="rounded-lg bg-secondary px-3 py-2 text-center text-sm text-secondary-foreground">
          Evidence saved on this device.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button asChild size="lg" className="h-12 w-full text-base">
          <Link href="/upload">Upload proof</Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-12 w-full text-base">
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 w-full">
          <Link href="/exempt">Exemption check</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved on this device</CardTitle>
          <CardDescription>
            {items.length === 0
              ? "Nothing saved yet."
              : `${items.length} evidence item${items.length === 1 ? "" : "s"}`}
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
                {item.userConfirmed ? " · confirmed" : " · draft"}
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
                setTick((t) => t + 1);
              }}
            >
              Delete all my data
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Not an official FSSA tool. We never say you are exempt or will keep
        coverage.
      </p>
    </main>
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
