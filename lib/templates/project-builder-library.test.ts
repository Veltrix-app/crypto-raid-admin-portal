import test from "node:test";
import assert from "node:assert/strict";
import { buildProjectBuilderLibrary } from "./project-builder-library";

test("buildProjectBuilderLibrary groups built-ins and saved templates with project-aware routes", () => {
  const sections = buildProjectBuilderLibrary({
    project: {
      id: "project-1",
      name: "Chainwars",
    },
    campaignId: "campaign-9",
    savedTemplates: [
      {
        id: "saved-campaign-template",
        projectId: "project-1",
        templateKind: "campaign",
        name: "Chainwars Proven Launch",
        description: "Saved launch variant",
        configuration: "{}",
      },
    ],
  });

  assert.deepEqual(
    sections.map((section) => section.kind),
    ["campaign", "quest", "raid", "playbook"]
  );

  const campaignSection = sections[0];
  assert.equal(campaignSection.items[0]?.source, "project_saved");
  assert.match(campaignSection.items[0]?.href ?? "", /savedTemplateId=saved-campaign-template/);
  assert.ok(
    campaignSection.items.some(
      (item) => item.source === "built_in" && /templateId=/.test(item.href)
    )
  );

  const questSection = sections[1];
  assert.ok(questSection.items.every((item) => item.href.includes("projectId=project-1")));
  assert.ok(questSection.items.every((item) => item.href.includes("campaignId=campaign-9")));

  const raidSection = sections[2];
  assert.ok(raidSection.items.every((item) => item.href.includes("/raids/new?")));

  const playbookSection = sections[3];
  assert.ok(
    playbookSection.items.some((item) => item.href === "/projects/project-1/launch")
  );
});
