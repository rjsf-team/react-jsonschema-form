import type { RJSFSchema } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';

import {
  expectToHaveBeenCalledWithFormData,
  setupConsoleErrorSuppression,
  submitForm,
  describeRepeated,
} from './testUtils.tsx';

const user = userEvent.setup();
setupConsoleErrorSuppression();

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

    it('should let a keyword beside a $ref in additionalProperties win, as it does beside any other $ref', async () => {
      // `resolveAllReferences()` layers a schema's own keywords over the referenced ones wherever a `$ref` appears, and
      // the add button seeds the new property from the same resolved schema the field renders it with, so the sibling
      // `type` is the one both of them read
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

      expect(node.querySelector<HTMLInputElement>('input[inputmode=decimal]')).toBeNull();
      expect(node.querySelectorAll<HTMLInputElement>('input[type=text]')[1]).toHaveValue('New Value');
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
      const { node } = createFormComponent({ schema, initialFormData: 'bar' });

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

  describe('a dependency or if/then/else swap replaces the old branch defaults (#5349)', () => {
    const cfgFor = (name: string): RJSFSchema => ({
      type: 'object',
      default: { name },
      properties: { name: { type: 'string' } },
    });

    /** The shape every case below varies: a `mode` select that swaps between two `dependencies` branches, with
     * only the branch payload differing. `mode`'s own `const` is merged in, so a branch states just what it adds
     */
    const modeSwap = (
      branchA: RJSFSchema,
      branchB: RJSFSchema,
      extraProperties: RJSFSchema['properties'] = {},
    ): RJSFSchema => ({
      type: 'object',
      properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' }, ...extraProperties },
      dependencies: {
        mode: {
          oneOf: [
            { ...branchA, properties: { mode: { const: 'a' }, ...branchA.properties } },
            { ...branchB, properties: { mode: { const: 'b' }, ...branchB.properties } },
          ],
        },
      },
    });

    /** The two branches both declaring `key`, built from one factory — what most of the cases below need */
    const modeSwapOn = (key: string, schemaFor: (mode: string) => RJSFSchema): RJSFSchema =>
      modeSwap({ properties: { [key]: schemaFor('a') } }, { properties: { [key]: schemaFor('b') } });

    const dependencySchema = modeSwapOn('cfg', cfgFor);

    /** The same two branches as `dependencySchema`, expressed as the other conditional keyword */
    const conditionalSchema: RJSFSchema = {
      type: 'object',
      properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' } },
      if: { properties: { mode: { const: 'a' } } },
      then: { properties: { cfg: cfgFor('a') } },
      else: { properties: { cfg: cfgFor('b') } },
    };

    const selectMode = (node: Element, mode: string) =>
      user.selectOptions(node.querySelector<HTMLSelectElement>('#root_mode')!, mode);

    it("applies the newly selected branch's object default", async () => {
      const { node, onChange } = createFormComponent({ schema: dependencySchema });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b' } }, 'root_mode');
    });

    it("applies the newly selected branch's object default for if/then/else", async () => {
      const { node, onChange } = createFormComponent({ schema: conditionalSchema });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b' } }, 'root_mode');
    });

    it('restores the first branch default on switching back', async () => {
      const { node, onChange } = createFormComponent({ schema: dependencySchema });

      await selectMode(node, 'b');
      await selectMode(node, 'a');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'a', cfg: { name: 'a' } }, 'root_mode');
    });

    it("merges the new branch's default with the leaf defaults it declares", async () => {
      const cfgWithRatio = (name: string): RJSFSchema => ({
        type: 'object',
        default: { name },
        properties: { name: { type: 'string' }, ratio: { type: 'number', default: 0 } },
      });
      const { node, onChange } = createFormComponent({ schema: modeSwapOn('cfg', cfgWithRatio) });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b', ratio: 0 } }, 'root_mode');
    });

    it("applies the newly selected branch's array default", async () => {
      const numsFor = (mode: string): RJSFSchema => ({
        type: 'array',
        items: { type: 'number' },
        default: [mode === 'a' ? 1 : 2],
      });
      const { node, onChange } = createFormComponent({ schema: modeSwapOn('nums', numsFor) });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', nums: [2] }, 'root_mode');
    });

    it('keeps a value the user edited away from the old branch default', async () => {
      const { node, onChange } = createFormComponent({ schema: dependencySchema });

      await user.clear(node.querySelector<HTMLInputElement>('#root_cfg_name')!);
      await user.type(node.querySelector<HTMLInputElement>('#root_cfg_name')!, 'mine');
      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'mine' } }, 'root_mode');
    });

    it('keeps the old value when the new branch declares no default for the key', async () => {
      const { node, onChange } = createFormComponent({
        schema: modeSwap(
          { properties: { cfg: cfgFor('a') } },
          { properties: { cfg: { type: 'object', properties: { name: { type: 'string' } } } } },
        ),
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'a' } }, 'root_mode');
    });

    it('leaves the value alone when the two branches compute the same default', async () => {
      const cfgTitled = (title: string): RJSFSchema => ({
        title,
        type: 'object',
        default: { name: 'x' },
        properties: { name: { type: 'string' } },
      });
      const { node, onChange } = createFormComponent({
        schema: modeSwapOn('cfg', (mode) => cfgTitled(mode.toUpperCase())),
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'x' } }, 'root_mode');
    });

    // A stub is in the retrieved schema only because the data holds the key, and the fill only writes an
    // `additionalProperties` default before the form's initial defaults have been generated, so nothing would put a
    // value dropped from under one back
    it('keeps a value held under a stubbed additional property whose schema the swap changed', async () => {
      const extraFor = (tag: string): RJSFSchema => ({
        type: 'object',
        default: { tag },
        properties: { tag: { type: 'string' } },
      });
      const { node, onChange } = createFormComponent({
        schema: modeSwap({ additionalProperties: extraFor('a') }, { additionalProperties: extraFor('b') }),
        formData: { mode: 'a', extra: { tag: 'a' } },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', extra: { tag: 'a' } }, 'root_mode');
    });

    // What spares `meta` is the free identity gate: both branches declare the very same subschema and its value did
    // not change, so it is never resolved, and no default is computed for it. The read-only server-supplied shape is
    // the one PR #5335 was reported to have wiped, so it is kept as the fixture
    it('never looks at a property both branches declare identically', async () => {
      const meta: RJSFSchema = {
        type: 'object',
        readOnly: true,
        default: { createdBy: 'placeholder' },
        properties: { createdBy: { type: 'string' } },
      };
      const { node, onChange } = createFormComponent({
        schema: modeSwap({ properties: { cfg: cfgFor('a'), meta } }, { properties: { cfg: cfgFor('b'), meta } }),
        formData: { mode: 'a', meta: { createdBy: 'server' } },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(
        onChange,
        { mode: 'b', cfg: { name: 'b' }, meta: { createdBy: 'server' } },
        'root_mode',
      );
    });

    // A boolean subschema is no object, so neither a symbol test nor `retrieveSchema()` can be asked about it
    it('swaps alongside a property declared as a boolean subschema', async () => {
      const { node, onChange } = createFormComponent({
        schema: modeSwap(
          { properties: { cfg: cfgFor('a') } },
          { properties: { cfg: cfgFor('b') } },
          { anything: true },
        ),
        formData: { mode: 'a', anything: 'kept' },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b' }, anything: 'kept' }, 'root_mode');
    });
  });
});
