"use client";

import { useEffect, useMemo, useState } from "react";
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
  ResolvedQuestDraft,
  ResolvedRewardDraft,
} from "@/lib/campaign-templates";
import { AdminProject } from "@/types/entities/project";
import { AdminQuest } from "@/types/entities/quest";
import { AdminReward } from "@/types/entities/reward";

type EditableProjectContextField =
  | "website"
  | "xUrl"
  | "telegramUrl"
  | "discordUrl"
  | "bannerUrl"
  | "contactEmail";

type EditableQuestDraft = Pick<
  AdminQuest,
  "title" | "description" | "xp" | "actionUrl" | "actionLabel"
>;

type EditableRewardDraft = Pick<AdminReward, "title" | "description" | "cost">;

export default function NewCampaignPage() {
  const router = useRouter();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const createCampaign = useAdminPortalStore((s) => s.createCampaign);
  const createQuest = useAdminPortalStore((s) => s.createQuest);
  const createReward = useAdminPortalStore((s) => s.createReward);
  const updateProject = useAdminPortalStore((s) => s.updateProject);
  const projects = useAdminPortalStore((s) => s.projects);

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<CampaignTemplateId>("community_growth_starter");
  const [selectedQuestKeys, setSelectedQuestKeys] = useState<string[]>([]);
  const [selectedRewardKeys, setSelectedRewardKeys] = useState<string[]>([]);
  const [projectContextDraft, setProjectContextDraft] = useState<
    Partial<Pick<AdminProject, EditableProjectContextField>>
  >({});
  const [questDraftEdits, setQuestDraftEdits] = useState<
    Record<string, Partial<EditableQuestDraft>>
  >({});
  const [rewardDraftEdits, setRewardDraftEdits] = useState<
    Record<string, Partial<EditableRewardDraft>>
  >({});
  const [contextSaving, setContextSaving] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);

  const selectedProject = useMemo(
    () =>
      projects.find((project) => project.id === activeProjectId) ??
      projects[0] ??
      null,
    [activeProjectId, projects]
  );
  const effectiveProject = useMemo(
    () =>
      selectedProject
        ? {
            ...selectedProject,
            ...projectContextDraft,
          }
        : null,
    [projectContextDraft, selectedProject]
  );

  const templateOptions = getCampaignTemplateOptions();
  const templatePlan = useMemo(
    () =>
      effectiveProject
        ? buildCampaignTemplate(effectiveProject, selectedTemplateId)
        : null,
    [effectiveProject, selectedTemplateId]
  );

  const selectedTemplate = templateOptions.find(
    (template) => template.id === selectedTemplateId
  );

  useEffect(() => {
    setProjectContextDraft({});
    setQuestDraftEdits({});
    setRewardDraftEdits({});
    setContextMessage(null);
  }, [selectedProject?.id, selectedTemplateId]);

  useEffect(() => {
    setSelectedQuestKeys(templatePlan?.questDrafts.map((quest) => quest.key) ?? []);
    setSelectedRewardKeys(templatePlan?.rewardDrafts.map((reward) => reward.key) ?? []);
  }, [templatePlan]);

  const includedQuestDrafts = useMemo(
    () =>
      templatePlan?.questDrafts
        .map((quest) => ({
          ...quest,
          draft: {
            ...quest.draft,
            ...(questDraftEdits[quest.key] ?? {}),
          },
        }))
        .filter((quest) => selectedQuestKeys.includes(quest.key)) ?? [],
    [questDraftEdits, selectedQuestKeys, templatePlan]
  );
  const includedRewardDrafts = useMemo(
    () =>
      templatePlan?.rewardDrafts
        .map((reward) => ({
          ...reward,
          draft: {
            ...reward.draft,
            ...(rewardDraftEdits[reward.key] ?? {}),
          },
        }))
        .filter((reward) => selectedRewardKeys.includes(reward.key)) ?? [],
    [rewardDraftEdits, selectedRewardKeys, templatePlan]
  );

  function updateQuestDraftEdit(
    key: string,
    field: keyof EditableQuestDraft,
    value: string | number
  ) {
    setQuestDraftEdits((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? {}),
        [field]: value,
      },
    }));
  }

  function updateRewardDraftEdit(
    key: string,
    field: keyof EditableRewardDraft,
    value: string | number
  ) {
    setRewardDraftEdits((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? {}),
        [field]: value,
      },
    }));
  }

  async function saveProjectContextFields() {
    if (!selectedProject || !templatePlan || templatePlan.missingProjectFields.length === 0) {
      return;
    }

    const nextProject = {
      ...selectedProject,
      ...projectContextDraft,
    };

    setContextSaving(true);
    setContextMessage(null);

    try {
      await updateProject(selectedProject.id, {
        name: nextProject.name,
        slug: nextProject.slug,
        chain: nextProject.chain,
        category: nextProject.category ?? "",
        status: nextProject.status,
        onboardingStatus: nextProject.onboardingStatus,
        description: nextProject.description,
        longDescription: nextProject.longDescription ?? "",
        members: nextProject.members,
        campaigns: nextProject.campaigns,
        logo: nextProject.logo,
        bannerUrl: nextProject.bannerUrl ?? "",
        website: nextProject.website ?? "",
        xUrl: nextProject.xUrl ?? "",
        telegramUrl: nextProject.telegramUrl ?? "",
        discordUrl: nextProject.discordUrl ?? "",
        contactEmail: nextProject.contactEmail ?? "",
        isFeatured: nextProject.isFeatured ?? false,
        isPublic: nextProject.isPublic ?? true,
      });

      setProjectContextDraft({});
      setContextMessage("Project context updated. Template autofill refreshed.");
    } catch (error: any) {
      setContextMessage(error?.message || "Failed to update project context.");
    } finally {
      setContextSaving(false);
    }
  }

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
                    value={`${includedQuestDrafts.length}/${templatePlan.questDrafts.length}`}
                  />
                  <PreviewStat
                    label="Reward drafts"
                    value={`${includedRewardDrafts.length}/${templatePlan.rewardDrafts.length}`}
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
                    <div className="mt-4 space-y-4">
                      <p className="text-sm leading-6 text-amber-200">
                        Missing project fields:{" "}
                        {templatePlan.missingProjectFields
                          .map((field) => formatProjectFieldLabel(field))
                          .join(", ")}
                        . Fill them here once and this template will auto-wire itself.
                      </p>

                      <div className="grid gap-4 md:grid-cols-2">
                        {templatePlan.missingProjectFields.map((field) => (
                          <label key={field} className="block">
                            <span className="mb-2 block text-sm font-semibold text-text">
                              {formatProjectFieldLabel(field)}
                            </span>
                            <input
                              value={
                                projectContextDraft[field as EditableProjectContextField] ??
                                ((effectiveProject?.[
                                  field as EditableProjectContextField
                                ] as string | undefined) ?? "")
                              }
                              onChange={(event) =>
                                setProjectContextDraft((current) => ({
                                  ...current,
                                  [field as EditableProjectContextField]: event.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none"
                              placeholder={`Add ${formatProjectFieldLabel(field)}`}
                            />
                          </label>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={saveProjectContextFields}
                          disabled={contextSaving}
                          className="rounded-2xl bg-primary px-4 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {contextSaving ? "Saving project context..." : "Save project context"}
                        </button>
                        {contextMessage ? (
                          <p className="text-sm text-sub">{contextMessage}</p>
                        ) : null}
                      </div>
                    </div>
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
                      <TemplateQuestCard
                        key={quest.key}
                        item={{
                          ...quest,
                          draft: {
                            ...quest.draft,
                            ...(questDraftEdits[quest.key] ?? {}),
                          },
                        }}
                        index={index}
                        included={selectedQuestKeys.includes(quest.key)}
                        onToggle={() =>
                          setSelectedQuestKeys((current) =>
                            current.includes(quest.key)
                              ? current.filter((key) => key !== quest.key)
                              : [...current, quest.key]
                          )
                        }
                        onEdit={updateQuestDraftEdit}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Generated rewards
                  </p>
                  <div className="mt-4 space-y-3">
                    {templatePlan.rewardDrafts.map((reward) => (
                      <TemplateRewardCard
                        key={reward.key}
                        item={{
                          ...reward,
                          draft: {
                            ...reward.draft,
                            ...(rewardDraftEdits[reward.key] ?? {}),
                          },
                        }}
                        included={selectedRewardKeys.includes(reward.key)}
                        onToggle={() =>
                          setSelectedRewardKeys((current) =>
                            current.includes(reward.key)
                              ? current.filter((key) => key !== reward.key)
                              : [...current, reward.key]
                          )
                        }
                        onEdit={updateRewardDraftEdit}
                      />
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
                for (const quest of includedQuestDrafts) {
                  await createQuest({
                    ...quest.draft,
                    projectId: values.projectId,
                    campaignId,
                    startsAt: values.startsAt || quest.draft.startsAt,
                    endsAt: values.endsAt || quest.draft.endsAt,
                    status: values.status === "active" ? "active" : quest.draft.status,
                  });
                }

                for (const reward of includedRewardDrafts) {
                  await createReward({
                    ...reward.draft,
                    projectId: values.projectId,
                    campaignId,
                    status: values.status === "active" ? "active" : reward.draft.status,
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

function TemplateQuestCard({
  item,
  index,
  included,
  onToggle,
  onEdit,
}: {
  item: ResolvedQuestDraft;
  index: number;
  included: boolean;
  onToggle: () => void;
  onEdit: (
    key: string,
    field: keyof EditableQuestDraft,
    value: string | number
  ) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">
            {index + 1}. {item.draft.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-sub">
            {item.draft.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
            included
              ? "bg-primary/15 text-primary"
              : "bg-white/5 text-sub"
          }`}
        >
          {included ? "Included" : "Skipped"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
        <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
          {item.draft.questType}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-text">
          {item.draft.xp} xp
        </span>
        <span
          className={`rounded-full px-3 py-1 ${
            item.missingProjectFields.length > 0
              ? "bg-amber-500/15 text-amber-300"
              : "bg-emerald-500/15 text-emerald-300"
          }`}
        >
          {item.missingProjectFields.length > 0 ? "Needs context" : "Ready"}
        </span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <TemplateMeta
          label="Auto-filled"
          value={
            item.autofilledFields.length > 0
              ? item.autofilledFields.join(", ")
              : "Base defaults only"
          }
        />
        <TemplateMeta
          label="Needs input"
          value={
            item.missingProjectFields.length > 0
              ? item.missingProjectFields
                  .map((field) => formatProjectFieldLabel(field))
                  .join(", ")
              : "Nothing missing"
          }
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Quest title
          </span>
          <input
            value={item.draft.title}
            onChange={(event) => onEdit(item.key, "title", event.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            XP
          </span>
          <input
            type="number"
            min={0}
            value={item.draft.xp}
            onChange={(event) =>
              onEdit(item.key, "xp", Number(event.target.value || 0))
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Description
          </span>
          <textarea
            value={item.draft.description}
            onChange={(event) =>
              onEdit(item.key, "description", event.target.value)
            }
            rows={3}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Action label
          </span>
          <input
            value={item.draft.actionLabel}
            onChange={(event) =>
              onEdit(item.key, "actionLabel", event.target.value)
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Action URL
          </span>
          <input
            value={item.draft.actionUrl ?? ""}
            onChange={(event) =>
              onEdit(item.key, "actionUrl", event.target.value)
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </label>
      </div>
    </div>
  );
}

function TemplateRewardCard({
  item,
  included,
  onToggle,
  onEdit,
}: {
  item: ResolvedRewardDraft;
  included: boolean;
  onToggle: () => void;
  onEdit: (
    key: string,
    field: keyof EditableRewardDraft,
    value: string | number
  ) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">{item.draft.title}</p>
          <p className="mt-2 text-sm leading-6 text-sub">
            {item.draft.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
            included
              ? "bg-primary/15 text-primary"
              : "bg-white/5 text-sub"
          }`}
        >
          {included ? "Included" : "Skipped"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
        <span className="rounded-full bg-white/5 px-3 py-1 text-text">
          {item.draft.rewardType}
        </span>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
          {item.draft.cost} xp
        </span>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">
          Ready
        </span>
      </div>

      <div className="mt-3">
        <TemplateMeta
          label="Auto-filled"
          value={
            item.autofilledFields.length > 0
              ? item.autofilledFields.join(", ")
              : "Base defaults only"
          }
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Reward title
          </span>
          <input
            value={item.draft.title}
            onChange={(event) => onEdit(item.key, "title", event.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Cost
          </span>
          <input
            type="number"
            min={0}
            value={item.draft.cost}
            onChange={(event) =>
              onEdit(item.key, "cost", Number(event.target.value || 0))
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Description
          </span>
          <textarea
            value={item.draft.description}
            onChange={(event) =>
              onEdit(item.key, "description", event.target.value)
            }
            rows={3}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </label>
      </div>
    </div>
  );
}

function TemplateMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-text">{value}</p>
    </div>
  );
}
