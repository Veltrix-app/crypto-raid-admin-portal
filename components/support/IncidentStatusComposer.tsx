"use client";

import { useState } from "react";
import { OpsSelect } from "@/components/layout/ops/OpsPrimitives";
import type {
  AdminServiceIncidentState,
  AdminServiceStatusLevel,
} from "@/types/entities/support";

export function IncidentStatusComposer({
  onSubmit,
  busy,
}: {
  onSubmit: (input: {
    action: "state_transition" | "public_update" | "internal_note";
    title?: string;
    message: string;
    state?: AdminServiceIncidentState;
    componentStatus?: AdminServiceStatusLevel;
  }) => Promise<void>;
  busy: boolean;
}) {
  const [action, setAction] = useState<"state_transition" | "public_update" | "internal_note">(
    "public_update"
  );
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<AdminServiceIncidentState>("identified");
  const [componentStatus, setComponentStatus] = useState<AdminServiceStatusLevel>("degraded");

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit({
          action,
          title: title.trim() || undefined,
          message,
          state: action === "internal_note" ? undefined : state,
          componentStatus: action === "internal_note" ? undefined : componentStatus,
        });
        setTitle("");
        setMessage("");
      }}
      className="space-y-3.5"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Action</span>
          <OpsSelect value={action} onChange={(value) => setAction(value as typeof action)} ariaLabel="Incident action">
            <option value="public_update">Public update</option>
            <option value="state_transition">State transition</option>
            <option value="internal_note">Internal note</option>
          </OpsSelect>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">State</span>
          <OpsSelect value={state} onChange={(value) => setState(value as AdminServiceIncidentState)} ariaLabel="Incident state" name="incident-state">
            <option value="investigating">Investigating</option>
            <option value="identified">Identified</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
          </OpsSelect>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Component status</span>
          <OpsSelect
            value={componentStatus}
            onChange={(value) => setComponentStatus(value as AdminServiceStatusLevel)}
            ariaLabel="Component status"
            name="component-status"
          >
            <option value="operational">Operational</option>
            <option value="degraded">Degraded</option>
            <option value="partial_outage">Partial outage</option>
            <option value="major_outage">Major outage</option>
            <option value="maintenance">Maintenance</option>
          </OpsSelect>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-[18px] border border-line bg-[linear-gradient(180deg,rgba(18,26,38,0.95),rgba(13,19,29,0.95))] px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Optional update label"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Message</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          className="w-full rounded-[18px] border border-line bg-[linear-gradient(180deg,rgba(18,26,38,0.95),rgba(13,19,29,0.95))] px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder={
            action === "internal_note"
              ? "Capture internal reasoning, next checks or provider detail."
              : "Write the bounded update that should land in the public timeline."
          }
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full border border-primary/35 bg-primary/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition hover:border-primary/50 hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving..." : "Publish update"}
        </button>
      </div>
    </form>
  );
}
