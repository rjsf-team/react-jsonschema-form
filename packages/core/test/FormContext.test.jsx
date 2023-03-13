import { expect } from 'chai';

import { createFormComponent, createSandbox } from './test_utils';

describe('FormContext', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const schema = { type: 'string' };

  const formContext = { foo: 'bar' };

  const CustomComponent = function (props) {
    const { registry } = props;
    const { formContext } = registry;
    return <div id={formContext.foo} />;
  };

  it('should be passed to Form', () => {
    const { comp } = createFormComponent({
      schema: schema,
      formContext,
    });
    expect(comp.props.formContext).eq(formContext);
  });

  it('should be passed to custom field', () => {
    const fields = { custom: CustomComponent };

    const { node } = createFormComponent({
      schema: schema,
      uiSchema: { 'ui:field': 'custom' },
      fields,
      formContext,
    });

    expect(node.querySelector('#' + formContext.foo)).to.exist;
  });

  it('should be passed to custom widget', () => {
    const widgets = { custom: CustomComponent };

    const { node } = createFormComponent({
      schema: { type: 'string' },
      uiSchema: { 'ui:widget': 'custom' },
      widgets,
      formContext,
    });

    expect(node.querySelector('#' + formContext.foo)).to.exist;
  });

  it('should be passed to TemplateField', () => {
    function CustomTemplateField({ formContext }) {
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

    expect(node.querySelector('#' + formContext.foo)).to.exist;
  });

  it('should be passed to ArrayTemplateField', () => {
    function CustomArrayTemplateField({ formContext }) {
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

    expect(node.querySelector('#' + formContext.foo)).to.exist;
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

    expect(node.querySelector('#' + formContext.foo)).to.exist;
  });

  it('should be passed to custom DescriptionFieldTemplate', () => {
    const templates = { DescriptionFieldTemplate: CustomComponent };

    const { node } = createFormComponent({
      schema: { type: 'string', description: 'A description' },
      templates,
      formContext,
    });

    expect(node.querySelector('#' + formContext.foo)).to.exist;
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

    expect(node.querySelector('#' + formContext.foo)).to.exist;
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

    expect(node.querySelector('#' + formContext.foo)).to.exist;
  });
});
