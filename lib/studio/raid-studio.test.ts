import test from "node:test";
import assert from "node:assert/strict";
import {
  getRaidLaunchWarnings,
  getRaidMemberPreview,
  getRaidStudioReadiness,
} from "./raid-studio";

test("getRaidStudioReadiness highlights missing destination and instruction gaps", () => {
  const items = getRaidStudioReadiness({
    values: {
      title: "Chainwars launch wave",
      community: "Chainwars raiders",
      target: "Like and repost the launch post",
      targetUrl: "",
      instructions: [],
      verificationType: "manual_confirm",
      verificationConfig: "",
      timer: "",
      status: "draft",
    },
    campaignCount: 0,
  });

  assert.equal(items.find((item) => item.label === "Destination")?.complete, false);
  assert.equal(items.find((item) => item.label === "Instructions")?.complete, false);
  assert.equal(items.find((item) => item.label === "Campaign context")?.complete, false);
});

test("raid studio preview and launch warnings stay pressure-aware", () => {
  const preview = getRaidMemberPreview({
    title: "Chainwars launch wave",
    community: "Chainwars raiders",
    target: "Like and repost the launch post",
    rewardXp: 240,
    timer: "18m left",
    instructions: ["Like the post", "Repost with comment"],
    verificationType: "api_repost_check",
    shortDescription: "Push the launch harder.",
  });

  assert.equal(preview.title, "Chainwars launch wave");
  assert.match(preview.cta, /Like and repost/i);
  assert.match(preview.verificationLabel, /api repost check/i);

  const warnings = getRaidLaunchWarnings({
    values: {
      targetUrl: "https://x.com/veltrix/status/1",
      instructions: ["Like the post"],
      verificationConfig: "{invalid",
      status: "active",
      timer: "",
    },
  });

  assert.ok(warnings.some((item) => item.label === "Verification config"));
  assert.ok(warnings.some((item) => item.label === "Timer posture"));
});
