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

    it('should apply the keywords beside a $ref in additionalProperties with its target, as beside any other $ref', async () => {
      // Resolution conjoins a schema's own keywords with the referenced ones wherever a `$ref` appears, and the add
      // button seeds the new property from the same resolved schema the field renders it with, so the `type` the
      // definition declares is the one both of them read
      const schema: RJSFSchema = {
        definitions: {
          testdef: { type: 'string' },
        },
        type: 'object',
        additionalProperties: {
          maxLength: 20,
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

    const kindFor = (v: string): RJSFSchema => ({
      type: 'object',
      default: { v },
      properties: { v: { type: 'string' } },
    });

    /** The shape every case below varies: a `mode` select that swaps between two `dependencies` branches, with
     * only the branch payload differing. `mode`'s own `const` is merged in, so a branch states just what it adds
     */
    const modeSwap = (branchA: RJSFSchema, branchB: RJSFSchema): RJSFSchema => ({
      type: 'object',
      properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' } },
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

    // An extra key is a field of the tree like a declared one, so the branch default it holds is replaced the same way
    it('replaces the old branch default an extra key holds', async () => {
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

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', extra: { tag: 'b' } }, 'root_mode');
    });

    // Both branches declare the very same subschema and its value did not change, so the diff never looks below it. A
    // read-only object holding a server-supplied value is the shape that has the most to lose if that ever stops
    // holding
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

    // A boolean subschema is no object, so it has no constraints to judge. `anything` changes from one to a string
    // schema and keeps its value, which the string schema accepts
    it('swaps alongside a property one branch declares as a boolean subschema', async () => {
      const { node, onChange } = createFormComponent({
        schema: modeSwap(
          { properties: { cfg: cfgFor('a'), anything: true, unvalued: { type: 'string' } } },
          { properties: { cfg: cfgFor('b'), anything: { type: 'string' }, unvalued: true } },
        ),
        formData: { mode: 'a', anything: 'kept' },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b' }, anything: 'kept' }, 'root_mode');
    });

    // What `getDefaultFormState()` computes says more than a branch declares. Each of these four shapes has the new
    // branch computing something for the key while declaring nothing for it, so honoring the computed value alone
    // would replace a value the user never touched with an empty container or with a subset of itself
    describe('keeps a value the new branch only computes a default for', () => {
      it('leaves a required object with no default of its own alone', async () => {
        const { node, onChange } = createFormComponent({
          schema: modeSwap(
            { properties: { cfg: cfgFor('a') } },
            { required: ['cfg'], properties: { cfg: { type: 'object', properties: { name: { type: 'string' } } } } },
          ),
        });

        await selectMode(node, 'b');

        expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'a' } }, 'root_mode');
      });

      it('leaves a required array with no default of its own alone', async () => {
        const { node, onChange } = createFormComponent({
          schema: modeSwap(
            { properties: { nums: { type: 'array', items: { type: 'number' }, default: [1, 2] } } },
            { required: ['nums'], properties: { nums: { type: 'array', items: { type: 'number' } } } },
          ),
        });

        await selectMode(node, 'b');

        expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', nums: [1, 2] }, 'root_mode');
      });

      it("leaves a value alone where only the new branch's leaf defaults differ", async () => {
        const cfgWithLeaves = (host?: string, port?: number): RJSFSchema => ({
          type: 'object',
          properties: {
            port: { type: 'number', ...(port !== undefined && { default: port }) },
            host: { type: 'string', ...(host !== undefined && { default: host }) },
          },
        });
        const { node, onChange } = createFormComponent({
          schema: modeSwap(
            { properties: { cfg: cfgWithLeaves(undefined, 80) } },
            { properties: { cfg: cfgWithLeaves('h') } },
          ),
        });

        await selectMode(node, 'b');

        expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { port: 80, host: 'h' } }, 'root_mode');
      });

      it('leaves an array the new branch only refills to its minItems alone', async () => {
        const tagsWithMin = (minItems: number): RJSFSchema => ({
          type: 'array',
          items: { type: 'string', default: 'x' },
          minItems,
        });
        const { node, onChange } = createFormComponent({
          schema: modeSwap({ properties: { tags: tagsWithMin(2) } }, { properties: { tags: tagsWithMin(1) } }),
        });

        await selectMode(node, 'b');

        expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', tags: ['x', 'x'] }, 'root_mode');
      });
    });

    // The same asymmetry read from the other side: what the old branch computed for a key says no more about what it
    // declared than what the new branch computes. A required boolean's `false` and a required array's `[]` are the
    // fill's work rather than a default the branch asked for, so a value sitting at one of them is nobody's default
    // to replace
    describe('keeps a value only the old branch computed a default for', () => {
      it('leaves a required boolean the old branch declared no default for alone', async () => {
        const { node, onChange } = createFormComponent({
          schema: modeSwap(
            { required: ['agree'], properties: { agree: { type: 'boolean' } } },
            { required: ['agree'], properties: { agree: { type: 'boolean', default: true } } },
          ),
        });

        await selectMode(node, 'b');

        expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', agree: false }, 'root_mode');
      });

      it('leaves a required array the old branch declared no default for alone', async () => {
        const { node, onChange } = createFormComponent({
          schema: modeSwap(
            { required: ['nums'], properties: { nums: { type: 'array', items: { type: 'number' } } } },
            { required: ['nums'], properties: { nums: { type: 'array', items: { type: 'number' }, default: [7] } } },
          ),
        });

        await selectMode(node, 'b');

        expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', nums: [] }, 'root_mode');
      });
    });

    // The swap changes the key's type. The value is the old branch's default, which comes first: the key takes the
    // new branch's default rather than being cleared for its type
    it("applies the new branch's default where the swap also changes the key's type", async () => {
      const { node, onChange } = createFormComponent({
        schema: modeSwap(
          { properties: { cfg: cfgFor('a') } },
          { properties: { cfg: { type: 'array', items: { type: 'string' }, default: ['x'] } } },
        ),
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: ['x'] }, 'root_mode');
    });

    // Here the type change is a leaf *inside* the value rather than the key itself. The value is the old branch's
    // default as a whole, so it takes the new default as a whole
    it("applies the new branch's default where the swap retypes a leaf inside it", async () => {
      const { node, onChange } = createFormComponent({
        schema: modeSwap(
          {
            properties: {
              cfg: {
                type: 'object',
                default: { name: 'a', tags: 'one' },
                properties: { name: { type: 'string' }, tags: { type: 'string' } },
              },
            },
          },
          {
            properties: {
              cfg: {
                type: 'object',
                default: { name: 'b', tags: ['x'] },
                properties: { name: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } },
              },
            },
          },
        ),
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b', tags: ['x'] } }, 'root_mode');
    });

    it("applies the new branch's default where the swap retypes its only leaf", async () => {
      const { node, onChange } = createFormComponent({
        schema: modeSwap(
          { properties: { cfg: { type: 'object', default: { v: 'x' }, properties: { v: { type: 'string' } } } } },
          { properties: { cfg: { type: 'object', default: { v: 5 }, properties: { v: { type: 'number' } } } } },
        ),
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { v: 5 } }, 'root_mode');
    });

    // A branch declares a value for a key through its own `default` object as well as through the key's schema, and
    // that object sits outside `properties`. These two branches declare `cfg` as the very same subschema and differ
    // only there
    it('applies a default the new branch declares through its own default object', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['a', 'b'], default: 'a' },
            cfg: { type: 'object', properties: { name: { type: 'string' } } },
          },
          if: { properties: { mode: { const: 'a' } } },
          then: { default: { cfg: { name: 'a' } } },
          else: { default: { cfg: { name: 'b' } } },
        },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b' } }, 'root_mode');
    });

    // `anyOf: [{ required }, …]` is the "at least one of" idiom, and it selects none of the level's properties, so
    // the level is still the conditional's to swap rather than an option switch's
    it('applies the new branch default on a level whose anyOf selects no properties', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' }, other: { type: 'string' } },
          if: { properties: { mode: { const: 'a' } } },
          then: { properties: { cfg: cfgFor('a') } },
          else: { properties: { cfg: cfgFor('b') } },
          anyOf: [{ required: ['mode'] }, { required: ['other'] }],
        },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b' } }, 'root_mode');
    });

    // The level's options leave its own properties alone, and a conditional declared on one of them is judged as any
    // other field is
    it('applies a nested branch default under a level whose oneOf declares properties', async () => {
      const dietFor = (food: string): RJSFSchema => ({
        type: 'object',
        default: { food },
        properties: { food: { type: 'string' } },
      });
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            m: {
              type: 'object',
              properties: { animal: { type: 'string', enum: ['Cat', 'Fish'], default: 'Fish' } },
              dependencies: {
                animal: {
                  oneOf: [
                    { properties: { animal: { const: 'Cat' }, diet: dietFor('meat') } },
                    { properties: { animal: { const: 'Fish' }, diet: dietFor('worms') } },
                  ],
                },
              },
            },
          },
          oneOf: [
            { title: 'A', properties: { x: { type: 'string' } } },
            { title: 'B', properties: { y: { type: 'string' } } },
          ],
        },
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_m_animal')!, 'Cat');

      expectToHaveBeenCalledWithFormData(onChange, { m: { animal: 'Cat', diet: { food: 'meat' } } }, 'root_m_animal');
    });

    // Each `if` requires `cfg`, so a branch declares its default only while the key holds a value. The new default is
    // written in place, so the key is never empty and the branch declaring it keeps applying
    it('writes the new default in place where the branch declaring it requires the key (#5480)', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['a', 'b'], default: 'a' },
            cfg: { type: 'object', properties: { name: { type: 'string' } } },
          },
          allOf: [
            {
              if: { properties: { mode: { const: 'a' } }, required: ['mode', 'cfg'] },
              then: { properties: { cfg: cfgFor('a') } },
            },
            {
              if: { properties: { mode: { const: 'b' } }, required: ['mode', 'cfg'] },
              then: { properties: { cfg: cfgFor('b') } },
            },
          ],
        },
        formData: { mode: 'a', cfg: { name: 'a' } },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b' } }, 'root_mode');
    });

    // `hint` is declared only while `cfg` is absent. The replacement for `cfg` is written in place, so no fill ever
    // sees the key absent and writes a `hint` the settled schema does not declare
    it('writes no default an else declares for the replaced key being absent (#5480)', async () => {
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' } },
          allOf: [
            {
              if: { properties: { mode: { const: 'a' } } },
              then: { properties: { cfg: cfgFor('a') } },
              else: { properties: { cfg: cfgFor('b') } },
            },
            {
              if: { required: ['cfg'] },
              else: { properties: { hint: { type: 'string', default: 'no cfg' } } },
            },
          ],
        },
        formData: { mode: 'a', cfg: { name: 'a' } },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b' } }, 'root_mode');
    });

    // A replacement is written where the key is, so the key keeps its place among its siblings
    it('keeps a replaced value in its place among its siblings', async () => {
      const cfgOf = (x: number): RJSFSchema => ({
        type: 'object',
        default: { x },
        properties: { x: { type: 'number' } },
      });
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['a', 'b'], default: 'a' },
            cfg: { type: 'object', properties: { x: { type: 'number' } } },
            tail: { type: 'string' },
          },
          allOf: [
            {
              if: { properties: { mode: { const: 'a' } }, required: ['mode', 'cfg'] },
              then: { properties: { cfg: cfgOf(1) } },
            },
            {
              if: { properties: { mode: { const: 'b' } }, required: ['mode', 'cfg'] },
              then: { properties: { cfg: cfgOf(2) } },
            },
          ],
        },
        formData: { mode: 'a', cfg: { x: 1 }, tail: 't' },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { x: 2 }, tail: 't' }, 'root_mode');
      // Where the replaced key sits among its siblings, rather than the whole order: `omitExtraData` rebuilds the
      // object from the retrieved schema, whose `properties` an `allOf` merge orders differently from the raw schema
      // the fill reads, so the variants do not all emit the same absolute order
      const keys = Object.keys(onChange.mock.lastCall![0].formData as object);
      expect(keys.indexOf('cfg')).toBeLessThan(keys.indexOf('tail'));
    });

    // Data that arrives out of schema order keeps that order while the fill has nothing to change, and a replacement
    // written in place reorders nothing around it
    it('leaves the siblings of a replaced key in the order the fill gave them', async () => {
      const cfgOf = (x: number): RJSFSchema => ({
        type: 'object',
        default: { x },
        properties: { x: { type: 'number' } },
      });
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['a', 'b'], default: 'a' },
            cfg: { type: 'object', properties: { x: { type: 'number' } } },
            tail: { type: 'string' },
          },
          allOf: [
            {
              if: { properties: { mode: { const: 'a' } }, required: ['mode', 'cfg'] },
              then: { properties: { cfg: cfgOf(1) } },
            },
            {
              if: { properties: { mode: { const: 'b' } }, required: ['mode', 'cfg'] },
              then: { properties: { cfg: cfgOf(2) } },
            },
          ],
        },
        formData: { tail: 't', cfg: { x: 1 }, mode: 'a' },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { x: 2 }, tail: 't' }, 'root_mode');
      const keys = Object.keys(onChange.mock.lastCall![0].formData as object);
      expect(keys.indexOf('mode')).toBeLessThan(keys.indexOf('tail'));
    });

    // The key's own declaration lives in a dependency keyed on its presence. The replacement is written in place, so
    // the dependency keeps applying, and with it the sibling it declares
    it("keeps a sibling the replaced key's own dependency declares", async () => {
      const withCfg = (name: string): RJSFSchema => ({
        dependencies: { cfg: { properties: { cfg: cfgFor(name), extra: { type: 'string' } } } },
      });
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' } },
          if: { properties: { mode: { const: 'a' } } },
          then: withCfg('a'),
          else: withCfg('b'),
        },
        formData: { mode: 'a', cfg: { name: 'a' }, extra: 'user text' },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', extra: 'user text', cfg: { name: 'b' } }, 'root_mode');
    });

    // `opts` has not swapped when the change is first seen, because the schema is still resolved for the `kind` the
    // data arrived holding. Replacing `kind` is what selects the other `opts` branch, one round of the diff later
    it('applies a default that replacing another key brings into reach', async () => {
      const optsFor = (o: string): RJSFSchema => ({
        type: 'object',
        default: { o },
        properties: { o: { type: 'string' } },
      });
      const kindFor = (k: string): RJSFSchema => ({ type: 'string', enum: ['k1', 'k2'], default: k });
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' } },
          allOf: [
            {
              if: { properties: { mode: { const: 'a' } } },
              then: { properties: { kind: kindFor('k1') } },
              else: { properties: { kind: kindFor('k2') } },
            },
            {
              if: { properties: { kind: { const: 'k1' } } },
              then: { properties: { opts: optsFor('k1') } },
              else: { properties: { opts: optsFor('k2') } },
            },
          ],
        },
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', kind: 'k2', opts: { o: 'k2' } }, 'root_mode');
    });

    // The replacement is written in place, so the next fill resolves the key's own conditionals against it and
    // writes what its branch requires: the change commits no data its own schema rejects
    it("resolves a replacement's own conditionals against the value written for it", async () => {
      const petFor = (branch: string): RJSFSchema => ({
        type: 'object',
        default: { animal: 'Fish' },
        properties: { animal: { type: 'string', enum: ['Cat', 'Fish'] } },
        if: { properties: { animal: { const: 'Cat' } } },
        then: { properties: { diet: { type: 'string', default: `${branch} meat` } } },
        else: { properties: { tank: { type: 'string', default: `${branch} tank` } }, required: ['tank'] },
      });
      const { node, onChange } = createFormComponent({
        schema: {
          type: 'object',
          properties: { mode: { type: 'string', enum: ['a', 'b'], default: 'a' } },
          if: { properties: { mode: { const: 'a' } } },
          then: { properties: { pet: petFor('a') } },
          else: { properties: { pet: petFor('b') } },
        },
        liveValidate: 'onChange',
      });

      await selectMode(node, 'b');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          formData: expect.objectContaining({ pet: expect.objectContaining({ animal: 'Fish', tank: 'b tank' }) }),
          errors: [],
        }),
        'root_mode',
      );
    });

    /** Two hops: `mode` swaps `kind`, and the `kind` written for the newly selected branch retypes `cfg`. `finalCfg`
     * is what the second hop retypes `cfg` to
     */
    const retypingCascade = (finalCfg: RJSFSchema): RJSFSchema => ({
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['a', 'b'], default: 'a' },
        kind: { type: 'object', properties: { v: { type: 'string' } } },
      },
      allOf: [
        {
          if: { properties: { mode: { const: 'a' } }, required: ['mode'] },
          then: { properties: { kind: kindFor('k1') } },
          else: { properties: { kind: kindFor('k2') } },
        },
        {
          if: { properties: { kind: { properties: { v: { const: 'k2' } }, required: ['v'] } }, required: ['kind'] },
          then: { properties: { cfg: finalCfg } },
          else: {
            properties: { cfg: { type: 'object', properties: { name: { type: 'string' } } } },
            allOf: [
              {
                if: { properties: { mode: { const: 'a' } }, required: ['mode'] },
                then: { properties: { cfg: cfgFor('a') } },
                else: { properties: { cfg: cfgFor('mid') } },
              },
            ],
          },
        },
      ],
    });

    const retypingCascadeData = { mode: 'a', kind: { v: 'k1' }, cfg: { name: 'a' } };

    // The second hop retypes the key the first hop replaced: each round diffs against the tree the round before
    // judged, so the value the first round wrote is the old schema's default there, and takes the new one
    it('replaces a refill that a later iteration retypes', async () => {
      const { node, onChange } = createFormComponent({
        schema: retypingCascade({ type: 'string', default: 'final' }),
        formData: retypingCascadeData,
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', kind: { v: 'k2' }, cfg: 'final' }, 'root_mode');
    });

    // The same two hops, with nothing declared for `cfg` under the schema the second hop retypes it to: the value
    // the first round wrote is of the old type, so it goes
    it('leaves a key empty when the schema that rejected its refill declares nothing', async () => {
      const { node, onChange } = createFormComponent({
        schema: retypingCascade({ type: 'string' }),
        formData: retypingCascadeData,
        liveValidate: 'onChange',
      });

      await selectMode(node, 'b');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { mode: 'b', kind: { v: 'k2' } }, errors: [] }),
        'root_mode',
      );
    });

    // A swap decided inside a property: each round of the diff judges `cfg` at its own level, against the schema the
    // previous round left it under, so the replacement the first round wrote is replaced again once `kind` retypes it
    it('judges a replacement at its own level when the swap is decided inside a property', async () => {
      // `mode` swaps `kind` and declares `cfg`'s value through the branch's own `default`, while `kind.v` decides
      // `cfg`'s type — so no state of this form declares `cfg` twice, and each one is valid on its own terms
      const wrapped: RJSFSchema = {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['a', 'b'], default: 'a' },
          kind: { type: 'object', properties: { v: { type: 'string' } } },
        },
        dependencies: {
          mode: {
            oneOf: [
              { properties: { mode: { const: 'a' }, kind: kindFor('k1') }, default: { cfg: { name: 'a' } } },
              { properties: { mode: { const: 'b' }, kind: kindFor('k2') }, default: { cfg: { name: 'mid' } } },
            ],
          },
        },
        allOf: [
          {
            if: { properties: { kind: { properties: { v: { const: 'k2' } }, required: ['v'] } }, required: ['kind'] },
            then: { properties: { cfg: { type: 'string', default: 'final' } } },
            else: { properties: { cfg: { type: 'object', properties: { name: { type: 'string' } } } } },
          },
        ],
      };
      const { node, onChange } = createFormComponent({
        schema: { type: 'object', properties: { wrap: wrapped } },
        formData: { wrap: { mode: 'a', kind: { v: 'k1' }, cfg: { name: 'a' } } },
        liveValidate: 'onChange',
      });

      await user.selectOptions(node.querySelector<HTMLSelectElement>('#root_wrap_mode')!, 'b');

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ formData: { wrap: { mode: 'b', kind: { v: 'k2' }, cfg: 'final' } }, errors: [] }),
        'root_wrap_mode',
      );
    });

    // Where a branch declares the default is what decides how much of the value it speaks for. On the object itself
    // it declares that object's keys, so an untouched one is replaced while its edited sibling is kept; one level up
    // it declares the whole object, which the edit no longer matches, so all of it stays
    describe('a nested default is matched at the level that declares it', () => {
      const cfgWithNote = (name: string): RJSFSchema => ({
        type: 'object',
        default: { name },
        properties: { name: { type: 'string' }, note: { type: 'string' } },
      });

      /** Pasted rather than typed: every keystroke drives a derivation, and only the settled value is under test */
      const writeNote = async (node: Element) => {
        await user.click(node.querySelector<HTMLInputElement>('#root_cfg_note')!);
        await user.paste('hi');
      };

      it('replaces an untouched leaf beside an edited one when the object declares the default', async () => {
        const { node, onChange } = createFormComponent({ schema: modeSwapOn('cfg', cfgWithNote) });

        await writeNote(node);
        await selectMode(node, 'b');

        expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'b', note: 'hi' } }, 'root_mode');
      });

      it('keeps the whole value when the branch declares the default above the object', async () => {
        const { node, onChange } = createFormComponent({
          schema: {
            type: 'object',
            properties: {
              mode: { type: 'string', enum: ['a', 'b'], default: 'a' },
              cfg: { type: 'object', properties: { name: { type: 'string' }, note: { type: 'string' } } },
            },
            if: { properties: { mode: { const: 'a' } } },
            then: { default: { cfg: { name: 'a' } } },
            else: { default: { cfg: { name: 'b' } } },
          },
        });

        await writeNote(node);
        await selectMode(node, 'b');

        expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', cfg: { name: 'a', note: 'hi' } }, 'root_mode');
      });
    });

    // A key is read off the data and the declared defaults as an own property, so a property named like a member of
    // `Object.prototype` is not answered by the inherited member
    it('reads a property named like an inherited Object member as its own', async () => {
      // Annotated, since a property named `constructor` in an object literal otherwise collides with the signature
      // every object inherits under that name and TypeScript stops reading the value as a schema
      const noDefaultCfg: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const { node, onChange } = createFormComponent({
        schema: modeSwap({ properties: { constructor: cfgFor('a') } }, { properties: { constructor: noDefaultCfg } }),
      });

      await selectMode(node, 'b');

      expectToHaveBeenCalledWithFormData(onChange, { mode: 'b', constructor: { name: 'a' } }, 'root_mode');
    });
  });
});
