import { readFileSync, writeFileSync } from 'fs';
import { RJSFSchema, schemaParser } from '@rjsf/utils';

import compileSchemaValidators from '../src/compileSchemaValidators';
import createAjvInstance from '../src/createAjvInstance';
import superSchema from './harness/superSchema.json';
import { CUSTOM_OPTIONS } from './harness/testData';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
}));

jest.mock('../src/createAjvInstance', () =>
  jest.fn().mockImplementation((...args) => jest.requireActual('../src/createAjvInstance').default(...args))
);

const OUTPUT_FILE = 'test.js';

describe('compileSchemaValidators()', () => {
  let consoleLogSpy: jest.SpyInstance;
  let expectedCode: string;
  beforeAll(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  afterAll(() => {
    consoleLogSpy.mockRestore();
  });
  describe('compiling without additional options', () => {
    let schemas: RJSFSchema[];
    beforeAll(() => {
      schemas = Object.values(schemaParser(superSchema as RJSFSchema));
      expectedCode = readFileSync('./test/harness/superSchema.js').toString();
      compileSchemaValidators(superSchema as RJSFSchema, OUTPUT_FILE);
    });
    afterAll(() => {
      consoleLogSpy.mockClear();
      (writeFileSync as jest.Mock).mockClear();
    });
    it('called console.log twice', () => {
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
    it('the first time relates to parsing the schema', () => {
      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 'parsing the schema');
    });
    it('the second time relates to writing the output file', () => {
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, `writing ${OUTPUT_FILE}`);
    });
    it('create AJV instance was called with the expected options', () => {
      const expectedCompileOpts = { code: { source: true, lines: true }, schemas };
      expect(createAjvInstance).toHaveBeenCalledWith(undefined, undefined, expectedCompileOpts, undefined, undefined);
    });
    it('wrote the expected output', () => {
      expect(writeFileSync).toHaveBeenCalledWith(OUTPUT_FILE, expectedCode);
    });
  });
  describe('compiling WITH additional options', () => {
    let schemas: RJSFSchema[];
    beforeAll(() => {
      schemas = Object.values(schemaParser(superSchema as RJSFSchema));
      expectedCode = readFileSync('./test/harness/superSchemaOptions.js').toString();
      compileSchemaValidators(superSchema as RJSFSchema, OUTPUT_FILE, {
        ...CUSTOM_OPTIONS,
        ajvOptionsOverrides: { ...CUSTOM_OPTIONS.ajvOptionsOverrides, code: { lines: false } },
      });
    });
    afterAll(() => {
      consoleLogSpy.mockClear();
      (writeFileSync as jest.Mock).mockClear();
    });
    it('called console.log twice', () => {
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
    it('the first time relates to parsing the schema', () => {
      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, 'parsing the schema');
    });
    it('the second time relates to writing the output file', () => {
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, `writing ${OUTPUT_FILE}`);
    });
    it('create AJV instance was called with the expected options', () => {
      const {
        additionalMetaSchemas,
        customFormats,
        ajvOptionsOverrides = {},
        ajvFormatOptions,
        AjvClass,
      } = CUSTOM_OPTIONS;
      const expectedCompileOpts = { ...ajvOptionsOverrides, code: { source: true, lines: false }, schemas };
      expect(createAjvInstance).toHaveBeenCalledWith(
        additionalMetaSchemas,
        customFormats,
        expectedCompileOpts,
        ajvFormatOptions,
        AjvClass
      );
    });
    it('wrote the expected output', () => {
      expect(writeFileSync).toHaveBeenCalledWith(OUTPUT_FILE, expectedCode);
    });
  });
});
