import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import { computeEnumOptions } from '../src/components/fields/layoutMultiSchemaFieldSelector.ts';
import { retrievedOptionListOf } from '../src/components/uiState.ts';
import { selectSwitchedOption } from '../src/hooks/useSendOptionSwitch.ts';

// B's `$ref` selector has the selector read it into a copy of B, whose `if` was settled against the data before the
// switch, so only B as retrieved says that the data `transformChange` keeps doesn't fit it
const rootSchema: RJSFSchema = {
  type: 'object',
  $defs: { kindB: { type: 'string', const: 'b' } },
  properties: {
    thing: {
      type: 'object',
      anyOf: [
        { properties: { kind: { type: 'string', const: 'a' }, a: { type: 'string' } } },
        {
          properties: { kind: { $ref: '#/$defs/kindB' }, b: { type: 'string' } },
          if: { properties: { b: { const: 'x' } }, required: ['b'] },
          then: { required: ['c'] },
        },
      ],
    },
  },
};
const formData = { kind: 'a', a: 'v' };
const rewritten = { kind: 'rewritten', kept: { kind: 'b', b: 'x' }, edited: { kind: 'b' } } as const;

describe('selectSwitchedOption', () => {
  const schemaUtils = createSchemaUtils({ validator }, rootSchema);
  const schema = schemaUtils.retrieveSchema(rootSchema.properties!.thing as RJSFSchema, formData);

  it('matches the data again when a rewrite keeps data the retrieved option does not take', () => {
    const selectOption = vi.fn();
    const newOption = retrievedOptionListOf(schemaUtils, schema, formData)?.[1];

    selectSwitchedOption(selectOption, schemaUtils, { from: 0, to: 1, newOption }, formData, undefined, rewritten);

    expect(selectOption).toHaveBeenCalledWith(1, []);
  });

  it("reads that data as fitting the selector's copy of the option, which is why the retrieved one is handed in", () => {
    const selectOption = vi.fn();
    const uiSchema = { 'ui:options': { optionsSchemaSelector: 'kind' } };
    const newOption = computeEnumOptions(schema, schemaUtils, uiSchema, formData)[1]?.schema;

    selectSwitchedOption(selectOption, schemaUtils, { from: 0, to: 1, newOption }, formData, undefined, rewritten);

    expect(selectOption).not.toHaveBeenCalled();
  });
});
