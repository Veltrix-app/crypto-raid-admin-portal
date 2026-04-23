export type AdminSecurityPolicyStatus = "standard" | "enterprise_hardened";

export type AdminSecurityAuthMethod = "password" | "sso";

export type AdminAuthenticatorAssuranceLevel = "aal1" | "aal2";

export type AdminRecoveryReviewState = "clear" | "watching" | "review_required";

export type AdminSecurityRiskPosture = "standard" | "watching" | "high_risk";

export type AdminSecurityEnforcementState =
  | "none"
  | "two_factor_required"
  | "sso_required"
  | "blocked";

export type AdminSecuritySessionStatus = "active" | "revoked" | "expired" | "challenged";

export type AdminSecuritySessionRiskLabel = "normal" | "watching" | "challenged";

export type AdminDataAccessRequestType = "export" | "delete";

export type AdminDataAccessRequestStatus =
  | "submitted"
  | "in_review"
  | "awaiting_verification"
  | "approved"
  | "rejected"
  | "completed";

export type AdminDataRequestVerificationState =
  | "pending"
  | "verified"
  | "rejected"
  | "not_needed";

export type AdminComplianceControlArea =
  | "identity"
  | "session_security"
  | "data_lifecycle"
  | "vendor_management"
  | "incident_response"
  | "backup_recovery"
  | "policy";

export type AdminComplianceControlState =
  | "implemented"
  | "monitoring"
  | "needs_work"
  | "planned";

export type AdminComplianceReviewState = "reviewed" | "attention_needed" | "scheduled";

export type AdminComplianceCadence = "monthly" | "quarterly" | "annual" | "ad_hoc";

export type AdminEvidenceType =
  | "note"
  | "document"
  | "link"
  | "drill"
  | "audit_log"
  | "screenshot";

export type AdminSecurityIncidentSeverity = "low" | "medium" | "high" | "critical";

export type AdminSecurityIncidentState =
  | "open"
  | "triaging"
  | "contained"
  | "monitoring"
  | "resolved"
  | "postmortem_due";

export type AdminSecurityIncidentEventVisibilityScope = "internal" | "public" | "both";

export type AdminSsoConnectionStatus = "draft" | "active" | "disabled";

export type AdminSsoDomainVerificationStatus = "unverified" | "verified" | "blocked";

export type AdminSubprocessorStatus = "active" | "planned" | "retired";

export type AdminSecurityAccountPolicy = {
  customerAccountId: string;
  policyStatus: AdminSecurityPolicyStatus;
  ssoRequired: boolean;
  twoFactorRequiredForAdmins: boolean;
  allowedAuthMethods: AdminSecurityAuthMethod[];
  sessionReviewRequired: boolean;
  highRiskReauthRequired: boolean;
  securityContactEmail: string;
  notes: string;
  reviewedByAuthUserId?: string;
  lastReviewedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityPolicyEvent = {
  id: string;
  customerAccountId: string;
  eventType:
    | "policy_created"
    | "policy_updated"
    | "sso_required_set"
    | "two_factor_enforced"
    | "session_review_enabled"
    | "data_request_reviewed"
    | "security_note_added";
  actorAuthUserId?: string;
  summary: string;
  eventPayload?: Record<string, unknown>;
  createdAt: string;
};

export type AdminUserSecurityPosture = {
  authUserId: string;
  primaryCustomerAccountId?: string;
  twoFactorEnabled: boolean;
  verifiedFactorCount: number;
  currentAal: AdminAuthenticatorAssuranceLevel;
  currentAuthMethod: AdminSecurityAuthMethod | "unknown";
  ssoManaged: boolean;
  recoveryReviewState: AdminRecoveryReviewState;
  riskPosture: AdminSecurityRiskPosture;
  enforcementState: AdminSecurityEnforcementState;
  lastPasswordRecoveryAt?: string;
  lastReauthenticationAt?: string;
  lastSecurityReviewAt?: string;
  lastSeenAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecuritySession = {
  id: string;
  sessionId: string;
  authUserId: string;
  customerAccountId?: string;
  email?: string;
  currentAal: AdminAuthenticatorAssuranceLevel;
  primaryAuthMethod: AdminSecurityAuthMethod | "unknown";
  amrMethods: string[];
  userAgent?: string;
  ipSummary?: string;
  locationSummary?: string;
  status: AdminSecuritySessionStatus;
  riskLabel: AdminSecuritySessionRiskLabel;
  lastSeenAt: string;
  revokedAt?: string;
  revokedByAuthUserId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminDataAccessRequest = {
  id: string;
  customerAccountId?: string;
  authUserId?: string;
  requestType: AdminDataAccessRequestType;
  status: AdminDataAccessRequestStatus;
  verificationState: AdminDataRequestVerificationState;
  requesterEmail: string;
  summary: string;
  reviewNotes: string;
  reviewedByAuthUserId?: string;
  approvedByAuthUserId?: string;
  completedByAuthUserId?: string;
  requestedAt: string;
  reviewedAt?: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminComplianceControl = {
  id: string;
  controlKey: string;
  title: string;
  summary: string;
  controlArea: AdminComplianceControlArea;
  controlState: AdminComplianceControlState;
  reviewState: AdminComplianceReviewState;
  ownerLabel: string;
  cadence: AdminComplianceCadence;
  evidenceSummary: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminComplianceEvidenceItem = {
  id: string;
  complianceControlId: string;
  evidenceType: AdminEvidenceType;
  title: string;
  summary: string;
  evidenceUrl?: string;
  createdByAuthUserId?: string;
  verifiedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityIncident = {
  id: string;
  incidentRef: string;
  customerAccountId?: string;
  title: string;
  severity: AdminSecurityIncidentSeverity;
  state: AdminSecurityIncidentState;
  scopeSummary: string;
  publicSummary: string;
  internalSummary: string;
  ownerAuthUserId?: string;
  declaredByAuthUserId?: string;
  openedAt: string;
  resolvedAt?: string;
  postmortemDueAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityIncidentEvent = {
  id: string;
  securityIncidentId: string;
  eventType:
    | "incident_opened"
    | "state_changed"
    | "internal_note"
    | "public_note"
    | "contained"
    | "resolved"
    | "postmortem_logged";
  visibilityScope: AdminSecurityIncidentEventVisibilityScope;
  actorAuthUserId?: string;
  title?: string;
  message: string;
  eventPayload?: Record<string, unknown>;
  createdAt: string;
};

export type AdminSsoConnection = {
  id: string;
  customerAccountId: string;
  providerLabel: string;
  providerType: "saml";
  supabaseProviderId?: string;
  status: AdminSsoConnectionStatus;
  configuredByAuthUserId?: string;
  enabledAt?: string;
  disabledAt?: string;
  lastTestedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminSsoDomain = {
  id: string;
  customerAccountId: string;
  ssoConnectionId: string;
  domain: string;
  isPrimary: boolean;
  verificationStatus: AdminSsoDomainVerificationStatus;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSubprocessor = {
  id: string;
  name: string;
  category: string;
  purpose: string;
  dataScope: string[];
  regionScope: string[];
  websiteUrl: string;
  status: AdminSubprocessorStatus;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AdminSecurityAccountSummary = {
  customerAccountId: string;
  accountName: string;
  policyStatus: AdminSecurityPolicyStatus;
  billingPlanId?: string;
  billingStatus?: string;
  ssoRequired: boolean;
  twoFactorRequiredForAdmins: boolean;
  teamMemberCount: number;
  ownersWithoutTwoFactor: number;
  adminsWithoutTwoFactor: number;
  activeSessionCount: number;
  openDataRequestCount: number;
  activeSecurityIncidentCount: number;
  weakPosture: boolean;
  policyLastReviewedAt?: string;
};

export type AdminSecurityOverview = {
  generatedAt: string;
  counts: {
    accounts: number;
    enterpriseHardenedAccounts: number;
    accountsRequiringSso: number;
    accountsRequiringTwoFactor: number;
    weakPostureAccounts: number;
    activeSessions: number;
    openDataRequests: number;
    activeSecurityIncidents: number;
    complianceControlsNeedingAttention: number;
  };
  queues: {
    weakPosture: AdminSecurityAccountSummary[];
    dataRequests: AdminDataAccessRequest[];
    securityIncidents: AdminSecurityIncident[];
    complianceAttention: AdminComplianceControl[];
  };
  accounts: AdminSecurityAccountSummary[];
  controls: AdminComplianceControl[];
  subprocessors: AdminSubprocessor[];
};

export type AdminSecurityAccountDetail = {
  account: AdminSecurityAccountSummary;
  policy: AdminSecurityAccountPolicy | null;
  members: Array<{
    authUserId: string;
    email: string;
    role: string;
    status: string;
    security: AdminUserSecurityPosture | null;
  }>;
  sessions: AdminSecuritySession[];
  requests: AdminDataAccessRequest[];
  policyEvents: AdminSecurityPolicyEvent[];
  incidents: AdminSecurityIncident[];
  ssoConnections: Array<
    AdminSsoConnection & {
      domains: AdminSsoDomain[];
    }
  >;
};

export type PortalSecurityCurrentAccount = {
  customerAccountId?: string;
  accountName?: string;
  membershipRole?: string;
  policy: AdminSecurityAccountPolicy | null;
  userPosture: AdminUserSecurityPosture | null;
  sessions: AdminSecuritySession[];
  requests: AdminDataAccessRequest[];
  ssoConnections: Array<
    AdminSsoConnection & {
      domains: AdminSsoDomain[];
    }
  >;
  requiresTwoFactor: boolean;
  requiresSso: boolean;
};
