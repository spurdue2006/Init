"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
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
import { LanguageToggle, useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
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
      setError(t("upload.needPhoto"));
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
        setError(t("upload.timeout"));
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
          {t("nav.backHome")}
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {t("upload.step")}
          </p>
          <LanguageToggle />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("upload.title")}</CardTitle>
          <CardDescription>{t("upload.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!secure ? (
            <div className="rounded-xl border border-amber-600/30 bg-amber-50 px-3 py-3 text-sm text-amber-950">
              <p className="font-medium">{t("upload.httpsBlockedTitle")}</p>
              <p className="mt-1 text-amber-900/80">
                {t("upload.httpsBlockedBody")}
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
                  setError(t("upload.httpsNeed"));
                  libraryRef.current?.click();
                  return;
                }
                cameraRef.current?.click();
              }}
              disabled={loading}
            >
              {t("upload.takePhoto")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="h-12 w-full text-base"
              onClick={() => libraryRef.current?.click()}
              disabled={loading}
            >
              {t("upload.choosePhoto")}
            </Button>
          </div>

          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="max-h-72 w-full rounded-lg object-contain ring-1 ring-border"
            />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
              <span>{t("upload.preview")}</span>
              <span className="text-xs">{t("upload.allowCamera")}</span>
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
            {loading ? t("upload.extracting") : t("upload.extract")}
          </Button>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        {t("upload.footer")}
      </p>
    </main>
  );
}
