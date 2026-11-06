import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils } from '@rjsf/utils';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import { createPrecompiledValidator, customizeValidator } from '../src/index.ts';
import loadModule from './harness/loadModule.ts';

// `findSelectedOptionInXxxOf()` validates each option as `retrieveSchema()` hands it out, which can be a new object once
// the data gives it a stub, an `allOf` or an `if`/`then` to resolve, so the compile list has to hold what it asks for
describe('findFieldInSchema() through options with no discriminator', () => {
  const optionA: RJSFSchema = { type: 'object', properties: { a: { type: 'string', title: 'A' } }, required: ['a'] };
  const optionB: RJSFSchema = { type: 'object', properties: { b: { type: 'number', title: 'B' } }, required: ['b'] };
  const nested = (thing: RJSFSchema, rest: RJSFSchema = {}): RJSFSchema => ({
    type: 'object',
    properties: { thing },
    ...rest,
  });

  it.each<[string, RJSFSchema, string, unknown, string]>([
    ['with data', nested({ type: 'object', anyOf: [optionA, optionB] }), 'thing.b', { thing: { b: 1 } }, 'B'],
    ['with no data', nested({ type: 'object', anyOf: [optionA, optionB] }), 'thing.a', undefined, 'A'],
    [
      'written as $refs',
      nested(
        { type: 'object', anyOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] },
        { definitions: { A: optionA, B: optionB } },
      ),
      'thing.b',
      { thing: { b: 1 } },
      'B',
    ],
    [
      'whose extra keys the data stubs',
      nested({
        type: 'object',
        anyOf: [
          { ...optionA, additionalProperties: { type: 'string' } },
          { ...optionB, additionalProperties: { type: 'string' } },
        ],
      }),
      'thing.b',
      { thing: { b: 1, z: 'q' } },
      'B',
    ],
    [
      'with an allOf to resolve',
      nested({ type: 'object', anyOf: [{ allOf: [optionA] }, { allOf: [optionB] }] }),
      'thing.b',
      { thing: { b: 1 } },
      'B',
    ],
    [
      'with an if/then to resolve',
      nested({
        type: 'object',
        anyOf: [
          optionA,
          {
            type: 'object',
            properties: { b: { type: 'number' } },
            if: { required: ['b'] },
            then: { properties: { c: { type: 'string', title: 'C' } } },
          },
        ],
      }),
      'thing.c',
      { thing: { b: 1, c: 'x' } },
      'C',
    ],
  ])('finds the same field as a live validator, for options %s', (_, schema, path, formData, title) => {
    const live = createSchemaUtils({ validator: customizeValidator() }, schema);
    const precompiled = createSchemaUtils(
      { validator: createPrecompiledValidator(loadModule(compileSchemaValidatorsCode(schema)), schema) },
      schema,
    );

    expect(precompiled.findFieldInSchema(schema, path, formData).field?.title).toBe(title);
    expect(precompiled.findFieldInSchema(schema, path, formData)).toEqual(
      live.findFieldInSchema(schema, path, formData),
    );
  });
});
