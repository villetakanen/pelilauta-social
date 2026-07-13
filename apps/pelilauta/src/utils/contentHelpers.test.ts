import { describe, expect, it, vi } from 'vitest';
import { toDisplayString } from './contentHelpers';

describe('contentHelpers', () => {
  describe('toDisplayString', () => {
    it('should format absolute date by default', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      expect(toDisplayString(date)).toBe('2023-01-01');
    });

    it('should handle undefined date', () => {
      expect(toDisplayString(undefined)).toBe('N/A');
    });

    it('should format relative time (seconds)', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const past = new Date(now.getTime() - 5000); // 5 seconds ago
      expect(toDisplayString(past, true)).toBe('5 sekuntia sitten');

      vi.useRealTimers();
    });

    it('should format relative time (minutes)', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const past = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      expect(toDisplayString(past, true)).toBe('5 minuuttia sitten');
      vi.useRealTimers();
    });

    it('should format relative time (hours)', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const past = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      expect(toDisplayString(past, true)).toBe('2 tuntia sitten');
      vi.useRealTimers();
    });

    it('should format relative time (days)', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      expect(toDisplayString(past, true)).toBe('3 päivää sitten');
      vi.useRealTimers();
    });

    it('should support custom locale (en)', () => {
      const now = new Date('2023-01-01T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const past = new Date(now.getTime() - 5000);
      expect(toDisplayString(past, true, 'en')).toBe('5 seconds ago');
      vi.useRealTimers();
    });
  });
});
