import type { Registry } from '../src/index.ts';
import { dateElementAriaLabel, dateElementLabel, englishStringTranslator, TranslatableString } from '../src/index.ts';

const translateString: Registry['translateString'] = (key, params) => `[${key}${params ? `|${params.join('|')}` : ''}]`;

describe('dateElementLabel()', () => {
  it('returns the english name of each type by default', () => {
    ['year', 'month', 'day', 'hour', 'minute', 'second'].forEach((type) => {
      expect(dateElementLabel(type, englishStringTranslator)).toBe(type);
    });
  });
  it('translates each name through its own string', () => {
    expect(dateElementLabel('year', translateString)).toBe(`[${TranslatableString.YearLabel}]`);
    expect(dateElementLabel('second', translateString)).toBe(`[${TranslatableString.SecondLabel}]`);
  });
  it('falls back to the type for an unknown type, including an inherited key', () => {
    expect(dateElementLabel('week', translateString)).toBe('week');
    expect(dateElementLabel('toString', translateString)).toBe('toString');
  });
});

describe('dateElementAriaLabel()', () => {
  it('combines the field label and the element name through DateElementAriaLabel', () => {
    expect(dateElementAriaLabel('year', englishStringTranslator, 'When')).toBe('When, year');
    expect(dateElementAriaLabel('année', translateString, 'Quand')).toBe(
      `[${TranslatableString.DateElementAriaLabel}|Quand|année]`,
    );
  });
  it('lets a locale reorder the label and the element name', () => {
    const reordered: Registry['translateString'] = (key, params) =>
      key === TranslatableString.DateElementAriaLabel ? `${params![1]} (${params![0]})` : key;
    expect(dateElementAriaLabel('year', reordered, 'When')).toBe('year (When)');
  });
  it('returns the element name alone when the label is missing or empty', () => {
    expect(dateElementAriaLabel('day', englishStringTranslator)).toBe('day');
    expect(dateElementAriaLabel('day', englishStringTranslator, '')).toBe('day');
  });
});
