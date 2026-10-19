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

    it('should render the title and description of a null field itself, with no label naming a control', () => {
      const { node } = createFormComponent({
        schema: {
          type: 'null',
          title: 'foo',
          description: 'Describes foo',
        },
      });

      expect(node.querySelector('#root__title')).toHaveTextContent('foo');
      expect(node.querySelector('#root__description')).toHaveTextContent('Describes foo');
      expect(node.querySelector('.rjsf-field label')).not.toBeInTheDocument();
    });

    it('should render nothing of its own for a null field with no title or description', () => {
      const { node } = createFormComponent({ schema: { type: 'null' } });

      expect(node.querySelector('#root__title')).not.toBeInTheDocument();
      expect(node.querySelector('#root__description')).not.toBeInTheDocument();
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
        formData: 3,
        // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated `noValidate` prop
        noValidate: true,
      });

      await submitForm(node, user);
      expectToHaveBeenCalledWithFormData(onSubmit, 3, true);
    });
  });
});
