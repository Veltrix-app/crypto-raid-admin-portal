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
      <div className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] p-3.5">
        <div className="grid gap-3 md:grid-cols-[180px_1fr]">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Note type
            <select
              value={noteType}
              onChange={(event) => setNoteType(event.target.value)}
              className="mt-2 w-full rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-3 py-2 text-[13px] text-text outline-none transition focus:border-primary/35"
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
              className="mt-2 w-full rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-3 py-2 text-[13px] text-text outline-none transition focus:border-primary/35"
              placeholder="What should the next operator know?"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-bold uppercase tracking-[0.14em] text-sub">
          Note body
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-3 py-2.5 text-[13px] leading-5 text-text outline-none transition focus:border-primary/35"
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
          className="mt-3.5 inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add note"}
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        {notes.length ? (
          notes.map((note) => (
            <div key={note.id} className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-text">{note.title}</p>
                    <OpsStatusPill tone={note.status === "open" ? "warning" : "default"}>
                      {humanizeCommercialLabel(note.noteType)}
                    </OpsStatusPill>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-5 text-sub">{note.body}</p>
                </div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-sub">{note.createdAt}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-3.5 text-[13px] text-sub">
            No notes yet.
          </div>
        )}
      </div>
    </OpsPanel>
  );
}
