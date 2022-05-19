import { JSONSchema7 } from 'json-schema';

import { canExpand } from '../src';

describe('canExpand()', () => {
  it('no additional properties', () => {
    expect(canExpand({}, {}, {})).toBe(false);
  });
  it('has additional properties', () => {
    const schema: JSONSchema7 = {
      additionalProperties: {
        type: 'string',
      },
    };
    expect(canExpand(schema, {}, {})).toBe(true);
  });
  it('has uiSchema expandable false', () => {
    const schema: JSONSchema7 = {
      additionalProperties: {
        type: 'string',
      },
    };
    const uiSchema = {
      'ui:options': {
        expandable: false,
      },
    };
    expect(canExpand(schema, uiSchema, {})).toBe(false);
  });
  it('does not exceed maxProperties', () => {
    const schema: JSONSchema7 = {
      maxProperties: 1,
      additionalProperties: {
        type: 'string',
      },
    };
    expect(canExpand(schema, {}, {})).toBe(true);
  });
  it('already exceeds maxProperties', () => {
    const schema: JSONSchema7 = {
      maxProperties: 1,
      additionalProperties: {
        type: 'string',
      },
    };
    const formData = {
      foo: 'bar',
    };
    expect(canExpand(schema, {}, formData)).toBe(false);
  });
});
