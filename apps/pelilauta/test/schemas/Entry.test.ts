import { EntrySchema } from 'src/schemas/EntrySchema';
import { describe, expect, it } from 'vitest';

describe('EntrySchema', () => {
  it('should validate a valid entry with all fields', () => {
    const validData = {
      key: 'test-key-123',
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-16T12:30:00Z'),
      flowTime: 1673865000000, // Example timestamp
      owners: ['user-abc', 'user-xyz'],
    };
    const result = EntrySchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.key).toBe('test-key-123');
      expect(result.data.createdAt).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(result.data.updatedAt).toEqual(new Date('2024-01-16T12:30:00Z'));
      expect(result.data.flowTime).toBe(1673865000000);
      expect(result.data.owners).toEqual(['user-abc', 'user-xyz']);
    }
  });

  it('should use default values for key, flowTime, and owners if not provided', () => {
    const minimalData = {};
    const result = EntrySchema.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.key).toBe('');
      expect(result.data.createdAt).toBeUndefined();
      expect(result.data.updatedAt).toBeUndefined();
      expect(result.data.flowTime).toBe(0);
      expect(result.data.owners).toEqual([]);
    }
  });

  it('should correctly parse string dates for createdAt and updatedAt', () => {
    const dataWithDateStrings = {
      createdAt: '2024-02-20T08:00:00.000Z',
      updatedAt: '2024-02-21T09:30:00.000Z',
    };
    const result = EntrySchema.safeParse(dataWithDateStrings);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createdAt).toEqual(
        new Date('2024-02-20T08:00:00.000Z'),
      );
      expect(result.data.updatedAt).toEqual(
        new Date('2024-02-21T09:30:00.000Z'),
      );
    }
  });

  it('should allow createdAt and updatedAt to be undefined', () => {
    const dataWithoutDates = {
      key: 'no-dates-key',
      flowTime: 100,
      owners: ['owner1'],
    };
    const result = EntrySchema.safeParse(dataWithoutDates);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createdAt).toBeUndefined();
      expect(result.data.updatedAt).toBeUndefined();
    }
  });

  it('should fail validation if key is not a string', () => {
    const invalidData = { key: 123 };
    const result = EntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail validation if createdAt is an invalid date string', () => {
    const invalidData = { createdAt: 'not-a-real-date' };
    const result = EntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail validation if updatedAt is an invalid date string', () => {
    const invalidData = { updatedAt: 'invalid-date-format' };
    const result = EntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail validation if flowTime is not a number', () => {
    const invalidData = { flowTime: 'not-a-number' };
    const result = EntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail validation if owners is not an array of strings', () => {
    const invalidData = { owners: ['user1', 123] }; // 123 is not a string
    const result = EntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail validation if owners is not an array', () => {
    const invalidData = { owners: 'not-an-array' };
    const result = EntrySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept an empty owners array', () => {
    const dataWithEmptyOwners = {
      owners: [],
    };
    const result = EntrySchema.safeParse(dataWithEmptyOwners);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.owners).toEqual([]);
    }
  });

  it('should correctly coerce numeric string for flowTime', () => {
    const dataWithNumericStringFlowTime = {
      flowTime: '12345',
    };
    const result = EntrySchema.safeParse(dataWithNumericStringFlowTime);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.flowTime).toBe(12345);
    }
  });
});
