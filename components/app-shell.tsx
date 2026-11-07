"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  /** Optional page title shown under the brand in the header. */
  title?: string;
  /** Optional right-side header slot (e.g. step indicator). */
  headerRight?: ReactNode;
  className?: string;
};

export function AppShell({
  children,
  title,
  headerRight,
  className,
}: AppShellProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const nav = [
    { href: "/", label: t("nav.home") },
    { href: "/upload", label: t("nav.proof") },
    { href: "/dashboard", label: t("nav.progress") },
  ] as const;

  const showPageTitle = Boolean(title) && title !== t("nav.home");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--page)]">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-foreground"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold tracking-tight text-primary-foreground"
                aria-hidden
              >
                80
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold tracking-tight">
                  {t("brand")}
                </span>
                {showPageTitle ? (
                  <span className="block truncate text-xs font-medium text-muted-foreground">
                    {title}
                  </span>
                ) : null}
              </span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerRight ? (
              <div className="text-xs font-medium text-muted-foreground">
                {headerRight}
              </div>
            ) : null}
            <LanguageToggle />
          </div>
        </div>
        <nav
          aria-label="Main"
          className="mx-auto flex w-full max-w-lg gap-1 px-4 pb-2.5"
        >
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 rounded-md px-3 py-2.5 text-center text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main
        className={cn(
          "mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6",
          className,
        )}
      >
        {children}
      </main>

      <footer className="mx-auto w-full max-w-lg px-4 pb-8 pt-2">
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t("shell.disclaimer")}
        </p>
      </footer>
    </div>
  );
}
