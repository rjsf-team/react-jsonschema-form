import defaultValidator, { customizeValidator, Localizer } from '../src';
import AJV8Validator from '../src/validator';
import { CUSTOM_OPTIONS } from './harness/testData';

vi.mock('../src/validator');

type TestType = {
  foo: string;
  bar: boolean;
};

describe('customizeValidator()', () => {
  it('defaultValidator was created', () => {
    expect(defaultValidator).toBeInstanceOf(AJV8Validator);
  });
  it('defaultValidator was constructed with empty object and undefined for the localizer', () => {
    expect(AJV8Validator).toHaveBeenCalledWith({}, undefined);
  });
  describe('passing options to customizeValidator', () => {
    let custom: any;
    beforeAll(() => {
      vi.mocked(AJV8Validator).mockClear();
      custom = customizeValidator<TestType>(CUSTOM_OPTIONS);
    });
    it('custom validator was created', () => {
      expect(custom).toBeInstanceOf(AJV8Validator);
    });
    it('defaultValidator was constructed with custom options object and undefined for the localizer', () => {
      expect(AJV8Validator).toHaveBeenCalledWith(CUSTOM_OPTIONS, undefined);
    });
  });
  describe('passing localizer to customizeValidator', () => {
    let custom: any;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = vi.fn();
      vi.mocked(AJV8Validator).mockClear();
      custom = customizeValidator<TestType>(undefined, localizer);
    });
    it('custom validator was created', () => {
      expect(custom).toBeInstanceOf(AJV8Validator);
    });
    it('defaultValidator was constructed with empty object and the localizer', () => {
      expect(AJV8Validator).toHaveBeenCalledWith({}, localizer);
    });
  });
});
