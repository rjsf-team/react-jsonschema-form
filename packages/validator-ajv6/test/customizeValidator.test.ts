import AJV6Validator from '../src/validator';
import defaultValidator, { customizeValidator } from '../src';
import { CUSTOM_OPTIONS } from './createAjvInstance.test';

jest.mock('../src/validator');

type TestType = {
  foo: string;
  bar: boolean;
};

describe('customizeValidator()', () => {
  it('defaultValidator was created', () => {
    expect(defaultValidator).toBeInstanceOf(AJV6Validator);
  });
  it('defaultValidator was constructed with empty object', () => {
    expect(AJV6Validator).toHaveBeenCalledWith({});
  });
  describe('passing options to customizeValidator', () => {
    let custom: any;
    beforeAll(() => {
      (AJV6Validator as unknown as jest.Mock).mockClear();
      custom = customizeValidator<TestType>(CUSTOM_OPTIONS);
    });
    it('custom validator was created', () => {
      expect(custom).toBeInstanceOf(AJV6Validator);
    });
    it('defaultValidator was constructed with custom options object', () => {
      expect(AJV6Validator).toHaveBeenCalledWith(CUSTOM_OPTIONS);
    });
  });
});
