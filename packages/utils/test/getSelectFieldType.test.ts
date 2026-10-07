import { getSelectFieldType } from '../src/index.ts';

describe('getSelectFieldType()', () => {
  it.each<[string[], string]>([
    [['boolean'], 'boolean'],
    [['null', 'number'], 'number'],
    [['number', 'string'], 'string'],
    [['null', 'boolean', 'string'], 'string'],
    [['null'], 'string'],
    [[], 'string'],
    [['integer', 'integer'], 'integer'],
    [['integer', 'foo'], 'integer'],
    [['null', 'foo'], 'string'],
  ])('should give a select over %j the type %s', (types, expected) => {
    expect(getSelectFieldType(types)).toBe(expected);
  });
});
