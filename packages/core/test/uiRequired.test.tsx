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

    it("submits `[]` from a group a nested option shows, which the field's own `ui:required` doesn't reach", async () => {
      const { node, onSubmit } = createFormComponent({
        schema: {
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
        uiSchema: { c: { 'ui:required': true, oneOf: [{ 'ui:widget': 'checkboxes' }, {}] } },
        initialFormData: { c: [] },
      });
      await submitForm(node, user);
      expect(onSubmit).toHaveBeenCalled();
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
});
