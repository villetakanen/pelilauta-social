import { z } from 'zod';

/**
 * Shared license constants for content and assets.
 *
 * These licenses are used across:
 * - Site metadata (SiteSchema)
 * - Asset metadata (AssetSchema)
 * - Any other content that needs licensing information
 *
 * License translations are available in i18n files under `site:license.*`
 */

/**
 * Available license keys as a const array for TypeScript literal types
 */
export const LICENSE_KEYS = [
  '0', // All rights reserved (default, no license)
  'cc-by', // Creative Commons Attribution 4.0
  'cc-by-sa', // Creative Commons Attribution-ShareAlike 4.0
  'cc-by-nc', // Creative Commons Attribution-NonCommercial 4.0
  'cc-by-nc-sa', // Creative Commons Attribution-NonCommercial-ShareAlike 4.0
  'cc0', // Creative Commons Zero (Public Domain Dedication)
  'public-domain', // Public Domain
  'OGL', // Open Game License (for RPG content)
] as const;

/**
 * Zod enum for license validation in schemas
 */
export const LicenseSchema = z
  .enum([
    '0',
    'cc-by',
    'cc-by-sa',
    'cc-by-nc',
    'cc-by-nc-sa',
    'cc0',
    'public-domain',
    'OGL',
  ])
  .default('0');

/**
 * TypeScript type for license keys
 */
export type LicenseKey = (typeof LICENSE_KEYS)[number];

/**
 * Helper to check if a string is a valid license key
 */
export function isValidLicense(license: string): license is LicenseKey {
  return LICENSE_KEYS.includes(license as LicenseKey);
}

/**
 * Helper to get the i18n key for a license
 * Use with t() function: t(getLicenseI18nKey('cc-by'))
 */
export function getLicenseI18nKey(license: LicenseKey): string {
  return `site:license.${license}`;
}

/**
 * Helper to get the license link (if available)
 * Returns undefined for licenses without standard links
 */
export function getLicenseLinkI18nKey(license: LicenseKey): string | undefined {
  const licensesWithLinks: LicenseKey[] = [
    'cc-by',
    'cc-by-sa',
    'cc-by-nc',
    'cc-by-nc-sa',
    'cc0',
  ];

  if (licensesWithLinks.includes(license)) {
    return `site:license.links.${license}`;
  }

  return undefined;
}
