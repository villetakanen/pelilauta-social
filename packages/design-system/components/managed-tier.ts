/**
 * Optional loader for the managed icon tier (@myrrys/proprietary).
 *
 * The managed tier is a non-licensed, optional source: the submodule may be
 * absent (not checked out) or its access revoked. Loading it through a guarded
 * dynamic import means that when it is unavailable at runtime, `getManagedIcon`
 * degrades to yielding nothing and the Icon component falls through to the
 * bundled fallback → missing glyph instead of throwing. Addresses review
 * BLOCKER 1 (managed tier must not be a hard runtime dependency).
 *
 * Note: this makes the tier optional at runtime. The Vite alias still resolves
 * the module at build time, so a build performed with the submodule checked out
 * inlines the registry as normal; the guard covers the module being unavailable
 * when the server code actually runs.
 */
export interface IconEntry {
  inner: string;
  viewBox: string;
}

type GetIcon = (noun: string) => IconEntry | undefined;
type GetNouns = () => string[];

let getManagedIcon: GetIcon = () => undefined;
// Enumerating the managed tier lets the design-system book list every managed
// icon when the submodule is present (iconography spec). It degrades to an
// empty list when the tier is unavailable, exactly like getManagedIcon.
let getManagedNouns: GetNouns = () => [];

try {
  const managed = await import("@myrrys/proprietary");
  getManagedIcon = managed.getIcon as GetIcon;
  if (typeof managed.getNouns === "function") {
    getManagedNouns = managed.getNouns as GetNouns;
  }
} catch {
  // Proprietary registry unavailable — the managed tier stays empty.
}

export { getManagedIcon, getManagedNouns };
