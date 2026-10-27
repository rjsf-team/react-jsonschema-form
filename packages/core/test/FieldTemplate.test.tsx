import { Children } from 'react';
import type { FieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import { getTemplate } from '@rjsf/utils';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';

import { FieldLabel } from '../src/index.ts';
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
          hasErrors={false}
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

  // Exported so a custom `FieldTemplate` draws the label `rjsf.css` lines the array item's buttons and the key's input up
  // with, as core's `FieldTemplate` does
  describe('FieldLabel', () => {
    it("is exported from the package entry and draws the label core's FieldTemplate draws", () => {
      const { container } = render(
        <FieldLabel
          label='Name'
          required
          id='root_name'
          labelId='root_name__label'
          className='rjsf-field-label'
          invalid
        />,
      );

      const label = container.querySelector('label');
      expect(label).toHaveClass('rjsf-field-label');
      expect(label).toHaveAttribute('for', 'root_name');
      expect(label).toHaveAttribute('data-invalid', 'true');
      expect(label?.querySelector('#root_name__label')).toHaveTextContent(/^Name$/);
      expect(label?.querySelector('.rjsf-required')).toHaveTextContent('*');
    });

    it('draws the bare text with no marker, id or invalid state when none is asked for', () => {
      const { container } = render(<FieldLabel label='Name' id='root_name' />);

      expect(container.innerHTML).toBe('<label for="root_name">Name</label>');
    });

    it('draws nothing for an empty label', () => {
      const { container } = render(<FieldLabel label='' required />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  // jsdom can't measure layout, but it matches `rjsf.css`'s selectors, so these tie its rows to core's markup: an element
  // between the row and the field's parts, or a part out of order, would turn the rows off with no snapshot flagging it.
  // jsdom parses `@layer` but applies none of the rules inside it, so the sheet goes in without it
  describe('the control row rjsf.css finds', () => {
    const style = document.createElement('style');
    const oneOf = [
      { const: 'a', title: 'A', description: 'About a' },
      { const: 'b', title: 'B', description: 'About b' },
    ];

    beforeAll(() => {
      const css = readFileSync(`${import.meta.dirname}/../src/rjsf.css`, 'utf8');
      style.textContent = css.replace(/@layer rjsf \{([^]*)\}\s*$/, '$1');
      document.head.append(style);
    });

    afterAll(() => {
      style.remove();
    });

    it("puts an array item's toolbox past its label, description and selected option's description", () => {
      const { node } = createFormComponent({
        schema: { type: 'array', items: { type: 'string', title: 'Item', description: 'About the item', oneOf } },
        initialFormData: ['a'],
      });

      const item = node.querySelector('.rjsf-array-item')!;
      expect(getComputedStyle(item).getPropertyValue('--rjsf-control-row')).toBe('4');
    });

    it("puts an additional property's key input past the value's label and description", () => {
      const { node } = createFormComponent({
        schema: { type: 'object', additionalProperties: { type: 'string', title: 'Value', description: 'About it' } },
        initialFormData: { foo: 'x' },
      });

      const row = node.querySelector('.rjsf-additional-property')!;
      expect(getComputedStyle(row).getPropertyValue('--rjsf-control-row')).toBe('3');
    });
  });
});
