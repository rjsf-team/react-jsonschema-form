import type { RJSFSchema } from '@rjsf/utils';

import type { Localizer, ValidatorFunctions } from '../src';
import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators';
import createPrecompiledValidator from '../src/createPrecompiledValidator';
import ATAPrecompiledValidator from '../src/precompiledValidator';
import superSchemaObj from './harness/superSchema.json';

vi.mock('../src/precompiledValidator');

interface TestType {
  foo: string;
  bar: boolean;
}

function loadModule(code: string) {
  const module = { exports: {} as Record<string, any> };
  // oxlint-disable-next-line no-new-func, no-implied-eval
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
