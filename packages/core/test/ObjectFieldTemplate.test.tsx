import { PureComponent } from 'react';
import { DescriptionFieldProps, ObjectFieldTemplateProps } from '@rjsf/utils';

import { createFormComponent } from './testUtils';

const formData = { foo: 'bar', bar: 'foo' };
class ObjectFieldTemplate extends PureComponent<ObjectFieldTemplateProps> {
  render() {
    const { properties, title, description = '', registry, schema } = this.props;
    const { DescriptionFieldTemplate, TitleFieldTemplate } = registry.templates;
    return (
      <div className='root'>
        <TitleFieldTemplate id='test-title' title={title} registry={registry} schema={schema} />
        <DescriptionFieldTemplate id='test-desc' description={description} registry={registry} schema={schema} />
        <div>
          {properties.map(({ content }, index) => (
            <div key={index} className='property'>
              {content}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

const TitleFieldTemplate = () => <div className='title-field' />;
const DescriptionFieldTemplate = ({ description }: DescriptionFieldProps) =>
  description ? <div className='description-field' /> : null;

describe('ObjectFieldTemplate', () => {
  function sharedIts() {
    it('should render one root element', () => {
      expect(node.querySelectorAll('.root')).toHaveLength(1);
    });
    it('should render one title', () => {
      expect(node.querySelectorAll('.title-field')).toHaveLength(1);
    });
    it('should render one description', () => {
      expect(node.querySelectorAll('.description-field')).toHaveLength(1);
    });
    it('should render two property containers', () => {
      expect(node.querySelectorAll('.property')).toHaveLength(2);
    });
  }

  let node: Element;
  describe('with template globally configured', () => {
    createFormComponent({
      schema: {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      },
      uiSchema: { 'ui:description': 'foobar' },
      formData,
      templates: {
        ObjectFieldTemplate,
        TitleFieldTemplate,
        DescriptionFieldTemplate,
      },
    });
    sharedIts();
  });
  describe('with template configured in ui:ObjectFieldTemplate', () => {
    node = createFormComponent({
      schema: {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      },
      uiSchema: {
        'ui:description': 'foobar',
        'ui:ObjectFieldTemplate': ObjectFieldTemplate,
      },
      formData,
      templates: {
        TitleFieldTemplate,
        DescriptionFieldTemplate,
      },
    }).node;
    sharedIts();
  });
  describe('with template configured globally overridden by ui:ObjectFieldTemplate', () => {
    node = createFormComponent({
      schema: {
        type: 'object',
        properties: { foo: { type: 'string' }, bar: { type: 'string' } },
      },
      uiSchema: {
        'ui:description': 'foobar',
        'ui:ObjectFieldTemplate': ObjectFieldTemplate,
      },
      formData,
      templates: {
        ObjectFieldTemplate: () => <div />, // Empty object field template, proof that it's overridden
        TitleFieldTemplate,
        DescriptionFieldTemplate,
      },
    }).node;
    sharedIts();
  });
});
