import { RJSFSchema } from '@rjsf/utils';

import ATAPrecompiledValidator from '../src/precompiledValidator';
import { Localizer, ValidatorFunctions } from '../src';
import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators';
import superSchemaObj from './harness/superSchema.json';
import createPrecompiledValidator from '../src/createPrecompiledValidator';

vi.mock('../src/precompiledValidator');

type TestType = {
  foo: string;
  bar: boolean;
};

function loadModule(code: string) {
  const module = { exports: {} as Record<string, any> };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

const rootSchema = superSchemaObj as unknown as RJSFSchema;
const validateFns = loadModule(compileSchemaValidatorsCode(rootSchema)) as ValidatorFunctions;
const mockedValidator = vi.mocked(ATAPrecompiledValidator);

describe('createPrecompiledValidator()', () => {
  describe('passing validatorFns and rootSchema to createPrecompiledValidator', () => {
    let custom: any;
    beforeAll(() => {
      mockedValidator.mockClear();
      custom = createPrecompiledValidator<TestType>(validateFns, rootSchema);
    });
    it('precompiled validator was created', () => {
      expect(custom).toBeInstanceOf(ATAPrecompiledValidator);
    });
    it('precompiledValidator was constructed with validateFns and rootSchema', () => {
      expect(ATAPrecompiledValidator).toHaveBeenCalledWith(validateFns, rootSchema, undefined, undefined);
    });
  });
  describe('passing validatorFns, rootSchema and localizer to createPrecompiledValidator', () => {
    let custom: any;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = vi.fn();
      mockedValidator.mockClear();
      custom = createPrecompiledValidator<TestType>(validateFns, rootSchema, localizer);
    });
    it('precompiled validator was created', () => {
      expect(custom).toBeInstanceOf(ATAPrecompiledValidator);
    });
    it('defaultValidator was constructed with validateFns, rootSchema and the localizer', () => {
      expect(ATAPrecompiledValidator).toHaveBeenCalledWith(validateFns, rootSchema, localizer, undefined);
    });
  });
  describe('passing suppressDuplicateFiltering to createPrecompiledValidator', () => {
    let custom: any;
    beforeAll(() => {
      mockedValidator.mockClear();
      custom = createPrecompiledValidator<TestType>(validateFns, rootSchema, undefined, 'all');
    });
    it('precompiled validator was created', () => {
      expect(custom).toBeInstanceOf(ATAPrecompiledValidator);
    });
    it('precompiledValidator was constructed with validateFns, rootSchema, undefined, and suppressDuplicateFiltering', () => {
      expect(ATAPrecompiledValidator).toHaveBeenCalledWith(validateFns, rootSchema, undefined, 'all');
    });
  });
});
