"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveDraftEvidence } from "@/lib/draft";
import type { Evidence } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(next: File | null) {
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
  }

  async function onExtract() {
    if (!file) {
      setError("Take or choose a photo first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("image", file);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

      let res: Response;
      try {
        res = await fetch("/api/extract", {
          method: "POST",
          body,
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      const data = (await res.json()) as {
        evidence?: Evidence;
        error?: string;
      };

      if (!res.ok || !data.evidence) {
        throw new Error(data.error || "Extract failed");
      }

      saveDraftEvidence(data.evidence);
      router.push("/confirm");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Extract timed out. Try again — free-tier Gemini can be slow.");
      } else {
        setError(err instanceof Error ? err.message : "Extract failed");
      }
    } finally {
      setLoading(false);
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
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Step 1 of 2
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload proof</CardTitle>
          <CardDescription>
            On a phone, use <strong>Take photo</strong> to open the rear camera.
            Photos are read in memory and not saved on a server.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* capture=environment → rear camera on most phones */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              onFileChange(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          {/* no capture → photo library / Files */}
          <input
            ref={libraryRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              onFileChange(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              size="lg"
              className="h-12 w-full text-base"
              onClick={() => cameraRef.current?.click()}
              disabled={loading}
            >
              Take photo
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="h-12 w-full text-base"
              onClick={() => libraryRef.current?.click()}
              disabled={loading}
            >
              Choose photo
            </Button>
          </div>

          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Selected proof document preview"
              className="max-h-72 w-full rounded-lg object-contain ring-1 ring-border"
            />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
              <span>Preview appears here</span>
              <span className="text-xs">
                Allow camera access when the phone asks
              </span>
            </div>
          )}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="h-11 w-full flex-1 text-base"
            onClick={onExtract}
            disabled={!file || loading}
          >
            {loading ? "Reading document…" : "Extract with Gemini"}
          </Button>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Open this site on your phone (same Wi‑Fi) using the Network URL from{" "}
        <code className="rounded bg-muted px-1">npm run dev</code>, e.g.{" "}
        <code className="rounded bg-muted px-1">http://192.168.x.x:3000</code>.
        Fake demo documents only.
      </p>
    </main>
  );
}
