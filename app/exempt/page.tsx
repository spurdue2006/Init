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

/**
 * Soft suggest-only quiz from RULES.md exemptions.
 * Never asserts “you are exempt.”
 */
const QUESTIONS = [
  {
    id: "caregiver_child",
    prompt: "Are you a parent or caregiver of a child age 13 or younger?",
  },
  {
    id: "caregiver_disability",
    prompt: "Do you care for a person with a disability?",
  },
  {
    id: "pregnant",
    prompt:
      "Are you pregnant, or has it been 12 months or less since a pregnancy ended?",
  },
  {
    id: "medical",
    prompt:
      "Do you have a serious health condition, disability, or are you in substance-use treatment? (FSSA decides “medically frail.”)",
  },
  {
    id: "other",
    prompt:
      "Might another FSSA category apply (foster care under 26, Tribe member, veteran with 100% disability, recent incarceration, or SNAP/TANF work rules)?",
  },
] as const;

type Answer = "yes" | "no" | null;

const FSSA_MEMBERS =
  "https://secure.in.gov/fssa/hip/hip-work-requirements/info-for-hip-members";
const FSSA_HUB = "https://www.in.gov/fssa/hip/hip-work-requirements/";
const BENEFITS_PORTAL = "https://FSSABenefits.IN.gov";

export default function ExemptPage() {
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
    <AppShell title="Exemption check">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Exemption check
        </h1>
        <p className="text-sm text-muted-foreground">
          Based on FSSA’s published list. This app only suggests you{" "}
          <strong>might</strong> want to check — it never decides exemption or
          eligibility.
        </p>
      </header>

      <Card size="sm" className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Short quiz</CardTitle>
          <CardDescription>
            Answer each question, then see a soft suggestion with official
            links.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {QUESTIONS.map((q, index) => (
            <fieldset key={q.id} className="flex flex-col gap-2">
              <legend className="text-sm font-medium">
                {index + 1}. {q.prompt}
              </legend>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 min-w-16"
                  variant={answers[q.id] === "yes" ? "default" : "outline"}
                  onClick={() => setAnswer(q.id, "yes")}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 min-w-16"
                  variant={answers[q.id] === "no" ? "default" : "outline"}
                  onClick={() => setAnswer(q.id, "no")}
                >
                  No
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
            See suggestion
          </Button>

          {submitted ? (
            <div className="rounded-md border border-border bg-[var(--page)] px-3 py-3 text-sm">
              {anyYes ? (
                <p>
                  Based on your answers, you <strong>may be exempt</strong> for
                  some months — but only FSSA can confirm. Use their official
                  tools below. This app does not determine exemption.
                </p>
              ) : (
                <p>
                  Nothing in this short quiz suggested an exemption. You may
                  still qualify under another FSSA category we didn’t cover.
                  Check the official pre-screener / member pages.
                </p>
              )}
              <ul className="mt-3 flex flex-col gap-2">
                <li>
                  <a
                    className="underline-offset-4 hover:underline"
                    href={FSSA_MEMBERS}
                    target="_blank"
                    rel="noreferrer"
                  >
                    FSSA information for HIP members
                  </a>
                </li>
                <li>
                  <a
                    className="underline-offset-4 hover:underline"
                    href={FSSA_HUB}
                    target="_blank"
                    rel="noreferrer"
                  >
                    HIP work requirements hub
                  </a>
                </li>
                <li>
                  <a
                    className="underline-offset-4 hover:underline"
                    href={BENEFITS_PORTAL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    FSSA Benefits Portal
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
