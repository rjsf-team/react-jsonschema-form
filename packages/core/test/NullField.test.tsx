import type { DefaultFormStateBehavior, RJSFSchema } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';

import { createFormComponent, expectToHaveBeenCalledWithFormData, submitForm } from './testUtils.tsx';

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
});
