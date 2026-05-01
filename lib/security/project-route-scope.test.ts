import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const guardedProjectActionRoutes = [
  "app/api/projects/[id]/community-automation-run/route.ts",
  "app/api/projects/[id]/community-mission-post/route.ts",
  "app/api/projects/[id]/community-raid-post/route.ts",
  "app/api/projects/[id]/discord-command-sync/route.ts",
  "app/api/projects/[id]/discord-leaderboard-post/route.ts",
  "app/api/projects/[id]/discord-rank-sync/route.ts",
];

describe("project action route scope guards", () => {
  for (const routePath of guardedProjectActionRoutes) {
    it(`${routePath} asserts project access before side effects`, () => {
      const source = readFileSync(path.join(process.cwd(), routePath), "utf8");

      assert.match(source, /assertProjectCommunityAccess/);
      assert.match(source, /access\.projectId/);
    });
  }
});
