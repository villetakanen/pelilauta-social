/**
 * Clock's public surface: the Svelte host and the types a consumer needs to
 * declare `ticks` and read a slice back.
 *
 * `SliceDescriptor` and `Ticks` are exported because a consumer builds the
 * `ticks` prop from them. `Slice`, `SlicePath`, and the geometry functions
 * that build and clamp them are not — they are how the host renders itself,
 * not a surface another package should compute against.
 */

export { default as CnClock } from './CnClock.svelte';
export type { SliceDescriptor, Ticks } from './geometry';
