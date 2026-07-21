import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Vite plugin that resolves the optional `@myrrys/proprietary` managed icon
 * tier without making it a hard build dependency (review BLOCKER 1).
 *
 * When the submodule's registry is present, the import resolves to it as usual
 * and the artwork is inlined at build time. When it is absent (submodule not
 * checked out, or access revoked), the import resolves to an inline virtual
 * module that yields no icons, so the build succeeds and the Icon component
 * degrades to its bundled fallback → missing glyph. No stub file is committed
 * to the repository.
 *
 * @param {URL} realUrl - URL of the real registry entry point.
 */
export function optionalProprietary(realUrl) {
  const realPath = fileURLToPath(realUrl);
  const SPEC = "@myrrys/proprietary";
  const VIRTUAL = "\0virtual:myrrys-proprietary-empty";
  /** @type {import("vite").Plugin} */
  const plugin = {
    name: "optional-myrrys-proprietary",
    enforce: "pre",
    resolveId(id) {
      if (id === SPEC) return existsSync(realPath) ? realPath : VIRTUAL;
      if (id === VIRTUAL) return VIRTUAL;
      return null;
    },
    load(id) {
      if (id === VIRTUAL) {
        return "export const getIcon = () => undefined;\nexport const getNouns = () => [];\n";
      }
      return null;
    },
  };
  return plugin;
}
