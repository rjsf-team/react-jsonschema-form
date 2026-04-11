import { getOptionValueFormat } from '../src';

describe('getOptionValueFormat', () => {
  it("defaults to 'indexed' when options is undefined", () => {
    expect(getOptionValueFormat()).toBe('indexed');
  });

  it("defaults to 'indexed' when optionValueFormat is not set", () => {
    expect(getOptionValueFormat({})).toBe('indexed');
  });

  it("defaults to 'indexed' when optionValueFormat is undefined", () => {
    expect(getOptionValueFormat({ optionValueFormat: undefined })).toBe('indexed');
  });

  it("returns 'indexed' when explicitly set", () => {
    expect(getOptionValueFormat({ optionValueFormat: 'indexed' })).toBe('indexed');
  });

  it("returns 'realValue' when explicitly set", () => {
    expect(getOptionValueFormat({ optionValueFormat: 'realValue' })).toBe('realValue');
  });
});
