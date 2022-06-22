import Ajv from 'ajv';
import { isObject } from 'lodash';

import { CustomValidatorOptionsType } from './types';

export const AJV_CONFIG = {
  errorDataPath: 'property',
  allErrors: true,
  multipleOfPrecision: 8,
  schemaId: 'auto',
  unknownFormats: 'ignore',
} as const;
export const COLOR_FORMAT_REGEX = /^(#?([0-9A-Fa-f]{3}){1,2}\b|aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|(rgb\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*\))|(rgb\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*\)))$/;
export const DATA_URL_FORMAT_REGEX = /^data:([a-z]+\/[a-z0-9-+.]+)?;(?:name=(.*);)?base64,(.*)$/;

/** Creates an Ajv version 6 implementation object with standard support for the 'color` and `data-url` custom formats.
 * If `additionalMetaSchemas` are provided then the Ajv instance is modified to add each of the meta schemas in the
 * list. If `customFormats` are provided then those additional formats are added to the list of supported formats.
 *
 * @param [additionalMetaSchemas] - The list of additional meta schemas that the validator can access
 * @param [customFormats] - The set of additional custom formats that the validator will support
 */
export default function createAjvInstance(
  additionalMetaSchemas?: CustomValidatorOptionsType['additionalMetaSchemas'],
  customFormats?: CustomValidatorOptionsType['customFormats'],
) {
  const ajv = new Ajv(AJV_CONFIG);

  // add custom formats
  ajv.addFormat('data-url', DATA_URL_FORMAT_REGEX);
  ajv.addFormat('color', COLOR_FORMAT_REGEX);

  // add more schemas to validate against
  if (additionalMetaSchemas && Array.isArray(additionalMetaSchemas)) {
    ajv.addMetaSchema(additionalMetaSchemas);
  }

  // add more custom formats to validate against
  if (customFormats && isObject(customFormats)) {
    Object.keys(customFormats).forEach(formatName => {
      ajv.addFormat(formatName, customFormats[formatName]);
    });
  }

  return ajv;
}
