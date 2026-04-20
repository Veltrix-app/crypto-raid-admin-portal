"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ProjectOperationAuditRecord,
  ProjectOperationIncidentRecord,
  ProjectOperationIncidentStatus,
  ProjectOperationObjectType,
  ProjectOperationOverrideRecord,
  ProjectOperationOverrideStatus,
  ProjectOperationOverrideType,
} from "@/lib/platform/core-ops";

type UseProjectOpsOptions = {
  objectType?: ProjectOperationObjectType;
  objectId?: string;
  enabled?: boolean;
};

type CreateOverrideInput = {
  objectType: ProjectOperationObjectType;
  objectId: string;
  overrideType: ProjectOperationOverrideType;
  reason?: string;
  metadata?: Record<string, unknown>;
};

function matchesScope(
  row: { object_type: ProjectOperationObjectType; object_id: string },
  options: UseProjectOpsOptions
) {
  if (options.objectType && row.object_type !== options.objectType) {
    return false;
  }

  if (options.objectId && row.object_id !== options.objectId) {
    return false;
  }

  return true;
}

export function useProjectOps(projectId: string | null | undefined, options: UseProjectOpsOptions = {}) {
  const enabled = Boolean(projectId) && (options.enabled ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [incidents, setIncidents] = useState<ProjectOperationIncidentRecord[]>([]);
  const [overrides, setOverrides] = useState<ProjectOperationOverrideRecord[]>([]);
  const [audits, setAudits] = useState<ProjectOperationAuditRecord[]>([]);
  const [workingIncidentId, setWorkingIncidentId] = useState<string | null>(null);
  const [workingOverrideId, setWorkingOverrideId] = useState<string | null>(null);
  const [creatingOverride, setCreatingOverride] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !projectId) {
      setIncidents([]);
      setOverrides([]);
      setAudits([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [incidentsResponse, overridesResponse, auditsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}/ops-incidents`, { cache: "no-store" }),
        fetch(`/api/projects/${projectId}/ops-overrides`, { cache: "no-store" }),
        fetch(`/api/projects/${projectId}/ops-audit`, { cache: "no-store" }),
      ]);

      const [incidentsPayload, overridesPayload, auditsPayload] = await Promise.all([
        incidentsResponse.json().catch(() => null),
        overridesResponse.json().catch(() => null),
        auditsResponse.json().catch(() => null),
      ]);

      if (!incidentsResponse.ok || !incidentsPayload?.ok) {
        throw new Error(incidentsPayload?.error ?? "Failed to load project incidents.");
      }

      if (!overridesResponse.ok || !overridesPayload?.ok) {
        throw new Error(overridesPayload?.error ?? "Failed to load project overrides.");
      }

      if (!auditsResponse.ok || !auditsPayload?.ok) {
        throw new Error(auditsPayload?.error ?? "Failed to load project audit history.");
      }

      setIncidents((incidentsPayload.incidents ?? []) as ProjectOperationIncidentRecord[]);
      setOverrides((overridesPayload.overrides ?? []) as ProjectOperationOverrideRecord[]);
      setAudits((auditsPayload.audits ?? []) as ProjectOperationAuditRecord[]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load project ops.");
    } finally {
      setLoading(false);
    }
  }, [enabled, projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const scopedIncidents = useMemo(
    () => incidents.filter((row) => matchesScope(row, options)),
    [incidents, options.objectId, options.objectType]
  );
  const scopedOverrides = useMemo(
    () => overrides.filter((row) => matchesScope(row, options)),
    [overrides, options.objectId, options.objectType]
  );
  const scopedAudits = useMemo(
    () => audits.filter((row) => matchesScope(row, options)),
    [audits, options.objectId, options.objectType]
  );

  const openIncidents = useMemo(
    () => scopedIncidents.filter((row) => row.status === "open" || row.status === "watching"),
    [scopedIncidents]
  );
  const activeOverrides = useMemo(
    () => scopedOverrides.filter((row) => row.status === "active"),
    [scopedOverrides]
  );

  const updateIncidentStatus = useCallback(
    async (
      incidentId: string,
      status: Extract<ProjectOperationIncidentStatus, "watching" | "resolved" | "dismissed">
    ) => {
      if (!projectId) {
        return;
      }

      setWorkingIncidentId(incidentId);
      setError("");

      try {
        const response = await fetch(`/api/projects/${projectId}/ops-incidents`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ incidentId, status }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to update incident.");
        }

        setIncidents((current) =>
          current.map((row) => (row.id === incidentId ? payload.incident : row))
        );
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to update incident.");
      } finally {
        setWorkingIncidentId(null);
      }
    },
    [projectId]
  );

  const createOverride = useCallback(
    async (input: CreateOverrideInput) => {
      if (!projectId) {
        return;
      }

      setCreatingOverride(true);
      setError("");

      try {
        const response = await fetch(`/api/projects/${projectId}/ops-overrides`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to create override.");
        }

        setOverrides((current) => [payload.override, ...current]);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to create override.");
      } finally {
        setCreatingOverride(false);
      }
    },
    [projectId]
  );

  const resolveOverride = useCallback(
    async (
      overrideId: string,
      status: Extract<ProjectOperationOverrideStatus, "resolved" | "canceled"> = "resolved"
    ) => {
      if (!projectId) {
        return;
      }

      setWorkingOverrideId(overrideId);
      setError("");

      try {
        const response = await fetch(`/api/projects/${projectId}/ops-overrides`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ overrideId, status }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to update override.");
        }

        setOverrides((current) =>
          current.map((row) => (row.id === overrideId ? payload.override : row))
        );
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Failed to update override.");
      } finally {
        setWorkingOverrideId(null);
      }
    },
    [projectId]
  );

  return {
    loading,
    error,
    incidents: scopedIncidents,
    overrides: scopedOverrides,
    audits: scopedAudits,
    openIncidents,
    activeOverrides,
    creatingOverride,
    workingIncidentId,
    workingOverrideId,
    refresh,
    updateIncidentStatus,
    createOverride,
    resolveOverride,
  };
}
