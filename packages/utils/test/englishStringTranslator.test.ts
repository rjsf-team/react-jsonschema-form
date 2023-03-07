import { englishStringTranslator, TranslatableString } from '../src';

const PARAMS = ['one', 'two', 'three'];

function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
}

const simpleStrings: TranslatableString[] = [];

const parameterStrings: TranslatableString[] = [];

for (const key of enumKeys(TranslatableString)) {
  const value = TranslatableString[key];
  if (value.includes('%1')) {
    parameterStrings.push(value);
  } else {
    simpleStrings.push(value);
  }
}

describe('englishStringTranslator', () => {
  it('Simple strings return what was given', () => {
    simpleStrings.forEach((enumeration) => {
      expect(englishStringTranslator(enumeration)).toEqual(enumeration);
    });
  });
  it('Parameterized strings return strings with parameters replaced', () => {
    parameterStrings.forEach((enumeration) => {
      const expected = enumeration.replace('%1', PARAMS[0]).replace('%2', PARAMS[1]).replace('%3', PARAMS[2]);
      expect(englishStringTranslator(enumeration, PARAMS)).toEqual(expected);
    });
  });
});
