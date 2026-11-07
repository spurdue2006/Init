"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LanguageToggle, useI18n } from "@/lib/i18n";

const QUESTION_IDS = [
  "caregiver_child",
  "caregiver_disability",
  "pregnant",
  "medical",
  "other",
] as const;

type Answer = "yes" | "no" | null;

const FSSA_MEMBERS =
  "https://secure.in.gov/fssa/hip/hip-work-requirements/info-for-hip-members";
const FSSA_HUB = "https://www.in.gov/fssa/hip/hip-work-requirements/";
const BENEFITS_PORTAL = "https://FSSABenefits.IN.gov";

export default function ExemptPage() {
  const { t } = useI18n();
  const [answers, setAnswers] = useState<Record<string, Answer>>(
    Object.fromEntries(QUESTION_IDS.map((id) => [id, null])),
  );
  const [submitted, setSubmitted] = useState(false);

  const anyYes = useMemo(
    () => Object.values(answers).some((a) => a === "yes"),
    [answers],
  );

  const allAnswered = QUESTION_IDS.every((id) => answers[id] !== null);

  function setAnswer(id: string, value: Answer) {
    setSubmitted(false);
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("nav.backDashboard")}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("nav.home")}
          </Link>
          <LanguageToggle />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("exempt.title")}</CardTitle>
          <CardDescription>{t("exempt.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {QUESTION_IDS.map((id, index) => (
            <fieldset key={id} className="flex flex-col gap-2">
              <legend className="text-sm font-medium">
                {index + 1}. {t(`exempt.q_${id}`)}
              </legend>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={answers[id] === "yes" ? "default" : "outline"}
                  onClick={() => setAnswer(id, "yes")}
                >
                  {t("exempt.yes")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={answers[id] === "no" ? "default" : "outline"}
                  onClick={() => setAnswer(id, "no")}
                >
                  {t("exempt.no")}
                </Button>
              </div>
            </fieldset>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          <Button
            type="button"
            className="h-11 w-full"
            disabled={!allAnswered}
            onClick={() => setSubmitted(true)}
          >
            {t("exempt.seeSuggestion")}
          </Button>

          {submitted ? (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm">
              <p>{anyYes ? t("exempt.maybeExempt") : t("exempt.maybeNot")}</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li>
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href={FSSA_MEMBERS}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("exempt.linkMembers")}
                  </a>
                </li>
                <li>
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href={FSSA_HUB}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("exempt.linkHub")}
                  </a>
                </li>
                <li>
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href={BENEFITS_PORTAL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("exempt.linkPortal")}
                  </a>
                </li>
              </ul>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </main>
  );
}
