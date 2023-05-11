import { RJSFSchema } from '@rjsf/utils';

import AJV8PrecompiledValidator from '../src/precompiledValidator';
import { Localizer, ValidatorFunctions } from '../src';
import * as superSchemaFns from './harness/superSchema';
import superSchema from './harness/superSchema.json';
import createPrecompiledValidator from '../src/createPrecompiledValidator';

jest.mock('../src/precompiledValidator');

type TestType = {
  foo: string;
  bar: boolean;
};

const validateFns = superSchemaFns as ValidatorFunctions;
const rootSchema = superSchema as RJSFSchema;
const mockedValidator = jest.mocked(AJV8PrecompiledValidator);

describe('createPrecompiledValidator()', () => {
  describe('passing validatorFns and rootSchema to createPrecompiledValidator', () => {
    let custom: any;
    beforeAll(() => {
      mockedValidator.mockClear();
      custom = createPrecompiledValidator<TestType>(validateFns, rootSchema);
    });
    it('precompiled validator was created', () => {
      expect(custom).toBeInstanceOf(AJV8PrecompiledValidator);
    });
    it('precompiledValidator was constructed with validateFns and rootSchema', () => {
      expect(AJV8PrecompiledValidator).toHaveBeenCalledWith(validateFns, rootSchema, undefined);
    });
  });
  describe('passing validatorFns, rootSchema and localizer to createPrecompiledValidator', () => {
    let custom: any;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = jest.fn();
      mockedValidator.mockClear();
      custom = createPrecompiledValidator<TestType>(validateFns, rootSchema, localizer);
    });
    it('precompiled validator was created', () => {
      expect(custom).toBeInstanceOf(AJV8PrecompiledValidator);
    });
    it('defaultValidator was constructed with validateFns, rootSchema and the localizer', () => {
      expect(AJV8PrecompiledValidator).toHaveBeenCalledWith(validateFns, rootSchema, localizer);
    });
  });
});
