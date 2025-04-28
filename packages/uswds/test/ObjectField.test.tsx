import Form from '../src';
import { createSchemaTest } from '../schemaTests';

createSchemaTest(Form, {
  schema: {
    type: 'object',
    properties: {
      a: { type: 'string' },
      b: { type: 'number' },
    },
  },
});
