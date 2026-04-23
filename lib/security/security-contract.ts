import type {
  AdminSecurityAccountPolicy,
  AdminUserSecurityPosture,
} from "@/types/entities/security";

export const TWO_FACTOR_ENFORCED_ROLES = ["owner", "admin"] as const;

export function normalizeSecurityRole(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isRoleSubjectToTwoFactor(value: string | null | undefined) {
  const normalizedRole = normalizeSecurityRole(value);
  return TWO_FACTOR_ENFORCED_ROLES.includes(
    normalizedRole as (typeof TWO_FACTOR_ENFORCED_ROLES)[number]
  );
}

export function normalizeSecurityAuthMethod(value: string | null | undefined) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!normalized) {
    return "unknown" as const;
  }

  if (["sso", "saml", "oidc"].includes(normalized)) {
    return "sso" as const;
  }

  if (["password", "otp", "magiclink"].includes(normalized)) {
    return "password" as const;
  }

  return "unknown" as const;
}

export function derivePrimaryAuthMethodFromAmr(methods: string[]) {
  const normalizedMethods = methods.map((method) => normalizeSecurityAuthMethod(method));
  if (normalizedMethods.includes("sso")) {
    return "sso" as const;
  }

  if (normalizedMethods.includes("password")) {
    return "password" as const;
  }

  return "unknown" as const;
}

export function getAuthenticatorAssuranceRank(value: string | null | undefined) {
  return value === "aal2" ? 2 : 1;
}

export function derivePortalSecurityRequirements(params: {
  membershipRole?: string | null;
  policy: AdminSecurityAccountPolicy | null;
  userPosture: AdminUserSecurityPosture | null;
}) {
  const roleRequiresTwoFactor =
    Boolean(params.policy?.twoFactorRequiredForAdmins) &&
    isRoleSubjectToTwoFactor(params.membershipRole);
  const requiresSso = Boolean(params.policy?.ssoRequired);
  const currentAalRank = getAuthenticatorAssuranceRank(params.userPosture?.currentAal);
  const currentAuthMethod = params.userPosture?.currentAuthMethod ?? "unknown";
  const twoFactorSatisfied =
    currentAalRank >= 2 || Boolean(params.userPosture?.twoFactorEnabled && roleRequiresTwoFactor === false);
  const ssoSatisfied = !requiresSso || currentAuthMethod === "sso";

  return {
    roleRequiresTwoFactor,
    requiresTwoFactor: roleRequiresTwoFactor,
    requiresSso,
    twoFactorSatisfied,
    ssoSatisfied,
    blockedByTwoFactor: roleRequiresTwoFactor && !twoFactorSatisfied,
    blockedBySso: requiresSso && !ssoSatisfied,
  };
}

export function deriveWeakSecurityPosture(params: {
  policy: AdminSecurityAccountPolicy | null;
  ownersWithoutTwoFactor: number;
  adminsWithoutTwoFactor: number;
  activeSessionCount: number;
  ssoConnectionCount: number;
}) {
  if (!params.policy) {
    return true;
  }

  if (params.policy.ssoRequired && params.ssoConnectionCount === 0) {
    return true;
  }

  if (params.policy.twoFactorRequiredForAdmins) {
    return params.ownersWithoutTwoFactor > 0 || params.adminsWithoutTwoFactor > 0;
  }

  return params.activeSessionCount === 0;
}

export function formatSecurityLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value.replaceAll("_", " ");
}
