/**
 * Package unit tests for the icon capability. Runs on Node's built-in test
 * runner with type stripping, so it needs no test-framework dependency:
 *   node --experimental-strip-types --test test/icon-registry.test.ts
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { FallbackIcons } from "../components/icon-fallback.ts";
import { getIcon as getCommunityIcon, getNouns as communityNouns } from "../icons/community.ts";
import { getIcon as getManagedIcon } from "../../myrrys-proprietary/index.ts";

// Mirror of the component's resolution order (community -> managed -> fallback
// -> missing) so precedence is asserted independently of Svelte rendering.
function resolveTier(noun: string): "community" | "managed" | "fallback" | "missing" {
  if (getCommunityIcon(noun)) return "community";
  if (getManagedIcon(noun)) return "managed";
  if (FallbackIcons[noun]) return "fallback";
  return "missing";
}

test("community tier owns fox and search", () => {
  assert.equal(resolveTier("fox"), "community");
  assert.equal(resolveTier("search"), "community");
  assert.ok(communityNouns().includes("fox"));
  assert.ok(communityNouns().includes("search"));
});

test("managed tier owns the branded featured-tag nouns", () => {
  for (const noun of ["dd5", "pathfinder", "ll-ampersand", "pbta-logo"]) {
    assert.equal(resolveTier(noun), "managed", `${noun} should resolve to managed`);
  }
});

test("branded managed artwork keeps encoded colors; community is monochrome", () => {
  assert.match(getManagedIcon("dd5")!.inner, /fill="#BC0F0F"/);
  assert.match(getCommunityIcon("fox")!.inner, /fill="currentColor"/);
  assert.match(getCommunityIcon("search")!.inner, /fill="currentColor"/);
});

test("unknown, empty, and absent nouns fall to the missing glyph", () => {
  assert.equal(resolveTier("no-such-noun-xyz"), "missing");
  assert.equal(resolveTier(""), "missing");
  assert.ok(FallbackIcons.missing);
  assert.ok(FallbackIcons.missing.paths.length > 0);
});

test("bundled fallback tier provides the essential UI symbols", () => {
  for (const noun of ["menu", "close", "account", "arrow-left"]) {
    assert.equal(resolveTier(noun), "fallback", `${noun} should resolve to fallback`);
  }
});

test("pbta-logo artwork matches the v18 front-page logo viewBox", () => {
  assert.equal(getManagedIcon("pbta-logo")!.viewBox, "0 0 256 256");
});

test("icon.css :root defines exactly the five sizing tokens with the v20 values", () => {
  const css = readFileSync(new URL("../styles/icon.css", import.meta.url), "utf8");
  const rootBlock = css.match(/:root\s*\{([^}]*)\}/);
  assert.ok(rootBlock, ":root token block is present");
  const expected: Record<string, string> = {
    "--cn-icon-size-xsmall": "1rem",
    "--cn-icon-size-small": "1.5rem",
    "--cn-icon-size": "2.25rem",
    "--cn-icon-size-large": "4.5rem",
    "--cn-icon-size-xlarge": "8rem",
  };
  const found = [...rootBlock[1].matchAll(/(--cn-icon-size[\w-]*)\s*:\s*([^;]+);/g)].map((m) => [
    m[1],
    m[2].trim(),
  ]);
  const foundMap = Object.fromEntries(found);
  assert.deepEqual(foundMap, expected);
  assert.equal(found.length, 5, "no unrelated icon sizing tokens are defined at :root");
});

test("icon.css collapses the size vocabulary to the button icon size in button and fab contexts", () => {
  const css = readFileSync(new URL("../styles/icon.css", import.meta.url), "utf8");
  const context = css.replace(/:root\s*\{[^}]*\}/, "");

  // The context targets the local Icon element inside buttons and fabs.
  assert.match(context, /button[\s\S]*?\.cn-icon\s*\{/, "context rule targets .cn-icon inside buttons");
  assert.match(context, /\.fab/, "context rule covers fabs");

  // Every size other than the target small collapses to the button icon size,
  // so any size selection renders at the control's size.
  for (const token of [
    "--cn-icon-size-xsmall",
    "--cn-icon-size",
    "--cn-icon-size-large",
    "--cn-icon-size-xlarge",
  ]) {
    const re = new RegExp(`${token.replace(/-/g, "\\-")}\\s*:\\s*var\\(\\s*--cn-icon-size-small\\s*\\)`);
    assert.match(context, re, `${token} collapses to the button icon size`);
  }

  // The small token is the target and is not redefined by the context rule.
  assert.ok(
    !/--cn-icon-size-small\s*:/.test(context),
    "the small token is not redefined by the context rule",
  );

  // Contextual sizing sets the public tokens; it must not force the
  // component's private dimension variable (v20's --icon-dim !important bug).
  assert.ok(!/--icon-dim/.test(css), "the context rule does not touch the private --icon-dim");
});

test("community registry generation is deterministic (--check passes)", () => {
  const script = fileURLToPath(new URL("../scripts/generate-icon-registry.mjs", import.meta.url));
  // Throws (non-zero exit) if the committed registry is stale.
  execFileSync("node", [script, "--check"], { stdio: "pipe" });
});
