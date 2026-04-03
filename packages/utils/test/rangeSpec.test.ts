import { rangeSpec } from '../src';

describe('rangeSpec()', () => {
  it('returns an empty object when the schema does not contain range info', () => {
    expect(rangeSpec({})).toEqual({});
  });
  it('returns an full range spec when the schema contains non-zero range info', () => {
    expect(rangeSpec({ multipleOf: 1, minimum: 1, maximum: 2 })).toEqual({
      step: 1,
      min: 1,
      max: 2,
    });
  });
  it('returns an partial range spec when the schema contains zero range info', () => {
    expect(rangeSpec({ multipleOf: 0, minimum: 0, maximum: 0 })).toEqual({
      min: 0,
      max: 0,
    });
  });
  it('returns min/max from formatMinimum/formatMaximum for format: date', () => {
    expect(rangeSpec({ format: 'date', formatMinimum: '2020-01-01', formatMaximum: '2025-12-31' } as any)).toEqual({
      min: '2020-01-01',
      max: '2025-12-31',
    });
  });
  it('returns min/max from formatMinimum/formatMaximum for format: date-time', () => {
    expect(
      rangeSpec({
        format: 'date-time',
        formatMinimum: '2020-01-01T00:00:00Z',
        formatMaximum: '2025-12-31T23:59:59Z',
      } as any),
    ).toEqual({
      min: '2020-01-01T00:00:00Z',
      max: '2025-12-31T23:59:59Z',
    });
  });
  it('returns min/max from formatMinimum/formatMaximum for format: time', () => {
    expect(rangeSpec({ format: 'time', formatMinimum: '08:00:00', formatMaximum: '18:00:00' } as any)).toEqual({
      min: '08:00:00',
      max: '18:00:00',
    });
  });
  it('returns only min when only formatMinimum is set on a date schema', () => {
    expect(rangeSpec({ format: 'date', formatMinimum: '2020-01-01' } as any)).toEqual({ min: '2020-01-01' });
  });
  it('returns only max when only formatMaximum is set on a date schema', () => {
    expect(rangeSpec({ format: 'date', formatMaximum: '2025-12-31' } as any)).toEqual({ max: '2025-12-31' });
  });
  it('ignores minimum/maximum on date schemas in favour of formatMinimum/formatMaximum', () => {
    expect(
      rangeSpec({
        format: 'date',
        minimum: 0,
        maximum: 100,
        formatMinimum: '2020-01-01',
        formatMaximum: '2025-12-31',
      } as any),
    ).toEqual({
      min: '2020-01-01',
      max: '2025-12-31',
    });
  });
  it('returns empty object for date schema with no formatMinimum/formatMaximum', () => {
    expect(rangeSpec({ format: 'date' } as any)).toEqual({});
  });
  it('resolves now() expression in formatMinimum for format: date', () => {
    const result = rangeSpec({ format: 'date', formatMinimum: 'now()' } as any);
    expect(result.min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('resolves now() expression in formatMaximum for format: date', () => {
    const result = rangeSpec({ format: 'date', formatMaximum: 'now()+86400' } as any);
    expect(result.max).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('resolves now() expression for format: date-time', () => {
    const result = rangeSpec({ format: 'date-time', formatMinimum: 'now()-3600' } as any);
    expect(result.min).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});
