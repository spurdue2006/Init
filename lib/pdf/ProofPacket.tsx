import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Evidence, MetBy, MonthStatus } from "@/lib/types";

export type ProofPacketProps = {
  monthStatus: MonthStatus;
  evidence: Evidence[];
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 16,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 120,
    color: "#444",
  },
  value: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    paddingBottom: 4,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 3,
  },
  colSource: { width: "22%" },
  colType: { width: "12%" },
  colPeriod: { width: "28%" },
  colHours: { width: "10%" },
  colPay: { width: "14%" },
  colConfirmed: { width: "14%" },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#999",
    fontSize: 8,
    lineHeight: 1.4,
    color: "#333",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#666",
  },
});

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

function ruleMetCopy(metBy: MetBy): string {
  switch (metBy) {
    case "hours":
      return "Month requirement appears met via the 80-hour activity pathway (based on confirmed evidence in this packet).";
    case "earnings":
      return "Month requirement appears met via the $580 earnings pathway (based on confirmed evidence in this packet).";
    case "school":
      return "Month requirement appears met via half-time school / apprenticeship evidence (based on confirmed evidence in this packet).";
    case "none":
      return "Month requirement does not appear met yet from confirmed evidence in this packet (neither 80 hours, $580 earnings, nor school).";
  }
}

function cell(value: string | number | undefined): string {
  if (value === undefined || value === "") return "—";
  return String(value);
}

/**
 * Proof packet PDF for a single calendar month.
 * Shlok: download with `pdf(<ProofPacket ... />).toBlob()` from `@react-pdf/renderer`.
 */
export function ProofPacket({ monthStatus, evidence }: ProofPacketProps) {
  const sorted = [...evidence].sort((a, b) =>
    a.periodStart.localeCompare(b.periodStart),
  );

  return (
    <Document
      title={`80 Hours Proof Packet — ${monthStatus.month}`}
      author="80 Hours"
      subject="HIP work-requirement evidence preparation packet"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>80 Hours — Proof Packet</Text>
        <Text style={styles.subtitle}>
          Month {monthStatus.month} · Prepared for FSSA Benefits Portal reporting
          (unofficial)
        </Text>

        <Text style={styles.sectionTitle}>Month summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Qualifying hours</Text>
          <Text style={styles.value}>{monthStatus.hours.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Gross earnings</Text>
          <Text style={styles.value}>{formatMoney(monthStatus.earnings)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Hours remaining</Text>
          <Text style={styles.value}>
            {monthStatus.hoursRemaining.toFixed(2)} (of 80)
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Days left in month</Text>
          <Text style={styles.value}>{monthStatus.daysLeft}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>At risk</Text>
          <Text style={styles.value}>{monthStatus.atRisk ? "Yes" : "No"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>metBy</Text>
          <Text style={styles.value}>{monthStatus.metBy}</Text>
        </View>

        <Text style={styles.sectionTitle}>Rule met</Text>
        <Text>{ruleMetCopy(monthStatus.metBy)}</Text>

        <Text style={styles.sectionTitle}>Evidence</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colSource}>Source</Text>
          <Text style={styles.colType}>Type</Text>
          <Text style={styles.colPeriod}>Period</Text>
          <Text style={styles.colHours}>Hours</Text>
          <Text style={styles.colPay}>Gross</Text>
          <Text style={styles.colConfirmed}>Confirmed</Text>
        </View>
        {sorted.length === 0 ? (
          <Text>No evidence rows in this packet.</Text>
        ) : (
          sorted.map((row) => (
            <View key={row.id} style={styles.tableRow} wrap={false}>
              <Text style={styles.colSource}>{row.source}</Text>
              <Text style={styles.colType}>{row.type}</Text>
              <Text style={styles.colPeriod}>
                {row.periodStart} → {row.periodEnd}
              </Text>
              <Text style={styles.colHours}>{cell(row.hours)}</Text>
              <Text style={styles.colPay}>
                {row.grossPay === undefined ? "—" : formatMoney(row.grossPay)}
              </Text>
              <Text style={styles.colConfirmed}>
                {row.userConfirmed ? "Yes" : "No"}
              </Text>
            </View>
          ))
        )}

        <View style={styles.disclaimer}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
            Disclaimer
          </Text>
          <Text>
            80 Hours is not an official FSSA or Indiana Medicaid tool. This PDF
            only helps you organize evidence toward HIP work requirements (80
            hours, $580 earnings, or half-time school/apprenticeship). It does
            not determine eligibility, exemptions, or compliance. Always confirm
            status and report through official FSSA channels (Benefits Portal:
            FSSABenefits.IN.gov). Never upload real pay stubs into demos or
            shared fixtures.
          </Text>
        </View>

        <Text style={styles.footer} fixed>
          Generated by 80 Hours · unofficial prep packet · {monthStatus.month}
        </Text>
      </Page>
    </Document>
  );
}
