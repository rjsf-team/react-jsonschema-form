import type {
  CustomValidator,
  ErrorSchema,
  ErrorTransformer,
  FormValidation,
  RJSFSchema,
  RJSFValidationError,
  UiSchema,
  ValidatorType,
} from '@rjsf/utils';
import {
  createSchemaUtils,
  ErrorSchemaBuilder,
  getDefaultFormState,
  getFirstMatchingOption,
  getValidationTarget,
  isSchemaObject,
  noop,
  retrieveSchema,
} from '@rjsf/utils';
import type { Ajv } from 'ajv';
import ajvI18n from 'ajv-i18n';
import { Ajv2019 } from 'ajv/dist/2019.js';
import { Ajv2020 } from 'ajv/dist/2020.js';
import metaSchemaDraft6 from 'ajv/lib/refs/json-schema-draft-06.json' with { type: 'json' };
import type { Mock } from 'vitest';

import pointerValidationTests, {
  absoluteRefValidationTests,
  sharedSubschemaValidationTests,
} from '../../utils/test/testUtils/pointerValidationTests.ts';
import customizeValidator from '../src/customizeValidator.ts';
import type { Localizer } from '../src/index.ts';
import AJV8Validator from '../src/validator.ts';
import { expectWarn } from './harness/testData.ts';

const illFormedKey = "bar`'()=+*&^%$#@!";

describe('AJV8Validator', () => {
  let builder: ErrorSchemaBuilder;
  beforeAll(() => {
    builder = new ErrorSchemaBuilder();
  });
  afterEach(() => {
    builder.resetAllErrors();
  });
  describe('default options', () => {
    let validator: AJV8Validator;
    beforeAll(() => {
      validator = new AJV8Validator({});
    });
    describe('validator.isValid()', () => {
      it('should return true if the data is valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        };

        expect(validator.isValid(schema, { foo: 'bar' }, schema)).toBe(true);
      });
      it('should return false if the data is not valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        };

        expect(validator.isValid(schema, { foo: 12345 }, schema)).toBe(false);
      });
      it('should key a schema whose $id is empty by its hash, since an empty $id names nothing', () => {
        const emptyIdRootSchema: RJSFSchema = { type: 'object' };

        expect(validator.isValid({ $id: '', type: 'string' }, 'a', emptyIdRootSchema)).toBe(true);
        // Keyed by the empty `$id`, this would be answered by the function compiled for the schema above
        expect(validator.isValid({ $id: '', type: 'number' }, 'a', emptyIdRootSchema)).toBe(false);
      });
      it("should resolve a local $ref when the root schema's $id is empty, since an empty $id names nothing", () => {
        const emptyIdRootSchema: RJSFSchema = {
          $id: '',
          type: 'object',
          definitions: { aStr: { type: 'string' } },
          properties: { a: { $ref: '#/definitions/aStr' } },
        };

        // Registered under the empty `$id`, the root would not answer the `__rjsf_rootSchema#/...` ref rewritten here
        expect(validator.isValid({ $ref: '#/definitions/aStr' }, 'hello', emptyIdRootSchema)).toBe(true);
      });
      it('should return false if the schema is invalid', () => {
        const schema: RJSFSchema = 'foobarbaz' as unknown as RJSFSchema;

        const isValid = expectWarn(
          () => validator.isValid(schema, { foo: 'bar' }, schema),
          // A root that won't register is skipped, so the schema itself is what fails to compile, by its key
          expect.stringMatching(/^Error encountered compiling schema "\w+":$/),
          expect.any(Error),
        );
        expect(isValid).toBe(false);
      });
      it('says the form data is what failed when the schema compiled and validating it threw', () => {
        // A custom format that throws runs during validation, not compilation. The two are told apart so a schema
        // that won't compile and one that throws on its data don't share a key when the errors read alike
        const localValidator = new AJV8Validator({
          customFormats: {
            boom: () => {
              throw new Error('custom format threw');
            },
          },
        });
        const schema: RJSFSchema = { $id: 'throws-on-data', type: 'string', format: 'boom' };

        const isValid = expectWarn(
          () => localValidator.isValid(schema, 'anything', { type: 'string' }),
          'Error encountered validating form data against schema "throws-on-data":',
          expect.any(Error),
        );
        expect(isValid).toBe(false);
      });
      it('should return true if the data is valid against the schema including refs to rootSchema', () => {
        const schema: RJSFSchema = {
          anyOf: [{ $ref: '#/definitions/foo' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            foo: {
              properties: {
                name: { type: 'string' },
              },
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        expect(validator.isValid(schema, formData, rootSchema)).toBe(true);
      });
      it('Only compiles the schema once', () => {
        const schema: RJSFSchema = {
          $id: 'schema-id',
        };

        const rootSchema: RJSFSchema = {
          $id: 'root-schema-id',
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        const addSchemaSpy = vi.spyOn(validator.ajv, 'addSchema');

        // Call isValid twice with the same schema
        validator.isValid(schema, formData, rootSchema);
        validator.isValid(schema, formData, rootSchema);

        // Root schema is added twice
        expect(addSchemaSpy).toHaveBeenCalledTimes(2);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(1, expect.objectContaining(rootSchema), rootSchema.$id);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(2, expect.objectContaining(schema), schema.$id);
      });
      it('should fallback to using compile', () => {
        const schema: RJSFSchema = {
          $id: 'schema-id-2',
        };

        const rootSchema: RJSFSchema = {
          $id: 'root-schema-id',
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        const ajvInstance = validator.ajv;
        const originalGetSchema = ajvInstance.getSchema.bind(ajvInstance);
        const getSchemaSpy = vi.spyOn(ajvInstance, 'getSchema');
        getSchemaSpy.mockClear();
        getSchemaSpy.mockImplementation((schemaId) => {
          if (schemaId === schema.$id) {
            return undefined;
          }

          return originalGetSchema(schemaId);
        });

        const compileSpy = vi.spyOn(ajvInstance, 'compile');
        compileSpy.mockClear();

        // Call isValid twice with the same schema; the mocked getSchema forces the
        // addSchema path to throw ("already exists"), which isValid warns about
        expectWarn(
          () => {
            validator.isValid(schema, formData, rootSchema);
            validator.isValid(schema, formData, rootSchema);
          },
          'Error encountered compiling schema "schema-id-2":',
          expect.any(Error),
        );

        getSchemaSpy.mockRestore();
        expect(compileSpy).toHaveBeenCalledTimes(1);
      });
      it('skips Ajv re-registration when handleSchemaUpdate is called repeatedly with the same rootSchema reference', () => {
        const localValidator = new AJV8Validator({});
        const rootSchema: RJSFSchema = {
          type: 'object',
          properties: { foo: { type: 'string' } },
        };

        const addSchemaSpy = vi.spyOn(localValidator.ajv, 'addSchema');
        const removeSchemaSpy = vi.spyOn(localValidator.ajv, 'removeSchema');

        localValidator.handleSchemaUpdate(rootSchema);
        localValidator.handleSchemaUpdate(rootSchema);
        localValidator.handleSchemaUpdate(rootSchema);
        localValidator.handleSchemaUpdate(rootSchema);

        expect(addSchemaSpy).toHaveBeenCalledTimes(1);
        expect(removeSchemaSpy).not.toHaveBeenCalled();

        addSchemaSpy.mockRestore();
        removeSchemaSpy.mockRestore();
      });
      it('normalizes the id of a root once, not on every isValid() against it', () => {
        const localValidator = new AJV8Validator({});
        const rootSchema: RJSFSchema = {
          $id: 'http://example.com/root.json',
          definitions: { s: { type: 'string' } },
        };
        const pointer: RJSFSchema = { $ref: '#/definitions/s' };
        const parseSpy = vi.spyOn(localValidator.ajv.opts.uriResolver, 'parse');

        expect(localValidator.isValid(pointer, 'x', rootSchema)).toBe(true);
        const callsForFirst = parseSpy.mock.calls.length;
        expect(localValidator.isValid(pointer, 1, rootSchema)).toBe(false);
        expect(localValidator.isValid(pointer, 'y', rootSchema)).toBe(true);

        expect(parseSpy).toHaveBeenCalledTimes(callsForFirst);
        parseSpy.mockRestore();
      });
      it('falls back to deep-equality when handleSchemaUpdate receives a different rootSchema reference', () => {
        const localValidator = new AJV8Validator({});
        const rootSchemaA: RJSFSchema = {
          type: 'object',
          properties: { foo: { type: 'string' } },
        };
        const rootSchemaAClone: RJSFSchema = JSON.parse(JSON.stringify(rootSchemaA));
        const rootSchemaB: RJSFSchema = {
          type: 'object',
          properties: { foo: { type: 'number' } },
        };

        const addSchemaSpy = vi.spyOn(localValidator.ajv, 'addSchema');
        const removeSchemaSpy = vi.spyOn(localValidator.ajv, 'removeSchema');

        localValidator.handleSchemaUpdate(rootSchemaA);
        localValidator.handleSchemaUpdate(rootSchemaAClone);
        expect(addSchemaSpy).toHaveBeenCalledTimes(1);
        expect(removeSchemaSpy).not.toHaveBeenCalled();

        localValidator.handleSchemaUpdate(rootSchemaB);
        expect(removeSchemaSpy).toHaveBeenCalledTimes(1);
        expect(addSchemaSpy).toHaveBeenCalledTimes(2);

        addSchemaSpy.mockRestore();
        removeSchemaSpy.mockRestore();
      });
      it('resolves a $ref into a root whose dialect it rejects from the first call on, and registers the next root', () => {
        const localValidator = new AJV8Validator({});
        const rejectedRoot: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $defs: { n: { type: 'object' } },
          type: 'object',
        };
        const nextRoot: RJSFSchema = { definitions: { animal: { const: 'Cat' } } };

        expect(localValidator.isValid({ $ref: '#/$defs/n' }, {}, rejectedRoot)).toBe(true);
        expect(localValidator.isValid({ $ref: '#/$defs/n' }, 'text', rejectedRoot)).toBe(false);
        expect(localValidator.isValid({ $ref: '#/$defs/n' }, {}, rejectedRoot)).toBe(true);
        expect(localValidator.isValid({ $ref: '#/definitions/animal' }, 'Cat', nextRoot)).toBe(true);
        expect(localValidator.isValid({ $ref: '#/definitions/animal' }, 'Dog', nextRoot)).toBe(false);
      });
      it('picks the then of an if that is a $ref into such a root on the first call, so the defaults take it', () => {
        const rootSchema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $defs: { I: { properties: { k: { const: 'x' } } } },
          type: 'object',
          properties: { k: { type: 'string', default: 'x' } },
          if: { $ref: '#/$defs/I' },
          then: { properties: { t: { type: 'string', default: 't' } } },
          else: { properties: { e: { type: 'string', default: 'e' } } },
        };
        const defaults = getDefaultFormState(
          { validator: new AJV8Validator({}) },
          { schema: rootSchema, rootSchema, formData: { k: 'x' } },
        );
        expect(defaults).toEqual({ k: 'x', t: 't' });
      });
    });
    it('replaces a root whose $id ends in an empty fragment with an edited root under the same $id', () => {
      const localValidator = new AJV8Validator({});
      const root: RJSFSchema = {
        $id: 'http://example.com/root.json#',
        definitions: { x: { type: 'string' } },
      };
      const edited: RJSFSchema = { ...root, definitions: { x: { type: 'number' } } };
      expect(localValidator.isValid({ $ref: '#/definitions/x' }, 's', root)).toBe(true);
      expect(localValidator.isValid({ $ref: '#/definitions/x' }, 's', edited)).toBe(false);
      expect(localValidator.isValid({ $ref: '#/definitions/x' }, 1, edited)).toBe(true);
    });
    describe('scoring an option whose $id is the base of a relative $ref', () => {
      const pickOptions: RJSFSchema[] = [
        { type: 'object', properties: { other: { type: 'number' } }, required: ['other'] },
        { $ref: '#/definitions/a' },
      ];
      const rootSchema: RJSFSchema = {
        definitions: {
          b: { $id: 'http://example.com/b.json', type: 'string', minLength: 3 },
          a: {
            $id: 'http://example.com/a.json',
            type: 'object',
            properties: { x: { type: 'string', not: { $ref: 'b.json' } } },
          },
        },
        type: 'object',
        properties: { pick: { oneOf: pickOptions } },
      };

      it('resolves the $ref against the option it augments, which the derived $id keeps as its base', () => {
        const retrieved = pickOptions.map((option) => retrieveSchema({ validator }, option, rootSchema, {}));

        expect(getFirstMatchingOption({ validator }, { x: 'ab' }, retrieved, rootSchema)).toBe(1);
      });
    });
    describe('compilation error caching (issue #3933)', () => {
      // AJV 8 registers a schema in its internal cache *before* running meta-schema
      // validation (validateSchema: true by default). When that validation throws (e.g.
      // anyOf: [] violates draft-07's minItems:1 requirement), the broken schema stays
      // cached so subsequent compile calls skip revalidation and silently return no
      // errors. The fix removes the schema from AJV's cache whenever a compilation
      // error occurs so every call correctly produces a validationError.
      it('rawValidation returns a validationError on repeated calls for a schema without $id', () => {
        const v = new AJV8Validator({});
        // Empty anyOf violates the draft-07 meta-schema (minItems: 1).
        // The full-schema case from issue #3933 uses no $id, so AJV caches by object ref.
        const schema: RJSFSchema = {
          type: 'object',
          properties: { foo: { type: 'string', anyOf: [] } },
        };

        const result1 = v.rawValidation(schema, {});
        expect(result1.validationError).toBeInstanceOf(Error);

        const result2 = v.rawValidation(schema, {});
        expect(result2.validationError).toBeInstanceOf(Error);
      });

      it('rawValidation returns a validationError on repeated calls for a schema with $id', () => {
        const v = new AJV8Validator({});
        const schema: RJSFSchema = { $id: 'test-caching-raw-$id', anyOf: [] };

        const result1 = v.rawValidation(schema, {});
        expect(result1.validationError).toBeInstanceOf(Error);

        const result2 = v.rawValidation(schema, {});
        expect(result2.validationError).toBeInstanceOf(Error);
      });

      it.each([null, 5, true, {}])('rawValidation returns a validationError for a schema whose $id is %j', (id) => {
        const v = new AJV8Validator({});
        const schema: RJSFSchema = { type: 'string' };
        Reflect.set(schema, '$id', id);

        expect(v.rawValidation(schema, 'a').validationError).toBeInstanceOf(Error);
        expect(v.rawValidation(schema, 'a').validationError).toBeInstanceOf(Error);
      });

      it('rawValidation returns a validationError when the schema was previously cached by isValid', () => {
        const v = new AJV8Validator({});
        // isValid uses addSchema (no meta-schema validation) so the broken schema
        // ends up in AJV's registry as a compiled always-false validator.  A
        // subsequent rawValidation call must not silently reuse that cached entry.
        const schema: RJSFSchema = {
          $id: 'test-caching-isvalid-cross',
          anyOf: [],
        };
        const rootSchema: RJSFSchema = {};

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
        v.isValid(schema, {}, rootSchema);
        warnSpy.mockRestore();

        const result = v.rawValidation(schema, {});
        expect(result.validationError).toBeInstanceOf(Error);
      });

      it('isValid returns false consistently when a compilation error occurs', () => {
        const v = new AJV8Validator({});
        // null is not a valid schema – AJV will throw when it tries to compile it.
        const schema = null as unknown as RJSFSchema;
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);

        const result1 = v.isValid(schema, {}, schema);
        const result2 = v.isValid(schema, {}, schema);

        warnSpy.mockRestore();
        expect(result1).toBe(false);
        expect(result2).toBe(false);
      });

      it('rawValidation does not evict a correctly-compiled schema when data evaluation throws', () => {
        // A keyword whose validate() throws during data evaluation (not compilation).
        // The schema is valid and compiles fine; the throw happens when the compiled
        // validator runs against formData.  The fix guards removeSchema with
        // compiledValidator === undefined so only compile-phase failures evict.
        const v = new AJV8Validator({
          extenderFn: (ajv: Ajv) => {
            ajv.addKeyword({
              keyword: 'throwOnValidate',
              schemaType: 'boolean',
              validate: () => {
                throw new Error('keyword threw during data evaluation');
              },
            });
            return ajv;
          },
        });
        const schema = {
          $id: 'test-exec-throw-raw',
          type: 'string',
          throwOnValidate: true,
        } as unknown as RJSFSchema;

        // First call — compiledValidator(formData) throws, so compilationError is set.
        const result = v.rawValidation(schema, 'hello');
        expect(result.validationError).toBeInstanceOf(Error);

        // Schema must still be cached — the execution throw must not have evicted it.
        expect(v.ajv.getSchema('test-exec-throw-raw')).toBeDefined();
      });

      it('isValid does not evict a correctly-compiled schema when data evaluation throws', () => {
        const v = new AJV8Validator({
          extenderFn: (ajv: Ajv) => {
            ajv.addKeyword({
              keyword: 'throwOnValidate',
              schemaType: 'boolean',
              validate: () => {
                throw new Error('keyword threw during data evaluation');
              },
            });
            return ajv;
          },
        });
        const schema = {
          $id: 'test-exec-throw-isvalid',
          type: 'string',
          throwOnValidate: true,
        } as unknown as RJSFSchema;
        const rootSchema: RJSFSchema = {};
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);

        // Execution throw — isValid should return false but NOT evict the schema.
        const result = v.isValid(schema, 'hello', rootSchema);
        expect(result).toBe(false);

        // $id is preserved by withIdRefPrefix, so schemaId === schema.$id.
        expect(v.ajv.getSchema('test-exec-throw-isvalid')).toBeDefined();

        warnSpy.mockRestore();
      });
    });
    describe('validator.validateFormData()', () => {
      describe('No custom validate function, single value', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              [illFormedKey]: { type: 'string' },
            },
          };
          const result = validator.validateFormData({ foo: 42, [illFormedKey]: 41 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });

        it('should return an error list', () => {
          expect(errors).toHaveLength(2);
          expect(errors[0].message).toEqual('must be string');
          expect(errors[1].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
          expect(errorSchema[illFormedKey]!.__errors).toHaveLength(1);
          expect(errorSchema[illFormedKey]!.__errors![0]).toEqual('must be string');
        });
      });
      describe('Validating multipleOf with a float', () => {
        let errors: RJSFValidationError[];
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              price: {
                title: 'Price per task ($)',
                type: 'number',
                multipleOf: 0.01,
                minimum: 0,
              },
            },
          };
          const result = validator.validateFormData({ price: 0.14 }, schema);
          errors = result.errors;
        });
        it('should not return an error', () => {
          expect(errors).toHaveLength(0);
        });
      });
      describe('Validating multipleOf with a float, with multiple errors', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              price: {
                title: 'Price per task ($)',
                type: 'number',
                multipleOf: 0.03,
                minimum: 1,
              },
            },
          };
          const result = validator.validateFormData({ price: 0.14 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it('should have 2 errors', () => {
          expect(errors).toHaveLength(2);
        });
        it('first error is for minimum', () => {
          expect(errors[0].message).toEqual('must be >= 1');
        });
        it('first error is for multipleOf', () => {
          expect(errors[1].message).toEqual('must be multiple of 0.03');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.price!.__errors).toHaveLength(2);
          expect(errorSchema.price!.__errors).toEqual(['must be >= 1', 'must be multiple of 0.03']);
        });
      });
      describe('Validating required fields', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        describe('formData is not provided at top level', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1', 'pass2'],
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
              },
            };

            const formData = { pass1: 'a' };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
          });
        });
        describe('formData is not provided for nested child', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                nested: {
                  type: 'object',
                  required: ['pass1', 'pass2'],
                  properties: {
                    pass1: { type: 'string' },
                    pass2: { type: 'string' },
                  },
                },
              },
            };

            const formData = { nested: { pass1: 'a' } };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
          });
        });
      });
      describe('No custom validate function, single additionalProperties value', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          };
          const result = validator.validateFormData({ foo: 42 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });

        it('should return an error list', () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
        });
      });
      describe("Doesn't recompile a schema with a specified ID", () => {
        it('Only compiles the schema once', () => {
          const schema: RJSFSchema = {
            $id: 'this-schema-has-an-id',
            type: 'object',
            properties: {
              string: {
                type: 'string',
              },
            },
          };

          const compileSpy = vi.spyOn(validator.ajv, 'compile');
          compileSpy.mockClear();

          // Call validateFormData twice with the same schema
          validator.validateFormData({ string: 'a' }, schema);
          validator.validateFormData({ string: 'b' }, schema);

          expect(compileSpy).toHaveBeenCalledTimes(1);
        });
      });
      describe('TransformErrors', () => {
        let errors: RJSFValidationError[];
        let newErrorMessage: string;
        let transformErrors: Mock;
        let uiSchema: UiSchema;
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              [illFormedKey]: { type: 'string' },
            },
          };
          uiSchema = {
            foo: { 'ui:label': false },
          };
          newErrorMessage = 'Better error message';
          transformErrors = vi.fn((errors: RJSFValidationError[]) => [{ ...errors[0], message: newErrorMessage }]);
          const result = validator.validateFormData(
            { foo: 42, [illFormedKey]: 41 },
            schema,
            undefined,
            transformErrors,
            uiSchema,
          );
          errors = result.errors;
        });

        it('should use transformErrors function', () => {
          expect(errors).not.toHaveLength(0);
          expect(errors[0].message).toEqual(newErrorMessage);
        });
        it('transformErrors function was called with uiSchema', () => {
          expect(transformErrors).toHaveBeenCalledWith(expect.any(Array), uiSchema);
        });
      });
      describe('Custom validate function', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        let validate: Mock;
        let uiSchema: UiSchema;
        beforeAll(() => {
          uiSchema = {
            foo: { 'ui:label': false },
          };

          validate = vi.fn(
            (formData: { pass1?: string; pass2?: string }, errors: FormValidation<{ pass2?: string }>) => {
              if (formData.pass1 !== formData.pass2) {
                errors.pass2?.addError('passwords don`t match.');
              }
              return errors;
            },
          );
        });
        describe('formData is provided', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1', 'pass2'],
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
                foo: { type: 'array', items: { type: 'string' } }, // Adding an array for test coverage
              },
            };
            const formData = { pass1: 'a', pass2: 'b', foo: ['a'] };
            const result = validator.validateFormData(formData, schema, validate, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual('passwords don`t match.');
          });
          it('validate function was called with uiSchema', () => {
            expect(validate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), uiSchema, expect.any(Object));
          });
        });
        describe('formData is missing data', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
              },
            };
            const formData = { pass1: 'a' };
            const result = validator.validateFormData(formData, schema, validate);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual('passwords don`t match.');
          });
        });
        describe('formData does not pass ajv validation', () => {
          let validate: Mock;
          let errorSchema: ErrorSchema;

          beforeAll(() => {
            validate = vi.fn(
              (
                _formData: unknown,
                errors: FormValidation<{ pass1?: string }>,
                _uiSchema?: UiSchema,
                errorSchema?: ErrorSchema<{ pass1: string }>,
              ) => {
                if ((errorSchema?.pass1?.__errors?.length ?? 0) > 0) {
                  errors.pass1?.addError('custom error from customValidate');
                }
                return errors;
              },
            );

            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1'],
              properties: {
                pass1: { type: 'string' },
              },
            };

            const formData = {};
            const result = validator.validateFormData(formData, schema, validate, undefined, {});
            errorSchema = result.errorSchema;
          });

          it('validate function was called with errorSchema', () => {
            expect(validate).toHaveBeenCalledTimes(1);
            const passedErrorSchema = validate.mock.calls[0][3];
            expect(passedErrorSchema).toBeDefined();
            expect(passedErrorSchema.pass1.__errors).toEqual(["must have required property 'pass1'"]);
          });

          it('returns merged errorSchema including customValidate errors', () => {
            expect(errorSchema.pass1!.__errors).toEqual([
              "must have required property 'pass1'",
              'custom error from customValidate',
            ]);
          });
        });
        describe('customValidate returns an array for the items of an array field', () => {
          it("lists its errors and keeps ajv's for the other items", () => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                list: {
                  type: 'array',
                  items: { type: 'object', properties: { name: { type: 'string', minLength: 3 } } },
                },
              },
            };
            const validate = (_formData: unknown, errors: FormValidation): FormValidation => ({
              ...errors,
              list: [{ name: { __errors: ['taken'] } }],
            });
            const result = validator.validateFormData({ list: [{ name: 'abc' }, { name: 'a' }] }, schema, validate);
            expect(result.errorSchema.list).toEqual({
              0: { name: { __errors: ['taken'] } },
              1: { name: { __errors: ['must NOT have fewer than 3 characters'] } },
            });
            expect(result.errors.map(({ stack }) => stack)).toEqual([
              '.list.1.name must NOT have fewer than 3 characters',
              '.list.0.name taken',
            ]);
          });
        });
        describe('uiSchema declares ui:initialValue', () => {
          it('passes customValidate a formData reflecting the ui:initialValue default, matching what the form renders', () => {
            const validate = vi.fn((_formData: unknown, errors: FormValidation) => errors);
            const schema: RJSFSchema = { type: 'object', properties: { country: { type: 'string' } } };
            const uiSchema: UiSchema = { country: { 'ui:initialValue': 'US' } };
            validator.validateFormData({}, schema, validate, undefined, uiSchema);
            expect(validate).toHaveBeenCalledWith({ country: 'US' }, expect.any(Object), uiSchema, expect.any(Object));
          });
        });
      });
      describe('Data-Url validation', () => {
        let schema: RJSFSchema;
        beforeAll(() => {
          schema = {
            type: 'object',
            properties: {
              dataUrlWithName: { type: 'string', format: 'data-url' },
              dataUrlWithoutName: { type: 'string', format: 'data-url' },
            },
          };
        });
        it('Data-Url with name is accepted', () => {
          const formData = {
            dataUrlWithName: 'data:text/plain;name=file1.txt;base64,x=',
          };
          const result = validator.validateFormData(formData, schema);
          expect(result.errors).toHaveLength(0);
        });
        it('Data-Url without name is accepted', () => {
          const formData = {
            dataUrlWithoutName: 'data:text/plain;base64,x=',
          };
          const result = validator.validateFormData(formData, schema);
          expect(result.errors).toHaveLength(0);
        });
      });
      describe('Invalid schema', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: {
                type: 'string',
                required: 'invalid_type_non_array' as unknown as string[],
              },
            },
          };
          const result = validator.validateFormData({ foo: 42 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it('should return an error list', () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].stack).toEqual('schema is invalid: data/properties/foo/required must be array');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema).toEqual({
            $schema: {
              __errors: ['schema is invalid: data/properties/foo/required must be array'],
            },
          });
        });
      });
    });
  });
  describe('default options, with Ajv2019', () => {
    let validator: AJV8Validator;
    beforeAll(() => {
      validator = new AJV8Validator({ AjvClass: Ajv2019 });
    });
    describe('validator.isValid()', () => {
      it('should return true if the data is valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        };

        expect(validator.isValid(schema, { foo: 'bar' }, schema)).toBe(true);
      });
      it('should return false if the data is not valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        };

        expect(validator.isValid(schema, { foo: 12345 }, schema)).toBe(false);
      });
      it('should return false if the schema is invalid', () => {
        const schema: RJSFSchema = 'foobarbaz' as unknown as RJSFSchema;

        const isValid = expectWarn(
          () => validator.isValid(schema, { foo: 'bar' }, schema),
          expect.stringMatching(/^Error encountered compiling schema "\w+":$/),
          expect.any(Error),
        );
        expect(isValid).toBe(false);
      });
      it('should return true if the data is valid against the schema including refs to rootSchema', () => {
        const schema: RJSFSchema = {
          anyOf: [{ $ref: '#/definitions/foo' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            foo: {
              properties: {
                name: { type: 'string' },
              },
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        expect(validator.isValid(schema, formData, rootSchema)).toBe(true);
      });
      it('Only compiles the schema once', () => {
        const schema: RJSFSchema = {
          $id: 'schema-id',
        };

        const rootSchema: RJSFSchema = {
          $id: 'root-schema-id',
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        const addSchemaSpy = vi.spyOn(validator.ajv, 'addSchema');
        addSchemaSpy.mockClear();

        // Call isValid twice with the same schema
        validator.isValid(schema, formData, rootSchema);
        validator.isValid(schema, formData, rootSchema);

        // Root schema is added twice
        expect(addSchemaSpy).toHaveBeenCalledTimes(2);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(1, expect.objectContaining(rootSchema), rootSchema.$id);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(2, expect.objectContaining(schema), schema.$id);
      });
    });
    describe('validator.validateFormData()', () => {
      describe('No custom validate function, single value', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              [illFormedKey]: { type: 'string' },
            },
          };
          const result = validator.validateFormData({ foo: 42, [illFormedKey]: 41 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });

        it('should return an error list', () => {
          expect(errors).toHaveLength(2);
          expect(errors[0].message).toEqual('must be string');
          expect(errors[1].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
          expect(errorSchema[illFormedKey]!.__errors).toHaveLength(1);
          expect(errorSchema[illFormedKey]!.__errors![0]).toEqual('must be string');
        });
      });
      describe('Validating multipleOf with a float', () => {
        let errors: RJSFValidationError[];
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              price: {
                title: 'Price per task ($)',
                type: 'number',
                multipleOf: 0.01,
                minimum: 0,
              },
            },
          };
          const result = validator.validateFormData({ price: 0.14 }, schema);
          errors = result.errors;
        });
        it('should not return an error', () => {
          expect(errors).toHaveLength(0);
        });
      });
      describe('Validating multipleOf with a float, with multiple errors', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              price: {
                title: 'Price per task ($)',
                type: 'number',
                multipleOf: 0.03,
                minimum: 1,
              },
            },
          };
          const result = validator.validateFormData({ price: 0.14 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it('should have 2 errors', () => {
          expect(errors).toHaveLength(2);
        });
        it('first error is for minimum', () => {
          expect(errors[0].message).toEqual('must be >= 1');
        });
        it('first error is for multipleOf', () => {
          expect(errors[1].message).toEqual('must be multiple of 0.03');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.price!.__errors).toHaveLength(2);
          expect(errorSchema.price!.__errors).toEqual(['must be >= 1', 'must be multiple of 0.03']);
        });
      });
      describe('Validating required fields', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        describe('formData is not provided at top level', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1', 'pass2'],
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
              },
            };

            const formData = { pass1: 'a' };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
          });
        });
        describe('formData is not provided for nested child', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                nested: {
                  type: 'object',
                  required: ['pass1', 'pass2'],
                  properties: {
                    pass1: { type: 'string' },
                    pass2: { type: 'string' },
                  },
                },
              },
            };

            const formData = { nested: { pass1: 'a' } };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
          });
        });
      });
      describe('No custom validate function, single additionalProperties value', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          };
          const result = validator.validateFormData({ foo: 42 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });

        it('should return an error list', () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
        });
      });
      describe("Doesn't recompile a schema with a specified ID", () => {
        it('Only compiles the schema once', () => {
          const schema: RJSFSchema = {
            $id: 'this-schema-has-an-id',
            type: 'object',
            properties: {
              string: {
                title: 'String field',
                type: 'string',
              },
            },
          };

          const compileSpy = vi.spyOn(validator.ajv, 'compile');
          compileSpy.mockClear();

          // Call validateFormData twice with the same schema
          validator.validateFormData({ string: 'a' }, schema);
          validator.validateFormData({ string: 'b' }, schema);

          expect(compileSpy).toHaveBeenCalledTimes(1);
        });
      });
      describe('TransformErrors', () => {
        let errors: RJSFValidationError[];
        let newErrorMessage: string;
        let transformErrors: Mock;
        let uiSchema: UiSchema;
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              [illFormedKey]: { type: 'string' },
            },
          };
          uiSchema = {
            foo: { 'ui:label': false },
          };
          newErrorMessage = 'Better error message';
          transformErrors = vi.fn((errors: RJSFValidationError[]) => [{ ...errors[0], message: newErrorMessage }]);
          const result = validator.validateFormData(
            { foo: 42, [illFormedKey]: 41 },
            schema,
            undefined,
            transformErrors,
            uiSchema,
          );
          errors = result.errors;
        });

        it('should use transformErrors function', () => {
          expect(errors).not.toHaveLength(0);
          expect(errors[0].message).toEqual(newErrorMessage);
        });
        it('transformErrors function was called with uiSchema', () => {
          expect(transformErrors).toHaveBeenCalledWith(expect.any(Array), uiSchema);
        });
      });
      describe('Custom validate function', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        let validate: Mock;
        let uiSchema: UiSchema;
        beforeAll(() => {
          uiSchema = {
            foo: { 'ui:label': false },
          };

          validate = vi.fn(
            (formData: { pass1?: string; pass2?: string }, errors: FormValidation<{ pass2?: string }>) => {
              if (formData.pass1 !== formData.pass2) {
                errors.pass2?.addError('passwords don`t match.');
              }
              return errors;
            },
          );
        });
        describe('formData is provided', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1', 'pass2'],
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
                foo: { type: 'array', items: { type: 'string' } }, // Adding an array for test coverage
              },
            };
            const formData = { pass1: 'a', pass2: 'b', foo: ['a'] };
            const result = validator.validateFormData(formData, schema, validate, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual('passwords don`t match.');
          });
          it('validate function was called with uiSchema', () => {
            expect(validate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), uiSchema, expect.any(Object));
          });
        });
        describe('formData is missing data', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
              },
            };
            const formData = { pass1: 'a' };
            const result = validator.validateFormData(formData, schema, validate);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual('passwords don`t match.');
          });
        });
        describe('formData does not pass ajv validation', () => {
          let validate: Mock;
          let errorSchema: ErrorSchema;

          beforeAll(() => {
            validate = vi.fn(
              (
                _formData: unknown,
                errors: FormValidation<{ pass1?: string }>,
                _uiSchema?: UiSchema,
                errorSchema?: ErrorSchema<{ pass1: string }>,
              ) => {
                if ((errorSchema?.pass1?.__errors?.length ?? 0) > 0) {
                  errors.pass1?.addError('custom error from customValidate');
                }
                return errors;
              },
            );

            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1'],
              properties: {
                pass1: { type: 'string' },
              },
            };

            const formData = {};
            const result = validator.validateFormData(formData, schema, validate, undefined, {});
            errorSchema = result.errorSchema;
          });

          it('validate function was called with errorSchema', () => {
            expect(validate).toHaveBeenCalledTimes(1);
            const passedErrorSchema = validate.mock.calls[0][3];
            expect(passedErrorSchema).toBeDefined();
            expect(passedErrorSchema.pass1.__errors).toEqual(["must have required property 'pass1'"]);
          });

          it('returns merged errorSchema including customValidate errors', () => {
            expect(errorSchema.pass1!.__errors).toEqual([
              "must have required property 'pass1'",
              'custom error from customValidate',
            ]);
          });
        });
      });
      describe('Data-Url validation', () => {
        let schema: RJSFSchema;
        beforeAll(() => {
          schema = {
            type: 'object',
            properties: {
              dataUrlWithName: { type: 'string', format: 'data-url' },
              dataUrlWithoutName: { type: 'string', format: 'data-url' },
            },
          };
        });
        it('Data-Url with name is accepted', () => {
          const formData = {
            dataUrlWithName: 'data:text/plain;name=file1.txt;base64,x=',
          };
          const result = validator.validateFormData(formData, schema);
          expect(result.errors).toHaveLength(0);
        });
        it('Data-Url without name is accepted', () => {
          const formData = {
            dataUrlWithoutName: 'data:text/plain;base64,x=',
          };
          const result = validator.validateFormData(formData, schema);
          expect(result.errors).toHaveLength(0);
        });
      });
      describe('Invalid schema', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: {
                type: 'string',
                required: 'invalid_type_non_array' as unknown as string[],
              },
            },
          };
          const result = validator.validateFormData({ foo: 42 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it('should return an error list', () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].stack).toEqual('schema is invalid: data/properties/foo/required must be array');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema).toEqual({
            $schema: {
              __errors: ['schema is invalid: data/properties/foo/required must be array'],
            },
          });
        });
      });
    });
  });
  describe('default options, with Ajv2020', () => {
    let validator: AJV8Validator;
    beforeAll(() => {
      validator = new AJV8Validator({ AjvClass: Ajv2020 });
    });
    describe('the root `createSchemaUtils()` hands out under a relative base', () => {
      const child = (id: string): RJSFSchema => ({
        $id: id,
        type: 'object',
        properties: { a: { $ref: '#/$defs/x' } },
        $defs: { x: { type: 'string' } },
      });
      it.each([
        ['no', undefined],
        ['a relative', 'schemas/root.json'],
      ])('resolves each `$ref` in a nested resource under a root with %s `$id`', (_, rootId) => {
        const rootSchema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          ...(rootId === undefined ? {} : { $id: rootId }),
          type: 'object',
          properties: {
            c: { $ref: '#/$defs/parent/$defs/child' },
            d: { $ref: '#/$defs/sub' },
            e: { $ref: '#/$defs/x' },
          },
          $defs: {
            parent: { $id: 'nested/parent.json', $defs: { child: child('child.json') } },
            sub: child('sub/child.json'),
            x: { type: 'number' },
          },
        };
        const handedOut = createSchemaUtils({ validator }, rootSchema).getRootSchema();

        const { errors } = validator.validateFormData({ c: { a: 1 }, d: { a: 1 }, e: 'e' }, handedOut);

        expect(errors.map(({ stack }) => stack)).toStrictEqual([
          '.c.a must be string',
          '.d.a must be string',
          '.e must be number',
        ]);
      });
    });
    describe('validator.isValid()', () => {
      it('should return true if the data is valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        };

        expect(validator.isValid(schema, { foo: 'bar' }, schema)).toBe(true);
      });
      it('should return false if the data is not valid against the schema', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
        };

        expect(validator.isValid(schema, { foo: 12345 }, schema)).toBe(false);
      });
      it('should return false if the schema is invalid', () => {
        const schema: RJSFSchema = 'foobarbaz' as unknown as RJSFSchema;

        const isValid = expectWarn(
          () => validator.isValid(schema, { foo: 'bar' }, schema),
          expect.stringMatching(/^Error encountered compiling schema "\w+":$/),
          expect.any(Error),
        );
        expect(isValid).toBe(false);
      });
      it('checks a schema against a root its dialect rejects, and registers the next root as usual', () => {
        // A draft-07 tuple: under 2020-12 `items` must be a single subschema
        const rejectedRoot: RJSFSchema = { type: 'array', items: [{ type: 'string' }] };
        const condition: RJSFSchema = { properties: { animal: { const: 'Cat' } } };
        const nextRoot: RJSFSchema = { definitions: { animal: { const: 'Cat' } } };

        expect(validator.isValid(condition, { animal: 'Cat' }, rejectedRoot)).toBe(true);
        expect(validator.isValid(condition, { animal: 'Dog' }, rejectedRoot)).toBe(false);
        expect(validator.isValid({ $ref: '#/definitions/animal' }, 'Cat', nextRoot)).toBe(true);
        expect(validator.isValid({ $ref: '#/definitions/animal' }, 'Dog', nextRoot)).toBe(false);
      });
      it('should return true if the data is valid against the schema including refs to rootSchema', () => {
        const schema: RJSFSchema = {
          anyOf: [{ $ref: '#/definitions/foo' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: {
            foo: {
              properties: {
                name: { type: 'string' },
              },
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        expect(validator.isValid(schema, formData, rootSchema)).toBe(true);
      });
      it('Only compiles the schema once', () => {
        const schema: RJSFSchema = {
          $id: 'schema-id',
        };

        const rootSchema: RJSFSchema = {
          $id: 'root-schema-id',
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        };
        const formData = {
          name: 'John Doe',
        };

        const addSchemaSpy = vi.spyOn(validator.ajv, 'addSchema');
        addSchemaSpy.mockClear();

        // Call isValid twice with the same schema
        validator.isValid(schema, formData, rootSchema);
        validator.isValid(schema, formData, rootSchema);

        // Root schema is added twice
        expect(addSchemaSpy).toHaveBeenCalledTimes(2);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(1, expect.objectContaining(rootSchema), rootSchema.$id);
        expect(addSchemaSpy).toHaveBeenNthCalledWith(2, expect.objectContaining(schema), schema.$id);
      });
    });
    describe('validator.validateFormData()', () => {
      describe('No custom validate function, single value', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              [illFormedKey]: { type: 'string' },
            },
          };
          const result = validator.validateFormData({ foo: 42, [illFormedKey]: 41 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });

        it('should return an error list', () => {
          expect(errors).toHaveLength(2);
          expect(errors[0].message).toEqual('must be string');
          expect(errors[1].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
          expect(errorSchema[illFormedKey]!.__errors).toHaveLength(1);
          expect(errorSchema[illFormedKey]!.__errors![0]).toEqual('must be string');
        });
      });
      describe('Validating multipleOf with a float', () => {
        let errors: RJSFValidationError[];
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              price: {
                title: 'Price per task ($)',
                type: 'number',
                multipleOf: 0.01,
                minimum: 0,
              },
            },
          };
          const result = validator.validateFormData({ price: 0.14 }, schema);
          errors = result.errors;
        });
        it('should not return an error', () => {
          expect(errors).toHaveLength(0);
        });
      });
      describe('Validating multipleOf with a float, with multiple errors', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              price: {
                title: 'Price per task ($)',
                type: 'number',
                multipleOf: 0.03,
                minimum: 1,
              },
            },
          };
          const result = validator.validateFormData({ price: 0.14 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it('should have 2 errors', () => {
          expect(errors).toHaveLength(2);
        });
        it('first error is for minimum', () => {
          expect(errors[0].message).toEqual('must be >= 1');
        });
        it('first error is for multipleOf', () => {
          expect(errors[1].message).toEqual('must be multiple of 0.03');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.price!.__errors).toHaveLength(2);
          expect(errorSchema.price!.__errors).toEqual(['must be >= 1', 'must be multiple of 0.03']);
        });
      });
      describe('Validating required fields', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        describe('formData is not provided at top level', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1', 'pass2'],
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
              },
            };

            const formData = { pass1: 'a' };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
          });
        });
        describe('formData is not provided for nested child', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                nested: {
                  type: 'object',
                  required: ['pass1', 'pass2'],
                  properties: {
                    pass1: { type: 'string' },
                    pass2: { type: 'string' },
                  },
                },
              },
            };

            const formData = { nested: { pass1: 'a' } };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual("must have required property 'pass2'");
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.pass2!.__errors![0]).toEqual("must have required property 'pass2'");
          });
        });
        describe('title is in validation messages at the top level', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['firstName', 'lastName'],
              properties: {
                firstName: { title: 'First Name', type: 'string' },
                lastName: { title: 'Last Name', type: 'string' },
                numberOfChildren: {
                  title: 'Number of children',
                  type: 'string',
                  pattern: '\\d+',
                },
              },
            };

            const formData = { firstName: 'a', numberOfChildren: 'aa' };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'Last Name'",
              '\'Number of children\' must match pattern "\\d+"',
            ]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.lastName!.__errors![0]).toEqual("must have required property 'Last Name'");

            expect(errorSchema.numberOfChildren!.__errors).toHaveLength(1);
            expect(errorSchema.numberOfChildren!.__errors![0]).toEqual('must match pattern "\\d+"');
          });
        });
        describe('title is in validation messages at the top level, with an allOf', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                animal: {
                  title: 'My animal',
                  enum: ['Cat', 'Fish'],
                },
              },
              allOf: [
                {
                  required: ['animal'],
                },
              ],
            };

            const formData = {};
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);

            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual(["must have required property 'My animal'"]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.animal!.__errors).toHaveLength(1);
            expect(errorSchema.animal!.__errors![0]).toEqual("must have required property 'My animal'");
          });
        });
        describe('title is in validation messages at the top level, with if-then-else', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                hasPet: { type: 'boolean' },
                animal: {
                  title: 'My animal',
                  enum: ['Cat', 'Fish'],
                },
              },
              if: {
                properties: { hasPet: { const: true } },
                required: ['hasPet'],
              },
              then: {
                required: ['animal'],
              },
            };

            const formData = { hasPet: true };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual(["must have required property 'My animal'", 'must match "then" schema']);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.animal!.__errors).toHaveLength(1);
            expect(errorSchema.animal!.__errors![0]).toEqual("must have required property 'My animal'");
          });
        });
        describe('title is in validation messages at the top level, with an allOf, uiSchema title', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                animal: {
                  title: 'My animal',
                  enum: ['Cat', 'Fish'],
                },
              },
              allOf: [
                {
                  required: ['animal'],
                },
              ],
            };
            const uiSchema: UiSchema = {
              animal: {
                title: 'My animal uiSchema',
              },
            };

            const formData = {};
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);

            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual(["must have required property 'My animal uiSchema'"]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.animal!.__errors).toHaveLength(1);
            expect(errorSchema.animal!.__errors![0]).toEqual("must have required property 'My animal uiSchema'");
          });
        });
        describe('title is in validation messages at the top level, with if-then-else', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                hasPet: { type: 'boolean' },
                animal: {
                  title: 'My animal',
                  enum: ['Cat', 'Fish'],
                },
              },
              if: {
                properties: { hasPet: { const: true } },
                required: ['hasPet'],
              },
              then: {
                required: ['animal'],
              },
            };
            const uiSchema: UiSchema = {
              animal: {
                title: 'My animal uiSchema',
              },
            };

            const formData = { hasPet: true };
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual(["must have required property 'My animal uiSchema'", 'must match "then" schema']);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.animal!.__errors).toHaveLength(1);
            expect(errorSchema.animal!.__errors![0]).toEqual("must have required property 'My animal uiSchema'");
          });
        });
        describe('title is in validation message with a nested child', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                nested: {
                  type: 'object',
                  required: ['firstName', 'lastName'],
                  properties: {
                    firstName: { type: 'string', title: 'First Name' },
                    lastName: { type: 'string', title: 'Last Name' },
                    numberOfChildren: {
                      title: 'Number of children',
                      type: 'string',
                      pattern: '\\d+',
                    },
                  },
                },
              },
            };

            const formData = {
              nested: { firstName: 'a', numberOfChildren: 'aa' },
            };
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);
            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'Last Name'",
              '\'Number of children\' must match pattern "\\d+"',
            ]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.lastName!.__errors![0]).toEqual("must have required property 'Last Name'");

            expect(errorSchema.nested!.numberOfChildren!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.numberOfChildren!.__errors![0]).toEqual('must match pattern "\\d+"');
          });
        });
        describe('title is in validation message when it is in the uiSchema ui:title field', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['firstName', 'lastName'],
              properties: {
                firstName: { title: 'First Name', type: 'string' },
                lastName: { title: 'Last Name', type: 'string' },
                numberOfChildren: {
                  title: 'Number of children',
                  type: 'string',
                  pattern: '\\d+',
                },
              },
            };
            const uiSchema: UiSchema = {
              lastName: {
                'ui:title': 'uiSchema Last Name',
              },
              numberOfChildren: {
                'ui:title': 'uiSchema Number of children',
              },
            };

            const formData = { firstName: 'a', numberOfChildren: 'aa' };
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'uiSchema Last Name'",
              '\'uiSchema Number of children\' must match pattern "\\d+"',
            ]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.lastName!.__errors![0]).toEqual("must have required property 'uiSchema Last Name'");

            expect(errorSchema.numberOfChildren!.__errors).toHaveLength(1);
            expect(errorSchema.numberOfChildren!.__errors![0]).toEqual('must match pattern "\\d+"');
          });
        });
        describe('title is in validation message when it is in the uiSchema ui:title field with anyOf', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              anyOf: [
                {
                  type: 'object',
                  required: ['firstName', 'lastName'],
                  properties: {
                    firstName: { type: 'string', title: 'First Name' },
                    lastName: { type: 'string', title: 'Last Name' },
                  },
                },
              ],
            };
            const uiSchema: UiSchema = {
              anyOf: [
                {
                  firstName: {
                    'ui:title': 'uiSchema First Name',
                  },
                  lastName: {
                    'ui:title': 'uiSchema Last Name',
                  },
                },
              ],
            };

            const formData = { firstName: 'a' };
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const expected = ["must have required property 'uiSchema Last Name'", 'must match a schema in anyOf'];

            const messages = errors.map((e) => e.message);
            expect(messages).toEqual(expected);

            const stack = errors.map((e) => e.stack);
            expect(stack).toEqual(expected);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.lastName!.__errors![0]).toEqual("must have required property 'uiSchema Last Name'");

            expect(errorSchema.__errors).toHaveLength(1);
            expect(errorSchema.__errors![0]).toEqual('must match a schema in anyOf');
          });
        });
        describe('title is in validation message when it is in the uiSchema ui:title field with oneOf', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              oneOf: [
                {
                  type: 'object',
                  required: ['firstName', 'lastName'],
                  properties: {
                    firstName: { type: 'string', title: 'First Name' },
                    lastName: { type: 'string', title: 'Last Name' },
                  },
                },
              ],
            };
            const uiSchema: UiSchema = {
              oneOf: [
                {
                  firstName: {
                    'ui:title': 'uiSchema First Name',
                  },
                  lastName: {
                    'ui:title': 'uiSchema Last Name',
                  },
                },
              ],
            };

            const formData = { firstName: 'a' };
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const expected = [
              "must have required property 'uiSchema Last Name'",
              'must match exactly one schema in oneOf',
            ];

            const messages = errors.map((e) => e.message);
            expect(messages).toEqual(expected);

            const stack = errors.map((e) => e.stack);
            expect(stack).toEqual(expected);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.lastName!.__errors![0]).toEqual("must have required property 'uiSchema Last Name'");

            expect(errorSchema.__errors).toHaveLength(1);
            expect(errorSchema.__errors![0]).toEqual('must match exactly one schema in oneOf');
          });
        });
        describe('ui:title is in validation message when it is defined in referrer', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              definitions: {
                address: {
                  type: 'object',
                  properties: {
                    streetAddress: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                  },
                  required: ['streetAddress', 'city', 'state'],
                },
              },
              type: 'object',
              required: ['billingAddress', 'shippingAddress'],
              properties: {
                billingAddress: {
                  $ref: '#/definitions/address',
                },
                shippingAddress: {
                  $ref: '#/definitions/address',
                },
              },
            };
            const uiSchema: UiSchema = {
              billingAddress: {
                'ui:title': 'uiSchema Billing Address',
              },
              shippingAddress: {
                city: {
                  'ui:title': 'uiSchema City',
                },
              },
            };

            const formData = {
              shippingAddress: {
                streetAddress: 'El Camino Real',
                state: 'California',
              },
            };
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const expected = [
              "must have required property 'uiSchema Billing Address'",
              "must have required property 'uiSchema City'",
            ];

            const messages = errors.map((e) => e.message);
            expect(messages).toEqual(expected);

            const stack = errors.map((e) => e.stack);
            expect(stack).toEqual(expected);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.billingAddress!.__errors).toHaveLength(1);
            expect(errorSchema.billingAddress!.__errors![0]).toEqual(
              "must have required property 'uiSchema Billing Address'",
            );

            expect(errorSchema.shippingAddress!.city!.__errors).toHaveLength(1);
            expect(errorSchema.shippingAddress!.city!.__errors![0]).toEqual(
              "must have required property 'uiSchema City'",
            );
          });
        });
        describe('ui:title is in validation message when it is defined in definitions', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              definitions: {
                address: {
                  type: 'object',
                  properties: {
                    streetAddress: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                  },
                  required: ['streetAddress', 'city', 'state'],
                },
              },
              type: 'object',
              required: ['billingAddress', 'shippingAddress'],
              properties: {
                billingAddress: {
                  $ref: '#/definitions/address',
                },
                shippingAddress: {
                  $ref: '#/definitions/address',
                },
              },
            };
            const uiSchema: UiSchema = {
              definitions: {
                address: {
                  city: {
                    'ui:title': 'uiSchema City',
                  },
                },
              },
              billingAddress: {
                'ui:title': 'uiSchema Billing Address',
              },
            };

            const formData = {
              shippingAddress: {
                streetAddress: 'El Camino Real',
                state: 'California',
              },
            };
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const expected = [
              "must have required property 'uiSchema Billing Address'",
              "must have required property 'uiSchema City'",
            ];

            const messages = errors.map((e) => e.message);
            expect(messages).toEqual(expected);

            const stack = errors.map((e) => e.stack);
            expect(stack).toEqual(expected);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.billingAddress!.__errors).toHaveLength(1);
            expect(errorSchema.billingAddress!.__errors![0]).toEqual(
              "must have required property 'uiSchema Billing Address'",
            );

            expect(errorSchema.shippingAddress!.city!.__errors).toHaveLength(1);
            expect(errorSchema.shippingAddress!.city!.__errors![0]).toEqual(
              "must have required property 'uiSchema City'",
            );
          });
        });
        describe('uiSchema title in validation when defined in nested field', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                nested: {
                  type: 'object',
                  required: ['firstName', 'lastName'],
                  properties: {
                    firstName: { type: 'string', title: 'First Name' },
                    lastName: { type: 'string', title: 'Last Name' },
                    numberOfChildren: {
                      title: 'Number of children',
                      type: 'string',
                      pattern: '\\d+',
                    },
                  },
                },
              },
            };
            const uiSchema: UiSchema = {
              nested: {
                lastName: {
                  'ui:title': 'uiSchema Last Name',
                },
                numberOfChildren: {
                  'ui:title': 'uiSchema Number of children',
                },
              },
            };

            const formData = {
              nested: { firstName: 'a', numberOfChildren: 'aa' },
            };
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);
            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'uiSchema Last Name'",
              '\'uiSchema Number of children\' must match pattern "\\d+"',
            ]);
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.nested!.lastName!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.lastName!.__errors![0]).toEqual(
              "must have required property 'uiSchema Last Name'",
            );

            expect(errorSchema.nested!.numberOfChildren!.__errors).toHaveLength(1);
            expect(errorSchema.nested!.numberOfChildren!.__errors![0]).toEqual('must match pattern "\\d+"');
          });
        });
        describe('replace the error message field with schema property title', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['a', 'r'],
              properties: {
                a: { title: 'First Name', type: 'string' },
                r: { title: 'Last Name', type: 'string' },
              },
            };

            const formData = {};
            const result = validator.validateFormData(formData, schema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);

            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'First Name'",
              "must have required property 'Last Name'",
            ]);
          });
        });
        describe('replace the error message field with uiSchema property title', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['a', 'r'],
              properties: {
                a: { type: 'string', title: 'First Name' },
                r: { type: 'string', title: 'Last Name' },
              },
            };
            const uiSchema: UiSchema = {
              a: {
                'ui:title': 'uiSchema First Name',
              },
              r: {
                'ui:title': 'uiSchema Last Name',
              },
            };

            const formData = {};
            const result = validator.validateFormData(formData, schema, undefined, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(2);
            const stack = errors.map((e) => e.stack);

            expect(stack).toEqual([
              "must have required property 'uiSchema First Name'",
              "must have required property 'uiSchema Last Name'",
            ]);
          });
        });
      });
      describe('No custom validate function, single additionalProperties value', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          };
          const result = validator.validateFormData({ foo: 42 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });

        it('should return an error list', () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].message).toEqual('must be string');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema.foo!.__errors).toHaveLength(1);
          expect(errorSchema.foo!.__errors![0]).toEqual('must be string');
        });
      });
      describe("Doesn't recompile a schema with a specified ID", () => {
        it('Only compiles the schema once', () => {
          const schema: RJSFSchema = {
            $id: 'this-schema-has-an-id',
            type: 'object',
            properties: {
              string: {
                title: 'String field',
                type: 'string',
              },
            },
          };

          const compileSpy = vi.spyOn(validator.ajv, 'compile');
          compileSpy.mockClear();

          // Call validateFormData twice with the same schema
          validator.validateFormData({ string: 'a' }, schema);
          validator.validateFormData({ string: 'b' }, schema);

          expect(compileSpy).toHaveBeenCalledTimes(1);
        });
      });
      describe('TransformErrors', () => {
        let errors: RJSFValidationError[];
        let newErrorMessage: string;
        let transformErrors: Mock;
        let uiSchema: UiSchema;
        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              [illFormedKey]: { type: 'string' },
            },
          };
          uiSchema = {
            foo: { 'ui:label': false },
          };
          newErrorMessage = 'Better error message';
          transformErrors = vi.fn((errors: RJSFValidationError[]) => [{ ...errors[0], message: newErrorMessage }]);
          const result = validator.validateFormData(
            { foo: 42, [illFormedKey]: 41 },
            schema,
            undefined,
            transformErrors,
            uiSchema,
          );
          errors = result.errors;
        });

        it('should use transformErrors function', () => {
          expect(errors).not.toHaveLength(0);
          expect(errors[0].message).toEqual(newErrorMessage);
        });
        it('transformErrors function was called with uiSchema', () => {
          expect(transformErrors).toHaveBeenCalledWith(expect.any(Array), uiSchema);
        });
      });
      describe('Custom validate function', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;
        let validate: Mock;
        let uiSchema: UiSchema;
        beforeAll(() => {
          uiSchema = {
            foo: { 'ui:label': false },
          };

          validate = vi.fn(
            (formData: { pass1?: string; pass2?: string }, errors: FormValidation<{ pass2?: string }>) => {
              if (formData.pass1 !== formData.pass2) {
                errors.pass2?.addError('passwords don`t match.');
              }
              return errors;
            },
          );
        });
        describe('formData is provided', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1', 'pass2'],
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
                foo: { type: 'array', items: { type: 'string' } }, // Adding an array for test coverage
              },
            };
            const formData = { pass1: 'a', pass2: 'b', foo: ['a'] };
            const result = validator.validateFormData(formData, schema, validate, undefined, uiSchema);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual('passwords don`t match.');
          });
          it('validate function was called with uiSchema', () => {
            expect(validate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), uiSchema, expect.any(Object));
          });
        });
        describe('formData is missing data', () => {
          beforeAll(() => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                pass1: { type: 'string' },
                pass2: { type: 'string' },
              },
            };
            const formData = { pass1: 'a' };
            const result = validator.validateFormData(formData, schema, validate);
            errors = result.errors;
            errorSchema = result.errorSchema;
          });
          it('should return an error list', () => {
            expect(errors).toHaveLength(1);
            expect(errors[0].stack).toEqual('.pass2 passwords don`t match.');
          });
          it('should return an errorSchema', () => {
            expect(errorSchema.pass2!.__errors).toHaveLength(1);
            expect(errorSchema.pass2!.__errors![0]).toEqual('passwords don`t match.');
          });
        });
        describe('formData does not pass ajv validation', () => {
          let validate: Mock;
          let errorSchema: ErrorSchema;

          beforeAll(() => {
            validate = vi.fn(
              (
                _formData: unknown,
                errors: FormValidation<{ pass1?: string }>,
                _uiSchema?: UiSchema,
                errorSchema?: ErrorSchema<{ pass1: string }>,
              ) => {
                if ((errorSchema?.pass1?.__errors?.length ?? 0) > 0) {
                  errors.pass1?.addError('custom error from customValidate');
                }
                return errors;
              },
            );

            const schema: RJSFSchema = {
              type: 'object',
              required: ['pass1'],
              properties: {
                pass1: { type: 'string' },
              },
            };

            const formData = {};
            const result = validator.validateFormData(formData, schema, validate, undefined, {});
            errorSchema = result.errorSchema;
          });

          it('validate function was called with errorSchema', () => {
            expect(validate).toHaveBeenCalledTimes(1);
            const passedErrorSchema = validate.mock.calls[0][3];
            expect(passedErrorSchema).toBeDefined();
            expect(passedErrorSchema.pass1.__errors).toEqual(["must have required property 'pass1'"]);
          });

          it('returns merged errorSchema including customValidate errors', () => {
            expect(errorSchema.pass1!.__errors).toEqual([
              "must have required property 'pass1'",
              'custom error from customValidate',
            ]);
          });
        });
      });
      describe('Data-Url validation', () => {
        let schema: RJSFSchema;
        beforeAll(() => {
          schema = {
            type: 'object',
            properties: {
              dataUrlWithName: { type: 'string', format: 'data-url' },
              dataUrlWithoutName: { type: 'string', format: 'data-url' },
            },
          };
        });
        it('Data-Url with name is accepted', () => {
          const formData = {
            dataUrlWithName: 'data:text/plain;name=file1.txt;base64,x=',
          };
          const result = validator.validateFormData(formData, schema);
          expect(result.errors).toHaveLength(0);
        });
        it('Data-Url without name is accepted', () => {
          const formData = {
            dataUrlWithoutName: 'data:text/plain;base64,x=',
          };
          const result = validator.validateFormData(formData, schema);
          expect(result.errors).toHaveLength(0);
        });
      });
      describe('Invalid schema', () => {
        let errors: RJSFValidationError[];
        let errorSchema: ErrorSchema;

        beforeAll(() => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              foo: {
                type: 'string',
                required: 'invalid_type_non_array' as unknown as string[],
              },
            },
          };
          const result = validator.validateFormData({ foo: 42 }, schema);
          errors = result.errors;
          errorSchema = result.errorSchema;
        });
        it('should return an error list', () => {
          expect(errors).toHaveLength(1);
          expect(errors[0].stack).toEqual('schema is invalid: data/properties/foo/required must be array');
        });
        it('should return an errorSchema', () => {
          expect(errorSchema).toEqual({
            $schema: {
              __errors: ['schema is invalid: data/properties/foo/required must be array'],
            },
          });
        });
      });
    });
  });
  describe('validator.validateFormData(), custom options, and localizer', () => {
    let validator: AJV8Validator;
    let schema: RJSFSchema;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = vi.fn().mockImplementation(noop);
      validator = new AJV8Validator({}, localizer);
      schema = {
        $ref: '#/definitions/Dataset',
        $schema: 'http://json-schema.org/draft-06/schema#',
        definitions: {
          Dataset: {
            properties: {
              datasetId: {
                pattern: '\\d+',
                type: 'string',
              },
            },
            required: ['datasetId'],
            type: 'object',
          },
        },
      };
    });
    it('should return a validation error about meta schema when meta schema is not defined', () => {
      const errors = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
      const errMessage = 'no schema with key or ref "http://json-schema.org/draft-06/schema#"';
      expect(errors.errors).toEqual([{ stack: errMessage }]);
      expect(errors.errorSchema).toEqual({
        $schema: { __errors: [errMessage] },
      });
      expect(localizer).not.toHaveBeenCalled();
    });
    describe('validating using single custom meta schema', () => {
      let errors: RJSFValidationError[];
      beforeAll(() => {
        vi.mocked(localizer).mockClear();
        validator = new AJV8Validator(
          {
            additionalMetaSchemas: [metaSchemaDraft6],
          },
          localizer,
        );
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
      it('localizer was called with the errors', () => {
        expect(localizer).toHaveBeenCalledWith([
          {
            data: 'some kind of text',
            instancePath: '/datasetId',
            keyword: 'pattern',
            message: 'must match pattern "\\d+"',
            params: { pattern: '\\d+' },
            parentSchema: {
              pattern: '\\d+',
              type: 'string',
            },
            schema: '\\d+',
            schemaPath: '#/definitions/Dataset/properties/datasetId/pattern',
          },
        ]);
      });
    });
    describe('validating using several custom meta schemas', () => {
      let errors: RJSFValidationError[];

      beforeAll(() => {
        validator = new AJV8Validator({
          additionalMetaSchemas: [metaSchemaDraft6],
        });
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
    });
    describe('validating using custom string formats', () => {
      let validator: ValidatorType;
      let schema: RJSFSchema;
      beforeAll(() => {
        validator = new AJV8Validator({});
        schema = {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              format: 'phone-us',
            },
          },
        };
      });
      it('should not return a validation error if unknown string format is used', () => {
        const result = expectWarn(
          () => validator.validateFormData({ phone: '800.555.2368' }, schema),
          expect.stringContaining('unknown format'),
        );
        expect(result.errors).toHaveLength(0);
      });
      describe('validating using a custom formats', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          validator = new AJV8Validator({
            customFormats: {
              'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
              'area-code': /\d{3}/,
            },
          });
          const result = validator.validateFormData({ phone: '800.555.2368' }, schema);
          errors = result.errors;
        });
        it('should return 1 error about formData', () => {
          expect(errors).toHaveLength(1);
        });
        it('should return a validation error about formData', () => {
          expect(errors[0].stack).toEqual('.phone must match format "phone-us"');
        });
        describe('prop updates with new custom formats are accepted', () => {
          beforeAll(() => {
            const result = validator.validateFormData(
              { phone: 'abc' },
              {
                type: 'object',
                properties: {
                  phone: {
                    type: 'string',
                    format: 'area-code',
                  },
                },
              },
            );
            errors = result.errors;
          });

          it('should return 1 error about formData', () => {
            expect(errors).toHaveLength(1);
          });
          it('should return a validation error about formData', () => {
            expect(errors[0].stack).toEqual('.phone must match format "area-code"');
          });
        });
      });
    });
    describe('validating required fields with localizer', () => {
      beforeAll(() => {
        localizer = vi.fn().mockImplementation(noop);
        validator = new AJV8Validator({}, localizer);
        schema = {
          type: 'object',
          required: ['a'],
          properties: {
            a: {
              type: 'string',
              title: 'A',
            },
          },
        };
      });
      it('should enclose missing properties with quotes', () => {
        const errors = validator.validateFormData({}, schema);
        const errMessage = "must have required property 'A'";
        expect(errors.errors[0].message).toEqual(errMessage);
        expect(errors.errors[0].stack).toEqual(errMessage);
        expect(errors.errorSchema).toEqual({
          a: { __errors: [errMessage] },
        });
        expect(errors.errors[0].params.missingProperty).toEqual('a');
      });
      it('should handle the case when errors are not present', () => {
        const errors = validator.validateFormData({ a: 'some kind of text' }, schema);
        expect(errors.errors).toHaveLength(0);
      });
    });
  });
  describe('validator.validateFormData(), custom options, localizer and Ajv2019', () => {
    let validator: AJV8Validator;
    let schema: RJSFSchema;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = vi.fn().mockImplementation(noop);
      validator = new AJV8Validator({ AjvClass: Ajv2019 }, localizer);
      schema = {
        $ref: '#/definitions/Dataset',
        $schema: 'http://json-schema.org/draft-06/schema#',
        definitions: {
          Dataset: {
            properties: {
              datasetId: {
                pattern: '\\d+',
                type: 'string',
              },
            },
            required: ['datasetId'],
            type: 'object',
          },
        },
      };
    });
    it('should return a validation error about meta schema when meta schema is not defined', () => {
      const errors = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
      const errMessage = 'no schema with key or ref "http://json-schema.org/draft-06/schema#"';
      expect(errors.errors).toEqual([{ stack: errMessage }]);
      expect(errors.errorSchema).toEqual({
        $schema: { __errors: [errMessage] },
      });
      expect(localizer).not.toHaveBeenCalled();
    });
    describe('validating using single custom meta schema', () => {
      let errors: RJSFValidationError[];
      beforeAll(() => {
        vi.mocked(localizer).mockClear();
        validator = new AJV8Validator(
          {
            additionalMetaSchemas: [metaSchemaDraft6],
            AjvClass: Ajv2019,
          },
          localizer,
        );
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
      it('localizer was called with the errors', () => {
        expect(localizer).toHaveBeenCalledWith([
          {
            data: 'some kind of text',
            instancePath: '/datasetId',
            keyword: 'pattern',
            message: 'must match pattern "\\d+"',
            params: { pattern: '\\d+' },
            parentSchema: {
              pattern: '\\d+',
              type: 'string',
            },
            schema: '\\d+',
            schemaPath: '#/definitions/Dataset/properties/datasetId/pattern',
          },
        ]);
      });
    });
    describe('validating using several custom meta schemas', () => {
      let errors: RJSFValidationError[];

      beforeAll(() => {
        validator = new AJV8Validator({
          additionalMetaSchemas: [metaSchemaDraft6],
          AjvClass: Ajv2019,
        });
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
    });
    describe('validating using custom string formats', () => {
      let validator: ValidatorType;
      let schema: RJSFSchema;
      beforeAll(() => {
        validator = new AJV8Validator({ AjvClass: Ajv2019 });
        schema = {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              format: 'phone-us',
            },
          },
        };
      });
      it('should not return a validation error if unknown string format is used', () => {
        const result = expectWarn(
          () => validator.validateFormData({ phone: '800.555.2368' }, schema),
          expect.stringContaining('unknown format'),
        );
        expect(result.errors).toHaveLength(0);
      });
      describe('validating using a custom formats', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          validator = new AJV8Validator({
            customFormats: {
              'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
              'area-code': /\d{3}/,
            },
          });
          const result = validator.validateFormData({ phone: '800.555.2368' }, schema);
          errors = result.errors;
        });
        it('should return 1 error about formData', () => {
          expect(errors).toHaveLength(1);
        });
        it('should return a validation error about formData', () => {
          expect(errors[0].stack).toEqual('.phone must match format "phone-us"');
        });
        describe('prop updates with new custom formats are accepted', () => {
          beforeAll(() => {
            const result = validator.validateFormData(
              { phone: 'abc' },
              {
                type: 'object',
                properties: {
                  phone: {
                    type: 'string',
                    format: 'area-code',
                  },
                },
              },
            );
            errors = result.errors;
          });

          it('should return 1 error about formData', () => {
            expect(errors).toHaveLength(1);
          });
          it('should return a validation error about formData', () => {
            expect(errors[0].stack).toEqual('.phone must match format "area-code"');
          });
        });
      });
    });
    describe('validating dependencies', () => {
      beforeAll(() => {
        validator = new AJV8Validator({ AjvClass: Ajv2019 }, ajvI18n.en);
      });
      it('should return an error when a dependent is missing', () => {
        schema = {
          type: 'object',
          properties: {
            creditCard: {
              type: 'number',
            },
            billingAddress: {
              type: 'string',
            },
          },
          dependentRequired: {
            creditCard: ['billingAddress'],
          },
        };
        const errors = validator.validateFormData({ creditCard: 1234567890 }, schema);
        const errMessage = "must have property 'billingAddress' when property 'creditCard' is present";
        expect(errors.errors[0].message).toEqual(errMessage);
        expect(errors.errors[0].stack).toEqual(errMessage);
        expect(errors.errorSchema).toEqual({
          billingAddress: {
            __errors: [errMessage],
          },
        });
        expect(errors.errors[0].params.deps).toEqual('billingAddress');
      });
      it('should return an error when multiple dependents are missing', () => {
        schema = {
          type: 'object',
          properties: {
            creditCard: {
              type: 'number',
            },
            holderName: {
              type: 'string',
            },
            billingAddress: {
              type: 'string',
            },
          },
          dependentRequired: {
            creditCard: ['holderName', 'billingAddress'],
          },
        };
        const errors = validator.validateFormData({ creditCard: 1234567890 }, schema);
        const errMessage = "must have properties 'holderName', 'billingAddress' when property 'creditCard' is present";
        expect(errors.errors[0].message).toEqual(errMessage);
        expect(errors.errors[0].stack).toEqual(errMessage);
        expect(errors.errorSchema).toEqual({
          billingAddress: {
            __errors: [errMessage],
          },
          holderName: {
            __errors: [errMessage],
          },
        });
        expect(errors.errors[0].params.deps).toEqual('holderName, billingAddress');
      });
      it('should return an error with title when a dependent is missing', () => {
        schema = {
          type: 'object',
          properties: {
            creditCard: {
              type: 'number',
              title: 'Credit card',
            },
            billingAddress: {
              type: 'string',
              title: 'Billing address',
            },
          },
          dependentRequired: {
            creditCard: ['billingAddress'],
          },
        };
        const errors = validator.validateFormData({ creditCard: 1234567890 }, schema);
        const errMessage = "must have property 'Billing address' when property 'Credit card' is present";
        expect(errors.errors[0].message).toEqual(errMessage);
        expect(errors.errors[0].stack).toEqual(errMessage);
        expect(errors.errorSchema).toEqual({
          billingAddress: {
            __errors: [errMessage],
          },
        });
        expect(errors.errors[0].params.deps).toEqual('billingAddress');
      });
      it('should return an error with titles when multiple dependents are missing', () => {
        schema = {
          type: 'object',
          properties: {
            creditCard: {
              type: 'number',
              title: 'Credit card',
            },
            holderName: {
              type: 'string',
              title: 'Holder name',
            },
            billingAddress: {
              type: 'string',
              title: 'Billing address',
            },
          },
          dependentRequired: {
            creditCard: ['holderName', 'billingAddress'],
          },
        };
        const errors = validator.validateFormData({ creditCard: 1234567890 }, schema);
        const errMessage =
          "must have properties 'Holder name', 'Billing address' when property 'Credit card' is present";
        expect(errors.errors[0].message).toEqual(errMessage);
        expect(errors.errors[0].stack).toEqual(errMessage);
        expect(errors.errorSchema).toEqual({
          billingAddress: {
            __errors: [errMessage],
          },
          holderName: {
            __errors: [errMessage],
          },
        });
        expect(errors.errors[0].params.deps).toEqual('holderName, billingAddress');
      });
      it('should return an error with uiSchema title when a dependent is missing', () => {
        schema = {
          type: 'object',
          properties: {
            creditCard: {
              type: 'number',
            },
            billingAddress: {
              type: 'string',
            },
          },
          dependentRequired: {
            creditCard: ['billingAddress'],
          },
        };
        const uiSchema: UiSchema = {
          creditCard: {
            'ui:title': 'uiSchema Credit card',
          },
          billingAddress: {
            'ui:title': 'uiSchema Billing address',
          },
        };
        const errors = validator.validateFormData({ creditCard: 1234567890 }, schema, undefined, undefined, uiSchema);
        const errMessage =
          "must have property 'uiSchema Billing address' when property 'uiSchema Credit card' is present";
        expect(errors.errors[0].message).toEqual(errMessage);
        expect(errors.errors[0].stack).toEqual(errMessage);
        expect(errors.errorSchema).toEqual({
          billingAddress: {
            __errors: [errMessage],
          },
        });
        expect(errors.errors[0].params.deps).toEqual('billingAddress');
      });
      it('should return an error with uiSchema titles when multiple dependents are missing', () => {
        schema = {
          type: 'object',
          properties: {
            creditCard: {
              type: 'number',
            },
            holderName: {
              type: 'string',
            },
            billingAddress: {
              type: 'string',
            },
          },
          dependentRequired: {
            creditCard: ['holderName', 'billingAddress'],
          },
        };
        const uiSchema: UiSchema = {
          creditCard: {
            'ui:title': 'uiSchema Credit card',
          },
          holderName: {
            'ui:title': 'uiSchema Holder name',
          },
          billingAddress: {
            'ui:title': 'uiSchema Billing address',
          },
        };
        const errors = validator.validateFormData({ creditCard: 1234567890 }, schema, undefined, undefined, uiSchema);
        const errMessage =
          "must have properties 'uiSchema Holder name', 'uiSchema Billing address' when property 'uiSchema Credit card' is present";
        expect(errors.errors[0].message).toEqual(errMessage);
        expect(errors.errors[0].stack).toEqual(errMessage);
        expect(errors.errorSchema).toEqual({
          billingAddress: {
            __errors: [errMessage],
          },
          holderName: {
            __errors: [errMessage],
          },
        });
        expect(errors.errors[0].params.deps).toEqual('holderName, billingAddress');
      });
      it('should handle the case when errors are not present', () => {
        schema = {
          type: 'object',
          properties: {
            creditCard: {
              type: 'number',
            },
            holderName: {
              type: 'string',
            },
            billingAddress: {
              type: 'string',
            },
          },
          dependentRequired: {
            creditCard: ['holderName', 'billingAddress'],
          },
        };
        const errors = validator.validateFormData(
          {
            creditCard: 1234567890,
            holderName: 'Alice',
            billingAddress: 'El Camino Real',
          },
          schema,
        );
        expect(errors.errors).toHaveLength(0);
      });
    });
  });
  describe('validator.validateFormData(), custom options, localizer and Ajv2020', () => {
    let validator: AJV8Validator;
    let schema: RJSFSchema;
    let localizer: Localizer;
    beforeAll(() => {
      localizer = vi.fn().mockImplementation(noop);
      validator = new AJV8Validator({ AjvClass: Ajv2020 }, localizer);
      schema = {
        $ref: '#/definitions/Dataset',
        $schema: 'http://json-schema.org/draft-06/schema#',
        definitions: {
          Dataset: {
            properties: {
              datasetId: {
                pattern: '\\d+',
                type: 'string',
              },
            },
            required: ['datasetId'],
            type: 'object',
          },
        },
      };
    });
    it('should return a validation error about meta schema when meta schema is not defined', () => {
      const errors = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
      const errMessage = 'no schema with key or ref "http://json-schema.org/draft-06/schema#"';
      expect(errors.errors).toEqual([{ stack: errMessage }]);
      expect(errors.errorSchema).toEqual({
        $schema: { __errors: [errMessage] },
      });
      expect(localizer).not.toHaveBeenCalled();
    });
    describe('validating using single custom meta schema', () => {
      let errors: RJSFValidationError[];
      beforeAll(() => {
        vi.mocked(localizer).mockClear();
        validator = new AJV8Validator(
          {
            additionalMetaSchemas: [metaSchemaDraft6],
            AjvClass: Ajv2020,
          },
          localizer,
        );
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
      it('localizer was called with the errors', () => {
        expect(localizer).toHaveBeenCalledWith([
          {
            data: 'some kind of text',
            instancePath: '/datasetId',
            keyword: 'pattern',
            message: 'must match pattern "\\d+"',
            params: { pattern: '\\d+' },
            parentSchema: {
              pattern: '\\d+',
              type: 'string',
            },
            schema: '\\d+',
            schemaPath: '#/definitions/Dataset/properties/datasetId/pattern',
          },
        ]);
      });
    });
    describe('validating using several custom meta schemas', () => {
      let errors: RJSFValidationError[];

      beforeAll(() => {
        validator = new AJV8Validator({
          additionalMetaSchemas: [metaSchemaDraft6],
          AjvClass: Ajv2020,
        });
        const result = validator.validateFormData({ datasetId: 'some kind of text' }, schema);
        errors = result.errors;
      });
      it('should return 1 error about formData', () => {
        expect(errors).toHaveLength(1);
      });
      it('has a pattern match validation error about formData', () => {
        expect(errors[0].stack).toEqual('.datasetId must match pattern "\\d+"');
      });
    });
    describe('validating using custom string formats', () => {
      let validator: ValidatorType;
      let schema: RJSFSchema;
      beforeAll(() => {
        validator = new AJV8Validator({ AjvClass: Ajv2020 });
        schema = {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              format: 'phone-us',
            },
          },
        };
      });
      it('should not return a validation error if unknown string format is used', () => {
        const result = expectWarn(
          () => validator.validateFormData({ phone: '800.555.2368' }, schema),
          expect.stringContaining('unknown format'),
        );
        expect(result.errors).toHaveLength(0);
      });
      describe('validating using a custom formats', () => {
        let errors: RJSFValidationError[];

        beforeAll(() => {
          validator = new AJV8Validator({
            customFormats: {
              'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
              'area-code': /\d{3}/,
            },
          });
          const result = validator.validateFormData({ phone: '800.555.2368' }, schema);
          errors = result.errors;
        });
        it('should return 1 error about formData', () => {
          expect(errors).toHaveLength(1);
        });
        it('should return a validation error about formData', () => {
          expect(errors[0].stack).toEqual('.phone must match format "phone-us"');
        });
        describe('prop updates with new custom formats are accepted', () => {
          beforeAll(() => {
            const result = validator.validateFormData(
              { phone: 'abc' },
              {
                type: 'object',
                properties: {
                  phone: {
                    type: 'string',
                    format: 'area-code',
                  },
                },
              },
            );
            errors = result.errors;
          });

          it('should return 1 error about formData', () => {
            expect(errors).toHaveLength(1);
          });
          it('should return a validation error about formData', () => {
            expect(errors[0].stack).toEqual('.phone must match format "area-code"');
          });
        });
      });
    });
  });
  describe('with suppressDuplicateFiltering option', () => {
    it('should store the suppressDuplicateFiltering value on the instance', () => {
      const validator = new AJV8Validator({
        suppressDuplicateFiltering: 'all',
      });
      expect(validator.suppressDuplicateFiltering).toBe('all');
    });
  });
  describe('time and date-time formats (RFC 3339 timezone requirement)', () => {
    let validator: AJV8Validator;
    beforeAll(() => {
      validator = new AJV8Validator({});
    });
    const timeSchema: RJSFSchema = { type: 'string', format: 'time' };
    const dateTimeSchema: RJSFSchema = { type: 'string', format: 'date-time' };
    const isoTimeSchema: RJSFSchema = { type: 'string', format: 'iso-time' };
    const isoDateTimeSchema: RJSFSchema = { type: 'string', format: 'iso-date-time' };

    it('should accept a "time" value with a "Z" offset', () => {
      expect(validator.isValid(timeSchema, '20:20:39Z', timeSchema)).toBe(true);
    });
    it('should accept a "time" value with a numeric offset', () => {
      expect(validator.isValid(timeSchema, '20:20:39+05:30', timeSchema)).toBe(true);
    });
    it('should reject a "time" value with no timezone offset', () => {
      expect(validator.isValid(timeSchema, '20:20:39', timeSchema)).toBe(false);
    });
    it('should accept a "date-time" value with a "Z" offset', () => {
      expect(validator.isValid(dateTimeSchema, '2016-04-05T14:01:30.000Z', dateTimeSchema)).toBe(true);
    });
    it('should reject a "date-time" value with no timezone offset', () => {
      expect(validator.isValid(dateTimeSchema, '2016-04-05T14:01:30', dateTimeSchema)).toBe(false);
    });
    it('should accept an "iso-time" value with no timezone offset, for backwards compatibility', () => {
      expect(validator.isValid(isoTimeSchema, '20:20:39', isoTimeSchema)).toBe(true);
    });
    it('should accept an "iso-date-time" value with no timezone offset, for backwards compatibility', () => {
      expect(validator.isValid(isoDateTimeSchema, '2016-04-05T14:01:30', isoDateTimeSchema)).toBe(true);
    });
  });
});

describe('validateFormData() and the data handed to customValidate', () => {
  it('hands customValidate the formData whose defaults the caller computed', () => {
    const validator = new AJV8Validator({});
    const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
    const customValidate = vi.fn<CustomValidator>((_formData, errors) => errors);
    // `Form` computes these with its own `SchemaUtils`, so they honor the `customMergeAllOf` and
    // `defaultFormStateBehavior` it was given, which a validator has no way to know
    validator.validateFormData({}, schema, customValidate, undefined, undefined, () => ({ a: 'fromTheForm' }));
    expect(customValidate.mock.calls[0][0]).toEqual({ a: 'fromTheForm' });
  });

  it('hands customValidate an undefined the caller computed, rather than recomputing its own defaults', () => {
    const validator = new AJV8Validator({});
    // A root whose defaults legitimately come out `undefined` for the form: read rather than called, the parameter
    // could not say that, and the validator would recompute `[]` here with neither of the form's settings
    const schema: RJSFSchema = { type: 'array', items: { type: 'object', properties: { a: { type: 'string' } } } };
    const customValidate = vi.fn<CustomValidator>((_formData, errors) => errors);
    validator.validateFormData(undefined, schema, customValidate, undefined, undefined, () => undefined);
    expect(customValidate.mock.calls[0][0]).toBeUndefined();
  });

  it('computes them itself, with the default allOf merge, when the caller supplies none', () => {
    const validator = new AJV8Validator({});
    const schema: RJSFSchema = {
      type: 'object',
      allOf: [{ properties: { merged: { type: 'string', default: 'fromAllOf' } } }],
    };
    const customValidate = vi.fn<CustomValidator>((_formData, errors) => errors);
    validator.validateFormData({}, schema, customValidate);
    expect(customValidate.mock.calls[0][0]).toEqual({ merged: 'fromAllOf' });
  });
});

describe('validateFormData() with a transformErrors that clears every message', () => {
  it('lists the errors whether or not a customValidate is passed', () => {
    const validator = new AJV8Validator({});
    const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string', minLength: 8 } } };
    const transformErrors: ErrorTransformer = (errors) => errors.map((error) => ({ ...error, message: undefined }));
    const customValidate: CustomValidator = (_formData, errors) => errors;
    const { errors } = validator.validateFormData({ a: 'short' }, schema, undefined, transformErrors);
    expect(errors).not.toEqual([]);
    expect(validator.validateFormData({ a: 'short' }, schema, customValidate, transformErrors).errors).toEqual(errors);
  });
});

describe('AJV8Validator resolving a $ref local to the root', () => {
  const optionRoot = (extra: RJSFSchema): RJSFSchema => ({
    ...extra,
    type: 'object',
    definitions: { a: { const: 'a' }, b: { const: 'b' } },
    properties: {
      v: {
        type: 'object',
        oneOf: [
          {
            properties: { kind: { $ref: '#/definitions/a' }, x: { type: 'string', default: 'X' } },
            required: ['kind'],
          },
          {
            properties: { kind: { $ref: '#/definitions/b' }, y: { type: 'string', default: 'Y' } },
            required: ['kind'],
          },
        ],
      },
    },
  });
  it.each([
    ['no $id', {}],
    ['an absolute $id', { $id: 'https://example.com/root.json' }],
    ['a relative $id', { $id: 'root.json' }],
    ['an $id ending in an empty fragment', { $id: 'https://example.com/root.json#' }],
  ])('picks the option a nested $ref matches under a root with %s', (_name, extra) => {
    const rootSchema = optionRoot(extra);
    const schemaUtils = createSchemaUtils({ validator: new AJV8Validator({}) }, rootSchema);
    expect(schemaUtils.getDefaultFormState(rootSchema, { v: { kind: 'b' } })).toEqual({ v: { kind: 'b', y: 'Y' } });
  });
  it('takes the then branch of an if holding a $ref under a 2020-12 root with an $id', () => {
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      $defs: { x: { const: 'x' } },
      type: 'object',
      properties: { k: { type: 'string', default: 'x' } },
      if: { properties: { k: { $ref: '#/$defs/x' } } },
      then: { properties: { t: { type: 'string', default: 't' } } },
      else: { properties: { e: { type: 'string', default: 'e' } } },
    };
    const schemaUtils = createSchemaUtils({ validator: new AJV8Validator({ AjvClass: Ajv2020 }) }, rootSchema);
    expect(schemaUtils.getDefaultFormState(rootSchema, { k: 'x' })).toEqual({ k: 'x', t: 't' });
  });
  it('does not resolve a root with an $id against an earlier root without one', () => {
    const validator = new AJV8Validator({});
    validator.isValid({ $ref: '#/definitions/a' }, 'x', { definitions: { a: { const: 'b' }, b: { const: 'a' } } });
    const rootSchema = optionRoot({ $id: 'https://example.com/root.json' });
    const schemaUtils = createSchemaUtils({ validator }, rootSchema);
    expect(schemaUtils.getDefaultFormState(rootSchema, { v: { kind: 'b' } })).toEqual({ v: { kind: 'b', y: 'Y' } });
  });
  it('does not answer a $ref with what it compiled against an earlier root under the same id', () => {
    const validator = new AJV8Validator({});
    const ref: RJSFSchema = { $ref: '#/definitions/x' };
    expect(validator.isValid(ref, 's', { definitions: { x: { type: 'string' } } })).toBe(true);
    const numberRoot: RJSFSchema = { definitions: { x: { type: 'number' } } };
    expect(validator.isValid(ref, 's', numberRoot)).toBe(false);
    expect(validator.isValid(ref, 5, numberRoot)).toBe(true);
  });
  it.each([
    'https://example.com/root.json#',
    'http://example.com:80/root.json',
    'HTTP://Example.COM/root.json',
    'http://example.com/a b.json',
  ])('replaces a root whose $id is %j with an edited root under the same $id', (id) => {
    const validator = new AJV8Validator({});
    const rootSchema: RJSFSchema = { $id: id, definitions: { x: { type: 'string' } } };
    const edited: RJSFSchema = { ...rootSchema, definitions: { x: { type: 'number' } } };
    expect(validator.isValid({ $ref: '#/definitions/x' }, 's', rootSchema)).toBe(true);
    expect(validator.isValid({ $ref: '#/definitions/x' }, 's', edited)).toBe(false);
    expect(validator.isValid({ $ref: '#/definitions/x' }, 1, edited)).toBe(true);
  });
  it('scores a 2020-12 option whose $ref has constraints beside it against the resource it sits in', () => {
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'http://x/root.json',
      $defs: {
        x: { type: 'object', properties: { v: { const: 'root' } }, required: ['v'] },
        B: {
          $id: 'http://x/b.json',
          $defs: { x: { type: 'object', properties: { v: { const: 'b' } }, required: ['v'] } },
          type: 'object',
          properties: {
            c: {
              oneOf: [
                { $ref: '#/$defs/x', minProperties: 1 },
                { type: 'object', properties: { w: { type: 'number' } }, required: ['w'] },
              ],
            },
          },
        },
      },
      type: 'object',
      properties: { b: { $ref: 'http://x/b.json' } },
    };
    const schemaUtils = createSchemaUtils({ validator: new AJV8Validator({}) }, rootSchema);
    const schemaOf = (value: unknown): RJSFSchema => (isSchemaObject(value) ? value : {});
    const b = schemaUtils.retrieveSchema(schemaOf(schemaUtils.retrieveSchema(rootSchema).properties?.b));
    const options = (schemaUtils.retrieveSchema(schemaOf(b.properties?.c), { v: 'b' }).oneOf ?? []).map(schemaOf);
    expect(schemaUtils.getFirstMatchingOption({ v: 'b' }, options)).toBe(0);
    expect(schemaUtils.getClosestMatchingOption({ v: 'b' }, options)).toBe(0);
  });
  it('matches the options beside dependencies of an object reached in two resources as each resource reads them', () => {
    const shared: RJSFSchema = {
      type: 'object',
      properties: { k: { type: 'string' } },
      dependencies: { k: { properties: { d: { type: 'string' } } } },
      oneOf: [{ $ref: '#/$defs/o1' }, { $ref: '#/$defs/o2' }],
    };
    const resource = (id: string, first: string, second: string): RJSFSchema => ({
      $id: id,
      $defs: {
        o1: { properties: { k: { const: first }, one: { type: 'string' } } },
        o2: { properties: { k: { const: second }, two: { type: 'string' } } },
        s: shared,
      },
    });
    const rootSchema: RJSFSchema = {
      $id: 'http://x/root.json',
      type: 'object',
      $defs: { A: resource('http://x/a.json', 'x', 'y'), B: resource('http://x/b.json', 'y', 'x') },
      properties: { pa: { $ref: 'http://x/a.json#/$defs/s' }, pb: { $ref: 'http://x/b.json#/$defs/s' } },
    };
    const schemaUtils = createSchemaUtils({ validator: new AJV8Validator({}) }, rootSchema);
    const view = schemaUtils.retrieveSchema(rootSchema, { pa: { k: 'x' }, pb: { k: 'x' } });
    const propertyKeys = (key: string) => {
      const property = view.properties?.[key];
      const retrieved = schemaUtils.retrieveSchema(isSchemaObject(property) ? property : {}, { k: 'x' });
      return Object.keys(retrieved.properties ?? {});
    };
    expect(propertyKeys('pa')).toEqual(['k', 'one', 'd']);
    expect(propertyKeys('pb')).toEqual(['k', 'two', 'd']);
  });
  it.each(['http://s.example/sub.json', 'http://s.example/sub.json#'])(
    'compiles a schema with an $id of its own, %s, anew under each root it is checked against',
    (id) => {
      const validator = new AJV8Validator({});
      const rootA: RJSFSchema = { $id: 'http://a.example/root.json', definitions: { x: { type: 'string' } } };
      const rootB: RJSFSchema = { $id: 'http://b.example/root.json', definitions: { x: { type: 'number' } } };
      const own: RJSFSchema = { $id: id, $ref: '#/definitions/x' };
      expect(validator.isValid(own, 'str', rootA)).toBe(true);
      expect(validator.isValid(own, 1, rootB)).toBe(true);
      expect(validator.isValid(own, 'str', rootB)).toBe(false);
      expect(validator.isValid(own, 'str', rootA)).toBe(true);
    },
  );
  it.each(['http://example.com:80/root.json', 'HTTP://Example.COM/root.json', 'http://example.com/a b.json'])(
    'validates form data against an edited root whose $id is %j rather than the root it replaced',
    (id) => {
      const validator = new AJV8Validator({});
      const rootSchema: RJSFSchema = {
        $id: id,
        definitions: { x: { type: 'string' } },
        type: 'object',
        properties: { x: { $ref: '#/definitions/x' } },
      };
      const edited: RJSFSchema = { ...rootSchema, definitions: { x: { type: 'number' } } };
      expect(validator.isValid({ $ref: '#/definitions/x' }, 's', rootSchema)).toBe(true);
      expect(validator.isValid({ $ref: '#/definitions/x' }, 1, edited)).toBe(true);
      expect(validator.validateFormData({ x: 1 }, edited).errors).toEqual([]);
    },
  );
});

describe('AJV8Validator validating a subschema by its place in the root', () => {
  it('does not answer a pointer with what it compiled for an earlier root', () => {
    const validator = customizeValidator();
    const pointer: RJSFSchema = { $ref: '#/definitions/X' };
    expect(validator.isValid(pointer, 's', { definitions: { X: { type: 'string' } } })).toBe(true);
    const numberRoot: RJSFSchema = { definitions: { X: { type: 'number' } } };
    expect(validator.isValid(pointer, 's', numberRoot)).toBe(false);
    expect(validator.isValid(pointer, 5, numberRoot)).toBe(true);
  });
  it('resolves a pointer into a root that carries an $id', () => {
    const validator = customizeValidator();
    const rootSchema: RJSFSchema = { $id: 'http://example.com/root.json', definitions: { X: { type: 'string' } } };
    expect(validator.isValid({ $ref: '#/definitions/X' }, 's', rootSchema)).toBe(true);
    expect(validator.isValid({ $ref: '#/definitions/X' }, 5, rootSchema)).toBe(false);
  });
  it('resolves a pointer into a root whose $id ends in an empty fragment', () => {
    const validator = customizeValidator();
    const rootSchema: RJSFSchema = { $id: 'http://example.com/root.json#', definitions: { X: { type: 'string' } } };
    expect(validator.isValid({ $ref: '#/definitions/X' }, 's', rootSchema)).toBe(true);
    expect(validator.isValid({ $ref: '#/definitions/X' }, 5, rootSchema)).toBe(false);
  });
  it('resolves a pointer under $defs to a property whose name holds characters a fragment may and may not hold, a # ending it', () => {
    const validator = customizeValidator();
    const property: RJSFSchema = { type: 'string' };
    const rootSchema: RJSFSchema = { $defs: { X: { properties: { 'a$b:c@d+e#f g%h#': property } } } };
    const pointer = getValidationTarget(property, rootSchema);
    expect(pointer).toEqual({ $ref: '#/$defs/X/properties/a$b:c@d+e%23f%20g%25h%23' });
    expect(validator.isValid(pointer, 's', rootSchema)).toBe(true);
    expect(validator.isValid(pointer, 5, rootSchema)).toBe(false);
  });
  it('resolves a pointer into a dependencies entry named like a keyword', () => {
    const validator = customizeValidator();
    const rootSchema: RJSFSchema = {
      properties: { type: { type: 'string' } },
      dependencies: { type: { oneOf: [{ properties: { type: { const: 'a' } } }] } },
    };
    const pointer: RJSFSchema = { $ref: '#/dependencies/type/oneOf/0/properties/type' };
    expect(validator.isValid(pointer, 'a', rootSchema)).toBe(true);
    expect(validator.isValid(pointer, 'b', rootSchema)).toBe(false);
  });
});

pointerValidationTests(() => customizeValidator());
absoluteRefValidationTests(() => customizeValidator());
sharedSubschemaValidationTests(() => customizeValidator());
