import { JSONSchema7 } from 'json-schema';

import { RangeSpecType } from './types';

export default function rangeSpec(schema: JSONSchema7) {
  const spec: RangeSpecType = {};
  if (schema.multipleOf) {
    spec.step = schema.multipleOf;
  }
  if (schema.minimum || schema.minimum === 0) {
    spec.min = schema.minimum;
  }
  if (schema.maximum || schema.maximum === 0) {
    spec.max = schema.maximum;
  }
  return spec;
}
