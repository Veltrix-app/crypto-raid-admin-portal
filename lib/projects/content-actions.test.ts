import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDuplicateContentTitle,
  canArchiveProjectContent,
  getPrimaryProjectContentAction,
  getProjectContentActionAuditType,
  resolveProjectContentStatus,
} from "./content-actions";

test("resolveProjectContentStatus maps lifecycle actions per content type", () => {
  assert.equal(resolveProjectContentStatus("campaign", "pause"), "paused");
  assert.equal(resolveProjectContentStatus("campaign", "publish"), "active");
  assert.equal(resolveProjectContentStatus("campaign", "resume"), "active");
  assert.equal(resolveProjectContentStatus("campaign", "archive"), "archived");

  assert.equal(resolveProjectContentStatus("quest", "archive"), "archived");
  assert.equal(resolveProjectContentStatus("raid", "archive"), "ended");
  assert.equal(resolveProjectContentStatus("reward", "resume"), "active");
});

test("buildDuplicateContentTitle keeps copies readable", () => {
  assert.equal(buildDuplicateContentTitle("Chainwars Launch"), "Chainwars Launch Copy");
  assert.equal(buildDuplicateContentTitle("Chainwars Launch Copy"), "Chainwars Launch Copy 2");
  assert.equal(buildDuplicateContentTitle("Chainwars Launch Copy 4"), "Chainwars Launch Copy 5");
});

test("getProjectContentActionAuditType keeps lifecycle actions explicit", () => {
  assert.equal(getProjectContentActionAuditType("publish"), "published");
  assert.equal(getProjectContentActionAuditType("pause"), "paused");
  assert.equal(getProjectContentActionAuditType("resume"), "resumed");
  assert.equal(getProjectContentActionAuditType("archive"), "archived");
  assert.equal(getProjectContentActionAuditType("duplicate"), "created");
});

test("getPrimaryProjectContentAction maps the next obvious lifecycle move", () => {
  assert.deepEqual(getPrimaryProjectContentAction("campaign", "draft"), {
    action: "publish",
    label: "Publish",
  });
  assert.deepEqual(getPrimaryProjectContentAction("campaign", "paused"), {
    action: "resume",
    label: "Resume",
  });
  assert.deepEqual(getPrimaryProjectContentAction("raid", "active"), {
    action: "pause",
    label: "Pause",
  });
  assert.equal(getPrimaryProjectContentAction("reward", "archived"), null);
  assert.equal(getPrimaryProjectContentAction("raid", "ended"), null);
});

test("canArchiveProjectContent only allows archive before a terminal state", () => {
  assert.equal(canArchiveProjectContent("campaign", "draft"), true);
  assert.equal(canArchiveProjectContent("campaign", "archived"), false);
  assert.equal(canArchiveProjectContent("quest", "paused"), true);
  assert.equal(canArchiveProjectContent("reward", "archived"), false);
  assert.equal(canArchiveProjectContent("raid", "active"), true);
  assert.equal(canArchiveProjectContent("raid", "ended"), false);
});
