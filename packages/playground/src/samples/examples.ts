import { Sample } from './Sample';
import validator from '@rjsf/validator-ajv8';

const examples: Sample = {
  validator: validator,
  schema: {
    title: 'Examples',
    description: 'A text field with example values.',
    type: 'object',
    properties: {
      browser: {
        type: 'string',
        title: 'Browser',
        examples: ['Firefox', 'Chrome', 'Opera', 'Vivaldi', 'Safari'],
      },
    },
  },
};

export default examples;
