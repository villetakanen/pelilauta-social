# UAT initialization amendment plan

This plan proposes changes to the shared starting data for acceptance journeys and
persona QA. It draws on the three reports dated 2026-09-21 and source inspection;
the investigation did not inspect or reset the running database.

## Evidence and scope

The [community-member report](reports/2026-09-21-qa-community-member.md) contains
a failed report envelope with a readable `structured_output` payload. Its narrative
and findings remain usable evidence, but the report parser failed. The
[first-time visitor](reports/2026-09-21-qa-first-time-visitor.md) and
[game master](reports/2026-09-21-qa-game-master.md) reports rendered normally.

| Experience or finding | Relationship to initialization | Planned response |
| :--- | :--- | :--- |
| The visitor and community member saw “Test Channel”. | `seed/meta.json` deliberately includes the API fixture in the public channel list. This is unsuitable seed content, rather than missing data. | Remove the channel from the shared UAT baseline. Retain API-suite initialization of its fixture. |
| The visitor found few replies. | Five seed threads share one reply. Four threads start without a conversation. | Add short Finnish exchanges to existing threads. |
| The visitor sought beginner or D&D material and eventually browsed the D&D tag. | Beginner content and a D&D-style wiki already exist, but seed threads and pages have no structured tags. Initialization neither writes nor resets the separate `tags` index. | Tag selected existing content and rebuild its index during initialization. The report does not establish what results the visitor actually saw. |
| The community member sought a suitable homebrew announcement venue. | Existing channel descriptions and discussions supported the decision. No failure occurred, but the seed contains no comparable announcement. | Add one Finnish homebrew announcement with a reader response as a representative example. |
| The game master found the campaign examples convincing. | The current wiki pages already demonstrate characters, session logs, agreements, and navigation. | Preserve these examples and their stable keys. |
| The game master explored assets, members, clocks, secrets, and exports. | The report establishes exploration, without demonstrating that every tool had populated data or that every operation succeeded. | Defer additional tool fixtures until a journey requires them. |
| Search and library redirected the visitor to login. | Both routes call `requireSession`; seed data cannot change that access decision. | Exclude authentication and navigation changes from this amendment. |
| The footer Info link failed, translation keys appeared, the library button was ambiguous, and page creation needed another step. | These findings concern routes, translations, labels, and interaction behavior. | Track application corrections separately. The test login form also belongs to the test environment, not the seed. |
| The community-member report failed to render. | `agents/qa/run.sh` accepts a narrative object or JSON in `response`, but the captured result uses `structured_output`. | Treat parser repair as separate QA tooling work. |

## Implementation sequence

### 1. Make the shared content representative

Amend `uat/pelilauta/e2e/seed/meta.json`, `threads.json`, `replies.json`, and
`pages.json`:

- Remove `test-channel` from the UAT channel list. The API suite already creates
  it in `apps/pelilauta/test/api/init-api-test-db.js`; retain its slug and API
  test references there. Run UAT initialization after any API suite that adds it
  and before persona QA.
- Give the beginner thread and hexcrawl thread two replies each, alternating the
  two existing member accounts. Keep the solo thread unanswered so the baseline
  still includes an empty discussion.
- Add one homebrew announcement to `roolipelit`, with a substantive description,
  `#osr` and `#homebrew` tags, and one reply. Use a Finnish title without `QA:`;
  that prefix identifies material created by persona runs for cleanup.
- Add D&D and beginner tags to the beginner thread and a D&D tag to the existing
  Gloamroad front page. Keep visible hashtags and structured `tags` consistent.
  Use the application's existing tag normalization and synonym rules.
- Reconcile `replyCount` and channel `threadCount` with the resulting documents.
  Preserve the horror thread's key, title, image, and zero initial reactions:
  `threads/react-to-front-page-thread.spec.ts` relies on those values.

Reuse the existing account placeholders. Preserve the hidden site and documentless
`newUser` required by the visibility and onboarding journeys. Do not add accounts,
campaigns, or binary assets for this amendment.

### 2. Initialize the derived tag index

Amend `uat/pelilauta/e2e/reset-and-seed.ts` to reset `tags` alongside the collections
whose source documents it deletes. Otherwise, prior UAT or QA entries can outlive
their threads and pages.

After resolving and parsing source documents, derive index entries from tagged
public threads and eligible public pages. Reuse
`apps/pelilauta/src/utils/shared/toTagData.ts`, `TagSchema`, and the document-id
conventions in the existing thread and page tag writers. Check the page writer's
visibility conditions before implementation; exclude the hidden site's content.
Keep the source JSON as the content authority rather than maintaining a second
handwritten inventory of tag entries.

Validate compound keys, referenced parents and authors, counts, and tag entries
before database deletion or uploads. Exercise these checks without credentials
using resolved fixture values. Preserve the test-project restriction and verify
that Storage also targets the intended test environment before uploads.

### 3. Use the same initialization before persona QA

`agents/qa/run.sh` starts or reuses a server but performs no database initialization.
Document the existing standalone reset-and-seed command from the seeder's header
in `agents/qa/AGENTS.md`, with a reference to
[Acceptance Testing](ACCEPTANCE_TESTING.md) for environment setup.

Initialize once before the persona batch, await completion, and run no API tests
or other database writers between initialization and the batch. Confirm that the
dev server uses the same test project. Keep initialization explicit because it
deletes test content; do not make opening the QA runner silently reset the database.
Retain the existing cleanup procedure after personas create content.

Update [Acceptance-Testing Seed](acceptance-testing-seed.md) with the resulting
inventory and derived-index behavior. Update the reset collection list in
[Acceptance Testing](ACCEPTANCE_TESTING.md) when implementation changes it.

## Verification and completion

During implementation, use focused unit checks for fixture relationships, tag
normalization, hidden-content exclusion, and index reconstruction. Run the relevant
type, unit, and prose gates from [delivery.yaml](../delivery.yaml). Reserve
`pnpm test:uat` for release acceptance.

Add a visitor journey that follows a seeded D&D tag to the beginner thread and
Gloamroad page, opens both results, and reads the seeded replies. Assert visible
content and navigable destinations rather than Firestore writes. Preserve the
existing reaction, registration, wiki, and hidden-site journeys.

At an authorized test-database initialization, verify these outcomes:

- `/channels` lists the three community channels without the API fixture.
- The beginner and hexcrawl discussions each show two replies with valid profiles.
- The homebrew announcement appears in `roolipelit` and its tag listing.
- D&D tag browsing works while signed out and reaches the seeded thread and page.
- A second initialization removes an obsolete test tag entry and recreates the same
  content relationships without duplicates or links to deleted QA material.
- The three personas can start from the documented baseline without depending on
  content from an earlier run.

Keep route, translation, access, and report-parser failures visible as separate
findings if they recur. Successful seeding does not resolve those defects.

This task delivers the plan only. Implementation and database resets remain pending;
any destructive reset requires the explicit confirmation specified in `AGENTS.md`.
