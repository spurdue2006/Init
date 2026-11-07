import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { Evidence, MonthStatus } from "@/lib/types";

export type ProofPacketProps = {
  monthStatus: MonthStatus;
  evidence: Evidence[];
};

/**
 * Stub — Kanav builds the real proof-packet PDF later.
 * Signature is frozen so Shlok can import `<ProofPacket />` now.
 */
export function ProofPacket({ monthStatus, evidence }: ProofPacketProps) {
  void monthStatus;
  void evidence;

  return (
    <Document>
      <Page size="LETTER" style={{ padding: 40 }}>
        <View>
          <Text>80 Hours — Proof Packet (stub)</Text>
        </View>
      </Page>
    </Document>
  );
}
