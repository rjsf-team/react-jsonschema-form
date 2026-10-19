import { Children } from 'react';
import type { FieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import { getTemplate } from '@rjsf/utils';
import { render } from '@testing-library/react';

import { getTestRegistry } from '../src/testing.ts';
import { createFormComponent } from './testUtils.tsx';

describe('FieldTemplate', () => {
  describe('FieldTemplate should only have one child', () => {
    function FieldTemplate(props: FieldTemplateProps) {
      if (Children.count(props.children) !== 1) {
        throw new Error('Got wrong number of children');
      }
      return null;
    }
    it('renders without throwing when exactly one child is provided', () => {
      createFormComponent({
        schema: { type: 'string' },
        uiSchema: { 'ui:disabled': true },
        templates: { FieldTemplate },
      });
    });
  });

  describe('Custom FieldTemplate for disabled property', () => {
    function FieldTemplate(props: FieldTemplateProps) {
      return <div className={props.disabled ? 'disabled' : 'foo'} />;
    }

    describe('with template globally configured', () => {
      it('should render with disabled when ui:disabled is truthy', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': true },
          templates: { FieldTemplate },
        });
        expect(node.querySelectorAll('.disabled')).toHaveLength(1);
      });

      it('should render with disabled when ui:disabled is falsey', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': false },
          templates: { FieldTemplate },
        });
        expect(node.querySelectorAll('.disabled')).toHaveLength(0);
      });
    });
    describe('with template configured in ui:FieldTemplate', () => {
      it('should render with disabled when ui:disabled is truthy', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': true, 'ui:FieldTemplate': FieldTemplate },
        });
        expect(node.querySelectorAll('.disabled')).toHaveLength(1);
      });

      it('should render with disabled when ui:disabled is falsey', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': false, 'ui:FieldTemplate': FieldTemplate },
        });
        expect(node.querySelectorAll('.disabled')).toHaveLength(0);
      });
    });
    describe('with template configured globally being overriden in ui:FieldTemplate', () => {
      it('should render with disabled when ui:disabled is truthy', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': true, 'ui:FieldTemplate': FieldTemplate },
          // Empty field template to prove that overides work
          templates: { FieldTemplate: () => <div /> },
        });
        expect(node.querySelectorAll('.disabled')).toHaveLength(1);
      });

      it('should render with disabled when ui:disabled is falsey', () => {
        const { node } = createFormComponent({
          schema: { type: 'string' },
          uiSchema: { 'ui:disabled': false, 'ui:FieldTemplate': FieldTemplate },
          // Empty field template to prove that overides work
          templates: { FieldTemplate: () => <div /> },
        });
        expect(node.querySelectorAll('.disabled')).toHaveLength(0);
      });
    });
  });

  describe('Custom FieldTemplate should have registry', () => {
    function FieldTemplate(props: FieldTemplateProps) {
      return (
        <div>
          Root Schema: <span id='root-schema'>{JSON.stringify(props.registry.rootSchema)}</span>
        </div>
      );
    }

    it('should allow access to root schema from registry', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { fooBarBaz: { type: 'string' } },
      };

      const { node } = createFormComponent({
        schema,
        templates: { FieldTemplate },
      });

      expect(node.querySelectorAll('#root-schema')).toHaveLength(1);
      expect(node.querySelectorAll('#root-schema')[0].innerHTML).toEqual(JSON.stringify(schema));
    });
  });

  describe('rendered without a plan, as outside SchemaField', () => {
    function renderTemplate(displayLabel: boolean, uiSchema?: FieldTemplateProps['uiSchema']) {
      const registry = getTestRegistry({});
      const FieldTemplate = getTemplate('FieldTemplate', registry);
      return render(
        <FieldTemplate
          id='root_foo'
          fieldPath={'foo' as FieldTemplateProps['fieldPath']}
          label='Foo'
          keyName='foo'
          description={<p id='root_foo__description'>About foo</p>}
          rawDescription='About foo'
          // oxlint-disable-next-line typescript/no-deprecated -- a template rendered without a plan reads the deprecated prop
          displayLabel={displayLabel}
          schema={{ type: 'string' }}
          uiSchema={uiSchema}
          registry={registry}
          readonly={false}
          disabled={false}
          required={false}
          onChange={vi.fn()}
          onKeyRename={vi.fn()}
          onKeyRenameBlur={vi.fn()}
          onRemoveProperty={vi.fn()}
        >
          <input id='root_foo' />
        </FieldTemplate>,
      );
    }

    it('draws the description where displayLabel lets it draw the label', () => {
      const { container } = renderTemplate(true);
      expect(container.querySelector('#root_foo__description')).toHaveTextContent('About foo');
    });

    it('draws no description where displayLabel turns the label off', () => {
      const { container } = renderTemplate(false);
      expect(container.querySelector('label')).toBeNull();
      expect(container.querySelector('#root_foo__description')).toBeNull();
    });

    it('leaves the label of a field whose ui:widget is the checkbox alias to its checkbox, and draws its description', () => {
      const { container } = renderTemplate(true, { 'ui:widget': 'checkbox' });
      expect(container.querySelector('label')).toBeNull();
      expect(container.querySelector('#root_foo__description')).toHaveTextContent('About foo');
    });
  });
});
