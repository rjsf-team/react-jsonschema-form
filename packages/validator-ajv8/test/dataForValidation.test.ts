import type { RJSFSchema, ValidatorType } from '@rjsf/utils';
import type { Options } from 'ajv';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import type { CompiledValidateFunction } from '../src/index.ts';
import { createPrecompiledValidator, customizeValidator } from '../src/index.ts';
import { evalValidatorCode } from './harness/compileSuperSchema.ts';
import { expectWarn } from './harness/testData.ts';

class Holder {
  readonly k = 'x';
}

const filled: RJSFSchema = {
  type: 'object',
  properties: { flag: { type: 'string', default: 'on' } },
  required: ['flag'],
};

/** Each option that lets Ajv change the data it validates, with a schema the data is valid against only once changed */
const changing: [string, Options, RJSFSchema, () => unknown][] = [
  ['useDefaults', { useDefaults: true }, filled, () => ({})],
  ['coerceTypes', { coerceTypes: true }, { type: 'object', properties: { n: { type: 'number' } } }, () => ({ n: '1' })],
  [
    'removeAdditional',
    { removeAdditional: true },
    { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: false },
    () => ({ a: 'x', extra: 1 }),
  ],
];

const validators: [string, (schema: RJSFSchema, options?: Options) => ValidatorType][] = [
  ['live', (_schema, options) => customizeValidator({ ajvOptionsOverrides: options })],
  [
    'precompiled',
    (schema, options) =>
      createPrecompiledValidator(
        evalValidatorCode(compileSchemaValidatorsCode(schema, { ajvOptionsOverrides: options })),
        schema,
      ),
  ],
];

describe.each(validators)('isValid() of a %s validator', (_kind, create) => {
  it.each(changing)('validates a copy of the data under %s, leaving the data it is handed as it was', (...args) => {
    const [, options, schema, data] = args;
    const formData = data();

    expect(create(schema, options).isValid(schema, formData, schema)).toBe(true);
    expect(formData).toEqual(data());
    expect(create(schema).isValid(schema, formData, schema)).toBe(false);
  });
  it.each<[string, RJSFSchema, () => object]>([
    ['an array', { type: 'array', items: filled }, () => [{}, {}]],
    ['a class instance', filled, () => new Holder()],
    ['a Date', filled, () => new Date(0)],
  ])('fills defaults into a copy of %s', (_name, schema, data) => {
    const formData = data();

    expect(create(schema, { useDefaults: true }).isValid(schema, formData, schema)).toBe(true);
    expect(formData).toEqual(data());
    expect(Object.keys(formData)).toEqual(Object.keys(data()));
  });
  it('copies an object with no prototype as one, which inherits no property a schema names', () => {
    // Ajv reads a named property through the prototype, so a copy inheriting `Object.prototype` would hold a function
    // under `toString`
    const named: RJSFSchema = { type: 'string' };
    const schema: RJSFSchema = {
      type: 'object',
      properties: { toString: named, flag: { type: 'string', default: 'on' } },
    };
    const formData: Record<string, unknown> = Object.create(null);

    expect(create(schema, { useDefaults: true }).isValid(schema, formData, schema)).toBe(true);
    expect(Object.keys(formData)).toEqual([]);
  });
});

describe('the data isValid() hands the validation function', () => {
  it('is the data itself under options that leave it as it is, and a copy under one that changes it', () => {
    const seen: unknown[] = [];
    const recording = (options?: Options) =>
      customizeValidator({
        ajvOptionsOverrides: options,
        extenderFn: (ajv) =>
          ajv.addKeyword({
            keyword: 'x-seen',
            validate: (_schema: unknown, data: unknown) => {
              seen.push(data);
              return true;
            },
          }),
      });
    const schema: RJSFSchema = { 'x-seen': true };
    const formData = { a: 1 };

    recording().isValid(schema, formData, schema);
    recording({ useDefaults: true }).isValid(schema, formData, schema);

    expect(seen[0]).toBe(formData);
    expect(seen[1]).not.toBe(formData);
    expect(seen[1]).toEqual(formData);
  });
  it('is the data itself for a precompiled function unless it is marked as changing the data', () => {
    const seen: unknown[] = [];
    const recording: CompiledValidateFunction = (data: unknown) => {
      seen.push(data);
      return true;
    };
    const schema: RJSFSchema = { $id: 'recording' };
    const validator = createPrecompiledValidator({ recording }, schema);
    const formData = { a: 1 };

    validator.isValid(schema, formData, schema);
    recording.changesData = true;
    validator.isValid(schema, formData, schema);

    expect(seen[0]).toBe(formData);
    expect(seen[1]).not.toBe(formData);
    expect(seen[1]).toEqual(formData);
  });
  it('reports data it cannot copy as invalid, since validating the data itself could change it', () => {
    const validator = customizeValidator({ ajvOptionsOverrides: { useDefaults: true } });
    const schema: RJSFSchema = { $id: 'uncopyable', ...filled };
    const formData = { held: Object.assign(new Holder(), { onChange: () => undefined }) };

    const isValid = expectWarn(
      () => validator.isValid(schema, formData, schema),
      'Error encountered validating form data against schema "uncopyable":',
      expect.any(Error),
    );
    expect(isValid).toBe(false);
  });
});

describe('compileSchemaValidatorsCode()', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: { a: { anyOf: [{ type: 'string' }, { type: 'number', default: 1 }] } },
  };
  it.each<[string, Options | undefined, boolean | undefined]>([
    ['options that leave the data as it is', undefined, undefined],
    ['useDefaults', { useDefaults: true }, true],
  ])('marks each function it compiles with %s as changing the data or not', (_name, options, marked) => {
    const functions = Object.values(
      evalValidatorCode(compileSchemaValidatorsCode(schema, { ajvOptionsOverrides: options })),
    );

    expect(functions.length).toBeGreaterThan(1);
    expect(functions.map((validate) => validate.changesData)).toEqual(functions.map(() => marked));
  });
  it('marks a function an ES module exports by the name it exports it under', () => {
    const code = compileSchemaValidatorsCode(
      { $id: 'root', type: 'object', properties: { a: { type: 'string', default: 'x' } } },
      { ajvOptionsOverrides: { useDefaults: true, code: { esm: true } } },
    );

    expect(code).toContain('export const root = ');
    expect(code.trimEnd().endsWith('\nroot.changesData = true;')).toBe(true);
  });
});
