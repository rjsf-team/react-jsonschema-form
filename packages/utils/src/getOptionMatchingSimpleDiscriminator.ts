import get from 'lodash/get';
import { PROPERTIES_KEY } from './constants';
import { RJSFSchema, StrictRJSFSchema } from './types';

export default function getOptionMatchingSimpleDiscriminator<T = any, S extends StrictRJSFSchema = RJSFSchema>(
  formData: T | undefined,
  options: S[],
  discriminatorField?: string
): number | undefined {
  if (formData && discriminatorField) {
    const value = get(formData, discriminatorField);

    if (value === undefined) {
      return;
    }

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const discriminator = get(option, [PROPERTIES_KEY, discriminatorField], {});

      if (discriminator.type === 'object' || discriminator.type === 'array') {
        continue;
      }

      if (discriminator.const === value) {
        return i;
      }

      if (discriminator.enum?.includes(value)) {
        return i;
      }
    }
  }

  return;
}
