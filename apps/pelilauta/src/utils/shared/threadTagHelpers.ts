/**
 * Thread Tag and Label Helpers
 *
 * This module provides utilities for working with thread tags and labels.
 *
 * **Key Concepts:**
 * - **tags**: Extracted from content fields (title, markdownContent), user-controlled, regenerated on edits
 * - **labels**: Manually assigned by moderators/admins, persistent through edits
 *
 * For full documentation, see: src/docs/76-01-entry-labels-and-tags.md
 */

import type { Thread } from '@schemas/ThreadSchema';

/**
 * Normalizes a tag string for consistent storage and comparison.
 *
 * Rules:
 * - Converts to lowercase
 * - Trims whitespace
 * - Replaces multiple spaces with single space
 *
 * @param tag - The tag string to normalize
 * @returns Normalized tag string
 *
 * @example
 * normalizeTag('  D&D 5e  ') // Returns 'd&d 5e'
 * normalizeTag('Call  of   Cthulhu') // Returns 'call of cthulhu'
 */
export function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Combines and deduplicates tags and labels from a thread.
 *
 * Returns a single array containing all unique tags from both:
 * - `thread.tags` (content-extracted tags)
 * - `thread.labels` (admin-assigned labels)
 *
 * Tags are normalized before deduplication to ensure consistency.
 *
 * @param thread - Thread object (or partial) containing tags and/or labels
 * @returns Array of unique normalized tags, sorted alphabetically
 *
 * @example
 * const thread = {
 *   tags: ['dnd', 'fantasy'],
 *   labels: ['featured', 'DnD']
 * };
 * getAllThreadTags(thread); // Returns ['dnd', 'fantasy', 'featured']
 */
export function getAllThreadTags(thread: Partial<Thread>): string[] {
  const allTags: string[] = [];

  // Add content-extracted tags
  if (thread.tags && Array.isArray(thread.tags)) {
    allTags.push(...thread.tags);
  }

  // Add admin-assigned labels
  if (thread.labels && Array.isArray(thread.labels)) {
    allTags.push(...thread.labels);
  }

  // Normalize and deduplicate
  const normalizedSet = new Set(allTags.map(normalizeTag));

  // Return as sorted array for consistency
  return Array.from(normalizedSet).sort();
}

/**
 * Checks if a given tag is an admin-assigned label on the thread.
 *
 * This is useful for UI rendering (e.g., showing labels with different styling)
 * and for permission checks (only admins can modify labels).
 *
 * @param thread - Thread object (or partial) containing labels
 * @param tag - Tag string to check
 * @returns True if the tag exists in thread.labels, false otherwise
 *
 * @example
 * const thread = {
 *   tags: ['dnd', 'fantasy'],
 *   labels: ['featured']
 * };
 * isLabel(thread, 'featured'); // Returns true
 * isLabel(thread, 'dnd'); // Returns false
 * isLabel(thread, 'unknown'); // Returns false
 */
export function isLabel(thread: Partial<Thread>, tag: string): boolean {
  if (!thread.labels || !Array.isArray(thread.labels)) {
    return false;
  }

  const normalizedTag = normalizeTag(tag);
  const normalizedLabels = thread.labels.map(normalizeTag);

  return normalizedLabels.includes(normalizedTag);
}
