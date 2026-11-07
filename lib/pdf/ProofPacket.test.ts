import { describe, expect, it } from "vitest";
import { computeMonthStatus } from "@/lib/rules";
import { mariaEvidence } from "@/lib/seed/maria";
import type { ProofPacketProps } from "@/lib/pdf";

describe("ProofPacket contract", () => {
  it("accepts MonthStatus + Evidence props shaped for Shlok download", () => {
    const monthStatus = computeMonthStatus(
      mariaEvidence,
      "2026-11",
      new Date(2026, 10, 7),
    );

    const props: ProofPacketProps = {
      monthStatus,
      evidence: mariaEvidence,
    };

    expect(props.monthStatus.hours).toBe(62);
    expect(props.evidence).toHaveLength(3);
    expect(props.monthStatus.metBy).toBe("none");
  });
});
