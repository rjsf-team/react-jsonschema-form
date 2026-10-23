import type { RJSFSchema } from '@rjsf/utils';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { createFormComponent, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

/** The ids every space-separated id list on the page names */
function listedIds(node: Element) {
  return Array.from(node.querySelectorAll('[aria-describedby], [aria-labelledby], [aria-controls]')).flatMap(
    (element) =>
      ['aria-describedby', 'aria-labelledby', 'aria-controls'].flatMap(
        (attribute) => element.getAttribute(attribute)?.split(' ').filter(Boolean) ?? [],
      ),
  );
}

/** The ids carried by more than one element on the page */
function duplicateIds(node: Element) {
  const ids = Array.from(node.querySelectorAll('[id]'), (element) => element.id);
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

describe('field ids', () => {
  it('names only elements on the page in the id lists of a field whose property name has spaces (#5558)', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        'Do you have any pets?': { type: 'string', title: 'Pets', description: 'Any at all', enum: ['No', 'Yes'] },
      },
    };
    const { node } = createFormComponent({
      schema,
      uiSchema: { 'Do you have any pets?': { 'ui:widget': 'radio', 'ui:help': 'Pick one' } },
      extraErrors: { 'Do you have any pets?': { __errors: ['Answer it'] } },
      showErrorList: false,
    });

    const ids = listedIds(node);
    expect(ids).toContain('root_Do%20you%20have%20any%20pets?__description');
    expect(ids.filter((id) => node.ownerDocument.getElementById(id) === null)).toEqual([]);
  });

  it('focuses the field of an error whose property name has spaces', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['first name'],
      properties: { 'first name': { type: 'string', title: 'First name' } },
    };
    const { node } = createFormComponent({ schema, focusOnFirstError: true, noHtml5Validate: true });

    await submitForm(node, user);

    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it("gives an alt-date's parts ids no sibling property's id can take (#5504)", () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { when: { type: 'string', format: 'date' }, when_year: { type: 'string', title: 'When year' } },
    };
    const { node } = createFormComponent({ schema, uiSchema: { when: { 'ui:widget': 'alt-date' } } });

    expect(duplicateIds(node)).toEqual([]);
    expect(screen.getByRole('textbox', { name: 'When year' })).toHaveAttribute('id', 'root_when_year');
    expect(node.querySelectorAll('[name="root_when_year"]')).toHaveLength(1);
  });

  it('gives a nested anyOf option selector an id of its own (#5574)', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        pet: {
          title: 'Pet',
          anyOf: [{ title: 'Inner', anyOf: [{ type: 'string', enum: ['a'] }, { type: 'number' }] }, { type: 'number' }],
        },
      },
    };
    const { node } = createFormComponent({ schema });

    // The selected option's own select is named by the field's label too, and comes last
    const selectors = screen.getAllByRole('combobox', { name: 'Pet' }).slice(0, -1);
    expect(selectors.map((selector) => selector.id)).toEqual(['root_pet__anyof_select', 'root_pet__anyof_select2']);
    expect(selectors.map((selector) => selector.getAttribute('name'))).toEqual([
      'root_pet__anyof_select',
      'root_pet__anyof_select2',
    ]);
    expect(duplicateIds(node)).toEqual([]);
  });

  it('numbers a nested selector by the selectors above for the same keyword, at the same data path', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        pet: {
          title: 'Pet',
          oneOf: [
            {
              title: 'Inner',
              anyOf: [
                {
                  title: 'Deep',
                  type: 'object',
                  properties: { tag: { title: 'Tag', anyOf: [{ type: 'string' }, { type: 'number' }] } },
                },
                { type: 'number' },
              ],
            },
            { type: 'number' },
          ],
        },
      },
    };
    const { node } = createFormComponent({ schema });

    expect(node.querySelector('#root_pet__oneof_select')).toBeInTheDocument();
    expect(node.querySelector('#root_pet__anyof_select')).toBeInTheDocument();
    expect(node.querySelector('#root_pet_tag__anyof_select')).toBeInTheDocument();
    expect(duplicateIds(node)).toEqual([]);
  });
});
