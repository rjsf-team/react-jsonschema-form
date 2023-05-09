import { RJSFSchema } from '@rjsf/utils';

import AJV8PrecompiledValidator from '../src/precompiledValidator';
import { Localizer, ValidatorFunctions } from '../src';
import * as superSchemaFns from './harness/superSchema';
import superSchema from './harness/superSchema.json';
import usePrecompiledValidator from '../src/usePrecompiledValidator';

jest.mock('../src/precompiledValidator');

type TestType = {
  foo: string;
  bar: boolean;
};

const validateFns = superSchemaFns as ValidatorFunctions;
const rootSchema = superSchema as RJSFSchema;

describe('usePrecompiledValidator()', () => {
  describe('passing validatorFns and rootSchema to usePrecompiledValidator', () => {
    let custom: any;
    beforeAll(() => {
      (AJV8PrecompiledValidator as unknown as jest.Mock).mockClear();
      custom = usePrecompiledValidator<TestType>(validateFns, rootSchema);
    });
    it('precompiled validator was created', () => {
      expect(custom).toBeInstanceOf(AJV8PrecompiledValidator);
    });
    it('precompiledValidator was constructed with validateFns and rootSchema', () => {
      expect(AJV8PrecompiledValidator).toHaveBeenCalledWith(validateFns, rootSchema, undefined);
    });
  });
  describe('passing validatorFns, rootSchema and localizer to usePrecompiledValidator', () => {
    let custom: any;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = jest.fn();
      (AJV8PrecompiledValidator as unknown as jest.Mock).mockClear();
      custom = usePrecompiledValidator<TestType>(validateFns, rootSchema, localizer);
    });
    it('precompiled validator was created', () => {
      expect(custom).toBeInstanceOf(AJV8PrecompiledValidator);
    });
    it('defaultValidator was constructed with validateFns, rootSchema and the localizer', () => {
      expect(AJV8PrecompiledValidator).toHaveBeenCalledWith(validateFns, rootSchema, localizer);
    });
  });
});
