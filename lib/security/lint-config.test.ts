import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("portal lint script uses the non-interactive ESLint CLI", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(process.cwd(), "package.json"), "utf8")
  ) as { scripts?: Record<string, string>; devDependencies?: Record<string, string> };

  assert.equal(packageJson.scripts?.lint, "eslint .");
  assert.ok(packageJson.devDependencies?.eslint, "eslint must be a direct dev dependency");
  assert.ok(
    packageJson.devDependencies?.["eslint-config-next"],
    "eslint-config-next must be a direct dev dependency"
  );
  assert.ok(existsSync(path.join(process.cwd(), "eslint.config.mjs")));
});
