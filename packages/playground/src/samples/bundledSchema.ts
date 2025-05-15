import { Sample } from './Sample';

const bundledSchema: Sample = {
  schema: {
    $id: 'https://jsonschema.dev/schemas/examples/non-negative-integer-bundle',
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    description: 'Must be a non-negative integer',
    $defs: {
      'https://jsonschema.dev/schemas/mixins/integer': {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $id: 'https://jsonschema.dev/schemas/mixins/integer',
        description: 'Must be an integer',
        type: 'integer',
      },
      'https://jsonschema.dev/schemas/mixins/non-negative': {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $id: 'https://jsonschema.dev/schemas/mixins/non-negative',
        description: 'Not allowed to be negative',
        minimum: 0,
      },
      nonNegativeInteger: {
        allOf: [
          {
            $ref: '/schemas/mixins/integer',
          },
          {
            $ref: '/schemas/mixins/non-negative',
          },
        ],
      },
    },
    properties: {
      num: {
        $ref: '#/$defs/nonNegativeInteger',
      },
    },
  },
  uiSchema: {},
};

export default bundledSchema;
