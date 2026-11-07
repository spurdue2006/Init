"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

export type Locale = "en" | "es";

type Dict = typeof en;

const DICTS: Record<Locale, Dict> = { en, es };
const STORAGE_KEY = "eighty-hours:locale";
const emptySubscribe = () => () => {};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(dict: Dict, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur === null || typeof cur !== "object" || !(part in cur)) {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

function format(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`,
  );
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [override, setOverride] = useState<Locale | null>(null);
  const locale: Locale = override ?? (mounted ? readStoredLocale() : "en");

  const setLocale = useCallback((next: Locale) => {
    setOverride(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const fromLocale = getByPath(DICTS[locale], path);
      const fallback = getByPath(DICTS.en, path);
      return format(fromLocale ?? fallback ?? path, vars);
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return ctx;
}

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      className={className}
      role="group"
      aria-label={t("lang.label")}
    >
      <div className="inline-flex rounded-lg border border-border p-0.5">
        <Button
          type="button"
          size="xs"
          variant={locale === "en" ? "default" : "ghost"}
          className="min-w-9"
          onClick={() => setLocale("en")}
        >
          {t("lang.en")}
        </Button>
        <Button
          type="button"
          size="xs"
          variant={locale === "es" ? "default" : "ghost"}
          className="min-w-9"
          onClick={() => setLocale("es")}
        >
          {t("lang.es")}
        </Button>
      </div>
    </div>
  );
}
