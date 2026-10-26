// Synthetic observations for isolated tests only; never consumer acceptance.
import { createHash } from "node:crypto";
import { completionPhases } from "../scripts/completion.mjs";

export function fullCompletionInput(
  sourceCommit,
  repository = "example/consumer",
) {
  const deployment = (url) => ({
    url,
    runUrl: `https://github.com/${repository}/actions/runs/1`,
    sourceCommit,
    frontend: `ghcr.io/${repository}-frontend@sha256:${"a".repeat(64)}`,
    backend: `ghcr.io/${repository}-backend@sha256:${"b".repeat(64)}`,
  });
  return {
    sourceCommit,
    phases: Object.fromEntries(
      Object.entries(completionPhases).map(([id, checks]) => [
        id,
        {
          status: "passed",
          evidence: Object.fromEntries(
            checks.map((check) => [check, `private:${id}-${check}`]),
          ),
        },
      ]),
    ),
    deployments: {
      staging: deployment("https://staging.example.test"),
      production: deployment("https://app.example.test"),
    },
    recovery: {
      initialized: true,
      isolated: true,
      backupSha256: "c".repeat(64),
      retrievedSha256: "c".repeat(64),
      restoredSha256: "c".repeat(64),
    },
  };
}

export function fullCompletionReceipt(
  sourceCommit = "1".repeat(40),
  repository = "example/consumer",
) {
  const receipt = {
    schemaVersion: 1,
    repository,
    scope: "full",
    ...fullCompletionInput(sourceCommit, repository),
    intake: { revision: 2, digest: "d".repeat(64) },
    completedAt: "2026-10-26T00:00:00.000Z",
    digest: null,
  };
  const stable = JSON.stringify(receipt, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
        )
      : item,
  );
  receipt.digest = createHash("sha256").update(stable).digest("hex");
  return receipt;
}
