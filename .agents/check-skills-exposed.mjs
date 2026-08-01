/**
 * check-skills-exposed.mjs
 *
 * Skills are authored in .agents/skills/ and reach Claude Code through an entry in
 * .claude/skills/. That second step is manual, and a skill that misses it does not
 * fail — it is simply never listed, so no session reads it and the work comes out
 * without it. design-system-developer sat unexposed long enough for three
 * implementation runs to ship no book and two to edit a file it forbids touching.
 *
 * Nothing else compares the two directories, which is why this exists rather than a
 * line in a review checklist: the failure is invisible to the agent that suffers it.
 *
 * Run: node .agents/check-skills-exposed.mjs
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const authored = join(root, '.agents/skills');
const exposed = join(root, '.claude/skills');

const skills = readdirSync(authored, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (skills.length === 0) {
  console.error(`No skills found in ${authored}. That is itself a failure.`);
  process.exit(1);
}

const missing = skills.filter((skill) => !existsSync(join(exposed, skill)));

if (missing.length > 0) {
  console.error(
    `These skills are authored but not exposed, so no session can load them:\n` +
      missing.map((skill) => `  ${skill}`).join('\n') +
      `\n\nFix each with:\n` +
      missing
        .map(
          (skill) =>
            `  ln -s ../../.agents/skills/${skill} .claude/skills/${skill}`,
        )
        .join('\n'),
  );
  process.exit(1);
}

console.log(`${skills.length} skills authored, all exposed.`);
