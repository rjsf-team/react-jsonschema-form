import Form from '../src';
import { createSchemaTest } from '../schemaTests';

createSchemaTest(Form, {
  schema: {
    type: 'number',
  },
});

createSchemaTest(Form, {
  schema: {
    type: 'integer',
  },
});
