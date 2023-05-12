import Ajv from 'ajv';
import Ajv2019 from 'ajv/dist/2019';
import addFormats from 'ajv-formats';

import createAjvInstance, { AJV_CONFIG, COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from '../src/createAjvInstance';
import { CUSTOM_OPTIONS } from './harness/testData';

jest.mock('ajv');
jest.mock('ajv/dist/2019');
jest.mock('ajv-formats');

describe('createAjvInstance()', () => {
  describe('no additional meta schemas, custom formats, ajv options overrides or ajv format options', () => {
    let ajv: Ajv;
    beforeAll(() => {
      ajv = createAjvInstance();
    });
    afterAll(() => {
      (Ajv as unknown as jest.Mock).mockClear();
      (addFormats as unknown as jest.Mock).mockClear();
    });
    it('expect a new Ajv to be constructed with the AJV_CONFIG', () => {
      expect(Ajv).toHaveBeenCalledWith(AJV_CONFIG);
    });
    it('expect addFormats to be called with the new ajv instance and undefined', () => {
      expect(addFormats).toHaveBeenCalledWith(ajv);
    });
    it('addFormat() was called twice', () => {
      expect(ajv.addFormat).toHaveBeenCalledTimes(2);
    });
    it('the first addFormat() was for data-url', () => {
      expect(ajv.addFormat).toHaveBeenNthCalledWith(1, 'data-url', DATA_URL_FORMAT_REGEX);
    });
    it('the second addFormat() was for color', () => {
      expect(ajv.addFormat).toHaveBeenNthCalledWith(2, 'color', COLOR_FORMAT_REGEX);
    });
    it('addMetaSchema was not called', () => {
      expect(ajv.addMetaSchema).not.toHaveBeenCalled();
    });
  });
  describe('all defaults except uses the Ajv2019 class', () => {
    let ajv: Ajv;
    beforeAll(() => {
      ajv = createAjvInstance(undefined, undefined, undefined, undefined, Ajv2019);
    });
    afterAll(() => {
      (Ajv as unknown as jest.Mock).mockClear();
      (addFormats as unknown as jest.Mock).mockClear();
    });
    it('expect a new Ajv2019 to be constructed with the AJV_CONFIG', () => {
      expect(Ajv2019).toHaveBeenCalledWith(AJV_CONFIG);
    });
    it('expect the default Ajv constructor was not called', () => {
      expect(Ajv).not.toHaveBeenCalled();
    });
    it('expect addFormats to be called with the new ajv instance and undefined', () => {
      expect(addFormats).toHaveBeenCalledWith(ajv);
    });
    it('addFormat() was called twice', () => {
      expect(ajv.addFormat).toHaveBeenCalledTimes(2);
    });
    it('the first addFormat() was for data-url', () => {
      expect(ajv.addFormat).toHaveBeenNthCalledWith(1, 'data-url', DATA_URL_FORMAT_REGEX);
    });
    it('the second addFormat() was for color', () => {
      expect(ajv.addFormat).toHaveBeenNthCalledWith(2, 'color', COLOR_FORMAT_REGEX);
    });
    it('addMetaSchema was not called', () => {
      expect(ajv.addMetaSchema).not.toHaveBeenCalled();
    });
  });
  describe('has additional meta schemas, custom formats, ajv options override and ajv format options', () => {
    let ajv: Ajv;
    beforeAll(() => {
      ajv = createAjvInstance(
        CUSTOM_OPTIONS.additionalMetaSchemas,
        CUSTOM_OPTIONS.customFormats,
        CUSTOM_OPTIONS.ajvOptionsOverrides,
        CUSTOM_OPTIONS.ajvFormatOptions
      );
    });
    afterAll(() => {
      (Ajv as unknown as jest.Mock).mockClear();
      (addFormats as unknown as jest.Mock).mockClear();
    });
    it('expect a new Ajv to be constructed with the AJV_CONFIG', () => {
      expect(Ajv).toHaveBeenCalledWith({
        ...AJV_CONFIG,
        ...CUSTOM_OPTIONS.ajvOptionsOverrides,
      });
    });
    it('expect addFormats to be called with the new ajv instance and options', () => {
      expect(addFormats).toHaveBeenCalledWith(ajv, CUSTOM_OPTIONS.ajvFormatOptions);
    });
    it('addFormat() was called twice', () => {
      expect(ajv.addFormat).toHaveBeenCalledTimes(4);
    });
    it('the first addFormat() was for data-url', () => {
      expect(ajv.addFormat).toHaveBeenNthCalledWith(1, 'data-url', DATA_URL_FORMAT_REGEX);
    });
    it('the second addFormat() was for color', () => {
      expect(ajv.addFormat).toHaveBeenNthCalledWith(2, 'color', COLOR_FORMAT_REGEX);
    });
    it('the remaining addFormat() calls were for custom formats', () => {
      Object.keys(CUSTOM_OPTIONS.customFormats!).forEach((key: string, i: number) => {
        expect(ajv.addFormat).toHaveBeenNthCalledWith(3 + i, key, CUSTOM_OPTIONS.customFormats![key]);
      });
    });
    it('addMetaSchema was not called', () => {
      expect(ajv.addMetaSchema).toHaveBeenCalledWith(CUSTOM_OPTIONS.additionalMetaSchemas);
    });
  });
  describe('disables ajv format', () => {
    let ajv: Ajv;
    beforeAll(() => {
      ajv = createAjvInstance(undefined, undefined, undefined, false);
    });
    afterAll(() => {
      (Ajv as unknown as jest.Mock).mockClear();
      (addFormats as unknown as jest.Mock).mockClear();
    });
    it('expect a new Ajv to be constructed with the AJV_CONFIG', () => {
      expect(Ajv).toHaveBeenCalledWith(AJV_CONFIG);
    });
    it('expect addFormats NOT to be called', () => {
      expect(addFormats).not.toHaveBeenCalled();
    });
    it('addFormat() was called twice', () => {
      expect(ajv.addFormat).toHaveBeenCalledTimes(2);
    });
    it('the first addFormat() was for data-url', () => {
      expect(ajv.addFormat).toHaveBeenNthCalledWith(1, 'data-url', DATA_URL_FORMAT_REGEX);
    });
    it('the second addFormat() was for color', () => {
      expect(ajv.addFormat).toHaveBeenNthCalledWith(2, 'color', COLOR_FORMAT_REGEX);
    });
    it('addMetaSchema was not called', () => {
      expect(ajv.addMetaSchema).not.toHaveBeenCalled();
    });
  });
});
