import { readFileSync } from 'fs';
import { RJSFSchema, schemaParser } from '@rjsf/utils';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators';
import createAjvInstance from '../src/createAjvInstance';
import superSchema from './harness/superSchema.json';
import { CUSTOM_OPTIONS } from './harness/testData';

jest.mock('../src/createAjvInstance', () =>
  jest.fn().mockImplementation((...args) => jest.requireActual('../src/createAjvInstance').default(...args)),
);

describe('compileSchemaValidatorsCode()', () => {
  let expectedCode: string;
  let generatedCode: string;

  describe('compiling without additional options', () => {
    let schemas: RJSFSchema[];
    beforeAll(() => {
      schemas = Object.values(schemaParser(superSchema as unknown as RJSFSchema));
      expectedCode = readFileSync('./test/harness/superSchema.cjs').toString();
      generatedCode = compileSchemaValidatorsCode(superSchema as unknown as RJSFSchema);
    });
    it('create AJV instance was called with the expected options', () => {
      const expectedCompileOpts = {
        code: { source: true, lines: true },
        schemas,
      };
      expect(createAjvInstance).toHaveBeenCalledWith(undefined, undefined, expectedCompileOpts, undefined, undefined);
    });
    it('generates the expected output', () => {
      expect(generatedCode).toBe(expectedCode);
    });
  });
  describe('compiling WITH additional options', () => {
    let schemas: RJSFSchema[];
    let expectedCode: string;
    beforeAll(() => {
      schemas = Object.values(schemaParser(superSchema as unknown as RJSFSchema));
      expectedCode = readFileSync('./test/harness/superSchemaOptions.cjs').toString();
      generatedCode = compileSchemaValidatorsCode(superSchema as unknown as RJSFSchema, {
        ...CUSTOM_OPTIONS,
        ajvOptionsOverrides: {
          ...CUSTOM_OPTIONS.ajvOptionsOverrides,
          code: { lines: false },
        },
      });
    });
    it('create AJV instance was called with the expected options', () => {
      const {
        additionalMetaSchemas,
        customFormats,
        ajvOptionsOverrides = {},
        ajvFormatOptions,
        AjvClass,
      } = CUSTOM_OPTIONS;
      const expectedCompileOpts = {
        ...ajvOptionsOverrides,
        code: { source: true, lines: false },
        schemas,
      };
      expect(createAjvInstance).toHaveBeenCalledWith(
        additionalMetaSchemas,
        customFormats,
        expectedCompileOpts,
        ajvFormatOptions,
        AjvClass,
      );
    });
    it('generates expected output', () => {
      expect(generatedCode).toBe(expectedCode);
    });
  });
});
