import { RJSFSchema, allowAdditionalItems } from '../src';

const schema1: RJSFSchema = {
  type: 'string',
  additionalItems: true,
};

const schema2: RJSFSchema = {
  type: 'string',
  additionalItems: { type: 'number' },
};

describe('allowAdditionalItems()', () => {
  let consoleWarnSpy: jest.SpyInstance;
  beforeAll(() => {
    // spy on console.warn() and make it do nothing to avoid making noise in the test
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });
  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });
  it('calling with schema, having additionalItems object returns true and does not warn', () => {
    expect(allowAdditionalItems(schema2)).toBe(true);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
  it('calling with schema, having additionalItem: true returns false and warns', () => {
    expect(allowAdditionalItems(schema1)).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith('additionalItems=true is currently not supported');
  });
});
