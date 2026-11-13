import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import { createSchemaUtils, getFirstMatchingOption, noop } from '../../src/index.ts';
import type { TestValidatorType } from './types.ts';

/** Returns a validator that records every schema it is asked to validate and fails all of them. What the augmentation
 * is handed to validate is what a validator keys the function it compiles by, so it is read from a validator that
 * records it rather than from whichever one this suite is running against, and failing every option is what makes
 * scoring reach them all.
 */
function recordingValidator() {
  const validated: RJSFSchema[] = [];
  const validator: ValidatorType = {
    isValid: (schema: RJSFSchema) => {
      validated.push(schema);
      return false;
    },
    rawValidation: () => ({}),
    validateFormData: () => ({ errors: [], errorSchema: {} }),
  };
  return { validated, validator };
}

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
    it('scores an option of the root that states no required by a pointer to it', () => {
      const { validated, validator } = recordingValidator();
      const options: RJSFSchema[] = [
        { $id: 'anOption', type: 'object', properties: { id: { enum: ['a'] } } },
        { type: 'object', properties: { id: { enum: ['b'] } } },
      ];
      const root: RJSFSchema = { oneOf: options };
      expect(getFirstMatchingOption({ validator }, { id: 'a' }, options, root)).toEqual(0);
      expect(validated).toEqual([{ $ref: '#/oneOf/0' }, { $ref: '#/oneOf/1' }]);
    });
    it('scores an option without a key the data holds as no match, without asking the validator', () => {
      const { validated, validator } = recordingValidator();
      const options: RJSFSchema[] = [{ type: 'object', properties: { id: { enum: ['a'] } } }];
      getFirstMatchingOption({ validator }, { other: 'a' }, options, rootSchema);
      expect(validated).toEqual([]);
    });
    it('drops the required of an option that has an $id along with the one that has none', () => {
      const { validated, validator } = recordingValidator();
      const options: RJSFSchema[] = [
        { $id: 'anOption', type: 'object', properties: { id: { enum: ['a'] } }, required: ['id'] },
        { type: 'object', properties: { id: { enum: ['b'] } }, required: ['id'] },
      ];
      getFirstMatchingOption({ validator }, { id: 'a' }, options, rootSchema);
      // A key the user has yet to fill in would fail the option's own `required`, so scoring asserts the `anyOf` of its
      // property names in its place, wherever that assertion ends up living
      expect(validated[0]).not.toHaveProperty('allOf.0.required');
      expect(validated[1]).not.toHaveProperty('required');
    });
    it('scores an option describing a map as it stands, since it declares no keys to assert', () => {
      const { validated, validator } = recordingValidator();
      // `stubExistingAdditionalProperties()` gives an option describing a map an empty `properties` before it is
      // scored, and an `anyOf` over no keys asserts nothing that can be satisfied, which a validator rejects outright
      const options: RJSFSchema[] = [
        { type: 'object', additionalProperties: { type: 'string' }, properties: {} },
        { $id: 'mapWithAnId', type: 'object', additionalProperties: { type: 'string' }, properties: {} },
      ];
      getFirstMatchingOption({ validator }, { anyKey: 'x' }, options, rootSchema);
      expect(validated).toHaveLength(2);
      for (const scored of validated) {
        expect(scored).not.toHaveProperty('anyOf');
        expect(scored).not.toHaveProperty('allOf');
      }
    });
    it('scores an option without the $id it states, so the copy is not compiled as the schema that $id names', () => {
      const { validated, validator } = recordingValidator();
      const options: RJSFSchema[] = [
        { $id: 'http://e.com/a.json#', type: 'object', properties: { a: {} }, required: ['a'] },
      ];
      getFirstMatchingOption({ validator }, { a: 'x' }, options, rootSchema);
      expect(validated[0]).not.toHaveProperty('$id');
    });
    it('matches a boolean option by what it says, without asking the validator', () => {
      const { validated, validator } = recordingValidator();
      // JSON Schema allows a boolean subschema anywhere a schema goes, an `anyOf`/`oneOf` entry included
      const options = [true, false] as unknown as RJSFSchema[];
      expect(getFirstMatchingOption({ validator }, { id: 'a' }, options, rootSchema)).toEqual(0);
      expect(validated).toEqual([]);
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
    it('does not match an option that declares no keys at all, so a "none" option leaves the data alone', () => {
      // Scored as it stands, an option with an empty `properties` matches every object, so a "none of these" option in
      // front of the real ones takes the data away from them -- the selector snaps back to it as a field is cleared
      const { validated, validator } = recordingValidator();
      const options: RJSFSchema[] = [
        { title: 'None', type: 'object', properties: {} },
        { title: 'Some', type: 'object', properties: { a: { type: 'string' } } },
      ];
      getFirstMatchingOption({ validator }, { a: 'x' }, options, rootSchema);
      expect(validated).toHaveLength(1);
      expect(validated[0]).toMatchObject({ title: 'Some' });
    });
    it('scores an option describing a map as it stands, since it declares its keys elsewhere', () => {
      const { validated, validator } = recordingValidator();
      const option: RJSFSchema = { type: 'object', properties: {}, additionalProperties: { type: 'string' } };
      getFirstMatchingOption({ validator }, { k: 'v' }, [option], rootSchema);
      expect(validated[0]).toEqual(option);
    });
    it('scores an option describing a map through unevaluatedProperties as it stands', () => {
      // The keyword describes the keys the option's `properties` don't name as much as `additionalProperties` does, so
      // an option carrying it describes a map rather than nothing at all
      const { validated, validator } = recordingValidator();
      const option = { type: 'object', properties: {}, unevaluatedProperties: { type: 'number' } } as RJSFSchema;
      getFirstMatchingOption({ validator }, { k: 1 }, [option], rootSchema);
      expect(validated[0]).toEqual(option);
    });
    it('does not match an option whose additionalProperties is spelled undefined', () => {
      // A keyword spelled `undefined`, as a schema built by spreading tends to spell one, reads as absent the way a
      // validator reads it, so it leaves the option describing no key its `properties` don't name
      const { validated, validator } = recordingValidator();
      const option: RJSFSchema = { type: 'object', properties: {}, additionalProperties: undefined };
      getFirstMatchingOption({ validator }, { a: 'x' }, [option], rootSchema);
      expect(validated).toEqual([]);
    });
    it('does not match an option whose patternProperties name no pattern either', () => {
      // An empty `patternProperties` describes no key, so it leaves the option with nothing to match on, the same way
      // an empty `properties` does
      const { validated, validator } = recordingValidator();
      const option: RJSFSchema = { type: 'object', properties: {}, patternProperties: {} };
      getFirstMatchingOption({ validator }, { a: 'x' }, [option], rootSchema);
      expect(validated).toEqual([]);
    });
    it('scores an option that declares no properties at all as it stands', () => {
      // An option without a `properties` key describes something other than an object, so there are no keys to assert
      const { validated, validator } = recordingValidator();
      const option: RJSFSchema = { type: 'string', minLength: 1 };
      getFirstMatchingOption({ validator }, 'x', [option], rootSchema);
      expect(validated[0]).toEqual(option);
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

    it('should match each option as a whole when the data holds no value for the discriminator property', () => {
      const { validated, validator } = recordingValidator();
      const foo: RJSFSchema = { type: 'object', properties: { code: { enum: ['foo_coding'] }, foo: {} } };
      const bar: RJSFSchema = { type: 'object', properties: { code: { enum: ['bar_coding'] }, bar: {} } };
      const schema: RJSFSchema = { discriminator: { propertyName: 'code' }, oneOf: [foo, bar] };
      expect(getFirstMatchingOption({ validator }, { bar: 1 }, [foo, bar], schema, 'code')).toEqual(0);
      expect(validated).toEqual([{ $ref: '#/oneOf/1' }]);
    });

    it('should check an option declaring no discriminator property as a whole', () => {
      const { validated, validator } = recordingValidator();
      const foo: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const bar: RJSFSchema = { type: 'object', properties: { name: { type: 'number' } } };
      const schema: RJSFSchema = { discriminator: { propertyName: 'code' }, oneOf: [foo, bar] };
      expect(getFirstMatchingOption({ validator }, { name: 1 }, [foo, bar], schema, 'code')).toEqual(0);
      expect(validated).toEqual([{ $ref: '#/oneOf/0' }, { $ref: '#/oneOf/1' }]);
    });

    // simple: the discriminator property is a string enum
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

    // non-simple: the discriminator property is an array
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
          expect.stringMatching(/^Error encountered compiling schema "[^"]+":$/),
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
