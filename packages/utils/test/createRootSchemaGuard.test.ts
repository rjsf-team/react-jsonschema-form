import type { RJSFSchema, ValidatorType } from '../src/index.ts';
import { createRootSchemaGuard, retrieveSchema } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

describe('createRootSchemaGuard()', () => {
  const rootSchema: RJSFSchema = {
    definitions: { name: { type: 'string', minLength: 2 } },
    type: 'object',
    properties: { name: { $ref: '#/definitions/name' } },
  };
  const differs =
    'The schema associated with the precompiled validator differs from the rootSchema provided for validation';
  let validator: ValidatorType;
  let guard: (schema: RJSFSchema, formData?: unknown) => void;
  beforeEach(() => {
    validator = getTestValidator({});
    guard = createRootSchemaGuard({ validator }, rootSchema);
  });

  it('accepts the root schema', () => {
    expect(() => guard(rootSchema)).not.toThrow();
  });
  it('accepts an equal copy of the root schema, and the same copy again once it was changed', () => {
    const copy = structuredClone(rootSchema);
    expect(() => guard(copy)).not.toThrow();
    copy.title = 'changed after it was accepted';
    expect(() => guard(copy)).not.toThrow();
  });
  it('accepts the resolution of the root schema', () => {
    const resolved = retrieveSchema({ validator }, rootSchema, rootSchema);
    expect(() => guard(resolved, {})).not.toThrow();
  });
  it('throws for another schema', () => {
    expect(() => guard({ type: 'object', properties: { name: { type: 'string' } } })).toThrow(new Error(differs));
  });
});
