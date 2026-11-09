import type { ConfigErrorTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import type { Sample } from './Sample.ts';

function ConfigErrorTemplate<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ConfigErrorTemplateProps<T, S, F>,
) {
  const { name, error, schema } = props;
  return (
    <div className='alert alert-warning' role='alert'>
      <strong>The &quot;{name || 'root'}&quot; field could not be rendered</strong>
      <p>{error.message}</p>
      <p>
        Properties in the schema: <code>{Object.keys(schema.properties ?? {}).join(', ')}</code>
      </p>
    </div>
  );
}

const customConfigError: Sample = {
  schema: {
    title: 'A registration form',
    description:
      'The "address" object has a `ui:order` that leaves out one of its properties. Instead of the default red configuration error, the custom `ConfigErrorTemplate` below renders a warning for that field while the rest of the form still works.',
    type: 'object',
    required: ['firstName', 'lastName'],
    properties: {
      firstName: {
        type: 'string',
        title: 'First name',
      },
      lastName: {
        type: 'string',
        title: 'Last name',
      },
      address: {
        type: 'object',
        title: 'Address',
        properties: {
          street: {
            type: 'string',
            title: 'Street',
          },
          city: {
            type: 'string',
            title: 'City',
          },
          zip: {
            type: 'string',
            title: 'ZIP code',
          },
        },
      },
    },
  },
  uiSchema: {
    address: {
      'ui:order': ['zip', 'city'],
    },
  },
  formData: {
    firstName: 'Chuck',
    lastName: 'Norris',
  },
  templates: {
    ConfigErrorTemplate,
  },
};

export default customConfigError;
