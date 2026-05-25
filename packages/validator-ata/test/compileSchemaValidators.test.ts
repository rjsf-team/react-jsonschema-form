import { writeFileSync } from 'fs';
import { RJSFSchema } from '@rjsf/utils';

import compileSchemaValidators, { compileSchemaValidatorsCode } from '../src/compileSchemaValidators';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
}));

jest.mock('../src/compileSchemaValidatorsCode', () => ({
  compileSchemaValidatorsCode: jest.fn(),
}));

const OUTPUT_FILE = 'test.js';

const testSchema = { $id: 'test-schema' } as RJSFSchema;

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
    beforeAll(() => {
      expectedCode = 'test output 1';
      (compileSchemaValidatorsCode as jest.Mock).mockImplementation(() => expectedCode);
      compileSchemaValidators(testSchema, OUTPUT_FILE);
    });
    afterAll(() => {
      consoleLogSpy.mockClear();
      (compileSchemaValidatorsCode as jest.Mock).mockClear();
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
    it('compileSchemaValidatorsCode was called with the expected options', () => {
      expect(compileSchemaValidatorsCode).toHaveBeenCalledWith(testSchema, {});
    });
    it('wrote the expected output', () => {
      expect(writeFileSync).toHaveBeenCalledWith(OUTPUT_FILE, expectedCode);
    });
  });
  describe('compiling with additional options', () => {
    const customOptions = { ataOptionsOverrides: { coerceTypes: true } };
    beforeAll(() => {
      expectedCode = 'expected code 2';
      (compileSchemaValidatorsCode as jest.Mock).mockImplementation(() => expectedCode);
      compileSchemaValidators(testSchema, OUTPUT_FILE, customOptions);
    });
    afterAll(() => {
      consoleLogSpy.mockClear();
      (compileSchemaValidatorsCode as jest.Mock).mockClear();
      (writeFileSync as jest.Mock).mockClear();
    });
    it('called console.log twice', () => {
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
    it('compileSchemaValidatorsCode was called with the expected options', () => {
      expect(compileSchemaValidatorsCode).toHaveBeenCalledWith(testSchema, customOptions);
    });
    it('wrote the expected output', () => {
      expect(writeFileSync).toHaveBeenCalledWith(OUTPUT_FILE, expectedCode);
    });
  });
});
