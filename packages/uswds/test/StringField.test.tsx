import Form from '../src';
import { createSchemaTest } from '../schemaTests';

createSchemaTest(Form, {
  schema: {
    type: 'string',
  },
});

createSchemaTest(Form, {
  schema: {
    type: 'string',
    format: 'email',
  },
});
