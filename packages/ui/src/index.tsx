import type { Evidence } from "@gameagent/protocol";

export const evidenceLabels: Record<Evidence["evidence_class"], string> = {
  deterministic: "Deterministic",
  measured: "Measured",
  comparative: "Comparative",
  heuristic: "Heuristic",
  human: "Human",
};

export function EvidenceLabel({
  evidenceClass,
}: {
  evidenceClass: Evidence["evidence_class"];
}) {
  return <span className="ga-evidence">{evidenceLabels[evidenceClass]}</span>;
}
