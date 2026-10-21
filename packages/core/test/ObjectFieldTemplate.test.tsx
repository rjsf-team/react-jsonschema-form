import { PureComponent } from 'react';
import type { DescriptionFieldProps, ObjectFieldTemplateProps, RJSFSchema } from '@rjsf/utils';

import { createFormComponent } from './testUtils.tsx';

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
            // oxlint-disable-next-line react/no-array-index-key
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
  let node: Element;
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

describe('ObjectFieldTemplate property hidden flag', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: { a: { type: 'string' }, b: { type: 'string', deprecated: true } },
  };
  let seen: ObjectFieldTemplateProps['properties'] = [];
  const CapturingTemplate = ({ properties }: ObjectFieldTemplateProps) => {
    seen = properties;
    return (
      <div>
        {properties.map(({ content, name }) => (
          <div key={name}>{content}</div>
        ))}
      </div>
    );
  };
  const hiddenByName = () => Object.fromEntries(seen.map(({ name, hidden }) => [name, hidden]));

  it('marks a property hidden by ui:widget as hidden', () => {
    createFormComponent({
      schema,
      uiSchema: { b: { 'ui:widget': 'hidden' } },
      templates: { ObjectFieldTemplate: CapturingTemplate },
    });
    expect(hiddenByName()).toEqual({ a: false, b: true });
  });
  it('marks a deprecated property hidden by the global deprecatedHandling: hide as hidden', () => {
    createFormComponent({
      schema,
      uiSchema: { 'ui:globalOptions': { deprecatedHandling: 'hide' } },
      templates: { ObjectFieldTemplate: CapturingTemplate },
    });
    expect(hiddenByName()).toEqual({ a: false, b: true });
  });
  it('marks a deprecated property hidden by its own ui:deprecatedHandling: hide as hidden', () => {
    createFormComponent({
      schema,
      uiSchema: { b: { 'ui:deprecatedHandling': 'hide' } },
      templates: { ObjectFieldTemplate: CapturingTemplate },
    });
    expect(hiddenByName()).toEqual({ a: false, b: true });
  });
  it('marks a property hidden when its $ref target is deprecated and the global deprecatedHandling is hide', () => {
    createFormComponent({
      schema: {
        type: 'object',
        properties: { a: { type: 'string' }, b: { $ref: '#/$defs/old' } },
        $defs: { old: { type: 'string', deprecated: true } },
      },
      uiSchema: { 'ui:globalOptions': { deprecatedHandling: 'hide' } },
      templates: { ObjectFieldTemplate: CapturingTemplate },
    });
    expect(hiddenByName()).toEqual({ a: false, b: true });
  });
  it('marks a property hidden by the ui:widget from its $ref ui:definitions as hidden', () => {
    createFormComponent({
      schema: {
        type: 'object',
        properties: { a: { type: 'string' }, b: { $ref: '#/$defs/secret' } },
        $defs: { secret: { type: 'string' } },
      },
      uiSchema: { 'ui:definitions': { '#/$defs/secret': { 'ui:widget': 'hidden' } } },
      templates: { ObjectFieldTemplate: CapturingTemplate },
    });
    expect(hiddenByName()).toEqual({ a: false, b: true });
  });
  it('does not hide a deprecated property by default', () => {
    createFormComponent({ schema, templates: { ObjectFieldTemplate: CapturingTemplate } });
    expect(hiddenByName()).toEqual({ a: false, b: false });
  });
});
