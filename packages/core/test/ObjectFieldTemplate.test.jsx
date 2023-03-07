import { PureComponent } from 'react';

import { expect } from 'chai';
import { createFormComponent, createSandbox } from './test_utils';

describe('ObjectFieldTemplate', () => {
  let sandbox;

  const formData = { foo: 'bar', bar: 'foo' };

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  class ObjectFieldTemplate extends PureComponent {
    render() {
      const { properties, title, description, registry } = this.props;
      const { DescriptionFieldTemplate, TitleFieldTemplate } = registry.templates;
      return (
        <div className='root'>
          <TitleFieldTemplate title={title} />
          <DescriptionFieldTemplate description={description} />
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
  const DescriptionFieldTemplate = ({ description }) => (description ? <div className='description-field' /> : null);

  let node;
  describe('with template globally configured', () => {
    node = createFormComponent({
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
    }).node;
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

  function sharedIts() {
    it('should render one root element', () => {
      expect(node.querySelectorAll('.root')).to.have.length.of(1);
    });

    it('should render one title', () => {
      expect(node.querySelectorAll('.title-field')).to.have.length.of(1);
    });

    it('should render one description', () => {
      expect(node.querySelectorAll('.description-field')).to.have.length.of(1);
    });

    it('should render two property containers', () => {
      expect(node.querySelectorAll('.property')).to.have.length.of(2);
    });
  }
});
