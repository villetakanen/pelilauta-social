# Critical dependency triage

## Scope and conclusion

The 2026-10-23 production-dependency audit reported five critical findings across
four advisories. Astro accounts for two findings because both applications resolve
7.2.0. The other affected versions are protobufjs 7.5.4, websocket-driver 0.7.4,
and tar 7.5.2.

The triage checked source, installed dependencies, and local build output. It did
not verify deployed configuration or establish a public exploit. It ran no
advisory proof of concept and changed no dependency or runtime configuration.
Source references in the triage sections identify the inspected pre-upgrade
versions; the applied remediation follows those sections.

Prioritize the AVIF decoder update, including the local Netlify image proxy.
Resolve the three remaining vulnerable transitive versions within their parents'
existing ranges. Preserve the image service, Firebase providers, and deployment
configuration.

## Astro and Sharp: image-processing exposure

[GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2)
requires processing an attacker-controlled AVIF through the affected Sharp/libheif
stack. The inspected Sharp version was 0.34.5 with libheif 1.20.2. The advisory
identifies Astro 7.2.8 and Sharp 0.35.4 as the patched floor.

The application uses the Netlify image service rather than a local Sharp
transformer. `apps/pelilauta/astro.config.mjs:122` enables the Netlify adapter
without disabling its Image CDN integration. The inspected adapter, version 8.2.0, selects
`@astrojs/netlify/image-service.js` in `dist/index.js:465`; that service constructs
`/.netlify/images` URLs and supplies no `transform` method. The generated
`generic_CZmShUfu.mjs` chunk confirms this entry point. Astro's image endpoint
rejects a service without `transform` before fetching or decoding an image
(`node_modules/astro/dist/assets/endpoint/generic.js:10`).

Application image helpers also use `/.netlify/images`
(`apps/pelilauta/src/utils/images/netlifyImage.ts:73`). This does not establish
which decoder version Netlify's production Image CDN runs.

The inspected local development path decoded images with that Sharp version.
`node_modules/@netlify/images/dist/main.js:78` passes allowed image requests to
IPX; `node_modules/ipx/dist/shared/ipx.CXJeaylD.mjs:427` creates a Sharp pipeline
from the fetched bytes. IPX 3.1.1 resolved Sharp 0.34.5 and declared `^0.34.3`,
which excludes the patched 0.35 line. Updating Astro alone must not be treated
as proof that this second decoder path is patched.

The design application builds static output
(`apps/design/astro.config.mjs:22`). No public request-time image processor or
untrusted asset publishing path was found there; repository and build inputs
remain its relevant trust boundary.

The registry supplies a supported upstream development-image update chain:
`@astrojs/netlify` 8.2.10 accepts Astro 7 and depends on
`@netlify/vite-plugin` `^3.0.1`; that line uses `@netlify/dev` 5, whose 5.1.10
release depends on `@netlify/images` 2.0.5. The latter uses IPX 4.0.0 with Sharp
`^0.35.5`. Verify the resolved chain rather than forcing Sharp outside IPX's
current declared range.

## protobufjs: no untrusted schema input found

[GHSA-xq3m-2v4x-88gg](https://github.com/advisories/GHSA-xq3m-2v4x-88gg)
requires attacker control over a protobuf schema or JSON descriptor that reaches
runtime code generation. Ordinary message fields under trusted schemas do not
meet that precondition.

The vulnerable telemetry copy resolves through `@opentelemetry/otlp-transformer`.
Its installed `build/src/generated/root.js:3` imports `protobufjs/minimal` and
contains fixed generated OpenTelemetry types. Searches of application code found
no protobuf schema-loading or reflection API exposed to uploads, Markdown,
settings, or API inputs. Admin Firestore now resolves a separate patched 7.6.6
copy; that does not replace the telemetry copy.

The transformer declares protobufjs `^7.3.0`, so 7.6.6 fits its existing range and
covers the additional protobuf advisories beyond the critical patch at 7.5.5.
Refresh every remaining vulnerable resolution and recheck actual consumers;
audit paths alone do not enumerate them all.

## websocket-driver: unused RTDB and legacy server framing

[GHSA-xv26-6w52-cph6](https://github.com/advisories/GHSA-xv26-6w52-cph6)
concerns legacy WebSocket draft length parsing. Firebase's Node Realtime Database
build imports Faye (`node_modules/@firebase/database/dist/node-esm/index.node.esm.js:1`).
Faye's client uses outbound `driver.client` connections
(`node_modules/faye-websocket/lib/faye/websocket/client.js:18`). The legacy
server-handshake dispatcher is separate
(`node_modules/websocket-driver/lib/websocket/driver/server.js:93`).

The application initializers use Auth and Firestore, and tracked source searches
found no RTDB initialization or application WebSocket server. A `databaseURL`
configuration field does not initialize RTDB. The installed dependency therefore
does not establish an attacker-reachable legacy WebSocket parser.

Faye declares websocket-driver `>=0.5.1`; patched 0.7.5 fits that range. This
requires no Firebase major upgrade or provider change.

## tar: installer and packaging exposure

[GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw)
requires extracting an attacker-controlled archive. The affected installed copy
at triage was `node_modules/@mapbox/node-pre-gyp/node_modules/tar` 7.5.2.

`node_modules/@mapbox/node-pre-gyp/lib/install.js:26` downloads native binaries
and pipes them into `tar.extract` at line 100. The installer derives its source
from package and command options. NFT references node-pre-gyp for binary tracing
(`node_modules/@vercel/nft/out/analyze.js:23`), which does not itself establish
that extraction runs on application requests.

No public API input was found flowing into this extractor. The site's export
helper creates ZIP downloads with JSZip
(`apps/pelilauta/src/firebase/client/site/createSiteExport.ts:8`); it does not
extract TAR uploads.

node-pre-gyp declares tar `^7.4.0`. Patched 7.5.22 is already installed on other
workspace paths and satisfies that range. Collapse the vulnerable resolution to
a supported patched version and verify packaging.

## Proposed remediation and verification

Update both Astro consumers to a patched 7.x release with Sharp at or above the
advisory's patched floor. Include the supported Netlify adapter update so the
local image proxy also receives the patched decoder. Refresh the three compatible
transitive resolutions without introducing a second application router or changing
service configuration.

Run both application type checks and builds, workspace unit tests and lint, the
app browser regressions, the design browser suite, and generated Netlify function
checks. Inspect every resolved Sharp/libheif path and repeat the audit. Native
image dependencies and both Astro consumers make this broader than a lockfile-only
cleanup. Production exposure and any remaining noncritical findings require
separate assessment.

## Applied remediation (2026-10-26)

The operator approved the patch set and the subsequent SSR bundling amendment.
Both applications now declare Astro `^7.2.8` and Node `>=22.12.0`. The app declares
Netlify adapter `^8.2.10`. The resolved image pipeline uses Sharp 0.35.5 and
libheif 1.23.5 in both Astro and the local Netlify/IPX path. Each decoder passed
a benign in-memory AVIF-to-WebP conversion on Node 22.23.4.

The lockfile resolves protobufjs 7.6.6, websocket-driver 0.7.5, and tar 7.5.22.
The older vulnerable resolutions are absent. The resolved versions satisfy the
existing parent ranges; the final workspace adds no permanent overrides or new
package-linking tooling.

The upgraded build exposed three packaging gaps. The RSS endpoint's Blobs client
and its runtime helper were absent from the generated function. Astro also
resolved an older external internal-helper package without `stripRequestBase`.
The existing SSR bundling allowlist now includes `@netlify/blobs`,
`@netlify/runtime-utils`, and `@astrojs/internal-helpers`. Firebase Admin remains
external. Image-service configuration, remote-image policy, Firebase providers,
and public addresses remain unchanged.

The build check now imports the complete server entry from an isolated function
copy with `require(ESM)` disabled, in addition to its Markdown sanitization check.
`test/netlify/cached-rss.mjs` exercises the generated RSS endpoint with a synthetic
Blobs context and a mock backend, verifies a cache-hit response, and restores its
globals. It contacts no platform cache or feed provider.

| Check | Result |
| :--- | :--- |
| Frozen workspace installation | Passed without permanent dependency overrides. |
| Workspace unit suite | All 1,158 tests passed. |
| App and design type checks and production builds | Passed; the existing app Zod deprecation hint remains. |
| App browser suite on Node 22 | All 60 tests passed. |
| Design browser suite | All 389 tests passed. |
| Isolated generated SSR import on Node 22 | Passed with `require(ESM)` disabled. |
| Generated protected-recovery and cached-RSS checks on Node 22 | Passed. |
| Native AVIF conversion in both image-processing paths on Node 22 | Passed. |
| Lint | Passed with four existing warnings. |
| Independent bounded implementation review | No blocker found. |

The production-dependency audit now reports zero critical findings, with 14 low,
41 moderate, and 42 high findings remaining. The full workspace audit, including
development dependencies, also reports zero critical findings; it retains 22 low,
79 moderate, and 62 high findings. This patch does not assess or clear those
noncritical findings.

Verification servers started for this work have stopped. The work changes no
production data or authentication configuration. No commit or deployment occurred,
and UAT remains reserved for release review.
