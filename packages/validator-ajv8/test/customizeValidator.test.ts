import type { ErrorObject } from 'ajv';

import type { Localizer } from '../src/index.ts';
import defaultValidator, { customizeValidator } from '../src/index.ts';
import AJV8Validator from '../src/validator.ts';
import { CUSTOM_OPTIONS } from './harness/testData.ts';

vi.mock('../src/validator');

describe('customizeValidator()', () => {
  it("types the errors of rawValidation() as the engine's", () => {
    expectTypeOf<ReturnType<ReturnType<typeof customizeValidator>['rawValidation']>['errors']>().toEqualTypeOf<
      ErrorObject[] | undefined
    >();
  });
  it('defaultValidator was created', () => {
    expect(defaultValidator).toBeInstanceOf(AJV8Validator);
  });
  it('defaultValidator was constructed with empty object and undefined for the localizer', () => {
    expect(AJV8Validator).toHaveBeenCalledWith({}, undefined);
  });
  describe('passing options to customizeValidator', () => {
    let custom: unknown;
    beforeAll(() => {
      vi.mocked(AJV8Validator).mockClear();
      custom = customizeValidator(CUSTOM_OPTIONS);
    });
    it('custom validator was created', () => {
      expect(custom).toBeInstanceOf(AJV8Validator);
    });
    it('defaultValidator was constructed with custom options object and undefined for the localizer', () => {
      expect(AJV8Validator).toHaveBeenCalledWith(CUSTOM_OPTIONS, undefined);
    });
  });
  describe('passing localizer to customizeValidator', () => {
    let custom: unknown;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = vi.fn();
      vi.mocked(AJV8Validator).mockClear();
      custom = customizeValidator(undefined, localizer);
    });
    it('custom validator was created', () => {
      expect(custom).toBeInstanceOf(AJV8Validator);
    });
    it('defaultValidator was constructed with empty object and the localizer', () => {
      expect(AJV8Validator).toHaveBeenCalledWith({}, localizer);
    });
  });
});
