import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import { createSchemaUtils, getFirstMatchingOption, JUNK_OPTION_ID, noop } from '../../src/index.ts';
import type { TestValidatorType } from './types.ts';

export default function getFirstMatchingOptionTest(testValidator: TestValidatorType) {
  describe('getFirstMatchingOption()', () => {
    let rootSchema: RJSFSchema;
    beforeAll(() => {
      rootSchema = {
        definitions: {
          a: { type: 'object', properties: { id: { enum: ['a'] } } },
          nested: {
            type: 'object',
            properties: {
              id: { enum: ['nested'] },
              child: { $ref: '#/definitions/any' },
            },
          },
          any: {
            anyOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/nested' }],
          },
        },
        $ref: '#/definitions/any',
      };
    });
    it('should infer correct anyOf schema based on data if passing undefined', () => {
      const options: RJSFSchema[] = [
        { type: 'object', properties: { id: { enum: ['a'] } } },
        {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/definitions/any' },
          },
        },
      ];
      expect(getFirstMatchingOption({ validator: testValidator }, undefined, options, rootSchema)).toEqual(0);
    });
    it("holds the augmentation outside an option that has an $id, keeping only the junk option's", () => {
      const validated: RJSFSchema[] = [];
      // What the augmentation is handed to validate is what a validator keys the function it compiles by, so it is read
      // from a validator that records it rather than from whichever one this suite is running against. Failing every
      // option is what makes both of them reach `isValid()`
      const recordingValidator: ValidatorType = {
        isValid: (schema: RJSFSchema) => {
          validated.push(schema);
          return false;
        },
        rawValidation: () => ({}),
        validateFormData: () => ({ errors: [], errorSchema: {} }),
      };
      const options: RJSFSchema[] = [
        { $id: 'anOption', type: 'object', properties: { id: { enum: ['a'] } } },
        { $id: JUNK_OPTION_ID, type: 'object', properties: { id: { enum: ['b'] } } },
      ];
      expect(getFirstMatchingOption({ validator: recordingValidator }, { id: 'a' }, options, rootSchema)).toEqual(0);
      expect(validated).toEqual([
        // The option stays whole inside the `allOf`, under a derived `$id` that keeps its own as the base, so that a
        // relative `$ref` left inside it still resolves and resolves to the option rather than to what wraps it
        {
          allOf: [
            {
              $id: expect.stringMatching(/^anOption\?rjsf=.+/),
              type: 'object',
              properties: { id: { enum: ['a'] } },
            },
          ],
          anyOf: [{ required: ['id'] }],
        },
        // The precompiled validators recognise the junk option by its `$id` and answer it without a compiled function
        { $id: JUNK_OPTION_ID, type: 'object', properties: { id: { enum: ['b'] } }, anyOf: [{ required: ['id'] }] },
      ]);
    });
    it('drops the required of an option that has an $id along with the one that has none', () => {
      const validated: RJSFSchema[] = [];
      const recordingValidator: ValidatorType = {
        isValid: (schema: RJSFSchema) => {
          validated.push(schema);
          return false;
        },
        rawValidation: () => ({}),
        validateFormData: () => ({ errors: [], errorSchema: {} }),
      };
      const options: RJSFSchema[] = [
        { $id: 'anOption', type: 'object', properties: { id: { enum: ['a'] } }, required: ['id'] },
        { type: 'object', properties: { id: { enum: ['b'] } }, required: ['id'] },
      ];
      getFirstMatchingOption({ validator: recordingValidator }, { id: 'a' }, options, rootSchema);
      // A key the user has yet to fill in would fail the option's own `required`, so scoring asserts the `anyOf` of its
      // property names in its place, wherever that assertion ends up living
      expect(validated[0]).not.toHaveProperty('allOf.0.required');
      expect(validated[1]).not.toHaveProperty('required');
    });
    it('scores an option describing a map as it stands, since it declares no keys to assert', () => {
      const validated: RJSFSchema[] = [];
      const recordingValidator: ValidatorType = {
        isValid: (schema: RJSFSchema) => {
          validated.push(schema);
          return false;
        },
        rawValidation: () => ({}),
        validateFormData: () => ({ errors: [], errorSchema: {} }),
      };
      // `stubExistingAdditionalProperties()` gives an option describing a map an empty `properties` before it is
      // scored, and an `anyOf` over no keys asserts nothing that can be satisfied, which a validator rejects outright
      const options: RJSFSchema[] = [
        { type: 'object', additionalProperties: { type: 'string' }, properties: {} },
        { $id: 'mapWithAnId', type: 'object', additionalProperties: { type: 'string' }, properties: {} },
      ];
      getFirstMatchingOption({ validator: recordingValidator }, { anyKey: 'x' }, options, rootSchema);
      expect(validated).toHaveLength(2);
      for (const scored of validated) {
        expect(scored).not.toHaveProperty('anyOf');
        expect(scored).not.toHaveProperty('allOf');
      }
    });
    it('derives an $id for an option whose own ends in an empty fragment', () => {
      const validated: RJSFSchema[] = [];
      const recordingValidator: ValidatorType = {
        isValid: (schema: RJSFSchema) => {
          validated.push(schema);
          return false;
        },
        rawValidation: () => ({}),
        validateFormData: () => ({ errors: [], errorSchema: {} }),
      };
      const options: RJSFSchema[] = [{ $id: 'http://e.com/a.json#', type: 'object', properties: { a: {} } }];
      getFirstMatchingOption({ validator: recordingValidator }, { a: 'x' }, options, rootSchema);
      // Appending to the fragment would put the query inside it, and the 2019-09 and 2020-12 meta-schemas require an
      // `$id` to match `^[^#]*#?$`, so every variant of such an option failed to compile
      const [wrappedOption] = validated[0].allOf as RJSFSchema[];
      const derived = wrappedOption.$id;
      expect(derived).toMatch(/^http:\/\/e\.com\/a\.json\?rjsf=/);
      expect(derived).not.toContain('#');
    });
    it('derives the schema an option is scored by once, so re-scoring it does not hash it again', () => {
      const validated: RJSFSchema[] = [];
      const recordingValidator: ValidatorType = {
        isValid: (schema: RJSFSchema) => {
          validated.push(schema);
          return false;
        },
        rawValidation: () => ({}),
        validateFormData: () => ({ errors: [], errorSchema: {} }),
      };
      const options: RJSFSchema[] = [{ $id: 'anOption', type: 'object', properties: { id: { enum: ['a'] } } }];
      getFirstMatchingOption({ validator: recordingValidator }, { id: 'a' }, options, rootSchema);
      getFirstMatchingOption({ validator: recordingValidator }, { id: 'b' }, options, rootSchema);
      // Deriving the `$id` serializes the whole option, and an option is re-scored on every change to the form data,
      // so the derivation is memoized by the option it came from: the same object back is what proves it
      expect(validated[1]).toBe(validated[0]);
    });
    it('scores a boolean option as it stands, since it declares nothing to augment', () => {
      const validated: unknown[] = [];
      const recordingValidator: ValidatorType = {
        isValid: (schema: RJSFSchema) => {
          validated.push(schema);
          return false;
        },
        rawValidation: () => ({}),
        validateFormData: () => ({ errors: [], errorSchema: {} }),
      };
      // JSON Schema allows a boolean subschema anywhere a schema goes, an `anyOf`/`oneOf` entry included
      const options = [true, false] as unknown as RJSFSchema[];
      expect(getFirstMatchingOption({ validator: recordingValidator }, { id: 'a' }, options, rootSchema)).toEqual(0);
      expect(validated).toEqual([true, false]);
    });
    it('should handle undefined formData when a discriminator field is present in an option', () => {
      const options: RJSFSchema[] = [{ type: 'object', properties: { id: { const: 'a' } } }];
      expect(getFirstMatchingOption({ validator: testValidator }, undefined, options, rootSchema, 'id')).toEqual(0);
    });
    it('should infer correct anyOf schema with properties also having anyOf/allOf', () => {
      // Mock isValid to iterate through both options by failing the first
      testValidator.setReturnValues({ isValid: [false, false] });
      const options: RJSFSchema[] = [
        {
          type: 'object',
          properties: { id: { enum: ['a'] } },
          anyOf: [{ type: 'string' }, { type: 'boolean' }],
        },
        {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/definitions/any' },
          },
          anyOf: [{ type: 'number' }, { type: 'boolean' }],
          allOf: [{ type: 'string' }],
        },
      ];
      expect(getFirstMatchingOption({ validator: testValidator }, null, options, rootSchema)).toEqual(0);
    });
    it('returns 0 if no options match', () => {
      // Mock isValid fail all the tests to trigger the fall-through
      testValidator.setReturnValues({ isValid: [false, false, false] });
      const options: RJSFSchema[] = [{ type: 'string' }, { type: 'string' }, { type: 'null' }];
      expect(getFirstMatchingOption({ validator: testValidator }, undefined, options, rootSchema)).toEqual(0);
    });
    it('should infer correct anyOf schema based on data if passing null and option 2 is {type: null}', () => {
      // Mock isValid fail the first two, non-null values
      testValidator.setReturnValues({ isValid: [false, false, true] });
      const options: RJSFSchema[] = [{ type: 'string' }, { type: 'string' }, { type: 'null' }];
      expect(getFirstMatchingOption({ validator: testValidator }, null, options, rootSchema)).toEqual(2);
    });
    it('should infer correct anyOf schema based on data', () => {
      // Mock isValid to fail the first non-nested value
      testValidator.setReturnValues({ isValid: [false, true] });
      const options: RJSFSchema[] = [
        { type: 'object', properties: { id: { enum: ['a'] } } },
        {
          type: 'object',
          properties: {
            id: { enum: ['nested'] },
            child: { $ref: '#/definitions/any' },
          },
        },
      ];
      const formData = {
        id: 'nested',
        child: {
          id: 'nested',
          child: {
            id: 'a',
          },
        },
      };
      const schemaUtils = createSchemaUtils({ validator: testValidator }, rootSchema);
      expect(schemaUtils.getFirstMatchingOption(formData, options)).toEqual(1);
      // Mock again isValid fail the first non-nested value
      testValidator.setReturnValues({ isValid: [false, true] });
      expect(schemaUtils.getFirstMatchingOption(formData, options)).toEqual(1);
    });
    it('should return 0 when schema has discriminator but no matching data', () => {
      // Mock isValid to fail both values
      testValidator.setReturnValues({ isValid: [false, false] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: { title: 'Code', default: 'foo_coding', enum: ['foo_coding'], type: 'string' },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: { title: 'Code', default: 'bar_coding', enum: ['bar_coding'], type: 'string' },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
        required: ['code'],
      };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      expect(getFirstMatchingOption({ validator: testValidator }, null, options, schema, 'code')).toEqual(0);
    });

    // simple in the sense of getOptionMatchingSimpleDiscriminator
    it('should return Bar when schema has simple discriminator for bar', () => {
      // Mock isValid to pass the second value
      testValidator.setReturnValues({ isValid: [false, true] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: { title: 'Code', default: 'foo_coding', enum: ['foo_coding'], type: 'string' },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: { title: 'Code', default: 'bar_coding', enum: ['bar_coding'], type: 'string' },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
        required: ['code'],
      };
      const formData = { code: 'bar_coding' };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      // Use the schemaUtils to verify the discriminator prop gets passed
      const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
      expect(schemaUtils.getFirstMatchingOption(formData, options, 'code')).toEqual(1);
    });

    // simple in the sense of getOptionMatchingSimpleDiscriminator
    it('should return Bar when schema has non-simple discriminator for bar', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
      // Mock isValid to pass the second value
      testValidator.setReturnValues({ isValid: [false, true] });
      const schema: RJSFSchema = {
        type: 'object',
        definitions: {
          Foo: {
            title: 'Foo',
            type: 'object',
            properties: {
              code: { title: 'Code', type: 'array', items: { type: 'string', enum: ['foo_coding'] } },
            },
          },
          Bar: {
            title: 'Bar',
            type: 'object',
            properties: {
              code: { title: 'Code', type: 'array', items: { type: 'string', enum: ['bar_coding'] } },
            },
          },
        },
        discriminator: {
          propertyName: 'code',
        },
        oneOf: [{ $ref: '#/definitions/Foo' }, { $ref: '#/definitions/Bar' }],
        required: ['code'],
      };
      const formData = { code: ['bar_coding'] };
      const options = [schema.definitions!.Foo, schema.definitions!.Bar] as RJSFSchema[];
      // Use the schemaUtils to verify the discriminator prop gets passed
      const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
      const result = schemaUtils.getFirstMatchingOption(formData, options, 'code');
      const wasWarned = consoleWarnSpy.mock.calls.length > 0;
      if (wasWarned) {
        // According to the docs https://ajv.js.org/json-schema.html#discriminator, with ajv8 discrimator turned on the
        // schema in this test will fail because of the limitations of AJV implementation
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Error encountered compiling schema:',
          expect.objectContaining({
            message: 'discriminator: "properties/code" must have "const" or "enum"',
          }),
        );
        expect(result).toEqual(0);
      } else {
        expect(result).toEqual(1);
      }
      consoleWarnSpy.mockRestore();
    });
  });
}
