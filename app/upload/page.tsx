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
  const inputRef = useRef<HTMLInputElement>(null);
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
        <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
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
            Snap a paystub, gig earnings screen, or volunteer sheet. The photo
            is read in memory and not saved on a server.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />

          <Button
            type="button"
            size="lg"
            className="h-12 w-full text-base"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
          >
            {file ? "Retake / choose another" : "Open camera or photos"}
          </Button>

          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Selected proof document preview"
              className="max-h-72 w-full rounded-lg object-contain ring-1 ring-border"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Preview appears here
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
        Fake demo documents only. Never upload a real person’s pay stub.
      </p>
    </main>
  );
}
