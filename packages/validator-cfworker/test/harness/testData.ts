import type { CustomValidatorOptionsType } from '../../src';

export const CUSTOM_OPTIONS: CustomValidatorOptionsType = {
  customFormats: {
    'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/,
    'area-code': '\\d{3}',
  },
  draft: '2019-09',
  shortCircuit: false,
};
