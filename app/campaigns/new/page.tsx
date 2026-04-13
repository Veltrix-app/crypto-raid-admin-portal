"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import {
  buildCampaignTemplate,
  CampaignTemplateId,
  formatProjectFieldLabel,
  getCampaignTemplateOptions,
} from "@/lib/campaign-templates";

export default function NewCampaignPage() {
  const router = useRouter();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const createCampaign = useAdminPortalStore((s) => s.createCampaign);
  const createQuest = useAdminPortalStore((s) => s.createQuest);
  const createReward = useAdminPortalStore((s) => s.createReward);
  const projects = useAdminPortalStore((s) => s.projects);

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<CampaignTemplateId>("community_growth_starter");

  const selectedProject = useMemo(
    () =>
      projects.find((project) => project.id === activeProjectId) ??
      projects[0] ??
      null,
    [activeProjectId, projects]
  );

  const templateOptions = getCampaignTemplateOptions();
  const templatePlan = useMemo(
    () =>
      selectedProject
        ? buildCampaignTemplate(selectedProject, selectedTemplateId)
        : null,
    [selectedProject, selectedTemplateId]
  );

  const selectedTemplate = templateOptions.find(
    (template) => template.id === selectedTemplateId
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Campaign Builder
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">
            New Campaign
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-sub">
            Pick a full campaign template and let Veltrix generate the campaign,
            quest sequence and reward drafts from the project context you already
            filled in.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Full Campaign Templates
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-text">
                  Start from a complete playbook
                </h2>
              </div>

              <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Active Project
                </p>
                <p className="mt-2 text-lg font-extrabold text-text">
                  {selectedProject?.name || "No project"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {templateOptions.map((template) => {
                const isActive = template.id === selectedTemplateId;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-line bg-card2 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text">
                          {template.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-sub">
                          {template.summary}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
                        {template.quests.length} quests / {template.rewards.length} rewards
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Autofill Preview
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-text">
              What Veltrix will generate for you
            </h2>

            {selectedTemplate && templatePlan ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-sm font-bold text-text">
                    {selectedTemplate.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    {selectedTemplate.goal}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <PreviewStat
                    label="Campaign title"
                    value={templatePlan.campaignDraft.title}
                  />
                  <PreviewStat
                    label="Quest drafts"
                    value={templatePlan.questDrafts.length}
                  />
                  <PreviewStat
                    label="Reward drafts"
                    value={templatePlan.rewardDrafts.length}
                  />
                </div>

                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Project context usage
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTemplate.requiredProjectFields.map((field) => (
                      <span
                        key={field}
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                          templatePlan.missingProjectFields.includes(field)
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {formatProjectFieldLabel(field)}
                      </span>
                    ))}
                  </div>
                  {templatePlan.missingProjectFields.length > 0 ? (
                    <p className="mt-3 text-sm leading-6 text-amber-200">
                      Missing project fields:{" "}
                      {templatePlan.missingProjectFields
                        .map((field) => formatProjectFieldLabel(field))
                        .join(", ")}
                      . Add these on the project profile for full autofill.
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-sub">
                      All required project links are present, so this template can
                      auto-fill immediately.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Generated quest flow
                  </p>
                  <div className="mt-4 space-y-3">
                    {templatePlan.questDrafts.map((quest, index) => (
                      <div
                        key={`${quest.title}-${index}`}
                        className="rounded-2xl border border-line bg-card px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-text">
                              {index + 1}. {quest.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-sub">
                              {quest.description}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                            <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
                              {quest.questType}
                            </span>
                            <span className="rounded-full bg-white/5 px-3 py-1 text-text">
                              {quest.xp} xp
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Generated rewards
                  </p>
                  <div className="mt-4 space-y-3">
                    {templatePlan.rewardDrafts.map((reward, index) => (
                      <div
                        key={`${reward.title}-${index}`}
                        className="rounded-2xl border border-line bg-card px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-text">
                              {reward.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-sub">
                              {reward.description}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                            <span className="rounded-full bg-white/5 px-3 py-1 text-text">
                              {reward.rewardType}
                            </span>
                            <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
                              {reward.cost} xp
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-sub">
                Pick a project workspace and a template to see the generated plan.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <CampaignForm
            projects={projects}
            defaultProjectId={selectedProject?.id}
            resetKey={`${selectedProject?.id || "none"}:${selectedTemplateId}`}
            initialValues={templatePlan?.campaignDraft}
            onSubmit={async (values) => {
              const campaignId = await createCampaign(values);

              if (templatePlan) {
                for (const quest of templatePlan.questDrafts) {
                  await createQuest({
                    ...quest,
                    projectId: values.projectId,
                    campaignId,
                    startsAt: values.startsAt || quest.startsAt,
                    endsAt: values.endsAt || quest.endsAt,
                    status: values.status === "active" ? "active" : quest.status,
                  });
                }

                for (const reward of templatePlan.rewardDrafts) {
                  await createReward({
                    ...reward,
                    projectId: values.projectId,
                    campaignId,
                    status: values.status === "active" ? "active" : reward.status,
                  });
                }
              }

              router.push(`/campaigns/${campaignId}`);
            }}
            submitLabel="Generate Campaign"
          />
        </div>
      </div>
    </AdminShell>
  );
}

function PreviewStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card2 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 text-lg font-extrabold text-text">{value}</p>
    </div>
  );
}
