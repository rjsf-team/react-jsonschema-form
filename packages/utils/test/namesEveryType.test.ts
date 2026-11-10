import { namesEveryType } from '../src/index.ts';

describe('namesEveryType()', () => {
  it.each<[unknown, unknown, boolean]>([
    ['string', 'string', true],
    ['string', ['string', 'null'], true],
    [['string', 'null'], 'string', false],
    ['integer', 'number', true],
    ['number', 'integer', false],
    [['integer', 'null'], ['null', 'number'], true],
    ['string', 'number', false],
  ])('%j to %j is %s', (oldType, newType, expected) => {
    expect(namesEveryType(oldType, newType)).toBe(expected);
  });
});
