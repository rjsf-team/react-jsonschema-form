import { enumOptionValueEncoder } from '../src';

describe('enumOptionValueEncoder', () => {
  describe("when format is 'indexed'", () => {
    it('returns the index as a string', () => {
      expect(enumOptionValueEncoder('hello', 2, 'indexed')).toBe('2');
    });
    it('returns the index for numeric values', () => {
      expect(enumOptionValueEncoder(123, 0, 'indexed')).toBe('0');
    });
    it('returns the index for object values', () => {
      expect(enumOptionValueEncoder({ name: 'test' }, 1, 'indexed')).toBe('1');
    });
    it('defaults to indexed when format is omitted', () => {
      expect(enumOptionValueEncoder('hello', 2)).toBe('2');
    });
  });

  describe("when format is 'realValue'", () => {
    it('returns String(value) for string values', () => {
      expect(enumOptionValueEncoder('hello', 2, 'realValue')).toBe('hello');
    });
    it('returns String(value) for numeric values', () => {
      expect(enumOptionValueEncoder(123, 0, 'realValue')).toBe('123');
    });
    it('returns String(value) for boolean values', () => {
      expect(enumOptionValueEncoder(true, 0, 'realValue')).toBe('true');
    });
    it('falls back to index for object values', () => {
      expect(enumOptionValueEncoder({ name: 'test' }, 1, 'realValue')).toBe('1');
    });
    it('falls back to index for array values', () => {
      expect(enumOptionValueEncoder([1, 2], 0, 'realValue')).toBe('0');
    });
    it('returns empty string for undefined', () => {
      expect(enumOptionValueEncoder(undefined, 0, 'realValue')).toBe('');
    });
    it('returns empty string for null', () => {
      expect(enumOptionValueEncoder(null, 0, 'realValue')).toBe('');
    });
  });
});
