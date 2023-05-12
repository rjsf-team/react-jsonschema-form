import { getDiscriminatorFieldFromSchema, RJSFSchema } from '../src';

const PROPERTY_NAME = 'testProp';
const BAD_DISCRIMINATOR: RJSFSchema = { discriminator: { propertyName: 5 } };
const GOOD_DISCRIMINATOR: RJSFSchema = { discriminator: { propertyName: PROPERTY_NAME } };

describe('getDiscriminatorFieldFromSchema()', () => {
  it('returns undefined when no discriminator is present', () => {
    expect(getDiscriminatorFieldFromSchema({})).toBeUndefined();
  });
  it('returns the propertyName when discriminator is present', () => {
    expect(getDiscriminatorFieldFromSchema(GOOD_DISCRIMINATOR)).toEqual(PROPERTY_NAME);
  });
  describe('bad discriminator', () => {
    let consoleWarn: jest.SpyInstance;
    beforeAll(() => {
      // Spy and mock to be silent
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    });
    afterAll(() => {
      consoleWarn.mockRestore();
    });
    it('returns undefined when discriminator is present, but not a string', () => {
      expect(getDiscriminatorFieldFromSchema(BAD_DISCRIMINATOR)).toBeUndefined();
    });
    it('it also warns about the bad discriminator', () => {
      expect(consoleWarn).toHaveBeenCalledWith('Expecting discriminator to be a string, got "number" instead');
    });
  });
});
