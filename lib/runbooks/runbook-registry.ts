export type RunbookEntry = {
  key: string;
  title: string;
  summary: string;
  surface: "overview" | "claims" | "moderation" | "onchain" | "community" | "deploy";
  href: string;
  docPath: string;
  checklist: string[];
};

export const RUNBOOK_REGISTRY: RunbookEntry[] = [
  {
    key: "launch-day",
    title: "Launch day posture",
    summary: "Use this when a project is about to go live and every critical rail needs one fast scan.",
    surface: "overview",
    href: "/overview",
    docPath: "docs/superpowers/specs/2026-04-21-operator-runbooks.md",
    checklist: [
      "Confirm Overview snapshot freshness and provider health before pushing traffic.",
      "Open Launch Workspace and Community OS for the active project.",
      "Clear any critical escalations, active overrides or payout blockers first.",
    ],
  },
  {
    key: "claims-recovery",
    title: "Claims and payout recovery",
    summary: "Use this when blocked claims, delivery failures or reward pressure need a named recovery owner.",
    surface: "claims",
    href: "/claims",
    docPath: "docs/superpowers/specs/2026-04-21-operator-runbooks.md",
    checklist: [
      "Open Claims and inspect payout cases, incidents and overrides together.",
      "Move repeated failures into a support escalation with the next action recorded.",
      "Retry or pause only the project-safe rail you are actively stabilizing.",
    ],
  },
  {
    key: "trust-surge",
    title: "Trust and moderation surge",
    summary: "Use this when proof review, suspicious members or callback noise start repeating across one project.",
    surface: "moderation",
    href: "/moderation",
    docPath: "docs/superpowers/specs/2026-04-21-operator-runbooks.md",
    checklist: [
      "Open Moderation and confirm whether trust cases or pipeline incidents are actually driving the pressure.",
      "Request project input explicitly when trust work is blocked on a project decision.",
      "Capture the owner and waiting state in the support escalation rail instead of losing context in comments.",
    ],
  },
  {
    key: "onchain-recovery",
    title: "On-chain recovery",
    summary: "Use this when ingest, enrichment or provider sync failures start repeating or blocking project delivery.",
    surface: "onchain",
    href: "/onchain",
    docPath: "docs/superpowers/specs/2026-04-21-operator-runbooks.md",
    checklist: [
      "Open On-chain and separate failures from suspicious signal work.",
      "Queue only project-safe retries, rescans and enrichment reruns unless a full operator intervention is required.",
      "Escalate repeated provider or deploy blockers so Overview keeps them visible.",
    ],
  },
  {
    key: "community-drift",
    title: "Community automation drift",
    summary: "Use this when commands, automations or captain execution quality start slipping before or during launch.",
    surface: "community",
    href: "/projects",
    docPath: "docs/superpowers/specs/2026-04-21-operator-runbooks.md",
    checklist: [
      "Open the relevant project's Community OS and confirm automation, captain and command readiness.",
      "Check whether the issue belongs in Community, Claims or On-chain before retrying blindly.",
      "Record named ownership if the same community failure crosses more than one surface.",
    ],
  },
  {
    key: "deploy-hygiene",
    title: "Deploy and environment hygiene",
    summary: "Use this before major launches, after config changes, or when a healthy queue suddenly stops updating.",
    surface: "deploy",
    href: "/overview",
    docPath: "docs/superpowers/specs/2026-04-21-deploy-hygiene-checklist.md",
    checklist: [
      "Verify Supabase public and service-role keys on the portal deployment.",
      "Confirm bot URLs, webhook secrets and member deep-link bases are configured.",
      "Redeploy the exact surface that owns the failing runtime after config changes.",
    ],
  },
];

export function listRunbooks(surface?: RunbookEntry["surface"]) {
  if (!surface) {
    return RUNBOOK_REGISTRY;
  }
  return RUNBOOK_REGISTRY.filter((entry) => entry.surface === surface);
}
