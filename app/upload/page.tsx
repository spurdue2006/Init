"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
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

const emptySubscribe = () => () => {};

function useSecureContext(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.isSecureContext,
    () => true,
  );
}

export default function UploadPage() {
  const router = useRouter();
  const secure = useSecureContext();
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
    <AppShell title="Proof" headerRight="Step 1 of 2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Upload proof</h1>
        <p className="text-sm text-muted-foreground">
          Photos are read in memory and not saved on a server. Phones need HTTPS
          (or localhost) for the live camera.
        </p>
      </header>

      <Card size="sm" className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Document</CardTitle>
          <CardDescription>
            Take a photo or choose one from your library.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!secure ? (
            <div className="rounded-md border border-amber-700/25 bg-amber-50/80 px-3 py-3 text-sm text-amber-950">
              <p className="font-medium">Camera blocked on this URL</p>
              <p className="mt-1 text-amber-900/80">
                You’re on plain HTTP. Use <strong>Choose photo</strong>, or open
                an HTTPS / Vercel URL for <strong>Take photo</strong>.
              </p>
            </div>
          ) : null}

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
              onClick={() => {
                if (!secure) {
                  setError(
                    "Live camera needs HTTPS. Use Choose photo, or open the ngrok/Vercel HTTPS link on your phone.",
                  );
                  libraryRef.current?.click();
                  return;
                }
                cameraRef.current?.click();
              }}
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
              className="max-h-72 w-full rounded-md object-contain ring-1 ring-border"
            />
          ) : (
            <div className="flex h-44 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-[var(--page)] px-4 text-center text-sm text-muted-foreground">
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
        <CardFooter>
          <Button
            type="button"
            className="h-11 w-full text-base"
            onClick={onExtract}
            disabled={!file || loading}
          >
            {loading ? "Reading document…" : "Extract with Gemini"}
          </Button>
        </CardFooter>
      </Card>

      <p className="text-xs text-muted-foreground">
        Fake demo documents only. For live camera use HTTPS (ngrok / Vercel).
      </p>
    </AppShell>
  );
}
