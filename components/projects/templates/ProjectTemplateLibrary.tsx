"use client";

import Link from "next/link";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { ProjectBuilderLibrarySection } from "@/lib/templates/project-builder-library";

export default function ProjectTemplateLibrary({
  sections,
  layout = "stack",
}: {
  sections: ProjectBuilderLibrarySection[];
  layout?: "stack" | "wide";
}) {
  return (
    <div className={layout === "wide" ? "grid gap-2.5 2xl:grid-cols-2" : "grid gap-2.5"}>
      {sections.map((section) => (
        <div
          key={section.kind}
          className="rounded-[18px] bg-white/[0.012] p-3.5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.026] pb-3">
            <div className="min-w-0 max-w-xl">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary/90">
                {section.title}
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-sub">{section.description}</p>
            </div>
            <span className="rounded-full bg-white/[0.016] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-sub">
              {section.items.length} routes
            </span>
          </div>

          <div className="mt-2.5 grid gap-1.5">
            {section.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group block rounded-[14px] bg-black/20 px-3 py-2.5 transition-colors duration-200 hover:bg-white/[0.032]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words text-[13px] font-semibold text-text [overflow-wrap:anywhere]">
                        {item.title}
                      </p>
                      {item.fitLabel ? (
                        <OpsStatusPill tone="warning">{item.fitLabel}</OpsStatusPill>
                      ) : null}
                    </div>
                    <p className="mt-1.5 break-words text-[11px] leading-5 text-sub [overflow-wrap:anywhere]">
                      {item.summary}
                    </p>
                  </div>

                  <span className="shrink-0 pt-0.5 text-[11px] font-bold text-primary transition-transform duration-200 group-hover:translate-x-0.5">
                    {item.cta} -&gt;
                  </span>
                </div>

                {item.fitReasons?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <OpsStatusPill
                      tone={item.source === "project_saved" ? "success" : "default"}
                    >
                      {item.source === "project_saved" ? "Saved" : "Built in"}
                    </OpsStatusPill>
                    {item.fitReasons.slice(0, 2).map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full bg-white/[0.022] px-2.5 py-1 text-[10px] font-semibold leading-4 text-sub"
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
