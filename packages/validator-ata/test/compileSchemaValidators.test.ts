import type { RJSFSchema } from '@rjsf/utils';
import { writeFileSync } from 'fs';
import noop from 'lodash/noop';
import type { MockInstance } from 'vitest';

import compileSchemaValidators, { compileSchemaValidatorsCode } from '../src/compileSchemaValidators';

vi.mock('fs', () => {
  const writeFileSync = vi.fn();
  return { writeFileSync, default: { writeFileSync } };
});

vi.mock('../src/compileSchemaValidatorsCode', () => ({
  compileSchemaValidatorsCode: vi.fn(),
}));

const OUTPUT_FILE = 'test.js';

const testSchema = { $id: 'test-schema' } as RJSFSchema;

describe('compileSchemaValidators()', () => {
  let consoleLogSpy: MockInstance;
  let expectedCode: string;
  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(noop);
  });
  afterAll(() => {
    consoleLogSpy.mockRestore();
  });
  describe('compiling without additional options', () => {
    beforeAll(() => {
      expectedCode = 'test output 1';
      vi.mocked(compileSchemaValidatorsCode).mockImplementation(() => expectedCode);
      compileSchemaValidators(testSchema, OUTPUT_FILE);
    });
    afterAll(() => {
      consoleLogSpy.mockClear();
      vi.mocked(compileSchemaValidatorsCode).mockClear();
      vi.mocked(writeFileSync).mockClear();
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
      vi.mocked(compileSchemaValidatorsCode).mockImplementation(() => expectedCode);
      compileSchemaValidators(testSchema, OUTPUT_FILE, customOptions);
    });
    afterAll(() => {
      consoleLogSpy.mockClear();
      vi.mocked(compileSchemaValidatorsCode).mockClear();
      vi.mocked(writeFileSync).mockClear();
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
