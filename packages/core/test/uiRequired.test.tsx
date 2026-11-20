import type { FieldProps, RJSFSchema, UiSchema } from '@rjsf/utils';
import { noop, toPath } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';
import type { MockInstance } from 'vitest';

import ArrayField from '../src/components/fields/ArrayField.tsx';
import { useOptionSelection } from '../src/index.ts';
import { createFormComponent, elementOf, errorListMessages, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

describe('ui:required enforcement', () => {
  async function expectSubmitBlocked(schema: RJSFSchema, uiSchema: UiSchema, formData?: unknown) {
    const { node, onSubmit, onError } = createFormComponent({ schema, uiSchema, initialFormData: formData });
    await submitForm(node, user, true);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  }

  let warnSpy: MockInstance;
  beforeAll(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
  });
  afterAll(() => {
    warnSpy.mockRestore();
  });

  describe('schema shapes the rendered field resolves through', () => {
    it('enforces ui:required declared inside a ui:definitions fragment', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        definitions: { Address: { type: 'object', properties: { zip: { type: 'string' } } } },
        properties: { home: { $ref: '#/definitions/Address' } },
      };
      const uiSchema: UiSchema = {
        'ui:definitions': { '#/definitions/Address': { zip: { 'ui:required': true } } },
      };
      await expectSubmitBlocked(schema, uiSchema, { home: {} });
    });

    it('enforces ui:required declared in the ui:definitions entry of an option inside an allOf', async () => {
      const schema: RJSFSchema = {
        $defs: { Foo: { type: 'object', properties: { c: { type: 'string' } } }, Bar: { type: 'number' } },
        allOf: [{ anyOf: [{ $ref: '#/$defs/Foo' }, { $ref: '#/$defs/Bar' }] }],
      };
      const uiSchema: UiSchema = { 'ui:definitions': { '#/$defs/Foo': { c: { 'ui:required': true } } } };
      const { node, onSubmit } = createFormComponent({ schema, uiSchema });
      await submitForm(node, user, true);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(errorListMessages(node)).toEqual([".c must have required property 'c'"]);
    });

    const cOrBar: RJSFSchema[] = [{ type: 'object', properties: { c: { type: 'string' } } }, { $ref: '#/$defs/Bar' }];
    it.each<[string, RJSFSchema]>([
      ['inside an allOf', { allOf: [{ anyOf: cOrBar }] }],
      ['listed directly', { anyOf: cOrBar }],
    ])(
      "enforces the field's ui:required for an option %s with no entry, before one with a ui:definitions entry",
      async (_label, offering) => {
        const schema: RJSFSchema = { $defs: { Bar: { type: 'number' } }, ...offering };
        const uiSchema: UiSchema = {
          'ui:definitions': { '#/$defs/Bar': { 'ui:title': 'BarTitle' } },
          c: { 'ui:required': true },
        };
        const { node, onSubmit } = createFormComponent({ schema, uiSchema });
        expect(elementOf(node, 'label[for="root_c"]').textContent).toContain('*');
        await submitForm(node, user, true);
        expect(onSubmit).not.toHaveBeenCalled();
        expect(errorListMessages(node)).toEqual([".c must have required property 'c'"]);
      },
    );

    it('enforces ui:required on a field nested inside array items', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          people: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
        },
      };
      const uiSchema: UiSchema = { people: { items: { name: { 'ui:required': true } } } };
      await expectSubmitBlocked(schema, uiSchema, { people: [{}] });
    });

    it('enforces ui:required on a field declared through a nested allOf', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          address: {
            allOf: [
              { type: 'object', properties: { street: { type: 'string' } } },
              { type: 'object', properties: { city: { type: 'string' } } },
            ],
          },
        },
      };
      const uiSchema: UiSchema = { address: { street: { 'ui:required': true } } };
      await expectSubmitBlocked(schema, uiSchema, { address: {} });
    });

    it('enforces ui:required under a nested $ref on a plain submit (no liveValidate)', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        definitions: { Address: { type: 'object', properties: { street: { type: 'string' } } } },
        properties: { address: { $ref: '#/definitions/Address' } },
      };
      const uiSchema: UiSchema = { address: { street: { 'ui:required': true } } };
      await expectSubmitBlocked(schema, uiSchema, { address: {} });
    });

    it('enforces ui:required on a $ref-rooted schema on a plain submit', async () => {
      const schema: RJSFSchema = {
        definitions: { Person: { type: 'object', properties: { nick: { type: 'string' } } } },
        $ref: '#/definitions/Person',
      };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      await expectSubmitBlocked(schema, uiSchema, {});
    });

    it('applies ui:initialValue declared inside a ui:definitions fragment', () => {
      const schema: RJSFSchema = {
        type: 'object',
        definitions: { Address: { type: 'object', properties: { country: { type: 'string' } } } },
        properties: { home: { $ref: '#/definitions/Address' } },
      };
      const uiSchema: UiSchema = {
        'ui:definitions': { '#/definitions/Address': { country: { 'ui:initialValue': 'US' } } },
      };
      const { node } = createFormComponent({ schema, uiSchema });
      expect(node.querySelector<HTMLInputElement>('#root_home_country')).toHaveValue('US');
    });

    it('lets the user clear a ui:initialValue mid-edit instead of resurrecting it', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { country: { type: 'string' } } };
      const uiSchema: UiSchema = { country: { 'ui:initialValue': 'US' } };
      const { node } = createFormComponent({ schema, uiSchema });
      const input = node.querySelector<HTMLInputElement>('#root_country')!;
      expect(input).toHaveValue('US');
      await user.clear(input);
      expect(input).toHaveValue('');
    });

    it('enforces ui:required inside the selected oneOf branch', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          thing: {
            oneOf: [
              {
                type: 'object',
                title: 'A',
                properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } },
              },
              {
                type: 'object',
                title: 'B',
                properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } },
              },
            ],
          },
        },
      };
      const uiSchema: UiSchema = { thing: { aField: { 'ui:required': true } } };
      const { node, onSubmit } = createFormComponent({ schema, uiSchema, initialFormData: { thing: { kind: 'a' } } });
      await submitForm(node, user, true);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('enforces ui:required inside the anyOf option shown rather than the one the data matches best', async () => {
      // Switches to the second option and keeps the data, which matches the first option better
      function SecondOption({ fieldPath, formData, options, registry }: FieldProps & { options: RJSFSchema[] }) {
        const { selectedOption, selectOption } = useOptionSelection(registry, fieldPath, options, formData);
        return (
          <button id='second' type='button' onClick={() => selectOption(1)}>
            {selectedOption}
          </button>
        );
      }
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          thing: {
            anyOf: [
              { type: 'object', title: 'A', properties: { aField: { type: 'string' } } },
              { type: 'object', title: 'B', properties: { bField: { type: 'string' } } },
            ],
          },
        },
      };
      const uiSchema: UiSchema = { thing: { bField: { 'ui:required': true } } };
      const { node, onSubmit, onError } = createFormComponent({
        schema,
        uiSchema,
        fields: { AnyOfField: SecondOption },
        initialFormData: { thing: { aField: 'a' } },
      });
      await user.click(elementOf(node, '#second'));
      expect(node.querySelector('#second')).toHaveTextContent('1');

      await submitForm(node, user, true);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError.mock.lastCall?.[0]).toEqual([
        expect.objectContaining({ property: '.thing.bField', message: "must have required property 'bField'" }),
      ]);
    });

    it.each([false, true])(
      'reads a %s option as the empty option the field shows, and submits under it',
      async (booleanOption) => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            thing: {
              type: 'object',
              anyOf: [booleanOption, { title: 'B', properties: { bField: { type: 'string' } } }],
            },
          },
        };
        const uiSchema: UiSchema = { thing: { anyOf: [{}, { bField: { 'ui:required': true } }] } };
        const { node, onSubmit } = createFormComponent({ schema, uiSchema, initialFormData: { thing: {} } });
        expect(node.querySelector('#root_thing_bField')).not.toBeInTheDocument();

        await submitForm(node, user, true);

        expect(onSubmit).toHaveBeenCalledTimes(1);
      },
    );

    it('enforces ui:required below a $ref cycle once the user expands it, and not before', async () => {
      const schema: RJSFSchema = {
        definitions: {
          node: { type: 'object', properties: { name: { type: 'string' }, child: { $ref: '#/definitions/node' } } },
        },
        $ref: '#/definitions/node',
      };
      const uiSchema: UiSchema = { child: { name: { 'ui:required': true } } };
      const { node, onSubmit } = createFormComponent({ schema, uiSchema, initialFormData: { name: 'a' } });

      await submitForm(node, user, true);
      expect(onSubmit).toHaveBeenCalledTimes(1);

      await user.click(elementOf(node, '#root_child__expand'));
      await submitForm(node, user, true);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(node.querySelector('#root_child_name__error')).toHaveTextContent("must have required property 'name'");
    });

    it('enforces ui:required on a deeply nested object property', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          a: { type: 'object', properties: { b: { type: 'object', properties: { c: { type: 'string' } } } } },
        },
      };
      const uiSchema: UiSchema = { a: { b: { c: { 'ui:required': true } } } };
      const { node, onSubmit } = createFormComponent({ schema, uiSchema, initialFormData: { a: { b: {} } } });
      await submitForm(node, user, true);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not fire for a field that has a value', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node, onSubmit } = createFormComponent({ schema, uiSchema, initialFormData: { nick: 'x' } });
      await submitForm(node, user, true);
      expect(onSubmit).toHaveBeenCalled();
    });

    it('reports the error at the field path so it renders under the field', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node, onError } = createFormComponent({ schema, uiSchema, initialFormData: {} });
      await submitForm(node, user, true);
      expect(onError).toHaveBeenCalled();
      const errors = onError.mock.calls[0][0];
      expect(errors[0].property).toBe('.nick');
    });
  });

  describe('a group of checkboxes (#5573)', () => {
    const colors = (extra: RJSFSchema = {}, required: string[] = []): RJSFSchema => ({
      type: 'object',
      required,
      properties: {
        c: { type: 'array', title: 'Colors', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true, ...extra },
      },
    });
    const uiSchema: UiSchema = { c: { 'ui:widget': 'checkboxes', 'ui:required': true } };

    it.each<[string, RJSFSchema, unknown]>([
      ['with no value', colors(), undefined],
      ['the schema requires too, which seeds `[]`', colors({}, ['c']), undefined],
      ['holding an initial `[]`', colors(), { c: [] }],
      ['with a `default` of `[]`', colors({ default: [] }), undefined],
    ])('blocks a submit with no box checked, %s', async (_, schema, formData) => {
      await expectSubmitBlocked(schema, uiSchema, formData);
    });

    it('blocks a submit with no box checked, naming the widget by its registered name', async () => {
      await expectSubmitBlocked(colors({}, ['c']), { c: { 'ui:widget': 'CheckboxesWidget', 'ui:required': true } });
    });

    it('blocks a submit with no box checked, under a `ui:field` naming `ArrayField`', async () => {
      await expectSubmitBlocked(colors({}, ['c']), {
        c: { 'ui:field': 'ArrayField', 'ui:widget': 'checkboxes', 'ui:required': true },
      });
    });

    it('blocks a submit with no box checked, on a group an option renders', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        required: ['c'],
        properties: {
          c: {
            oneOf: [
              { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
              { type: 'string' },
            ],
          },
        },
      };
      await expectSubmitBlocked(schema, { c: { oneOf: [uiSchema.c as UiSchema, {}] } }, { c: [] });
    });

    it("blocks a submit with no box checked, on a group an option renders under the field's own `ui:required`", async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          c: {
            title: 'Colors',
            oneOf: [
              { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
              { title: 'B', type: 'number' },
            ],
          },
        },
      };
      await expectSubmitBlocked(
        schema,
        { c: { 'ui:required': true, oneOf: [{ 'ui:widget': 'checkboxes' }, {}] } },
        { c: [] },
      );
    });

    it("blocks a submit with no box checked, on a group a nested option shows, under the field's own `ui:required` (#5894)", async () => {
      await expectSubmitBlocked(
        {
          type: 'object',
          properties: {
            c: {
              title: 'Colors',
              oneOf: [
                {
                  oneOf: [
                    { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
                    { type: 'string' },
                  ],
                },
                { title: 'B', type: 'number' },
              ],
            },
          },
        },
        { c: { 'ui:required': true, oneOf: [{ 'ui:widget': 'checkboxes' }, {}] } },
        { c: [] },
      );
    });

    it('submits under an untyped option whose `ui:required` it has no control to answer', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
          type: 'object',
          properties: { c: { oneOf: [{ title: 'Anything' }, { title: 'Number', type: 'number' }] } },
        },
        uiSchema: { c: { oneOf: [{ 'ui:required': true }, {}] } },
      });
      await submitForm(node, user);
      expect(onSubmit).toHaveBeenCalled();
    });

    it('blocks a submit with no value, on an option of an optional field', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          c: {
            oneOf: [
              { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
              { type: 'number' },
            ],
          },
        },
      };
      await expectSubmitBlocked(schema, { c: { oneOf: [uiSchema.c as UiSchema, {}] } });
    });

    it('lets a submit through once another option is shown', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          c: {
            oneOf: [
              { title: 'Colors', type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
              { title: 'Number', type: 'number' },
            ],
          },
        },
      };
      const { node, onSubmit } = createFormComponent({
        schema,
        uiSchema: { c: { oneOf: [uiSchema.c as UiSchema, {}] } },
        initialFormData: { c: 1 },
      });
      await submitForm(node, user);
      expect(onSubmit).toHaveBeenCalled();
    });

    it('blocks a submit once the last box is unchecked', async () => {
      const { node, onSubmit, onError } = createFormComponent({ schema: colors(), uiSchema });
      const box = elementOf(node, 'input[type=checkbox]');
      await user.click(box);
      await user.click(box);
      await submitForm(node, user);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });

    it('reports one error where `minItems` already rejects `[]`', async () => {
      const { node, onSubmit } = createFormComponent({ schema: colors({ minItems: 1 }, ['c']), uiSchema });
      await submitForm(node, user);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(errorListMessages(node)).toEqual(["'Colors' must NOT have fewer than 1 items"]);
    });

    it('submits with a box checked', async () => {
      const { node, onSubmit } = createFormComponent({ schema: colors({}, ['c']), uiSchema });
      await user.click(elementOf(node, 'input[type=checkbox]'));
      await submitForm(node, user);
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  // The walk asks the form which field renders the array, as `SchemaField` plans it, rather than guessing from the
  // uiSchema's names (#5744)
  describe('an empty array, by the field the form renders it with', () => {
    const colors: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true };
    const withC = (c: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { c } });

    it('blocks a submit with nothing chosen in a required multiple select (#5744)', async () => {
      await expectSubmitBlocked({ ...withC(colors), required: ['c'] }, { c: { 'ui:required': true } });
    });

    it.each<[string, UiSchema]>([
      ['a `ui:field` given as the `ArrayField` component', { 'ui:field': ArrayField, 'ui:required': true }],
      ['a `ui:field` naming no registered field, which renders by type', { 'ui:field': 'Nope', 'ui:required': true }],
    ])('blocks a submit with nothing chosen under %s', async (_, uiSchema) => {
      await expectSubmitBlocked(withC(colors), { c: uiSchema }, { c: [] });
    });

    it('blocks a submit with nothing chosen in a custom widget on an array with no `items` under the fallback UI', async () => {
      const { node, onSubmit, onError } = createFormComponent({
        schema: withC({ type: 'array' }),
        uiSchema: { c: { 'ui:widget': 'TagsWidget', 'ui:required': true } },
        widgets: { TagsWidget: () => null },
        initialFormData: { c: [] },
        useFallbackUiForUnsupportedType: true,
      });
      await submitForm(node, user, true);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });

    it('blocks a submit with nothing chosen in the multiple select the fallback UI renders for a type list', async () => {
      const { node, onSubmit, onError } = createFormComponent({
        schema: withC({ ...colors, type: ['string', 'array'] }),
        uiSchema: { c: { 'ui:required': true } },
        initialFormData: { c: [] },
        useFallbackUiForUnsupportedType: true,
      });
      await submitForm(node, user, true);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });

    it('blocks a submit with nothing chosen in the multiple select the fallback UI renders for a schema with no type', async () => {
      const { type: _type, ...typeless } = colors;
      const { node, onSubmit, onError } = createFormComponent({
        schema: withC(typeless),
        uiSchema: { c: { 'ui:required': true } },
        initialFormData: { c: [] },
        useFallbackUiForUnsupportedType: true,
      });
      expect(node.querySelector('select[multiple]')).toBeInTheDocument();
      await submitForm(node, user, true);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });

    it('submits `[]` from the list of items the fallback UI renders where it drops a `ui:widget` no array takes', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: withC({ type: ['string', 'array'], items: { type: 'string' } }),
        uiSchema: { c: { 'ui:widget': 'textarea', 'ui:required': true } },
        initialFormData: { c: [] },
        useFallbackUiForUnsupportedType: true,
      });
      expect(node.querySelector('textarea')).not.toBeInTheDocument();
      await submitForm(node, user, true);
      expect(onSubmit).toHaveBeenCalled();
    });

    it('submits `[]` from a multiple select its `deprecatedHandling` hides', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: withC({ ...colors, deprecated: true }),
        uiSchema: { c: { 'ui:required': true, 'ui:options': { deprecatedHandling: 'hide' } } },
        initialFormData: { c: [] },
      });
      await submitForm(node, user, true);
      expect(onSubmit).toHaveBeenCalled();
    });

    it("submits `[]` to a field of your own the schema's `$id` names, as it does to one a `ui:field` names", async () => {
      const Tags = (_: FieldProps) => null;
      const { node, onSubmit } = createFormComponent({
        schema: withC({ ...colors, $id: 'Tags' }),
        uiSchema: { c: { 'ui:required': true } },
        fields: { Tags },
        initialFormData: { c: [] },
      });
      await submitForm(node, user, true);
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('a checkbox an option renders (#5573)', () => {
    it('shows the marker on a field just switched to it, which holds nothing and blocks the submit', async () => {
      const schema: RJSFSchema = {
        type: 'object',
        required: ['c'],
        properties: {
          c: {
            title: 'C',
            oneOf: [
              { title: 'Text', type: 'string' },
              { title: 'Box', type: 'boolean' },
            ],
          },
        },
      };
      const { node, onSubmit } = createFormComponent({ schema, noHtml5Validate: true });
      await user.selectOptions(elementOf(node, 'select'), 'Box');
      expect(node.textContent.split('*')).toHaveLength(2);
      await submitForm(node, user);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('error reporting', () => {
    it('toPath treats a leading dot the same', () => {
      expect(toPath('.nick')).toEqual(toPath('nick'));
    });

    it('focusOnFirstError focuses the ui:required field', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node } = createFormComponent({ schema, uiSchema, initialFormData: {}, focusOnFirstError: true });
      await submitForm(node, user, true);
      expect(document.activeElement?.id).toBe('root_nick');
    });

    it('renders the error under the field', async () => {
      const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node } = createFormComponent({ schema, uiSchema, initialFormData: {}, showErrorList: false });
      await submitForm(node, user, true);
      expect(node.textContent).toContain("must have required property 'nick'");
    });

    it('reports a single error, not a duplicate, for a field that is both schema-required and ui:required: true', async () => {
      const schema: RJSFSchema = { type: 'object', required: ['nick'], properties: { nick: { type: 'string' } } };
      const uiSchema: UiSchema = { nick: { 'ui:required': true } };
      const { node, onError } = createFormComponent({ schema, uiSchema, initialFormData: {} });
      await submitForm(node, user, true);
      expect(onError).toHaveBeenCalled();
      const errors = onError.mock.calls[0][0];
      expect(errors).toHaveLength(1);
      // AJV's own required error (the one that survives, since the ui:required walk defers to it) reports the
      // property without ui:required's leading-dot convention.
      expect(errors[0].property).toBe('nick');
    });

    it('passes the same formContext to the function form of uiSchema.items as rendering does, even when the formContext prop is omitted', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          people: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
        },
      };
      const uiSchema: UiSchema = {
        people: {
          items: (_item: unknown, _index: number, formContext: { mode?: string }) =>
            formContext.mode === 'strict' ? {} : { name: { 'ui:required': true } },
        },
      };
      // No `formContext` prop: the registry normalizes the missing prop to `{}` for rendering, and validation must
      // see that same `{}` rather than `undefined`, or the function above throws and ui:required silently no-ops.
      await expectSubmitBlocked(schema, uiSchema, { people: [{}] });
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('the options an option offers in turn (#5894)', () => {
    const shown: RJSFSchema = { type: 'object', properties: { x: { type: 'string' }, w: { type: 'string' } } };
    const other: RJSFSchema = { type: 'object', properties: { y: { type: 'string' } } };
    const nested: RJSFSchema = { anyOf: [{ type: 'number' }, { anyOf: [shown, other] }] };
    const nestedFirst: RJSFSchema = { anyOf: [{ anyOf: [shown, other] }, { type: 'number' }] };
    const wReq: UiSchema = { w: { 'ui:required': true } };
    const p = (field: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { p: field } });
    const odc: UiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } };
    const colors: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true };

    /** Whether the label of the field `id` is marked required, or undefined where no such field renders */
    function markedRequired(node: Element, id: string) {
      const label = node.querySelector(`#${id}__label`)?.closest('label');
      return label ? label.textContent.includes('*') : undefined;
    }

    // Submitted past the browser's own `required` check, which hides the gap only for a native input
    async function submitted(node: Element, onSubmit: ReturnType<typeof createFormComponent>['onSubmit']) {
      await submitForm(node, user, true);
      return onSubmit.mock.calls.length > 0;
    }

    it.each<[string, RJSFSchema, UiSchema, unknown, string]>([
      ['1: a single level', { anyOf: [shown, other] }, { anyOf: [wReq] }, { x: 'a' }, 'root_w'],
      ["2: the nested option's own entry", nested, { anyOf: [{}, { anyOf: [wReq] }] }, { x: 'a' }, 'root_w'],
      ["3: the field's uiSchema both levels fall back to", nested, wReq, { x: 'a' }, 'root_w'],
      [
        "3b: the field's uiSchema beside an outer list with no entry for the option",
        nested,
        { anyOf: [{}], ...wReq },
        { x: 'a' },
        'root_w',
      ],
      [
        '5: a `oneOf` in a `oneOf`',
        {
          oneOf: [
            { type: 'number' },
            {
              oneOf: [
                { ...shown, required: ['x'] },
                { ...other, required: ['y'] },
              ],
            },
          ],
        },
        { oneOf: [{}, { oneOf: [wReq] }] },
        { x: 'a' },
        'root_w',
      ],
      [
        '6: an `anyOf` in a `oneOf`',
        { oneOf: [{ type: 'number' }, { anyOf: [shown, other] }] },
        { oneOf: [{}, { anyOf: [wReq] }] },
        { x: 'a' },
        'root_w',
      ],
      [
        '7: an inner `oneOf` picked by its discriminator',
        {
          anyOf: [
            { type: 'number' },
            {
              type: 'object',
              discriminator: { propertyName: 'kind' },
              oneOf: [
                { properties: { kind: { const: 'o' }, y: { type: 'string' } } },
                { properties: { kind: { const: 's' }, w: { type: 'string' } } },
              ],
            },
          ],
        },
        { anyOf: [{}, { oneOf: [{}, wReq] }] },
        { kind: 's' },
        'root_w',
      ],
      [
        '8: three levels, each with an entry of its own',
        { anyOf: [{ type: 'number' }, { anyOf: [{ type: 'boolean' }, nested] }] },
        { anyOf: [{}, { anyOf: [{}, { anyOf: [{}, { anyOf: [wReq] }] }] }] },
        { x: 'a' },
        'root_w',
      ],
      [
        '8b: three levels, falling back to the field',
        { anyOf: [{ type: 'number' }, { anyOf: [{ type: 'boolean' }, nested] }] },
        wReq,
        { x: 'a' },
        'root_w',
      ],
      [
        '9b: an object option with a property of its own beside its options',
        {
          anyOf: [{ type: 'number' }, { type: 'object', properties: { z: { type: 'string' } }, anyOf: [shown, other] }],
        },
        { anyOf: [{}, { anyOf: [wReq] }] },
        // Shown by its own property, or the number option is the closest match
        { x: 'a', z: 'c' },
        'root_w',
      ],
      [
        '9c: an object field with a property of its own, whose option offers options',
        {
          type: 'object',
          properties: { z: { type: 'string' } },
          anyOf: [{ anyOf: [shown, other] }, { properties: { q: { type: 'number' } }, required: ['q'] }],
        },
        { anyOf: [{ anyOf: [wReq] }] },
        { x: 'a' },
        'root_w',
      ],
      [
        '9d: an object field with a property of its own, whose object option has one too',
        {
          type: 'object',
          properties: { z: { type: 'string' } },
          anyOf: [
            { type: 'object', properties: { z2: { type: 'string' } }, anyOf: [shown, other] },
            { properties: { q: { type: 'number' } }, required: ['q'] },
          ],
        },
        { anyOf: [{ anyOf: [wReq] }] },
        { x: 'a' },
        'root_w',
      ],
      [
        "10: an option whose own `ui:required: false` leaves its field's fields as they are",
        nested,
        { anyOf: [{}, { 'ui:required': false, anyOf: [wReq] }] },
        { x: 'a' },
        'root_w',
      ],
      [
        '12a: the nested option listed first, with no data',
        nestedFirst,
        { anyOf: [{ anyOf: [wReq] }] },
        undefined,
        'root_w',
      ],
      ['12b: the nested option listed first, with `{}`', nestedFirst, { anyOf: [{ anyOf: [wReq] }] }, {}, 'root_w'],
      [
        '13b: under Optional Data Controls, once the user has added the object',
        p(nestedFirst),
        { ...odc, p: { anyOf: [{ anyOf: [wReq] }] } },
        { p: { x: 'a' } },
        'root_p_w',
      ],
      ['13d: with Optional Data Controls off', p(nestedFirst), { p: { anyOf: [{ anyOf: [wReq] }] } }, {}, 'root_p_w'],
      [
        '13e: under Optional Data Controls, below an option whose `ui:required` keeps its fields on screen',
        p(nestedFirst),
        { ...odc, p: { anyOf: [{ 'ui:required': true, anyOf: [wReq] }] } },
        {},
        'root_p_w',
      ],
    ])('blocks a submit with an empty field marked required, %s', async (_, schema, uiSchema, formData, id) => {
      const { node, onSubmit } = createFormComponent({ schema, uiSchema, initialFormData: formData });
      expect(markedRequired(node, id)).toBe(true);
      expect(await submitted(node, onSubmit)).toBe(false);
    });

    it.each<[string, RJSFSchema, UiSchema, unknown, string]>([
      [
        "4: an outer list entry for another option, which the shown option's fallback leaves behind",
        nested,
        { anyOf: [wReq] },
        { x: 'a' },
        'root_w',
      ],
      ['11: the other inner option shown', nested, { anyOf: [{}, { anyOf: [wReq] }] }, { y: 'b' }, 'root_w'],
      ['11b: the outer number option shown', nested, { anyOf: [{}, { anyOf: [wReq] }] }, 3, 'root_w'],
      [
        '13c: an object under Optional Data Controls the user has not added',
        p(nestedFirst),
        { ...odc, p: { anyOf: [{ anyOf: [wReq] }] } },
        {},
        'root_p_w',
      ],
    ])('lets a submit through with %s', async (_, schema, uiSchema, formData, id) => {
      const { node, onSubmit } = createFormComponent({ schema, uiSchema, initialFormData: formData });
      expect(markedRequired(node, id)).not.toBe(true);
      expect(await submitted(node, onSubmit)).toBe(true);
    });

    it("14: marks a select over whole values a nested option shows required, from the field's `ui:required`", () => {
      // The select seeds its first value, so there is no empty value to submit; the walk's error for one is tested in
      // `@rjsf/utils`
      const { node } = createFormComponent({
        schema: p({ anyOf: [{ anyOf: [{ const: { a: 1 } }, { const: { a: 2 } }] }, { type: 'number' }] }),
        uiSchema: { p: { 'ui:required': true } },
        initialFormData: {},
      });
      expect(markedRequired(node, 'root_p')).toBe(true);
      expect(elementOf(node, 'select#root_p')).toBeRequired();
    });

    it('11d: blocks a submit once the user switches the inner selector to the option marking the field required', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: nested,
        uiSchema: { anyOf: [{}, { anyOf: [wReq] }] },
        initialFormData: { y: 'b' },
      });
      expect(markedRequired(node, 'root_w')).toBeUndefined();
      const [, inner] = node.querySelectorAll('select');
      await user.selectOptions(inner, 'Option 1');
      expect(markedRequired(node, 'root_w')).toBe(true);
      expect(await submitted(node, onSubmit)).toBe(false);
    });

    describe('a type selector numbered below the ones above it at the path', () => {
      const typed = (inner: RJSFSchema): RJSFSchema =>
        p({
          type: ['object', 'number'],
          properties: { a: { type: 'string' } },
          anyOf: [
            {
              type: ['object', 'number'],
              properties: { q: { type: 'string' } },
              anyOf: [
                { title: 'i1', ...inner },
                { title: 'i2', minimum: 2 },
              ],
            },
            { minimum: 1 },
          ],
        });

      it.each<[string, RJSFSchema, string, string]>([
        ["the option's", {}, 'q', 'root_p__internalTypeSelector2'],
        [
          "the option's own option's, below it",
          { type: ['object', 'number'], properties: { r: { type: 'string' } } },
          'r',
          'root_p__internalTypeSelector3',
        ],
      ])('submits once %s type selector is on number', async (_, inner, property, typeSelector) => {
        const { node, onSubmit } = createFormComponent({
          schema: typed(inner),
          uiSchema: { p: { anyOf: [{ [property]: { 'ui:required': true } }] } },
          initialFormData: { p: {} },
          useFallbackUiForUnsupportedType: true,
        });
        await user.selectOptions(elementOf(node, '#root_p__anyof_select', HTMLSelectElement), 'Option 1');
        await user.selectOptions(elementOf(node, '#root_p__anyof_select2', HTMLSelectElement), 'i1');
        expect(markedRequired(node, `root_p_${property}`)).toBe(true);
        await user.selectOptions(elementOf(node, `#${typeSelector}`, HTMLSelectElement), 'number');
        expect(markedRequired(node, `root_p_${property}`)).toBeUndefined();
        expect(await submitted(node, onSubmit)).toBe(true);
      });
    });

    describe('a multiple select a nested option shows, holding `[]`', () => {
      const field = (inner: RJSFSchema): RJSFSchema => p({ anyOf: [inner, { type: 'number' }] });
      it.each<[string, RJSFSchema, UiSchema]>([
        [
          "15: falling back to the field's uiSchema",
          field({ anyOf: [colors, { type: 'string' }] }),
          { 'ui:required': true },
        ],
        ['15b: on a single level', field(colors), { 'ui:required': true }],
        [
          '15c: below an outer option with an entry of its own',
          field({ anyOf: [colors, { type: 'string' }] }),
          { 'ui:required': true, anyOf: [{}] },
        ],
      ])('is natively required and blocks a submit, %s', async (_, schema, uiSchema) => {
        const { node, onSubmit } = createFormComponent({
          schema,
          uiSchema: { p: uiSchema },
          initialFormData: { p: [] },
        });
        expect(markedRequired(node, 'root_p')).toBe(true);
        expect(elementOf(node, 'select[multiple]')).toBeRequired();
        expect(await submitted(node, onSubmit)).toBe(false);
      });
    });

    it("blocks a submit of a cleared select of constants an option shows, from the option's `ui:required`, which no constant's entry overrides", async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p({
          anyOf: [
            {
              type: 'string',
              oneOf: [
                { const: 'a', title: 'A' },
                { const: 'b', title: 'B' },
              ],
            },
            { type: 'number' },
          ],
        }),
        uiSchema: { p: { anyOf: [{ 'ui:required': true, oneOf: [{ 'ui:required': false }] }] } },
      });
      expect(markedRequired(node, 'root_p')).toBe(true);
      // Cleared rather than left untouched, which the form's defaults would fill on submit
      await user.selectOptions(elementOf(node, '#root_p'), 'A');
      await user.selectOptions(elementOf(node, '#root_p'), '');
      expect(await submitted(node, onSubmit)).toBe(false);
    });

    it("blocks a submit of a cleared select of constants with no `type` an option shows, from the option's `ui:required`", async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p({
          anyOf: [
            {
              oneOf: [
                { const: 'a', title: 'A' },
                { const: 'b', title: 'B' },
              ],
            },
            { type: 'number' },
          ],
        }),
        uiSchema: { p: { anyOf: [{ 'ui:required': true }] } },
      });
      expect(markedRequired(node, 'root_p')).toBe(true);
      // Cleared rather than left untouched, which the form's defaults would fill on submit
      await user.selectOptions(elementOf(node, '#root_p'), 'A');
      await user.selectOptions(elementOf(node, '#root_p'), '');
      expect(await submitted(node, onSubmit)).toBe(false);
    });

    it("blocks a submit with a property an option declares beside options of its own empty, as the option's entry marks it", async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p({
          anyOf: [
            {
              type: 'object',
              properties: { z: { type: 'string' } },
              anyOf: [
                { type: 'object', properties: { w: { type: 'string' } } },
                { type: 'object', properties: { y: { type: 'string' } } },
              ],
            },
            { type: 'number' },
          ],
        }),
        uiSchema: { p: { anyOf: [{ z: { 'ui:required': true }, anyOf: [{ 'ui:title': 'W' }] }] } },
        initialFormData: { p: {} },
      });
      expect(markedRequired(node, 'root_p_z')).toBe(true);
      expect(await submitted(node, onSubmit)).toBe(false);
    });

    it("blocks a submit with the field empty where an option offering options of its own marks it required and the option shown there doesn't", async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p({ anyOf: [{ type: 'string', anyOf: [{ minLength: 1 }, { maxLength: 3 }] }, { type: 'number' }] }),
        uiSchema: { p: { anyOf: [{ 'ui:required': true, anyOf: [{ 'ui:required': false }] }] } },
      });
      expect(markedRequired(node, 'root_p')).toBe(true);
      expect(await submitted(node, onSubmit)).toBe(false);
    });

    it("blocks a submit with the field empty where an option with no `type` offering options of its own marks it required and the option shown there doesn't", async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p({
          anyOf: [
            {
              anyOf: [
                { type: 'string', minLength: 1 },
                { type: 'string', maxLength: 3 },
              ],
            },
            { type: 'number' },
          ],
        }),
        uiSchema: { p: { anyOf: [{ 'ui:required': true, anyOf: [{ 'ui:required': false }] }] } },
      });
      expect(markedRequired(node, 'root_p')).toBe(true);
      expect(await submitted(node, onSubmit)).toBe(false);
    });

    it('blocks a submit with an empty field marked required, under Optional Data Controls, below an option whose own option keeps its fields on screen', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p(nestedFirst),
        uiSchema: { ...odc, p: { anyOf: [{ anyOf: [{ 'ui:required': true, ...wReq }] }] } },
      });
      expect(markedRequired(node, 'root_p_w')).toBe(true);
      expect(await submitted(node, onSubmit)).toBe(false);
    });

    it('blocks a submit with the field empty where an option offering options of its own marks it required and the option shown there is an Optional Data Control', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p(nestedFirst),
        uiSchema: { ...odc, p: { anyOf: [{ 'ui:required': true, anyOf: [{ 'ui:required': false }] }] } },
      });
      expect(markedRequired(node, 'root_p')).toBe(true);
      expect(node.querySelector('#root_p_w')).toBeNull();
      expect(await submitted(node, onSubmit)).toBe(false);
    });

    it('reports no field of an option shown as an Optional Data Control below an option offering options of its own', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p({ anyOf: [{ type: 'object', anyOf: [shown, other] }, { type: 'number' }] }),
        uiSchema: { ...odc, p: { anyOf: [{ 'ui:required': true, anyOf: [{ 'ui:required': false, ...wReq }] }] } },
      });
      expect(node.querySelector('#root_p_w')).toBeNull();
      expect(await submitted(node, onSubmit)).toBe(false);
      expect(errorListMessages(node)).toEqual([".p must have required property 'p'"]);
    });

    it("submits with the field empty where only an option shown below the one marking the field's label sets `ui:required`", async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p(nestedFirst),
        uiSchema: { p: { anyOf: [{ anyOf: [{ 'ui:required': true }] }] } },
      });
      expect([...node.querySelectorAll('legend, label')].map(({ textContent }) => textContent)).not.toContain('p*');
      expect(await submitted(node, onSubmit)).toBe(true);
    });

    it('submits past the options of an option that a `ui:field` renders in their place', async () => {
      const { node, onSubmit } = createFormComponent({
        schema: p({ anyOf: [{ anyOf: [shown, other] }, { type: 'number' }] }),
        uiSchema: {
          p: { anyOf: [{ 'ui:field': 'MyField', 'ui:fieldReplacesAnyOrOneOf': true, anyOf: [wReq] }] },
        },
        initialFormData: { p: { x: 'a' } },
        fields: { MyField: () => <div /> },
      });
      expect(node.querySelector('#root_p_w')).toBeNull();
      expect(await submitted(node, onSubmit)).toBe(true);
    });
  });
});
