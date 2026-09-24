import type { UiSchema } from '@rjsf/utils';
import { getUiRequiredErrorSchema, toErrorList, validationDataMerge } from '@rjsf/utils';

import AJV8PrecompiledValidator from '../src/precompiledValidator.ts';
import { SUPER_SCHEMA_OPTIONS, compileSuperSchema, superSchema } from './harness/compileSuperSchema.ts';

describe('ui:required with a precompiled validator', () => {
  it('enforces ui:required without rewriting the schema the precompiled validator was built from', () => {
    const validator = new AJV8PrecompiledValidator(compileSuperSchema(SUPER_SCHEMA_OPTIONS), superSchema);
    const uiSchema: UiSchema = { price: { 'ui:required': true } };
    const formData = {};

    // Mirrors what Form.validate() does: validate the untouched schema, then merge ui:required errors in.
    const schemaValidation = validator.validateFormData({ validator }, formData, superSchema);
    const merged = validationDataMerge(
      schemaValidation,
      getUiRequiredErrorSchema({ validator }, superSchema, uiSchema, formData),
    );

    expect(toErrorList(merged.errorSchema).some((e) => e.property === '.price')).toBe(true);

    const filled = { price: 3 };
    const okValidation = validator.validateFormData({ validator }, filled, superSchema);
    const okMerged = validationDataMerge(
      okValidation,
      getUiRequiredErrorSchema({ validator }, superSchema, uiSchema, filled),
    );
    expect(toErrorList(okMerged.errorSchema).some((e) => e.property === '.price')).toBe(false);
  });
});
