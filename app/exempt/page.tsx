"use client";

import { useMemo, useState } from "react";
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
import { useI18n } from "@/lib/i18n";

/**
 * Soft suggest-only quiz from RULES.md exemptions.
 * Never asserts “you are exempt.”
 */
const QUESTIONS = [
  { id: "caregiver_child", key: "exempt.q_caregiver_child" },
  { id: "caregiver_disability", key: "exempt.q_caregiver_disability" },
  { id: "pregnant", key: "exempt.q_pregnant" },
  { id: "medical", key: "exempt.q_medical" },
  { id: "other", key: "exempt.q_other" },
] as const;

type Answer = "yes" | "no" | null;

const FSSA_MEMBERS =
  "https://secure.in.gov/fssa/hip/hip-work-requirements/info-for-hip-members";
const FSSA_HUB = "https://www.in.gov/fssa/hip/hip-work-requirements/";
const BENEFITS_PORTAL = "https://FSSABenefits.IN.gov";

export default function ExemptPage() {
  const { t } = useI18n();
  const [answers, setAnswers] = useState<Record<string, Answer>>(
    Object.fromEntries(QUESTIONS.map((q) => [q.id, null])),
  );
  const [submitted, setSubmitted] = useState(false);

  const anyYes = useMemo(
    () => Object.values(answers).some((a) => a === "yes"),
    [answers],
  );

  const allAnswered = QUESTIONS.every((q) => answers[q.id] !== null);

  function setAnswer(id: string, value: Answer) {
    setSubmitted(false);
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <AppShell title={t("exempt.title")}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("exempt.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("exempt.description")}</p>
      </header>

      <Card size="sm" className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">{t("exempt.quizTitle")}</CardTitle>
          <CardDescription>{t("exempt.quizDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {QUESTIONS.map((q, index) => (
            <fieldset key={q.id} className="flex flex-col gap-2">
              <legend className="text-sm font-medium">
                {index + 1}. {t(q.key)}
              </legend>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 min-w-16"
                  variant={answers[q.id] === "yes" ? "default" : "outline"}
                  onClick={() => setAnswer(q.id, "yes")}
                >
                  {t("exempt.yes")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 min-w-16"
                  variant={answers[q.id] === "no" ? "default" : "outline"}
                  onClick={() => setAnswer(q.id, "no")}
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
            <div className="rounded-md border border-border bg-[var(--page)] px-3 py-3 text-sm">
              <p>{anyYes ? t("exempt.maybeExempt") : t("exempt.maybeNot")}</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li>
                  <a
                    className="underline-offset-4 hover:underline"
                    href={FSSA_MEMBERS}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("exempt.linkMembers")}
                  </a>
                </li>
                <li>
                  <a
                    className="underline-offset-4 hover:underline"
                    href={FSSA_HUB}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("exempt.linkHub")}
                  </a>
                </li>
                <li>
                  <a
                    className="underline-offset-4 hover:underline"
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
    </AppShell>
  );
}
