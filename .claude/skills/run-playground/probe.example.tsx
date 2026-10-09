import Form from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils, toErrorList } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { renderToStaticMarkup } from 'react-dom/server';

const schema: RJSFSchema = {
  type: 'object',
  required: ['name'],
  properties: { name: { type: 'string', minLength: 3, default: 'ab' }, n: { type: 'integer' } },
};
const su = createSchemaUtils({ validator }, schema);
const formData = su.getDefaultFormState(schema, {});
console.log('defaults:', formData);
console.log(
  'errors:',
  toErrorList(validator.validateFormData(formData, schema).errorSchema).map((e) => e.stack),
);
console.log(renderToStaticMarkup(<Form schema={schema} validator={validator} formData={formData} />).slice(0, 300));
