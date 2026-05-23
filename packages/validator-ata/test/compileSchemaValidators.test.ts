import { RJSFSchema } from '@rjsf/utils';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators';
import createPrecompiledValidator from '../src/createPrecompiledValidator';

// Evaluate generated CJS module source into an exports object.
function loadModule(code: string) {
  const module = { exports: {} as Record<string, any> };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

const schema: RJSFSchema = {
  $id: 'root',
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: { $ref: '#/definitions/address' },
  },
  required: ['name'],
  definitions: {
    address: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
  },
};

test('generates a module with a validator function per schema id', () => {
  const code = compileSchemaValidatorsCode(schema);
  const validateFns = loadModule(code);
  const validator = createPrecompiledValidator(validateFns, schema);

  expect(validator.isValid(schema, { name: 'Mert' }, schema)).toBe(true);
  expect(validator.isValid(schema, { name: 5 }, schema)).toBe(false);
});

test('resolves cross-schema $ref in the compiled output', () => {
  const code = compileSchemaValidatorsCode(schema);
  const validateFns = loadModule(code);
  const validator = createPrecompiledValidator(validateFns, schema);

  const good = validator.validateFormData({ name: 'Mert', address: { city: 'Istanbul' } }, schema);
  expect(good.errors).toHaveLength(0);
  const bad = validator.validateFormData({ name: 'Mert', address: {} }, schema);
  expect(bad.errors.length).toBeGreaterThan(0);
});
