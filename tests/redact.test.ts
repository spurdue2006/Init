import { describe, expect, it } from "vitest";
import {
  containsSensitiveDigits,
  redactEvidence,
  redactText,
} from "@/lib/redact";

describe("redactText", () => {
  it("redacts dashed SSNs", () => {
    expect(redactText("SSN 123-45-6789 on file")).toBe(
      "SSN [REDACTED] on file",
    );
  });

  it("redacts compact SSNs", () => {
    expect(redactText("ssn:123456789")).toBe("ssn:[REDACTED]");
  });

  it("redacts long account numbers", () => {
    expect(redactText("Acct 123456789012")).toBe("Acct [REDACTED]");
  });

  it("leaves short numeric values alone", () => {
    expect(redactText("Worked 40 hours, zip 46204")).toBe(
      "Worked 40 hours, zip 46204",
    );
  });
});

describe("containsSensitiveDigits", () => {
  it("detects remaining SSN-shaped digits", () => {
    expect(containsSensitiveDigits("123-45-6789")).toBe(true);
    expect(containsSensitiveDigits("hours: 32")).toBe(false);
  });
});

describe("redactEvidence", () => {
  it("scrubs source and notes", () => {
    const result = redactEvidence({
      source: "Acme — SSN 111-22-3333",
      notes: "Direct deposit ****999988887777",
    });
    expect(result.source).toBe("Acme — SSN [REDACTED]");
    expect(result.notes).toBe("Direct deposit ****[REDACTED]");
    expect(containsSensitiveDigits(result.source)).toBe(false);
  });
});
