import { EvidenceLabel } from "@gameagent/ui";

export default function Foundation() {
  return (
    <main>
      <h1>Game Agent Network</h1>
      <p>Phase 0: shared UI foundation.</p>
      <p>
        This page validates package imports, semantic tokens, and evidence
        labels. Project loading and production controls begin in later phases.
      </p>
      <h2>Evidence vocabulary</h2>
      <ul>
        {(
          [
            "deterministic",
            "measured",
            "comparative",
            "heuristic",
            "human",
          ] as const
        ).map((kind) => (
          <li key={kind}>
            <EvidenceLabel evidenceClass={kind} />
          </li>
        ))}
      </ul>
    </main>
  );
}
