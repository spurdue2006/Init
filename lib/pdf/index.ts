/**
 * PDF proof packet for Shlok’s dashboard download (S7).
 *
 * Client download example:
 *   import { pdf } from "@react-pdf/renderer";
 *   import { ProofPacket } from "@/lib/pdf";
 *   const blob = await pdf(
 *     <ProofPacket monthStatus={status} evidence={rows} />,
 *   ).toBlob();
 */
export { ProofPacket, type ProofPacketProps } from "./ProofPacket";
