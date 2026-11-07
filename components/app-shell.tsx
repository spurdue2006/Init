"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/upload", label: "Proof" },
  { href: "/dashboard", label: "Progress" },
] as const;

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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--page)]">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-[var(--page)]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              80 Hours
            </Link>
            {title ? (
              <p className="truncate text-xs text-muted-foreground">{title}</p>
            ) : null}
          </div>
          {headerRight ? (
            <div className="shrink-0 text-xs text-muted-foreground">
              {headerRight}
            </div>
          ) : null}
        </div>
        <nav
          aria-label="Main"
          className="mx-auto flex w-full max-w-lg gap-1 px-4 pb-2"
        >
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-center text-sm transition-colors",
                  active
                    ? "bg-foreground text-background"
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
          Not an official FSSA tool. Estimates only — confirm status and report
          through FSSA. PDF packets help you prepare; they are not filings.
        </p>
      </footer>
    </div>
  );
}
