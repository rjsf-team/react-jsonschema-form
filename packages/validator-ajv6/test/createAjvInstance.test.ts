import Ajv, { Ajv as AjvType } from 'ajv';

import createAjvInstance, { AJV_CONFIG, COLOR_FORMAT_REGEX, DATA_URL_FORMAT_REGEX } from '../src/createAjvInstance';
import { CustomValidatorOptionsType } from '../src';

jest.mock('ajv');

export const CUSTOM_OPTIONS: CustomValidatorOptionsType = {
  additionalMetaSchemas: [
    require('ajv/lib/refs/json-schema-draft-04.json'),
  ],
  customFormats: {
    'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
    'area-code': /\d{3}/,
  }
};

describe('createAjvInstance()', () => {
  describe('no additional meta schemas or custom formats', () => {
    let ajv: AjvType;
    beforeAll(() => {
      ajv = createAjvInstance();
    });
    afterAll(() => {
      (Ajv as unknown as jest.Mock).mockClear();
    });
    it('expect a new Ajv to be constructed with the AJV_CONFIG', () => {
      expect(Ajv).toHaveBeenCalledWith(AJV_CONFIG);
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
  describe('no additional meta schemas or custom formats', () => {
    let ajv: AjvType;
    beforeAll(() => {
      ajv = createAjvInstance(CUSTOM_OPTIONS.additionalMetaSchemas, CUSTOM_OPTIONS.customFormats);
    });
    afterAll(() => {
      (Ajv as unknown as jest.Mock).mockClear();
    });
    it('expect a new Ajv to be constructed with the AJV_CONFIG', () => {
      expect(Ajv).toHaveBeenCalledWith(AJV_CONFIG);
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
    it('the remaining addForma() calls were for custom formats', () => {
      Object.keys(CUSTOM_OPTIONS.customFormats!).forEach((key: string, i: number) => {
        expect(ajv.addFormat).toHaveBeenNthCalledWith(3 + i, key, CUSTOM_OPTIONS.customFormats![key]);
      });
    });
    it('addMetaSchema was not called', () => {
      expect(ajv.addMetaSchema).toHaveBeenCalledWith(CUSTOM_OPTIONS.additionalMetaSchemas);
    });
  });
});
