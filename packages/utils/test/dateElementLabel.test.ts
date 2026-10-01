import type { Registry } from '../src/index.ts';
import {
  DATE_ELEMENT_LABELS,
  dateElementAriaLabel,
  dateElementLabel,
  englishStringTranslator,
  TranslatableString,
} from '../src/index.ts';

const translateString: Registry['translateString'] = (key) => `[${key}]`;

describe('DATE_ELEMENT_LABELS', () => {
  it('maps every date element type to its translatable string', () => {
    expect(DATE_ELEMENT_LABELS).toEqual({
      year: TranslatableString.YearLabel,
      month: TranslatableString.MonthLabel,
      day: TranslatableString.DayLabel,
      hour: TranslatableString.HourLabel,
      minute: TranslatableString.MinuteLabel,
      second: TranslatableString.SecondLabel,
    });
  });
});

describe('dateElementLabel()', () => {
  it('returns the english name of each type by default', () => {
    Object.keys(DATE_ELEMENT_LABELS).forEach((type) => {
      expect(dateElementLabel(type, englishStringTranslator)).toBe(type);
    });
  });
  it('translates the name through translateString', () => {
    expect(dateElementLabel('year', translateString)).toBe('[year]');
  });
  it('falls back to the type for an unknown type, including an inherited key', () => {
    expect(dateElementLabel('week', translateString)).toBe('week');
    expect(dateElementLabel('toString', translateString)).toBe('toString');
  });
});

describe('dateElementAriaLabel()', () => {
  it('prefixes the name with the field label', () => {
    expect(dateElementAriaLabel('year', englishStringTranslator, 'When')).toBe('When, year');
    expect(dateElementAriaLabel('second', translateString, 'When')).toBe('When, [second]');
  });
  it('returns the name alone when the label is missing, empty or hidden', () => {
    expect(dateElementAriaLabel('day', englishStringTranslator)).toBe('day');
    expect(dateElementAriaLabel('day', englishStringTranslator, '')).toBe('day');
    expect(dateElementAriaLabel('day', englishStringTranslator, 'When', true)).toBe('day');
  });
});
