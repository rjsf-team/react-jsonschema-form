import type { RJSFSchema } from '@rjsf/utils';
import userEvent from '@testing-library/user-event';

import {
  expectToHaveBeenCalledWithFormData,
  setupConsoleErrorSuppression,
  submitForm,
  describeRepeated,
} from './testUtils.tsx';

const user = userEvent.setup();
const renderErrorSuppression = setupConsoleErrorSuppression();

describeRepeated('Form common: schema definitions and defaults', (createFormComponent) => {
  describe('Schema definitions', () => {
    it('should use a single schema definition reference', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        $ref: '#/definitions/testdef',
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should handle multiple schema definition references', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef' },
          bar: { $ref: '#/definitions/testdef' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(2);
    });

    it('should handle deeply referenced schema definitions', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            properties: {
              bar: { $ref: '#/definitions/testdef' },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should handle references to deep schema definitions', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef/properties/bar' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should handle referenced definitions for array items', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        properties: {
          foo: {
            type: 'array',
            items: { $ref: '#/definitions/testdef' },
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          foo: ['blah'],
        },
      });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should not crash with null values for property with additionalProperties', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          data: {
            additionalProperties: {
              type: 'string',
            },
            type: 'object',
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          data: null,
        },
      });

      expect(node).not.toBeNull();
    });

    it('should not crash with non-object values for property with additionalProperties', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          data1: {
            additionalProperties: {
              type: 'string',
            },
            type: 'object',
          },
          data2: {
            additionalProperties: {
              type: 'string',
            },
            type: 'object',
          },
        },
      };

      const { node } = createFormComponent({
        schema,
        formData: {
          data1: 123,
          data2: ['one', 'two', 'three'],
        },
      });

      expect(node).not.toBeNull();
    });

    it('should raise for non-existent definitions referenced', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/nonexistent' },
        },
      };

      expect(() => createFormComponent({ schema })).toThrow(/#\/definitions\/nonexistent/);
      expect(renderErrorSuppression.consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('The above error occurred in the <Form> component'),
      );
    });

    it('should propagate referenced definition defaults', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' },
        },
        $ref: '#/definitions/testdef',
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveValue('hello');
    });

    it('should propagate nested referenced definition defaults', () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' },
        },
        type: 'object',
        properties: {
          foo: { $ref: '#/definitions/testdef' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveValue('hello');
    });

    it('should propagate referenced definition defaults for array items', async () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string', default: 'hello' },
        },
        type: 'array',
        items: {
          $ref: '#/definitions/testdef',
        },
      };

      const { node } = createFormComponent({ schema });

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveValue('hello');
    });

    it('should propagate referenced definition defaults in objects with additionalProperties', async () => {
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        additionalProperties: {
          $ref: '#/definitions/testdef',
        },
      };

      const { node } = createFormComponent({ schema });

      await user.click(node.querySelector('.btn-add')!);

      expect(node.querySelector<HTMLInputElement>('input[type=text]')!).toHaveValue('newKey');
    });

    it('should propagate referenced definition defaults in objects with additionalProperties that have a type present', async () => {
      // Though `additionalProperties` has a `type` present here, it also has a `$ref` so that
      // referenced schema should override it.
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'number' },
        },
        type: 'object',
        additionalProperties: {
          type: 'string',
          $ref: '#/definitions/testdef',
        },
      };

      const { node } = createFormComponent({ schema });

      await user.click(node.querySelector('.btn-add')!);

      expect(node.querySelector<HTMLInputElement>('input[type=number]')).toHaveValue(0);
    });

    it('should recursively handle referenced definitions', async () => {
      const schema: RJSFSchema = {
        $ref: '#/definitions/node',
        definitions: {
          node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              children: {
                type: 'array',
                items: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector('#root_children_0_name')).not.toBeInTheDocument();

      await user.click(node.querySelector('.rjsf-array-item-add button')!);

      expect(node.querySelector('#root_children_0_name')).toBeInTheDocument();
    });

    it('should follow recursive references', () => {
      const schema: RJSFSchema = {
        definitions: {
          bar: { $ref: '#/definitions/qux' },
          qux: { type: 'string' },
        },
        type: 'object',
        required: ['foo'],
        properties: {
          foo: { $ref: '#/definitions/bar' },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should follow multiple recursive references', () => {
      const schema: RJSFSchema = {
        definitions: {
          bar: { $ref: '#/definitions/bar2' },
          bar2: { $ref: '#/definitions/qux' },
          qux: { type: 'string' },
        },
        type: 'object',
        required: ['foo'],
        properties: {
          foo: { $ref: '#/definitions/bar' },
        },
      };
      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(1);
    });

    it('should priorize definition over schema type property', () => {
      // Refs bug #140
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          childObj: {
            type: 'object',
            $ref: '#/definitions/childObj',
          },
        },
        definitions: {
          childObj: {
            type: 'object',
            properties: {
              otherName: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('input[type=text]')).toHaveLength(2);
    });

    it('should priorize local properties over definition ones', () => {
      // Refs bug #140
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            title: 'custom title',
            $ref: '#/definitions/objectDef',
          },
        },
        definitions: {
          objectDef: {
            type: 'object',
            title: 'definition title',
            properties: {
              field: { type: 'string' },
            },
          },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelector('legend')).toHaveTextContent('custom title');
    });

    it('should propagate and handle a resolved schema definition', () => {
      const schema: RJSFSchema = {
        definitions: {
          enumDef: { type: 'string', enum: ['a', 'b'] },
        },
        type: 'object',
        properties: {
          name: { $ref: '#/definitions/enumDef' },
        },
      };

      const { node } = createFormComponent({ schema });

      expect(node.querySelectorAll('option')).toHaveLength(3);
    });
  });

  describe('Default value handling on clear', () => {
    const schema: RJSFSchema = {
      type: 'string',
      default: 'foo',
    };

    it('should not set default when a text field is cleared', async () => {
      const { node } = createFormComponent({ schema, formData: 'bar' });

      await user.clear(node.querySelector<HTMLInputElement>('input')!);

      expect(node.querySelector<HTMLInputElement>('input')).toHaveValue('');
    });
  });

  describe('Defaults array items default propagation', () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'lvl 1 obj',
      properties: {
        object: {
          type: 'object',
          title: 'lvl 2 obj',
          properties: {
            array: {
              type: 'array',
              items: {
                type: 'object',
                title: 'lvl 3 obj',
                properties: {
                  bool: {
                    type: 'boolean',
                    default: true,
                  },
                },
              },
            },
          },
        },
      },
    };

    it('should propagate deeply nested defaults to submit handler', async () => {
      const { node, onSubmit } = createFormComponent({ schema });

      await user.click(node.querySelector('.rjsf-array-item-add button')!);
      await submitForm(node, user);

      expectToHaveBeenCalledWithFormData(onSubmit, { object: { array: [{ bool: true }] } }, true);
    });
  });

  describe('Defaults additionalProperties propagation', () => {
    it('should submit string string map defaults', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: {
          type: 'string',
        },
        default: {
          foo: 'bar',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await submitForm(node, user);

      expectToHaveBeenCalledWithFormData(onSubmit, { foo: 'bar' }, true);
    });

    it('should submit a combination of properties and additional properties defaults', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          x: {
            type: 'string',
          },
        },
        additionalProperties: {
          type: 'string',
        },
        default: {
          x: 'x default value',
          y: 'y default value',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await submitForm(node, user);

      expectToHaveBeenCalledWithFormData(onSubmit, { x: 'x default value', y: 'y default value' }, true);
    });

    it('should submit a properties and additional properties defaults when properties default is nested', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          x: {
            type: 'string',
            default: 'x default value',
          },
        },
        additionalProperties: {
          type: 'string',
        },
        default: {
          y: 'y default value',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await submitForm(node, user);

      expectToHaveBeenCalledWithFormData(onSubmit, { x: 'x default value', y: 'y default value' }, true);
    });

    it('should submit defaults when nested map has map values', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          x: {
            additionalProperties: {
              $ref: '#/definitions/objectDef',
            },
          },
        },
        definitions: {
          objectDef: {
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          },
        },
        default: {
          x: {
            y: {
              z: 'x.y.z default value',
            },
          },
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await submitForm(node, user);

      expectToHaveBeenCalledWithFormData(onSubmit, { x: { y: { z: 'x.y.z default value' } } }, true);
    });

    it('should submit defaults when they are defined in a nested additionalProperties', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          x: {
            additionalProperties: {
              type: 'string',
              default: 'x.y default value',
            },
          },
        },
        default: {
          x: {
            y: {},
          },
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await submitForm(node, user);

      expectToHaveBeenCalledWithFormData(onSubmit, { x: { y: 'x.y default value' } }, true);
    });

    it('should submit defaults when additionalProperties is a boolean value', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: true,
        default: {
          foo: 'bar',
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await submitForm(node, user);

      expectToHaveBeenCalledWithFormData(onSubmit, { foo: 'bar' }, true);
    });

    it('should NOT submit default values when additionalProperties is false', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
          },
        },
        additionalProperties: false,
        default: {
          foo: "I'm the only one",
          bar: "I don't belong here",
        },
      };

      const { node, onSubmit } = createFormComponent({ schema });
      await submitForm(node, user);

      expectToHaveBeenCalledWithFormData(onSubmit, { foo: "I'm the only one" }, true);
    });
  });
});
