export type CapabilityScenario = "overview" | "pageDenied" | "actionDenied" | "revocation";

export function createCapabilityFixture(scenario: CapabilityScenario) {
  let pageAllowed = scenario !== "pageDenied";
  let approveAllowed = scenario !== "actionDenied";
  let revision = 1;
  let writes = 0;
  let rejections = 0;
  let approved = false;

  return {
    snapshot: () => ({ pageAllowed, approveAllowed, revision, writes, rejections, approved }),
    revoke() {
      approveAllowed = false;
      revision += 1;
    },
    revokePage() {
      pageAllowed = false;
      approveAllowed = false;
      revision += 1;
    },
    approve() {
      // This private server stand-in checks its own live state, independently of UI guards.
      if (!pageAllowed || !approveAllowed) {
        rejections += 1;
        throw new Error("FORBIDDEN");
      }
      writes += 1;
      approved = true;
      approveAllowed = false;
      revision += 1;
    },
  };
}
