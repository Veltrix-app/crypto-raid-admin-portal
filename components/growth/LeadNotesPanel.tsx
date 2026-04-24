"use client";

import { useState } from "react";
import {
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import {
  commercialNoteTypeOptions,
  humanizeCommercialLabel,
} from "@/lib/growth/growth-contract";
import type { AdminCommercialLeadNote } from "@/types/entities/growth-sales";

export function LeadNotesPanel({
  notes,
  onCreate,
  saving,
}: {
  notes: AdminCommercialLeadNote[];
  onCreate: (input: { noteType: string; title: string; body: string }) => Promise<void>;
  saving: boolean;
}) {
  const [noteType, setNoteType] = useState("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <OpsPanel
      eyebrow="Lead notes"
      title="Internal commercial notes"
      description="Keep qualification context, buyer concerns and enterprise edges with the lead."
    >
      <div className="rounded-[22px] border border-line bg-card2 p-4">
        <div className="grid gap-3 md:grid-cols-[180px_1fr]">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Note type
            <select
              value={noteType}
              onChange={(event) => setNoteType(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm text-text outline-none transition focus:border-primary/35"
            >
              {commercialNoteTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm text-text outline-none transition focus:border-primary/35"
              placeholder="What should the next operator know?"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-bold uppercase tracking-[0.14em] text-sub">
          Note body
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-[22px] border border-line bg-card px-3 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary/35"
            placeholder="Capture the commercial context or buyer concern."
          />
        </label>
        <button
          type="button"
          onClick={() =>
            void onCreate({ noteType, title, body }).then(() => {
              setTitle("");
              setBody("");
              setNoteType("general");
            })
          }
          disabled={saving}
          className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add note"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {notes.length ? (
          notes.map((note) => (
            <div key={note.id} className="rounded-[22px] border border-line bg-card2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-text">{note.title}</p>
                    <OpsStatusPill tone={note.status === "open" ? "warning" : "default"}>
                      {humanizeCommercialLabel(note.noteType)}
                    </OpsStatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-sub">{note.body}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.14em] text-sub">{note.createdAt}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[22px] border border-line bg-card2 px-4 py-4 text-sm text-sub">
            No notes yet.
          </div>
        )}
      </div>
    </OpsPanel>
  );
}
