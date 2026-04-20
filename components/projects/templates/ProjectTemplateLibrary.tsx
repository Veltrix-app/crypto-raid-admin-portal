"use client";

import Link from "next/link";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { ProjectBuilderLibrarySection } from "@/lib/templates/project-builder-library";

export default function ProjectTemplateLibrary({
  sections,
}: {
  sections: ProjectBuilderLibrarySection[];
}) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div
          key={section.kind}
          className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,26,38,0.92),rgba(11,16,24,0.98))] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {section.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-sub">{section.description}</p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {section.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-[24px] border border-white/8 bg-black/20 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.06]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <OpsStatusPill
                        tone={item.source === "project_saved" ? "success" : "default"}
                      >
                        {item.source === "project_saved" ? "Saved" : "Built in"}
                      </OpsStatusPill>
                      {item.fitLabel ? (
                        <OpsStatusPill tone="warning">{item.fitLabel}</OpsStatusPill>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-base font-extrabold tracking-tight text-text">
                        {item.title}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-sub">{item.summary}</p>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-primary transition-transform duration-300 group-hover:translate-x-0.5">
                    {item.cta}
                  </span>
                </div>

                {item.fitReasons?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.fitReasons.slice(0, 2).map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold leading-5 text-sub"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
