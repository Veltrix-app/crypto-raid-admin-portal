import type {
  AdminSuccessAccountDetail,
  AdminSuccessAccountSummary,
} from "@/types/entities/success";

export async function fetchCurrentPortalAccountActivation() {
  const response = await fetch("/api/success/account/current", {
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        summary?: AdminSuccessAccountSummary;
        detail?: AdminSuccessAccountDetail;
        error?: string;
      }
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? "Failed to load account activation.");
  }

  return {
    summary: payload.summary ?? null,
    detail: payload.detail ?? null,
  };
}
