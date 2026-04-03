import { resolveDynamicDates } from '../src/resolveDynamicDates';

const TODAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

describe('resolveDynamicDates()', () => {
  it('returns static date schemas unchanged', () => {
    const schema = { type: 'string', format: 'date', formatMinimum: '2020-01-01', formatMaximum: '2025-12-31' };
    const result = resolveDynamicDates(schema as any);
    expect(result.formatMinimum).toBe('2020-01-01');
    expect(result.formatMaximum).toBe('2025-12-31');
  });

  it('resolves now() in a top-level date field', () => {
    const schema = { type: 'string', format: 'date', formatMinimum: 'now()', formatMaximum: 'now()+2592000' };
    const result = resolveDynamicDates(schema as any);
    expect(result.formatMinimum).toMatch(TODAY_RE);
    expect(result.formatMaximum).toMatch(TODAY_RE);
  });

  it('resolves now() in a date-time field', () => {
    const schema = { type: 'string', format: 'date-time', formatMinimum: 'now()-3600' };
    const result = resolveDynamicDates(schema as any);
    expect(result.formatMinimum).toMatch(DATETIME_RE);
  });

  it('does not modify non-date fields', () => {
    const schema = { type: 'number', minimum: 0, maximum: 100 };
    const result = resolveDynamicDates(schema as any);
    expect(result).toEqual(schema);
  });

  it('resolves now() inside properties', () => {
    const schema = {
      type: 'object',
      properties: {
        birthDate: { type: 'string', format: 'date', formatMaximum: 'now()' },
        name: { type: 'string' },
      },
    };
    const result = resolveDynamicDates(schema as any);
    expect((result.properties!.birthDate as any).formatMaximum).toMatch(TODAY_RE);
    expect((result.properties!.name as any).formatMaximum).toBeUndefined();
  });

  it('resolves now() inside definitions', () => {
    const schema = {
      definitions: {
        DateField: { type: 'string', format: 'date', formatMinimum: 'now()' },
      },
    };
    const result = resolveDynamicDates(schema as any);
    expect((result.definitions!.DateField as any).formatMinimum).toMatch(TODAY_RE);
  });

  it('resolves now() inside allOf', () => {
    const schema = {
      allOf: [{ type: 'string', format: 'date', formatMinimum: 'now()' }],
    };
    const result = resolveDynamicDates(schema as any);
    expect((result.allOf![0] as any).formatMinimum).toMatch(TODAY_RE);
  });

  it('resolves now() inside anyOf', () => {
    const schema = {
      anyOf: [{ type: 'string', format: 'date', formatMaximum: 'now()' }],
    };
    const result = resolveDynamicDates(schema as any);
    expect((result.anyOf![0] as any).formatMaximum).toMatch(TODAY_RE);
  });

  it('resolves now() inside oneOf', () => {
    const schema = {
      oneOf: [{ type: 'string', format: 'date', formatMinimum: 'now()-86400' }],
    };
    const result = resolveDynamicDates(schema as any);
    expect((result.oneOf![0] as any).formatMinimum).toMatch(TODAY_RE);
  });

  it('resolves now() inside if/then/else', () => {
    const schema = {
      if: { type: 'string', format: 'date', formatMinimum: 'now()' },
      then: { type: 'string', format: 'date', formatMaximum: 'now()+86400' },
      else: { type: 'string', format: 'date', formatMinimum: 'now()-86400' },
    };
    const result = resolveDynamicDates(schema as any);
    expect((result as any).if.formatMinimum).toMatch(TODAY_RE);
    expect((result as any).then.formatMaximum).toMatch(TODAY_RE);
    expect((result as any).else.formatMinimum).toMatch(TODAY_RE);
  });

  it('resolves now() inside array items (object form)', () => {
    const schema = {
      type: 'array',
      items: { type: 'string', format: 'date', formatMinimum: 'now()' },
    };
    const result = resolveDynamicDates(schema as any);
    expect((result.items as any).formatMinimum).toMatch(TODAY_RE);
  });

  it('resolves now() inside array items (tuple form)', () => {
    const schema = {
      type: 'array',
      items: [{ type: 'string', format: 'date', formatMinimum: 'now()' }],
    };
    const result = resolveDynamicDates(schema as any);
    expect(((result.items as any[])[0] as any).formatMinimum).toMatch(TODAY_RE);
  });

  it('does not mutate the original schema', () => {
    const schema = { type: 'string', format: 'date', formatMinimum: 'now()' };
    resolveDynamicDates(schema as any);
    expect(schema.formatMinimum).toBe('now()');
  });
  it('preserves boolean property values in properties (e.g. additionalProperties: true)', () => {
    const schema = { type: 'object', properties: { foo: true } };
    const result = resolveDynamicDates(schema as any);
    expect((result.properties as any).foo).toBe(true);
  });
  it('preserves boolean values in definitions', () => {
    const schema = { definitions: { Noop: true } };
    const result = resolveDynamicDates(schema as any);
    expect((result.definitions as any).Noop).toBe(true);
  });
  it('leaves items unchanged when it is false', () => {
    const schema = { type: 'array', items: false };
    const result = resolveDynamicDates(schema as any);
    expect(result.items).toBe(false);
  });
  it('leaves items unchanged when it is true', () => {
    const schema = { type: 'array', items: true };
    const result = resolveDynamicDates(schema as any);
    expect(result.items).toBe(true);
  });
});
