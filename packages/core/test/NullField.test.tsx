import type { DefaultFormStateBehavior, RJSFSchema } from '@rjsf/utils';
import { act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import {
  createFormComponent,
  createFormRef,
  elementOf,
  expectToHaveBeenCalledWithFormData,
  handleOf,
  submitForm,
} from './testUtils.tsx';

const user = userEvent.setup();

describe('NullField', () => {
  describe('No widget', () => {
    it('should render a null field', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'null',
        },
      });

      expect(node.querySelectorAll('.rjsf-field')).toHaveLength(1);
    });

    it('should render a null field with a label', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'null',
          title: 'foo',
        },
      });

      expect(node.querySelector('.rjsf-field label')).toHaveTextContent('foo');
    });

    it('should assign a default value', () => {
      const { getFormData } = createFormComponent({
        schema: {
          type: 'null',
          default: null,
        },
      });

      expect(getFormData()).toBe(null);
    });

    it('should not overwrite existing data', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'null',
        },
        initialFormData: 3,
        // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
        noValidate: true,
      });

      await submitForm(node, user);
      expectToHaveBeenCalledWithFormData(onSubmit, 3, true);
    });
  });

  // A `null` schema allows one value, so a missing one is filled in as it, whatever the form says of other defaults
  describe.each<NonNullable<DefaultFormStateBehavior['emptyObjectFields']>>([
    'populateAllDefaults',
    'populateRequiredDefaults',
    'skipEmptyDefaults',
    'skipDefaults',
  ])('a missing value under emptyObjectFields: %s', (emptyObjectFields) => {
    it.each<[string, RJSFSchema, unknown]>([
      ['a required property', { type: 'object', required: ['n'], properties: { n: { type: 'null' } } }, { n: null }],
      ['an optional property', { type: 'object', properties: { n: { type: 'null' } } }, { n: null }],
      [
        'an optional object',
        { type: 'object', properties: { o: { type: 'object', properties: { n: { type: 'null' } } } } },
        { o: { n: null } },
      ],
      [
        "an optional object's allOf",
        { type: 'object', properties: { a: { type: 'object', allOf: [{ properties: { n: { type: 'null' } } }] } } },
        { a: { n: null } },
      ],
      [
        "an optional object's if/then",
        {
          type: 'object',
          properties: {
            a: {
              type: 'object',
              properties: { k: { type: 'string' } },
              if: { properties: { k: { const: 'x' } } },
              then: { properties: { n: { type: 'null' } } },
            },
          },
        },
        { a: { n: null } },
      ],
      [
        'a property whose $ref names a null schema',
        { type: 'object', properties: { n: { $ref: '#/$defs/none' } }, $defs: { none: { type: 'null' } } },
        { n: null },
      ],
    ])('of a null schema in %s is submitted as null', async (_, schema, submitted) => {
      const { node, onSubmit, onError } = createFormComponent({
        schema,
        defaultFormStateBehavior: { emptyObjectFields },
      });

      await submitForm(node, user);

      expect(onError).not.toHaveBeenCalled();
      expectToHaveBeenCalledWithFormData(onSubmit, submitted, true);
    });
  });

  describe('a value it is handed as undefined', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['n'],
      properties: { n: { type: 'null' }, s: { type: 'string' } },
    };

    it.each<[string, (ref: ReturnType<typeof createFormRef>) => void]>([
      ['a seed', () => {}],
      ['setFieldValue() at the field', (ref) => handleOf(ref).setFieldValue('n', undefined)],
      ['setFieldValue() at the root', (ref) => handleOf(ref).setFieldValue('', { n: undefined, s: 'a' })],
    ])('is filled in as null, from %s', async (_, write) => {
      const ref = createFormRef();
      const { node, onSubmit, getFormData } = createFormComponent({
        ref,
        schema,
        initialFormData: { n: undefined, s: 'a' },
      });

      act(() => write(ref));
      await submitForm(node, user);

      expect(getFormData()).toEqual({ n: null, s: 'a' });
      expectToHaveBeenCalledWithFormData(onSubmit, { n: null, s: 'a' }, true);
    });

    it('is filled in as null when a condition retypes the property to null', async () => {
      const { node, getFormData } = createFormComponent({
        schema: {
          type: 'object',
          properties: { k: { type: 'string' } },
          if: { properties: { k: { const: 'x' } }, required: ['k'] },
          then: { properties: { n: { type: 'null' } }, required: ['n'] },
          else: { properties: { n: { type: 'string' } } },
        },
        initialFormData: { n: 'abc' },
      });

      await user.type(elementOf(node, '#root_k'), 'x');

      expect(getFormData()).toEqual({ k: 'x', n: null });
    });

    it('is filled in as null when an option switch retypes the property to null', async () => {
      const { node, getFormData } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            p: {
              oneOf: [
                { title: 'text', type: 'object', properties: { n: { type: 'string' } } },
                { title: 'none', type: 'object', properties: { n: { type: 'null' } }, required: ['n'] },
              ],
            },
          },
        },
        initialFormData: { p: { n: 'abc' } },
      });

      await user.selectOptions(elementOf(node, '#root_p__oneof_select'), 'none');

      expect(getFormData()).toEqual({ p: { n: null } });
    });
  });
});
