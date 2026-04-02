import enumOptionValueEncoder from '../src/enumOptionValueEncoder';

describe('enumOptionValueEncoder', () => {
  describe('when useRealValues is false', () => {
    it('returns the index as a string', () => {
      expect(enumOptionValueEncoder('hello', 2, false)).toBe('2');
    });
    it('returns the index for numeric values', () => {
      expect(enumOptionValueEncoder(123, 0, false)).toBe('0');
    });
    it('returns the index for object values', () => {
      expect(enumOptionValueEncoder({ name: 'test' }, 1, false)).toBe('1');
    });
  });

  describe('when useRealValues is true', () => {
    it('returns String(value) for string values', () => {
      expect(enumOptionValueEncoder('hello', 2, true)).toBe('hello');
    });
    it('returns String(value) for numeric values', () => {
      expect(enumOptionValueEncoder(123, 0, true)).toBe('123');
    });
    it('returns String(value) for boolean values', () => {
      expect(enumOptionValueEncoder(true, 0, true)).toBe('true');
    });
    it('falls back to index for object values', () => {
      expect(enumOptionValueEncoder({ name: 'test' }, 1, true)).toBe('1');
    });
    it('falls back to index for array values', () => {
      expect(enumOptionValueEncoder([1, 2], 0, true)).toBe('0');
    });
    it('returns empty string for undefined', () => {
      expect(enumOptionValueEncoder(undefined, 0, true)).toBe('');
    });
    it('returns empty string for null', () => {
      expect(enumOptionValueEncoder(null, 0, true)).toBe('');
    });
  });
});
