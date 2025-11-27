import { ArrayFieldTemplateProps, FieldTemplateProps, RJSFSchema } from '@rjsf/utils';

import { createFormComponent } from './testUtils';

const schema: RJSFSchema = { type: 'string' };

const formContext = { foo: 'bar' };

const fooId = `#${formContext.foo}`;

// Use `props: any` to support the variety of uses (widgets, fields, templates)
function CustomComponent(props: any) {
  const { registry } = props;
  const { formContext } = registry;
  return <div id={formContext.foo} />;
}

describe('FormContext', () => {
  it('should be passed to custom field', () => {
    const { node } = createFormComponent({
      schema: schema,
      uiSchema: { 'ui:field': 'custom' },
      fields: { custom: CustomComponent },
      formContext,
    });

    expect(node.querySelector(fooId)).toBeInTheDocument();
  });

  it('should be passed to custom widget', () => {
    const { node } = createFormComponent({
      schema: { type: 'string' },
      uiSchema: { 'ui:widget': 'custom' },
      widgets: { custom: CustomComponent },
      formContext,
    });

    expect(node.querySelector(fooId)).toBeInTheDocument();
  });

  it('should be passed to TemplateField', () => {
    function CustomTemplateField({ registry: { formContext } }: FieldTemplateProps) {
      return <div id={formContext.foo} />;
    }

    const { node } = createFormComponent({
      schema: {
        type: 'object',
        properties: {
          prop: {
            type: 'string',
          },
        },
      },
      templates: { FieldTemplate: CustomTemplateField },
      formContext,
    });

    expect(node.querySelector(fooId)).toBeInTheDocument();
  });

  it('should be passed to ArrayTemplateField', () => {
    function CustomArrayTemplateField({ registry: { formContext } }: ArrayFieldTemplateProps) {
      return <div id={formContext.foo} />;
    }

    const { node } = createFormComponent({
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      templates: { ArrayFieldTemplate: CustomArrayTemplateField },
      formContext,
    });

    expect(node.querySelector(fooId)).toBeInTheDocument();
  });

  it('should be passed to custom TitleFieldTemplate', () => {
    const templates = { TitleFieldTemplate: CustomComponent };

    const { node } = createFormComponent({
      schema: {
        type: 'object',
        title: 'A title',
        properties: {
          prop: {
            type: 'string',
          },
        },
      },
      templates,
      formContext,
    });

    expect(node.querySelector(fooId)).toBeInTheDocument();
  });

  it('should be passed to custom DescriptionFieldTemplate', () => {
    const templates = { DescriptionFieldTemplate: CustomComponent };

    const { node } = createFormComponent({
      schema: { type: 'string', description: 'A description' },
      templates,
      formContext,
    });

    expect(node.querySelector(fooId)).toBeInTheDocument();
  });

  it('should be passed to multiselect', () => {
    const widgets = { SelectWidget: CustomComponent };
    const { node } = createFormComponent({
      schema: {
        type: 'array',
        items: {
          type: 'string',
          oneOf: [
            {
              const: 'foo',
              title: 'bar',
            },
          ],
        },
        uniqueItems: true,
      },
      widgets,
      formContext,
    });

    expect(node.querySelector(fooId)).toBeInTheDocument();
  });

  it('should be passed to files array', () => {
    const widgets = { FileWidget: CustomComponent };
    const { node } = createFormComponent({
      schema: {
        type: 'array',
        items: {
          type: 'string',
          format: 'data-url',
        },
      },
      widgets,
      formContext,
    });

    expect(node.querySelector(fooId)).toBeInTheDocument();
  });
});
