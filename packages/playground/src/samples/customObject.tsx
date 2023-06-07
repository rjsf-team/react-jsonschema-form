import {
  getTemplate,
  getUiOptions,
  titleId,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  ObjectFieldTemplateProps,
} from '@rjsf/utils';

function ObjectFieldTemplate<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: ObjectFieldTemplateProps<T, S, F>
) {
  const { registry, properties, title, description, uiSchema, required, schema, idSchema } = props;
  const options = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, options);
  return (
    <div>
      {title && (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}{' '}
      {description}
      <div className='row'>
        {properties.map((prop) => (
          <div className='col-lg-1 col-md-2 col-sm-4 col-xs-6' key={prop.content.key}>
            {prop.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default {
  schema: {
    title: 'A registration form',
    description:
      'This is the same as the simple form, but with an altered bootstrap grid. Set the theme to default, and try shrinking the browser window to see it in action.',
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
      age: {
        type: 'integer',
        title: 'Age',
      },
      bio: {
        type: 'string',
        title: 'Bio',
      },
      password: {
        type: 'string',
        title: 'Password',
        minLength: 3,
      },
      telephone: {
        type: 'string',
        title: 'Telephone',
        minLength: 10,
      },
    },
  },
  formData: {
    firstName: 'Chuck',
    lastName: 'Norris',
    age: 75,
    bio: 'Roundhouse kicking asses since 1940',
    password: 'noneed',
  },
  templates: {
    ObjectFieldTemplate,
  },
};
