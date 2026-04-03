import { resolveDateExpression, formatDateForSchema, NOW_EXPRESSION_REGEX } from '../src/resolveDateExpression';

describe('NOW_EXPRESSION_REGEX', () => {
  it('matches "now()"', () => {
    expect(NOW_EXPRESSION_REGEX.test('now()')).toBe(true);
  });
  it('matches "now()+3600"', () => {
    expect(NOW_EXPRESSION_REGEX.test('now()+3600')).toBe(true);
  });
  it('matches "now()-86400"', () => {
    expect(NOW_EXPRESSION_REGEX.test('now()-86400')).toBe(true);
  });
  it('matches "now() + 60" with spaces', () => {
    expect(NOW_EXPRESSION_REGEX.test('now() + 60')).toBe(true);
  });
  it('does not match a static date string', () => {
    expect(NOW_EXPRESSION_REGEX.test('2023-01-01')).toBe(false);
  });
  it('does not match an empty string', () => {
    expect(NOW_EXPRESSION_REGEX.test('')).toBe(false);
  });
});

describe('formatDateForSchema()', () => {
  const date = new Date(2026, 3, 3, 14, 5, 9); // 2026-04-03 14:05:09 local

  it('formats as YYYY-MM-DD for format: date', () => {
    expect(formatDateForSchema(date, 'date')).toBe('2026-04-03');
  });
  it('formats as YYYY-MM-DDTHH:MM:SS for format: date-time', () => {
    expect(formatDateForSchema(date, 'date-time')).toBe('2026-04-03T14:05:09');
  });
  it('formats as HH:MM:SS for format: time', () => {
    expect(formatDateForSchema(date, 'time')).toBe('14:05:09');
  });
  it('defaults to date format for unknown format', () => {
    expect(formatDateForSchema(date, 'unknown')).toBe('2026-04-03');
  });
  it('pads single-digit month, day, hours, minutes, seconds', () => {
    const padDate = new Date(2026, 0, 1, 1, 2, 3); // 2026-01-01 01:02:03
    expect(formatDateForSchema(padDate, 'date-time')).toBe('2026-01-01T01:02:03');
  });
});

describe('resolveDateExpression()', () => {
  it('returns a static date string unchanged', () => {
    expect(resolveDateExpression('2023-01-01', 'date')).toBe('2023-01-01');
  });
  it('returns a static date-time string unchanged', () => {
    expect(resolveDateExpression('2023-01-01T00:00:00Z', 'date-time')).toBe('2023-01-01T00:00:00Z');
  });
  it('resolves "now()" to today formatted as date', () => {
    const before = new Date();
    const result = resolveDateExpression('now()', 'date');
    const after = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    // result must be a valid YYYY-MM-DD string between before and after (same day is sufficient here)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result >= `${before.getFullYear()}-${pad(before.getMonth() + 1)}-${pad(before.getDate())}`).toBe(true);
    expect(result <= `${after.getFullYear()}-${pad(after.getMonth() + 1)}-${pad(after.getDate())}`).toBe(true);
  });
  it('resolves "now()" to a time string for format: time', () => {
    const result = resolveDateExpression('now()', 'time');
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
  it('resolves "now()+86400" to tomorrow for format: date', () => {
    const tomorrow = new Date();
    tomorrow.setSeconds(tomorrow.getSeconds() + 86400);
    const pad = (n: number) => String(n).padStart(2, '0');
    const expected = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
    expect(resolveDateExpression('now()+86400', 'date')).toBe(expected);
  });
  it('resolves "now()-86400" to yesterday for format: date', () => {
    const yesterday = new Date();
    yesterday.setSeconds(yesterday.getSeconds() - 86400);
    const pad = (n: number) => String(n).padStart(2, '0');
    const expected = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
    expect(resolveDateExpression('now()-86400', 'date')).toBe(expected);
  });
  it('resolves "now() + 3600" with spaces', () => {
    const result = resolveDateExpression('now() + 3600', 'date-time');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});
