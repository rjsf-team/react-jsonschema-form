import { createFormComponent, submitForm } from './testUtils';

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
      const { onChange } = createFormComponent({
        schema: {
          type: 'null',
          default: null,
        },
      });

      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ formData: null }));
    });

    it('should not overwrite existing data', () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'null',
        },
        formData: 3,
        noValidate: true,
      });

      submitForm(node);
      expect(onSubmit).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: 3 }),
        expect.objectContaining({ type: 'submit' }),
      );
    });
  });
});
