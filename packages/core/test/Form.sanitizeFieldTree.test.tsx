import { createRef, useState } from 'react';
import type { DefaultFormStateBehavior, RJSFSchema, UiSchema } from '@rjsf/utils';
import { buttonId, createSchemaUtils, getByPath } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormRef, IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';
import { AcceptingParent, createParentLog, elementOf, handleOf, input, TransformingParent } from './testUtils.tsx';

interface ColorListData {
  color?: string;
  list?: (string | null)[];
  name?: string;
}

const user = userEvent.setup();

describe('sanitize as a diff of the field trees before and after a change', () => {
  it('judges a value an array write flips the constraints of (#5250)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        list: { type: 'array', items: { type: 'string' } },
        color: { type: 'string', enum: ['r', 'g'] },
        name: { type: 'string' },
      },
      allOf: [
        {
          if: { properties: { list: { minItems: 2 } } },
          then: { properties: { color: { enum: ['r'] } } },
        },
      ],
    };
    const events: IChangeEvent<ColorListData>[] = [];
    const { container } = render(
      <Form<ColorListData>
        schema={schema}
        validator={validator}
        initialFormData={{ color: 'g', list: ['x'] }}
        onChange={(event) => events.push(event)}
      />,
    );
    // The array write flips the conditional, and its own sanitize judges `color` against the `then`
    await user.click(elementOf(container, `#${buttonId('root_list', 'add')}`));
    await user.type(input(container, 'root_name'), 'a');
    const last = events[events.length - 1].formData;
    expect(last?.color).toBe('r');
  });

  it.each([
    { property: true, expected: { kind: 't', a: 'x' }, holds: 'keeps the value of', which: 'any value' },
    { property: false, expected: { kind: 't' }, holds: 'drops the value of', which: 'none' },
  ])('$holds a property whose schema becomes $property, which holds $which', async ({ property, expected }) => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { kind: { type: 'string', enum: ['s', 't'] } },
      if: { properties: { kind: { const: 's' } } },
      then: { properties: { a: { type: 'string' } } },
      else: { properties: { a: property } },
    };
    const events: IChangeEvent<{ kind?: string; a?: unknown }>[] = [];
    const { container } = render(
      <Form<{ kind?: string; a?: unknown }>
        schema={schema}
        validator={validator}
        initialFormData={{ kind: 's', a: 'x' }}
        onChange={(event) => events.push(event)}
      />,
    );

    await user.selectOptions(elementOf(container, '#root_kind'), 't');

    expect(events[events.length - 1].formData).toEqual(expected);
  });

  describe('a property a conditional stops declaring, judged as an extra key (#5778)', () => {
    interface KindData {
      kind?: string;
      a?: unknown;
    }
    const ifThen = (a: RJSFSchema = { type: 'string' }): RJSFSchema => ({
      if: { properties: { kind: { const: 's' } } },
      then: { properties: { a } },
    });
    const kindOf = (rest: RJSFSchema): RJSFSchema => ({
      type: 'object',
      properties: { kind: { type: 'string', enum: ['s', 't'] } },
      ...rest,
    });

    async function selectT(
      schema: RJSFSchema,
      {
        whenAbsent,
        initialFormData = { kind: 's', a: 'x' },
        uiSchema,
        beforeSwitch,
      }: {
        whenAbsent?: 'allow';
        uiSchema?: UiSchema<KindData>;
        initialFormData?: KindData;
        /** What the user does in the `s` branch before switching to `t` */
        beforeSwitch?: (container: HTMLElement) => Promise<void>;
      } = {},
    ) {
      const events: IChangeEvent<KindData>[] = [];
      const { container } = render(
        <Form<KindData>
          schema={schema}
          validator={validator}
          additionalPropertiesWhenAbsent={whenAbsent}
          initialFormData={initialFormData}
          uiSchema={uiSchema}
          onChange={(event) => events.push(event)}
        />,
      );
      await beforeSwitch?.(container);
      const hadField = container.querySelector('#root_a') !== null;
      await user.selectOptions(elementOf(container, '#root_kind'), 't');
      return { container, hadField, formData: events[events.length - 1].formData };
    }

    it.each<{ extras: string; schema: RJSFSchema; whenAbsent?: 'allow' }>([
      { extras: 'true', schema: kindOf({ ...ifThen(), additionalProperties: true }) },
      { extras: 'absent under allow', schema: kindOf(ifThen()), whenAbsent: 'allow' },
      // A `title` constrains no value, so the extra key's type is still guessed from its data
      { extras: 'an annotation alone', schema: kindOf({ ...ifThen(), additionalProperties: { title: 'Anything' } }) },
      { extras: 'absent under allow, in an allOf', schema: kindOf({ allOf: [ifThen()] }), whenAbsent: 'allow' },
      {
        extras: 'true, under dependencies',
        schema: kindOf({
          dependencies: {
            kind: {
              oneOf: [
                { properties: { kind: { const: 's' }, a: { type: 'string' } } },
                { properties: { kind: { const: 't' } } },
              ],
            },
          },
          additionalProperties: true,
        }),
      },
    ])('keeps a string when extra keys are $extras', async ({ schema, whenAbsent }) => {
      const { container, formData } = await selectT(schema, { whenAbsent });

      expect(formData).toEqual({ kind: 't', a: 'x' });
      expect(container.querySelector('#root_a__key')).not.toBeNull();
      expect(input(container, 'root_a').value).toBe('x');
    });

    it('keeps a number, and a value the user typed over the default', async () => {
      const schema = kindOf({ ...ifThen({ type: 'number', default: 1 }), additionalProperties: true });
      const { container, formData } = await selectT(schema, { initialFormData: { kind: 's', a: 5 } });

      expect(formData).toEqual({ kind: 't', a: 5 });
      expect(container.querySelector('#root_a__key')).not.toBeNull();
      expect(input(container, 'root_a').value).toBe('5');
    });

    it('keeps an object whose keys its extra key renders, as extra keys of their own', async () => {
      const schema = kindOf(ifThen({ type: 'object', properties: { b: { type: 'string' } } }));
      const { container, formData } = await selectT(schema, {
        whenAbsent: 'allow',
        initialFormData: { kind: 's', a: { b: 'x' } },
      });

      expect(formData).toEqual({ kind: 't', a: { b: 'x' } });
      expect(container.querySelector('#root_a__key')).not.toBeNull();
      expect(container.querySelector('#root_a_b__key')).not.toBeNull();
      expect(input(container, 'root_a_b').value).toBe('x');
    });

    // An object whose every key drops holds what an empty one does, which is dropped as the defaults' fill
    it.each([
      { held: 'only an array, and the object it empties', a: { b: ['x'] }, expected: { kind: 't' }, rendersA: false },
      {
        held: 'an array beside a string, keeping the string',
        a: { b: ['x'], c: 'y' },
        expected: { kind: 't', a: { c: 'y' } },
        rendersA: true,
      },
    ])('drops an array inside an object holding $held', async ({ a, expected, rendersA }) => {
      const schema = kindOf(
        ifThen({
          type: 'object',
          properties: { b: { type: 'array', items: { type: 'string' } }, c: { type: 'string' } },
        }),
      );
      const { container, formData } = await selectT(schema, { whenAbsent: 'allow', initialFormData: { kind: 's', a } });

      expect(formData).toEqual(expected);
      expect(container.querySelector('#root_a__key') !== null).toBe(rendersA);
      expect(container.querySelector('#root_a_b__key')).toBeNull();
    });

    it.each<{ extras: string; schema: RJSFSchema; initialFormData?: KindData }>([
      { extras: '{ type: number }', schema: kindOf({ ...ifThen(), additionalProperties: { type: 'number' } }) },
      { extras: 'false', schema: kindOf({ ...ifThen(), additionalProperties: false }) },
      { extras: 'absent under forbid', schema: kindOf(ifThen()) },
      // A guessed array stub declares no `items`, so it renders none of the items it would hold
      {
        extras: 'true, for an array',
        schema: kindOf({ ...ifThen({ type: 'array', items: { type: 'string' } }), additionalProperties: true }),
        initialFormData: { kind: 's', a: ['x', 'y'] },
      },
      // The guessed object stub takes no extra keys of its own under `'forbid'`, so it would render none of `b`
      {
        extras: 'true, for an object whose keys the stub forbids',
        schema: kindOf({
          ...ifThen({ type: 'object', properties: { b: { type: 'string' } } }),
          additionalProperties: true,
        }),
        initialFormData: { kind: 's', a: { b: 'x' } },
      },
      // A type that `items` or `properties` only implies is judged as a declared one
      {
        extras: 'true, for an array whose type is implied',
        schema: kindOf({ ...ifThen({ items: { type: 'string' } }), additionalProperties: true }),
        initialFormData: { kind: 's', a: ['x', 'y'] },
      },
      {
        extras: 'true, for an object whose type is implied',
        schema: kindOf({ ...ifThen({ properties: { b: { type: 'string' } } }), additionalProperties: true }),
        initialFormData: { kind: 's', a: { b: 'x' } },
      },
    ])('drops the value when extra keys are $extras', async ({ schema, initialFormData }) => {
      const { container, formData } = await selectT(schema, { initialFormData });

      expect(formData).toEqual({ kind: 't' });
      expect(container.querySelector('#root_a__key')).toBeNull();
    });

    // The form fills these in by itself, so keeping them would leave extra-key rows the user never typed
    it.each<{ filled: string; schema: RJSFSchema; initialFormData?: KindData; whenAbsent?: 'allow' }>([
      {
        filled: 'a default',
        schema: kindOf({ ...ifThen({ type: 'string', default: 'd' }), additionalProperties: true }),
      },
      { filled: 'a const', schema: kindOf({ ...ifThen({ type: 'string', const: 'x' }), additionalProperties: true }) },
      {
        filled: "a required object's empty object",
        schema: kindOf({
          if: { properties: { kind: { const: 's' } } },
          then: { properties: { a: { type: 'object', properties: { b: { type: 'string' } } } }, required: ['a'] },
          additionalProperties: true,
        }),
      },
      // The parent's `required` is what fills a boolean with `false`
      {
        filled: "a required boolean's false",
        schema: kindOf({
          if: { properties: { kind: { const: 's' } } },
          then: { properties: { a: { type: 'boolean' } }, required: ['a'] },
          additionalProperties: true,
        }),
      },
      {
        filled: "an object its properties' defaults fill",
        schema: kindOf({
          ...ifThen({ type: 'object', properties: { b: { type: 'string', default: 'q' } } }),
          additionalProperties: true,
        }),
        // Under `'allow'` the stub takes `b`, so only what the defaults filled in can drop the object
        whenAbsent: 'allow',
      },
      {
        filled: "an object the parent's default and its own defaults fill together",
        schema: kindOf({
          ...ifThen({
            type: 'object',
            properties: { b: { type: 'string' }, c: { type: 'string', default: 'y' } },
          }),
          default: { a: { b: 'x' } },
          additionalProperties: true,
        }),
        whenAbsent: 'allow',
      },
      // Equal data can't be told apart from what the defaults fill in, so an empty object the data held goes too
      {
        filled: 'an empty object',
        schema: kindOf({
          ...ifThen({ type: 'object', properties: { b: { type: 'string' } } }),
          additionalProperties: true,
        }),
        initialFormData: { kind: 's', a: {} },
      },
      // The extra key's own `default` seeds a new extra key, so it doesn't take the old default's place
      {
        filled: "a default, where the extra key's stub has its own",
        schema: kindOf({
          ...ifThen({ type: 'string', default: 'd' }),
          additionalProperties: { title: 'Any', default: 'z' },
        }),
      },
      {
        filled: "the parent's default, which both sides inherit",
        schema: kindOf({
          ...ifThen({ type: 'array', items: { type: 'string' } }),
          default: { a: ['x'] },
          additionalProperties: true,
        }),
        initialFormData: { kind: 's', a: ['x'] },
      },
    ])(
      'drops $filled rather than keeping it as an extra key',
      async ({ schema, initialFormData = { kind: 's' }, whenAbsent }) => {
        const { container, hadField, formData } = await selectT(schema, { initialFormData, whenAbsent });

        expect(hadField).toBe(true);
        expect(formData).toEqual({ kind: 't' });
        expect(container.querySelector('#root_a__key')).toBeNull();
      },
    );

    it('keeps a required boolean the user checked', async () => {
      const schema = kindOf({
        if: { properties: { kind: { const: 's' } } },
        then: { properties: { a: { type: 'boolean' } }, required: ['a'] },
        additionalProperties: true,
      });
      const { container, formData } = await selectT(schema, {
        initialFormData: { kind: 's' },
        beforeSwitch: (form) => user.click(input(form, 'root_a')),
      });

      expect(formData).toEqual({ kind: 't', a: true });
      expect(container.querySelector('#root_a__key')).not.toBeNull();
    });

    // The extra key is judged alone, so a limit the new branch puts on the object's keys can reject what it keeps
    it.each<{ branch: string; otherwise: RJSFSchema; expected: KindData; isValid: boolean }>([
      {
        branch: 'propertyNames',
        otherwise: { propertyNames: { enum: ['kind'] } },
        expected: { kind: 't', a: 'x' },
        isValid: false,
      },
      { branch: 'maxProperties', otherwise: { maxProperties: 1 }, expected: { kind: 't', a: 'x' }, isValid: false },
      {
        branch: 'additionalProperties: false',
        // `else` declares `kind` too, since its `additionalProperties` sees only the keys it declares itself
        otherwise: { properties: { kind: true }, additionalProperties: false },
        expected: { kind: 't' },
        isValid: true,
      },
    ])(
      "judges a kept value by the extra key alone, whatever the new branch's $branch says",
      async ({ otherwise, expected, isValid }) => {
        const schema = kindOf({ ...ifThen(), else: otherwise, additionalProperties: true });
        const { formData } = await selectT(schema);

        expect(formData).toEqual(expected);
        expect(validator.isValid(schema, formData, schema)).toBe(isValid);
      },
    );

    it('judges a field inside an array item against what the defaults filled that item with', async () => {
      interface ListData {
        list?: KindData[];
      }
      // Only the form's fill, around the item, sees the `required` that fills the boolean with `false`
      const item = kindOf({
        if: { properties: { kind: { const: 's' } } },
        then: { properties: { a: { type: 'boolean' } }, required: ['a'] },
        additionalProperties: true,
      });
      const schema: RJSFSchema = { type: 'object', properties: { list: { type: 'array', items: item } } };
      const events: IChangeEvent<ListData>[] = [];
      const { container } = render(
        <Form<ListData>
          schema={schema}
          validator={validator}
          initialFormData={{ list: [{ kind: 's' }, { kind: 's' }] }}
          onChange={(event) => events.push(event)}
        />,
      );

      await user.click(input(container, 'root_list_0_a'));
      await user.selectOptions(elementOf(container, '#root_list_0_kind'), 't');
      await user.selectOptions(elementOf(container, '#root_list_1_kind'), 't');

      expect(events[events.length - 1].formData).toEqual({ list: [{ kind: 't', a: true }, { kind: 't' }] });
      expect(container.querySelector('#root_list_0_a__key')).not.toBeNull();
      expect(container.querySelector('#root_list_1_a__key')).toBeNull();
    });

    it('drops what a default two levels up filled in beside what the user typed', async () => {
      const schema = kindOf({
        ...ifThen({ type: 'object', properties: { b: { type: 'string' }, c: { type: 'string' } } }),
        default: { a: { c: 'y' } },
        additionalProperties: true,
      });
      const { container, formData } = await selectT(schema, {
        whenAbsent: 'allow',
        initialFormData: { kind: 's' },
        beforeSwitch: (form) => user.type(input(form, 'root_a_b'), 'x'),
      });

      expect(formData).toEqual({ kind: 't', a: { b: 'x' } });
      expect(input(container, 'root_a_b').value).toBe('x');
      expect(container.querySelector('#root_a_c__key')).toBeNull();
    });

    it("drops the const of the option the user selected, not the first option's default", async () => {
      const schema = kindOf({
        ...ifThen({
          oneOf: [
            { title: 'X', type: 'string', default: 'x' },
            { title: 'Y', type: 'string', const: 'y' },
          ],
        }),
        additionalProperties: true,
      });
      const { container, formData } = await selectT(schema, {
        initialFormData: { kind: 's' },
        beforeSwitch: (form) => user.selectOptions(elementOf(form, '#root_a__oneof_select'), 'Y'),
      });

      expect(formData).toEqual({ kind: 't' });
      expect(container.querySelector('#root_a__key')).toBeNull();
    });

    it.each<{ filled: string; uiSchema: UiSchema<KindData>; expected: string }>([
      { filled: 'ui:initialValue', uiSchema: { a: { 'ui:initialValue': 'd' } }, expected: 'd' },
      { filled: 'ui:emptyValue', uiSchema: { a: { 'ui:emptyValue': '' } }, expected: '' },
    ])('drops what the $filled of the uiSchema filled in', async ({ uiSchema, expected }) => {
      const schema = kindOf({ ...ifThen(), additionalProperties: true });
      const { container, formData } = await selectT(schema, {
        initialFormData: { kind: 's' },
        uiSchema,
        beforeSwitch: async (form) => expect(input(form, 'root_a').value).toBe(expected),
      });

      expect(formData).toEqual({ kind: 't' });
      expect(container.querySelector('#root_a__key')).toBeNull();
    });

    it('keeps a value the user typed over the ui:initialValue', async () => {
      const schema = kindOf({ ...ifThen(), additionalProperties: true });
      const { container, formData } = await selectT(schema, {
        initialFormData: { kind: 's' },
        uiSchema: { a: { 'ui:initialValue': 'd' } },
        beforeSwitch: async (form) => {
          await user.clear(input(form, 'root_a'));
          await user.type(input(form, 'root_a'), 'x');
        },
      });

      expect(formData).toEqual({ kind: 't', a: 'x' });
      expect(container.querySelector('#root_a__key')).not.toBeNull();
    });

    // A new schema and a new uiSchema can arrive together, and the old tree was filled under the old uiSchema
    it.each<{ case: string; oldUi: UiSchema<KindData>; newUi: UiSchema<KindData>; typed?: string; expected: KindData }>(
      [
        {
          case: 'drops what the old uiSchema filled in, when the new one fills nothing',
          oldUi: { a: { 'ui:initialValue': 'init' } },
          newUi: {},
          expected: {},
        },
        {
          case: 'keeps what the user typed, when only the new uiSchema fills it in',
          oldUi: {},
          newUi: { a: { 'ui:initialValue': 'x' } },
          typed: 'x',
          expected: { a: 'x' },
        },
      ],
    )('$case', async ({ oldUi, newUi, typed, expected }) => {
      const ref = createRef<FormRef<KindData>>();
      const oldSchema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
      const newSchema: RJSFSchema = { type: 'object', additionalProperties: true };
      const { container, rerender } = render(
        <Form ref={ref} schema={oldSchema} uiSchema={oldUi} validator={validator} />,
      );
      if (typed !== undefined) {
        await user.type(input(container, 'root_a'), typed);
      }
      expect(input(container, 'root_a').value).toBe(typed ?? 'init');

      rerender(<Form ref={ref} schema={newSchema} uiSchema={newUi} validator={validator} />);

      expect(ref.current?.getFormData()).toEqual(expected);
      expect(container.querySelector('#root_a__key') !== null).toBe(typed !== undefined);
    });

    describe('the defaults filled under the option the old field showed', () => {
      const optionA: RJSFSchema = { title: 'A', type: 'object', properties: { w: { type: 'string', default: 'q' } } };
      const optionB: RJSFSchema = { title: 'B', type: 'object', properties: { x: { type: 'number' } } };
      const unionOf = (b: RJSFSchema) => kindOf({ ...ifThen({ oneOf: [optionA, b] }), additionalProperties: true });
      // Only the form's fill sees the uiSchema, so these are the fills of that one
      const uiSchema: UiSchema<KindData> = { a: { x: { 'ui:emptyValue': 7 } } };
      const closedB: RJSFSchema = { ...optionB, additionalProperties: false };

      it('drops them under the option the user selected, not the first one', async () => {
        const { container, formData } = await selectT(unionOf(closedB), {
          whenAbsent: 'allow',
          initialFormData: { kind: 's' },
          uiSchema,
          beforeSwitch: async (form) => {
            await user.selectOptions(elementOf(form, '#root_a__oneof_select'), 'B');
            expect(input(form, 'root_a_x').value).toBe('7');
          },
        });

        expect(formData).toEqual({ kind: 't' });
        expect(container.querySelector('#root_a__key')).toBeNull();
      });

      // Without its value the field matches the first option, so the fill reads what the old tree showed instead
      it('drops them under the option the data matched, not the one the field matches without it', async () => {
        const { container, formData } = await selectT(unionOf(closedB), {
          whenAbsent: 'allow',
          initialFormData: { kind: 's', a: { x: 7 } },
          uiSchema,
          // Only `B` declares `x`
          beforeSwitch: async (form) => expect(input(form, 'root_a_x').value).toBe('7'),
        });

        expect(formData).toEqual({ kind: 't' });
        expect(container.querySelector('#root_a__key')).toBeNull();
      });

      // Without data the field matches its first option, whose defaults are what the form filled it with to start. The
      // switch to the option shown already judges them against that option, as keys only it declared (#5824)
      it("drops another option's defaults on the switch to the option shown", async () => {
        const { container, formData } = await selectT(unionOf({ title: 'B', type: 'object' }), {
          whenAbsent: 'allow',
          initialFormData: { kind: 's' },
          beforeSwitch: async (form) => {
            expect(input(form, 'root_a_w').value).toBe('q');
            await user.selectOptions(elementOf(form, '#root_a__oneof_select'), 'B');
            expect(form.querySelector('#root_a_w')).toBeNull();
          },
        });

        expect(formData).toEqual({ kind: 't' });
        expect(container.querySelector('#root_a__key')).toBeNull();
      });
    });

    // Without `a` the inner `else` fills `'e'`, and with it the `then` shows it, so `'e'` is what the defaults fill in,
    // whether they filled it or the user typed it
    it.each([
      { start: 'the fill', initialFormData: { kind: 's' }, typed: undefined },
      { start: "the user's", initialFormData: { kind: 's', a: 'x' }, typed: 'e' },
    ])(
      'drops a value the defaults fill in under another branch than the one that shows it, from $start',
      async ({ initialFormData, typed }) => {
        const schema = kindOf({
          if: { properties: { kind: { const: 's' } } },
          then: {
            if: { required: ['a'] },
            then: { properties: { a: { type: 'string', default: 'd' } } },
            else: { properties: { a: { type: 'string', default: 'e' } } },
          },
          additionalProperties: true,
        });
        const { container, formData } = await selectT(schema, {
          initialFormData,
          beforeSwitch: async (form) => {
            if (typed !== undefined) {
              await user.clear(input(form, 'root_a'));
              await user.type(input(form, 'root_a'), typed);
            }
            expect(input(form, 'root_a').value).toBe('e');
          },
        });

        expect(formData).toEqual({ kind: 't' });
        expect(container.querySelector('#root_a__key')).toBeNull();
      },
    );

    // No data tells a value the user picked apart from the same value the default filled in
    it.each([
      { picked: 'd', expected: { kind: 't' }, isKept: false },
      { picked: 'e', expected: { kind: 't', a: 'e' }, isKept: true },
    ])('keeps the pick $picked only when it is not the default', async ({ picked, expected, isKept }) => {
      const schema = kindOf({
        ...ifThen({ type: 'string', enum: ['d', 'e'], default: 'd' }),
        additionalProperties: true,
      });
      const { container, formData } = await selectT(schema, {
        initialFormData: { kind: 's', a: picked === 'd' ? 'e' : 'd' },
        beforeSwitch: (form) => user.selectOptions(elementOf(form, '#root_a'), picked),
      });

      expect(formData).toEqual(expected);
      expect(container.querySelector('#root_a__key') !== null).toBe(isKept);
    });
  });

  it('judges each edit against the data before it when a parent stores what onChange reports (#5250)', async () => {
    interface PetData {
      pet: { mode?: string; color?: string };
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        pet: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['open', 'strict'] },
            color: { type: 'string', enum: ['r', 'g'] },
          },
          allOf: [
            {
              if: { properties: { mode: { const: 'strict' } } },
              then: { properties: { color: { enum: ['r'] } } },
            },
          ],
        },
      },
    };
    const log = createParentLog<PetData>();
    const { container } = render(
      <AcceptingParent<PetData> schema={schema} initialValue={{ pet: { mode: 'strict', color: 'r' } }} log={log} />,
    );
    await user.selectOptions(elementOf(container, '#root_pet_mode'), ['0']);
    await user.selectOptions(elementOf(container, '#root_pet_color'), ['1']);
    await user.selectOptions(elementOf(container, '#root_pet_mode'), ['1']);
    expect(log.value?.pet.color).toBe('r');
  });

  it('judges a flip after a reset against the restored data (#5250)', async () => {
    interface FlipData {
      cond?: string;
      pick?: string;
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        cond: { type: 'string', enum: ['x', 'y'] },
        pick: { type: 'string' },
      },
      if: { properties: { cond: { const: 'x' } } },
      then: { properties: { pick: { enum: ['a', 'b'] } } },
      else: { properties: { pick: { enum: ['c', 'd'] } } },
    };
    const ref = createRef<FormRef<FlipData>>();
    const events: IChangeEvent<FlipData>[] = [];
    const { container } = render(
      <Form<FlipData>
        ref={ref}
        schema={schema}
        validator={validator}
        initialFormData={{ cond: 'x', pick: 'a' }}
        onChange={(event) => events.push(event)}
      />,
    );
    // Flip to the else branch: 'a' is outside its enum and clears
    await user.selectOptions(elementOf(container, '#root_cond'), ['1']);
    // The reset restores the initial data, which the next flip is judged against
    act(() => handleOf(ref).reset());
    // Flip again: judged against the restored data on the then branch, 'a' is a real difference and clears
    await user.selectOptions(elementOf(container, '#root_cond'), ['1']);
    const last = events[events.length - 1].formData;
    expect(last?.pick).toBeUndefined();
  });

  it('judges each edit against the data before it when a parent stores a copy of what onChange reports (#5250)', async () => {
    interface PetData {
      pet: { mode?: string; color?: string };
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        pet: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['open', 'strict'] },
            color: { type: 'string', enum: ['r', 'g'] },
          },
          allOf: [
            {
              if: { properties: { mode: { const: 'strict' } } },
              then: { properties: { color: { enum: ['r'] } } },
            },
          ],
        },
      },
    };
    const log = createParentLog<PetData>();
    // A store that clones on write: the form takes each copy as a new value, deep-equal to the data it holds
    const { container } = render(
      <TransformingParent<PetData>
        schema={schema}
        initialValue={{ pet: { mode: 'strict', color: 'r' } }}
        log={log}
        transform={(reported) => (reported === undefined ? reported : structuredClone(reported))}
      />,
    );
    await user.selectOptions(elementOf(container, '#root_pet_mode'), ['0']);
    await user.selectOptions(elementOf(container, '#root_pet_color'), ['1']);
    await user.selectOptions(elementOf(container, '#root_pet_mode'), ['1']);
    expect(log.value?.pet.color).toBe('r');
  });

  it('judges edits as usual after the parent changed the schema once (#5451)', async () => {
    interface PetData {
      pet: { mode?: string; color?: string };
    }
    const baseSchema: RJSFSchema = {
      type: 'object',
      properties: {
        pet: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['open', 'strict'] },
            color: { type: 'string', enum: ['r', 'g'] },
          },
          allOf: [
            {
              if: { properties: { mode: { const: 'strict' } } },
              then: { properties: { color: { enum: ['r'] } } },
            },
          ],
        },
      },
    };
    // The one swap adds an enum option; nothing about the conditional changes
    const widenedSchema: RJSFSchema = {
      type: 'object',
      properties: {
        pet: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['open', 'strict'] },
            color: { type: 'string', enum: ['r', 'g', 'b'] },
          },
          allOf: [
            {
              if: { properties: { mode: { const: 'strict' } } },
              then: { properties: { color: { enum: ['r'] } } },
            },
          ],
        },
      },
    };
    const log = createParentLog<PetData>();
    // A parent that widens the schema in the same update that stores the first edit, then stores edits as usual
    function SwappingOnceParent() {
      const [value, setValue] = useState<PetData | undefined>({ pet: { mode: 'strict', color: 'r' } });
      const [schema, setSchema] = useState<RJSFSchema>(baseSchema);
      Object.assign(log, { value });
      return (
        <Form<PetData>
          schema={schema}
          validator={validator}
          // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
          formData={value}
          onChange={(event) => {
            log.reported.push(event.formData);
            log.events.push(event);
            setValue(event.formData);
            setSchema(widenedSchema);
          }}
        />
      );
    }
    const { container } = render(<SwappingOnceParent />);
    await user.selectOptions(elementOf(container, '#root_pet_mode'), ['0']);
    await user.selectOptions(elementOf(container, '#root_pet_color'), ['1']);
    await user.selectOptions(elementOf(container, '#root_pet_mode'), ['1']);
    expect(log.value?.pet.color).toBe('r');
  });

  it('judges an edit against data setFieldValue set across a conditional branch (#5250)', async () => {
    interface ModeData {
      mode?: string;
      color?: string;
      colors?: string[];
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['basic', 'advanced'] },
        color: { type: 'string' },
        colors: { type: 'array', items: { type: 'string' } },
      },
      allOf: [
        {
          if: { properties: { mode: { const: 'advanced' } } },
          then: {
            properties: {
              color: { enum: ['r', 'g', 'b', 'c'] },
              colors: { items: { enum: ['r', 'g', 'b', 'c'] } },
            },
          },
          else: {
            properties: {
              color: { enum: ['r', 'g', 'b'] },
              colors: { items: { enum: ['r', 'g', 'b'] } },
            },
          },
        },
      ],
    };
    const events: IChangeEvent<ModeData>[] = [];
    const ref = createRef<FormRef<ModeData>>();
    const { container } = render(
      <Form<ModeData>
        ref={ref}
        schema={schema}
        validator={validator}
        initialFormData={{ mode: 'basic', colors: [] }}
        onChange={(event) => events.push(event)}
      />,
    );
    // Data from outside the form's fields, set on the advanced branch
    act(() => handleOf(ref).setFieldValue('', { mode: 'advanced', color: 'c', colors: ['c'] }));
    await user.selectOptions(elementOf(container, '#root_mode'), ['0']);
    const last = events[events.length - 1].formData;
    expect(last?.color).toBeUndefined();
    expect(last?.colors).toEqual([]);
  });

  it('keeps the surviving rows paired with their own previous values when a row is removed (#5451)', async () => {
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    interface PairData {
      note?: string;
      rows?: Row[];
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    const events: IChangeEvent<PairData>[] = [];
    const { container } = render(
      <Form<PairData>
        schema={schema}
        validator={validator}
        initialFormData={{
          rows: [
            { kind: 'x', tags: [null, null] },
            { kind: 'y', tags: [null, null] },
          ],
        }}
        onChange={(event) => events.push(event)}
      />,
    );
    // The surviving row is paired with its own previous value through the announced move, so its constraints did
    // not change and it keeps the placeholders its branch offers
    await user.click(elementOf(container, `#${buttonId('root_rows_0', 'remove')}`));
    await user.type(input(container, 'root_note'), 'n');
    const last = events[events.length - 1].formData;
    expect(last?.rows).toEqual([{ kind: 'y', tags: [null, null] }]);
  });

  it('pairs the surviving rows by the move only once when removing a row re-judges a sibling', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['single', 'multi'] },
        list: {
          type: 'array',
          items: {
            type: 'object',
            properties: { kind: { type: 'string', enum: ['x', 'y'] }, v: {} },
            if: { properties: { kind: { const: 'x' } } },
            then: { properties: { v: { enum: [1, 2] } } },
            else: { properties: { v: { type: 'string' } } },
          },
        },
      },
      if: { properties: { list: { maxItems: 2 } } },
      then: { properties: { mode: { enum: ['single'] } } },
    };
    const events: IChangeEvent[] = [];
    const { container } = render(
      <Form
        schema={schema}
        validator={validator}
        initialFormData={{
          mode: 'multi',
          list: [
            { kind: 'x', v: 1 },
            { kind: 'x', v: 2 },
            { kind: 'y', v: 's' },
          ],
        }}
        onChange={(event) => events.push(event)}
      />,
    );
    // Re-judging `mode` takes the loop a second round, which judges the rows against the tree the first round built
    await user.click(elementOf(container, `#${buttonId('root_list_0', 'remove')}`));
    expect(events[events.length - 1].formData).toEqual({
      mode: 'single',
      list: [
        { kind: 'x', v: 2 },
        { kind: 'y', v: 's' },
      ],
    });
  });

  it('keeps the surviving row paired with its own previous value when a parent stores each edit (#5451)', async () => {
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    interface PairData {
      note?: string;
      rows?: Row[];
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    const log = createParentLog<PairData>();
    const { container } = render(
      <AcceptingParent<PairData>
        schema={schema}
        initialValue={{
          rows: [
            { kind: 'x', tags: [null, null] },
            { kind: 'y', tags: [null, null] },
          ],
        }}
        log={log}
      />,
    );
    await user.click(elementOf(container, `#${buttonId('root_rows_0', 'remove')}`));
    await user.type(input(container, 'root_note'), 'n');
    expect(log.value?.rows).toEqual([{ kind: 'y', tags: [null, null] }]);
  });

  it('keeps the rows setFieldValue set whose constraints an edit does not change (#5451)', async () => {
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    interface PairData {
      note?: string;
      rows?: Row[];
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    const events: IChangeEvent<PairData>[] = [];
    const ref = createRef<FormRef<PairData>>();
    const { container } = render(
      <Form<PairData>
        ref={ref}
        schema={schema}
        validator={validator}
        initialFormData={{
          rows: [
            { kind: 'x', tags: [null, null] },
            { kind: 'y', tags: [null, null] },
            { kind: 'y', tags: [null, null] },
          ],
        }}
        onChange={(event) => events.push(event)}
      />,
    );
    // Data from outside the form's fields, which no sanitize runs on
    act(() =>
      handleOf(ref).setFieldValue('', {
        rows: [
          { kind: 'x', tags: [null, null] },
          { kind: 'x', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
        ],
      }),
    );
    await user.click(elementOf(container, `#${buttonId('root_rows_0', 'remove')}`));
    await user.type(input(container, 'root_note'), 'n');
    // The remove is paired by its announced move, so no row's constraints change and every placeholder stays
    expect(events[events.length - 1].formData.rows).toEqual([
      { kind: 'x', tags: [null, null] },
      { kind: 'y', tags: [null, null] },
      { kind: 'y', tags: [null, null] },
    ]);
  });

  it('keeps an added row paired with its own starting value on the next sibling edit (#5451)', async () => {
    interface Row {
      kind?: string;
      tags?: (string | null | undefined)[];
    }
    interface PairData {
      note?: string;
      rows?: Row[];
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    const events: IChangeEvent<PairData>[] = [];
    const { container } = render(
      <Form<PairData>
        schema={schema}
        validator={validator}
        initialFormData={{ rows: [{ kind: 'x', tags: [null, null] }] }}
        onChange={(event) => events.push(event)}
      />,
    );
    await user.click(elementOf(container, `#${buttonId('root_rows', 'add')}`));
    await user.type(input(container, 'root_note'), 'n');
    const last = events[events.length - 1].formData;
    expect(last?.rows).toEqual([{ kind: 'x', tags: [null, null] }, { tags: [undefined, undefined] }]);
  });

  it('replaces a value a schema the parent swapped in as it stored an edit rejects', async () => {
    interface SwapData {
      color?: string;
      name?: string;
    }
    const wideSchema: RJSFSchema = {
      type: 'object',
      properties: { color: { type: 'string', enum: ['r', 'g'] }, name: { type: 'string' } },
      allOf: [
        {
          if: { properties: { name: { const: 'z' } }, required: ['name'] },
          then: { properties: { extra: { type: 'string' } } },
        },
      ],
    };
    const narrowSchema: RJSFSchema = {
      type: 'object',
      properties: { color: { type: 'string', enum: ['r'] }, name: { type: 'string' } },
      allOf: [
        {
          if: { properties: { name: { const: 'z' } }, required: ['name'] },
          then: { properties: { extra: { type: 'string' } } },
        },
      ],
    };
    const events: IChangeEvent<SwapData>[] = [];
    // A parent that stores every edit and narrows color's enum in the same update that stores the first one
    function SwappingParent() {
      const [value, setValue] = useState<SwapData | undefined>({ color: 'g' });
      const [schema, setSchema] = useState<RJSFSchema>(wideSchema);
      return (
        <Form<SwapData>
          schema={schema}
          validator={validator}
          // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
          formData={value}
          onChange={(event) => {
            events.push(event);
            setValue(event.formData);
            setSchema(narrowSchema);
          }}
        />
      );
    }
    const { container } = render(<SwappingParent />);
    // The narrow schema arrives as the parent stores the first edit, and the form sanitizes the data it holds for the
    // new schema's tree, as it does for any schema change, so `color` takes the option left
    await user.type(input(container, 'root_name'), 'a');
    await user.type(input(container, 'root_name'), 'b');
    const last = events[events.length - 1].formData;
    expect(last).toEqual({ color: 'r', name: 'ab' });
  });

  it('judges each edit of a live-validated form', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['open', 'strict'] },
        color: { type: 'string', enum: ['r', 'g'] },
      },
      allOf: [
        {
          if: { properties: { mode: { const: 'strict' } } },
          then: { properties: { color: { enum: ['r'] } } },
        },
      ],
    };
    interface PetData {
      mode?: string;
      color?: string;
    }
    const log = createParentLog<PetData>();
    const { container } = render(
      <AcceptingParent<PetData>
        schema={schema}
        initialValue={{ mode: 'strict', color: 'r' }}
        log={log}
        liveValidate='onChange'
      />,
    );
    await user.selectOptions(elementOf(container, '#root_mode'), ['0']);
    await user.selectOptions(elementOf(container, '#root_color'), ['1']);
    // The flip back narrows color: 'g' cannot stand
    await user.selectOptions(elementOf(container, '#root_mode'), ['1']);
    expect(log.value?.color).toBe('r');
  });

  it('judges the second of two edits in one event against the data the first one left', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['open', 'strict'] },
        color: { type: 'string', enum: ['r', 'g'] },
      },
      allOf: [
        {
          if: { properties: { mode: { const: 'strict' } } },
          then: { properties: { color: { enum: ['r'] } } },
        },
      ],
    };
    interface PetData {
      mode?: string;
      color?: string;
    }
    const log = createParentLog<PetData>();
    const ref = createRef<FormRef<PetData> | null>();
    function StackedParent() {
      const [value, setValue] = useState<PetData | undefined>({ mode: 'strict', color: 'r' });
      Object.assign(log, { value });
      return (
        <Form<PetData>
          ref={ref}
          schema={schema}
          validator={validator}
          // oxlint-disable-next-line typescript/no-deprecated -- pins the v6 echo pattern, passing back what onChange reported as `formData`
          formData={value}
          onChange={(event) => {
            log?.reported.push(event.formData);
            log?.events.push(event);
            setValue(event.formData);
          }}
        />
      );
    }
    render(<StackedParent />);
    // Two edits in one event: the second is built on the first's pending proposal, which is what it is judged
    // against
    act(() => {
      handleOf(ref).setFieldValue('mode', 'open');
      handleOf(ref).setFieldValue('color', 'g');
    });
    // Flipping to strict narrows `color`, so 'g' goes
    act(() => handleOf(ref).setFieldValue('mode', 'strict'));
    expect(log.value).toEqual({ mode: 'strict', color: 'r' });
  });

  it('judges an edit against the value sent when an edit clears a field', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        color: { type: 'string', enum: ['r', 'g'] },
      },
      allOf: [
        {
          if: { properties: { note: { const: 'x' } }, required: ['note'] },
          then: { properties: { color: { enum: ['r'] } } },
        },
      ],
    };
    interface NoteData {
      note?: string;
      color?: string;
    }
    const log = createParentLog<NoteData>();
    const { container } = render(
      <AcceptingParent<NoteData> schema={schema} initialValue={{ note: 'x', color: 'g' }} log={log} />,
    );
    // Clearing the leaf copies the proposal, so the parent answers a value that is not the one the edit path
    // first built; the next edit is judged against that answered value
    await user.clear(input(container, 'root_note'));
    // The conditional is off while the note is clear; writing the note back flips it on and narrows `color`
    await user.type(input(container, 'root_note'), 'x');
    expect(log.value).toEqual({ note: 'x', color: 'r' });
  });

  it('judges a flipped row after an array write added another', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    const events: IChangeEvent<{ rows?: Row[] }>[] = [];
    const { container } = render(
      <Form<{ rows?: Row[] }>
        schema={schema}
        validator={validator}
        initialFormData={{ rows: [{ kind: 'x', tags: ['a', 'a'] }] }}
        onChange={(event) => events.push(event)}
      />,
    );
    // The kind flip narrows the row's tags, so the 'a' the y-branch rejects goes
    await user.click(elementOf(container, `#${buttonId('root_rows', 'add')}`));
    await user.selectOptions(elementOf(container, '#root_rows_0_kind'), ['1']);
    const last = events[events.length - 1].formData;
    expect(last?.rows?.[0]).toEqual({ kind: 'y', tags: [] });
  });

  it('judges a copied row the copy flips the constraints of, as it judges the row it copies', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        list: {
          type: 'array',
          items: { type: 'object', properties: { color: { type: 'string', enum: ['r', 'g'] } } },
        },
      },
      allOf: [
        {
          if: { properties: { list: { minItems: 2 } } },
          then: { properties: { list: { items: { properties: { color: { enum: ['r'] } } } } } },
        },
      ],
    };
    const events: IChangeEvent<{ list?: { color?: string }[] }>[] = [];
    const { container } = render(
      <Form<{ list?: { color?: string }[] }>
        schema={schema}
        validator={validator}
        uiSchema={{ list: { 'ui:options': { copyable: true } } }}
        initialFormData={{ list: [{ color: 'g' }] }}
        onChange={(event) => events.push(event)}
      />,
    );
    await user.click(elementOf(container, `#${buttonId('root_list_0', 'copy')}`));
    const last = events[events.length - 1].formData;
    expect(last).toEqual({ list: [{ color: 'r' }, { color: 'r' }] });
  });

  it('keeps each row paired with its own previous value across a reorder (#5451)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    interface PairData {
      note?: string;
      rows?: Row[];
    }
    const events: IChangeEvent<PairData>[] = [];
    const { container } = render(
      <Form<PairData>
        schema={schema}
        validator={validator}
        initialFormData={{
          rows: [
            { kind: 'x', tags: [null, null] },
            { kind: 'y', tags: [null, null] },
          ],
        }}
        onChange={(event) => events.push(event)}
      />,
    );
    // The reorder pairs each row with its own previous value through the announced move, so no row's constraints
    // change and both keep the placeholders their branches offer
    await user.click(elementOf(container, `#${buttonId('root_rows_1', 'moveUp')}`));
    await user.type(input(container, 'root_note'), 'n');
    const last = events[events.length - 1].formData;
    expect(last?.rows).toEqual([
      { kind: 'y', tags: [null, null] },
      { kind: 'x', tags: [null, null] },
    ]);
  });

  it('keeps the existing rows paired when a row is added and a sibling is edited (#5451)', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    interface PairData {
      note?: string;
      rows?: Row[];
    }
    const events: IChangeEvent<PairData>[] = [];
    const { container } = render(
      <Form<PairData>
        schema={schema}
        validator={validator}
        initialFormData={{ rows: [{ kind: 'x', tags: [null, null] }] }}
        onChange={(event) => events.push(event)}
      />,
    );
    // The first row is paired with its own previous value, so it keeps its placeholders, and the added row has no
    // previous value to be judged against
    await user.click(elementOf(container, `#${buttonId('root_rows', 'add')}`));
    await user.type(input(container, 'root_note'), 'n');
    const last = events[events.length - 1].formData;
    expect(last?.rows?.[0]).toEqual({ kind: 'x', tags: [null, null] });
    expect(last?.rows).toHaveLength(2);
  });

  it('judges a row flipping into the narrowed branch', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    const events: IChangeEvent<{ rows?: Row[] }>[] = [];
    const { container } = render(
      <Form<{ rows?: Row[] }>
        schema={schema}
        validator={validator}
        initialFormData={{}}
        onChange={(event) => events.push(event)}
      />,
    );
    // The flip into the y-branch narrows the tags, so the 'a' it rejects goes
    await user.click(elementOf(container, `#${buttonId('root_rows', 'add')}`));
    await user.selectOptions(elementOf(container, '#root_rows_0_kind'), ['0']);
    // The narrowed branch filters the placeholder items, so the 'a' goes in through an explicit add
    await user.click(elementOf(container, `#${buttonId('root_rows_0_tags', 'add')}`));
    await user.selectOptions(elementOf(container, '#root_rows_0_tags_0'), ['0']);
    await user.selectOptions(elementOf(container, '#root_rows_0_kind'), ['1']);
    const last = events[events.length - 1].formData;
    expect(last?.rows?.[0]?.tags).toEqual([]);
  });
  it('keeps each row paired with its own previous value when the parent sets a reorder back (#5451)', async () => {
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    interface PairData {
      note?: string;
      rows?: Row[];
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    const rows: Row[] = [
      { kind: 'x', tags: [null, null] },
      { kind: 'y', tags: [null, null] },
    ];
    const ref = createRef<FormRef<PairData>>();
    const { container } = render(
      <Form<PairData>
        ref={ref}
        schema={schema}
        validator={validator}
        initialFormData={{ rows }}
        // A parent that declines any change to the leading row's kind by setting the rows back
        onChange={({ formData }) => {
          if (formData.rows?.[0]?.kind !== 'x') {
            handleOf(ref).setFieldValue('rows', rows);
          }
        }}
      />,
    );
    // The reorder is declined, so the sibling edit is judged against the rows as the parent kept them, and both
    // rows keep the placeholders their branches offer
    await user.click(elementOf(container, `#${buttonId('root_rows_0', 'moveDown')}`));
    await user.type(input(container, 'root_note'), 'n');
    expect(handleOf(ref).getFormData().rows).toEqual([
      { kind: 'x', tags: [null, null] },
      { kind: 'y', tags: [null, null] },
    ]);
  });

  it('judges a row an edit inside it leaves equal to another row by its own previous value', async () => {
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    const ref = createRef<FormRef<{ rows?: Row[] }>>();
    const { container } = render(
      <Form<{ rows?: Row[] }>
        ref={ref}
        schema={schema}
        validator={validator}
        initialFormData={{
          rows: [
            { kind: 'x', tags: [null, null] },
            { kind: 'y', tags: [null, null] },
          ],
        }}
      />,
    );

    await user.selectOptions(elementOf(container, '#root_rows_0_kind'), 'y');

    // The first row's kind changed, so its tags are judged, though the row now holds what the second one does
    expect(handleOf(ref).getFormData().rows).toEqual([
      { kind: 'y', tags: [] },
      { kind: 'y', tags: [null, null] },
    ]);
  });

  it('leaves a row setFieldValue added as it is (#5451)', async () => {
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    interface PairData {
      note?: string;
      rows?: Row[];
    }
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        note: { type: 'string' },
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['x', 'y'] },
              tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
            },
            allOf: [
              {
                if: { properties: { kind: { const: 'x' } } },
                then: { properties: { tags: { items: { enum: ['a'] } } } },
              },
              {
                if: { properties: { kind: { const: 'y' } } },
                then: { properties: { tags: { items: { enum: ['b'] } } } },
              },
            ],
          },
        },
      },
    };
    const ref = createRef<FormRef<PairData>>();
    let appended = false;
    const { container } = render(
      <Form<PairData>
        ref={ref}
        schema={schema}
        validator={validator}
        initialFormData={{
          rows: [
            { kind: 'x', tags: [null, null] },
            { kind: 'y', tags: [null, null] },
          ],
        }}
        // A parent that appends a row of its own on the first note edit
        onChange={({ formData }) => {
          if (!appended && formData.note !== undefined) {
            appended = true;
            handleOf(ref).setFieldValue('rows', [...(formData.rows ?? []), { kind: 'y', tags: ['a', 'a'] }]);
          }
        }}
      />,
    );
    await user.type(input(container, 'root_note'), 'n');
    await user.click(elementOf(container, `#${buttonId('root_rows_0', 'remove')}`));
    await user.type(input(container, 'root_note'), 'n');
    const { rows } = handleOf(ref).getFormData();
    // The row `setFieldValue()` added is taken as written, and no edit changes its constraints, so it keeps the tags its
    // branch rejects for validation to report
    expect(rows?.[1]).toEqual({ kind: 'y', tags: ['a', 'a'] });
  });

  it('leaves a root-level row setFieldValue added as it is (#5451)', async () => {
    interface Row {
      kind?: string;
      note?: string;
      tags?: (string | null)[];
    }
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['x', 'y'] },
          note: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
        },
        allOf: [
          {
            if: { properties: { kind: { const: 'x' } } },
            then: { properties: { tags: { items: { enum: ['a'] } } } },
          },
          {
            if: { properties: { kind: { const: 'y' } } },
            then: { properties: { tags: { items: { enum: ['b'] } } } },
          },
        ],
      },
    };
    const ref = createRef<FormRef<Row[]>>();
    let appended = false;
    const { container } = render(
      <Form<Row[]>
        ref={ref}
        schema={schema}
        validator={validator}
        initialFormData={[
          { kind: 'x', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
        ]}
        // A parent that appends a row of its own on the first note edit
        onChange={({ formData }) => {
          if (!appended && formData[0]?.note !== undefined) {
            appended = true;
            handleOf(ref).setFieldValue('', [...formData, { kind: 'y', tags: ['a', 'a'] }]);
          }
        }}
      />,
    );
    await user.type(input(container, 'root_0_note'), 'n');
    await user.click(elementOf(container, `#${buttonId('root_0', 'remove')}`));
    await user.type(input(container, 'root_0_note'), 'n');
    const rows = handleOf(ref).getFormData();
    // The row `setFieldValue()` added is taken as written, and no edit changes its constraints, so it keeps the tags its
    // branch rejects for validation to report
    expect(rows?.[1]).toEqual({ kind: 'y', tags: ['a', 'a'] });
  });

  it('keeps each row paired with its own previous value across a reorder at the document root (#5451)', async () => {
    interface Row {
      kind?: string;
      note?: string;
      tags?: (string | null)[];
    }
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: ['x', 'y'] },
          note: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' }, minItems: 2 },
        },
        allOf: [
          {
            if: { properties: { kind: { const: 'x' } } },
            then: { properties: { tags: { items: { enum: ['a'] } } } },
          },
          {
            if: { properties: { kind: { const: 'y' } } },
            then: { properties: { tags: { items: { enum: ['b'] } } } },
          },
        ],
      },
    };
    const events: IChangeEvent<Row[]>[] = [];
    const { container } = render(
      <Form<Row[]>
        schema={schema}
        validator={validator}
        initialFormData={[
          { kind: 'x', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
        ]}
        onChange={(event) => events.push(event)}
      />,
    );
    await user.click(elementOf(container, `#${buttonId('root_0', 'moveDown')}`));
    await user.type(input(container, 'root_0_note'), 'n');
    const last = events[events.length - 1].formData;
    expect(last?.[0]?.kind).toBe('y');
    expect(last?.[0]?.tags).toEqual([null, null]);
    expect(last?.[1]?.kind).toBe('x');
    expect(last?.[1]?.tags).toEqual([null, null]);
  });

  it('keeps an array its unchanged const rejects when a conditional elsewhere flips', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['a', 'b'] },
        fixed: { type: 'array', items: { type: 'string' }, const: ['a', 'b'] },
      },
      if: { properties: { kind: { const: 'b' } } },
      then: { properties: { note: { type: 'string' } } },
    };
    const events: IChangeEvent<{ kind?: string; fixed?: string[] }>[] = [];
    const { container } = render(
      <Form<{ kind?: string; fixed?: string[] }>
        schema={schema}
        validator={validator}
        defaultFormStateBehavior={{ constAsDefaults: 'never' }}
        initialFormData={{ kind: 'a', fixed: ['x'] }}
        onChange={(event) => events.push(event)}
      />,
    );
    await user.selectOptions(elementOf(container, '#root_kind'), 'b');
    expect(events[events.length - 1].formData).toEqual({ kind: 'b', fixed: ['x'] });
  });

  it.each([
    { spelling: 'inline', options: (one: RJSFSchema, two: RJSFSchema) => [one, two] },
    {
      spelling: 'as $refs',
      options: () => [{ $ref: '#/definitions/one' }, { $ref: '#/definitions/two' }],
    },
  ])(
    'keeps the constant a select offers with its options $spelling, whatever its conditionals default',
    async ({ options }) => {
      const one: RJSFSchema = { title: 'One', const: { x: 1, y: { z: 'a' } } };
      const two: RJSFSchema = { title: 'Two', const: { x: 2, y: { z: 'a' } } };
      const schema: RJSFSchema = {
        type: 'object',
        definitions: { one, two },
        properties: {
          sel: {
            type: 'object',
            properties: { x: { type: 'number' }, y: { type: 'object', properties: { z: { type: 'string' } } } },
            if: { properties: { x: { const: 1 } } },
            then: { properties: { y: { default: { z: 'a' } } } },
            else: { properties: { y: { default: { z: 'b' } } } },
            oneOf: options(one, two),
          },
        },
      };
      const events: IChangeEvent<{ sel?: unknown }>[] = [];
      const { container } = render(
        <Form<{ sel?: unknown }>
          schema={schema}
          validator={validator}
          initialFormData={{ sel: { x: 1, y: { z: 'a' } } }}
          onChange={(event) => events.push(event)}
        />,
      );

      await user.selectOptions(elementOf(container, '#root_sel'), 'Two');

      expect(events[events.length - 1].formData).toEqual({ sel: { x: 2, y: { z: 'a' } } });
    },
  );

  it('keeps a prefix item an edit elsewhere in its array leads its new entry to reject, rather than shifting the rest', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        list: { type: 'array', prefixItems: [{ type: 'string', enum: ['a', 'b'] }], items: { type: 'string' } },
      },
      if: { properties: { list: { contains: { const: 'x' } } } },
      then: { properties: { list: { prefixItems: [{ type: 'string', enum: ['a'] }] } } },
    };
    const events: IChangeEvent[] = [];
    const { container } = render(
      <Form
        schema={schema}
        validator={validator}
        initialFormData={{ list: ['b', 'y', 'z'] }}
        onChange={(event) => events.push(event)}
      />,
    );

    await user.clear(input(container, 'root_list_2'));
    await user.type(input(container, 'root_list_2'), 'x');

    expect(events[events.length - 1].formData).toEqual({ list: ['b', 'y', 'x'] });
  });

  describe('a schema change', () => {
    const colorSchema = (colors: string[]): RJSFSchema => ({
      type: 'object',
      definitions: { Color: { type: 'string', enum: colors } },
      properties: { color: { $ref: '#/definitions/Color' }, unrelated: { type: 'string' } },
    });

    it('sanitizes a self-owned form for the new schema as it arrives', () => {
      const ref = createRef<FormRef<{ color?: string; unrelated?: string }>>();
      const props = { validator, initialFormData: { color: 'b' } };
      const { rerender } = render(<Form ref={ref} schema={colorSchema(['a', 'b'])} {...props} />);

      rerender(<Form ref={ref} schema={colorSchema(['a'])} {...props} />);

      expect(ref.current?.getFormData()).toEqual({ color: 'a' });
    });

    it.each([
      { state: 'disabled', flags: { disabled: true } },
      { state: 'readonly', flags: { readonly: true } },
    ])('leaves the value of a $state self-owned form to it as the new schema arrives, as an edit does', ({ flags }) => {
      const ref = createRef<FormRef<{ color?: string; unrelated?: string }>>();
      const props = { validator, initialFormData: { color: 'b' }, ...flags };
      const { rerender } = render(<Form ref={ref} schema={colorSchema(['a', 'b'])} {...props} />);

      rerender(<Form ref={ref} schema={colorSchema(['a'])} {...props} />);

      expect(ref.current?.getFormData()).toEqual({ color: 'b' });
    });

    it.each([
      { from: ['string', 'number'], to: ['number', 'string', 'number'], expected: { v: 'a' }, outcome: 'keeps' },
      { from: ['string', 'string'], to: ['string', 'number'], expected: {}, outcome: 'drops' },
    ])('$outcome a value whose type list changes from $from to $to', ({ from, to, expected }) => {
      const typed = (type: string[]): RJSFSchema => ({ type: 'object', properties: { v: { type } as RJSFSchema } });
      const ref = createRef<FormRef>();
      const props = { validator, initialFormData: { v: 'a' } };
      const { rerender } = render(<Form ref={ref} schema={typed(from)} {...props} />);

      rerender(<Form ref={ref} schema={typed(to)} {...props} />);

      expect(ref.current?.getFormData()).toStrictEqual(expected);
    });

    it('keeps a clear whose type list is only reordered, rather than refilling its default', () => {
      const typed = (type: string[]): RJSFSchema => ({
        type: 'object',
        properties: { v: { type, default: 'd' } as RJSFSchema },
      });
      const ref = createRef<FormRef>();
      const props = { validator, initialFormData: { v: undefined } };
      const { rerender } = render(<Form ref={ref} schema={typed(['string', 'null'])} {...props} />);

      rerender(<Form ref={ref} schema={typed(['null', 'string'])} {...props} />);

      expect(ref.current?.getFormData()).toStrictEqual({ v: undefined });
    });

    describe('of an array whose items prefixItems describe by position', () => {
      const listSchema = (prefix: RJSFSchema, rest: string[]): RJSFSchema => ({
        type: 'object',
        properties: { list: { type: 'array', prefixItems: [prefix], items: { type: 'string', enum: rest } } },
      });

      it('judges a prefix item by its own prefixItems entry, rather than dropping it and shifting the next', () => {
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: [1, 'a', 'b'] } };
        const { rerender } = render(<Form ref={ref} schema={listSchema({ type: 'number' }, ['a', 'b'])} {...props} />);

        rerender(<Form ref={ref} schema={listSchema({ type: 'number' }, ['a'])} {...props} />);

        expect(ref.current?.getFormData()).toEqual({ list: [1, 'a'] });
      });

      it.each([
        { data: ['b', 'a'], expected: {}, outcome: 'drops the array holding' },
        { data: [undefined, 'a'], expected: { list: [undefined, 'a'] }, outcome: 'keeps an unfilled' },
      ])('$outcome a prefix item the new entry rejects', ({ data, expected }) => {
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: data } };
        const prefix = (values: string[]): RJSFSchema => ({ type: 'string', enum: values });
        const { rerender } = render(<Form ref={ref} schema={listSchema(prefix(['a', 'b']), ['a'])} {...props} />);

        rerender(<Form ref={ref} schema={listSchema(prefix(['a']), ['a'])} {...props} />);

        expect(ref.current?.getFormData()).toStrictEqual(expected);
      });

      it.each([
        { data: ['a', 'b'], expected: {}, outcome: 'drops the array where an item' },
        { data: ['a'], expected: { list: ['a'] }, outcome: 'keeps the array where no item' },
      ])('$outcome reaches the new false, as sanitizeDataForNewSchema() does', ({ data, expected }) => {
        const closed = (rest: RJSFSchema | false): RJSFSchema => ({
          type: 'object',
          properties: { list: { type: 'array', prefixItems: [{ type: 'string' }], items: rest } },
        });
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: data } };
        const { rerender } = render(<Form ref={ref} schema={closed({ type: 'string' })} {...props} />);

        rerender(<Form ref={ref} schema={closed(false)} {...props} />);

        expect(ref.current?.getFormData()).toStrictEqual(expected);
      });

      // An option's `default` decides no item's validity, so the item already failed the old entry
      it('keeps a rejected prefix item whose option only changes its default, as sanitizeDataForNewSchema() does', () => {
        const prefix = (a: number): RJSFSchema => ({
          type: 'object',
          const: { a: 1 },
          properties: { a: { type: 'number' } },
          oneOf: [{ default: { a } }],
        });
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: [{ a: 2 }, 'a'] } };
        const { rerender } = render(<Form ref={ref} schema={listSchema(prefix(1), ['a'])} {...props} />);

        rerender(<Form ref={ref} schema={listSchema(prefix(3), ['a'])} {...props} />);

        expect(ref.current?.getFormData()).toStrictEqual({ list: [{ a: 2 }, 'a'] });
      });

      it('keeps an unfilled prefix item at a position the new prefixItems close, as sanitizeDataForNewSchema() does', () => {
        const prefixed = (second: RJSFSchema | false): RJSFSchema => ({
          type: 'object',
          properties: { list: { type: 'array', prefixItems: [{ type: 'string' }, second] } },
        });
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: ['a', undefined] } };
        const { rerender } = render(<Form ref={ref} schema={prefixed({ type: 'string' })} {...props} />);

        rerender(<Form ref={ref} schema={prefixed(false)} {...props} />);

        expect(ref.current?.getFormData()).toStrictEqual({ list: ['a', undefined] });
      });

      it.each([
        { rest: { type: 'string' } as RJSFSchema, cutOff: 'a rejected prefix item' },
        { rest: false as const, cutOff: 'an item past a closed tuple' },
      ])('trims $cutOff that a new maxItems cuts off, as sanitizeDataForNewSchema() does', ({ rest }) => {
        const bounded = (maxItems: number | undefined, values: string[], items: RJSFSchema | false): RJSFSchema => ({
          type: 'object',
          properties: {
            list: {
              type: 'array',
              maxItems,
              prefixItems: [{ type: 'string' }, { type: 'string', enum: values }],
              items,
            },
          },
        });
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: ['x', 'b', 'c'] } };
        const { rerender } = render(
          <Form ref={ref} schema={bounded(undefined, ['b'], { type: 'string' })} {...props} />,
        );

        rerender(<Form ref={ref} schema={bounded(1, ['a'], rest)} {...props} />);

        expect(ref.current?.getFormData()).toStrictEqual({ list: ['x'] });
      });

      it('keeps an array already longer than an unchanged maxItems whose item past it is rejected', () => {
        const bounded = (values: string[]): RJSFSchema => ({
          type: 'object',
          properties: {
            list: {
              type: 'array',
              maxItems: 1,
              prefixItems: [{ type: 'string' }, { type: 'string', enum: values }],
              items: { type: 'string' },
            },
          },
        });
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: ['x', 'b'] } };
        const { rerender } = render(<Form ref={ref} schema={bounded(['b'])} {...props} />);

        rerender(<Form ref={ref} schema={bounded(['a'])} {...props} />);

        expect(ref.current?.getFormData()).toStrictEqual({ list: ['x', 'b'] });
      });

      it('keeps the items past a closed tuple the new schema opens', () => {
        const tuple = (rest: RJSFSchema | false): RJSFSchema => ({
          type: 'object',
          properties: { list: { type: 'array', prefixItems: [{ type: 'string' }], items: rest } },
        });
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: ['a', 'b'] } };
        const { rerender } = render(<Form ref={ref} schema={tuple(false)} {...props} />);

        rerender(<Form ref={ref} schema={tuple({ type: 'string' })} {...props} />);

        expect(ref.current?.getFormData()).toStrictEqual({ list: ['a', 'b'] });
      });

      it('keeps a prefix item both schemas reject alike where only its default changes, rather than clearing the array', () => {
        const withDefault = (value: string): RJSFSchema => ({
          type: 'object',
          properties: {
            list: {
              type: 'array',
              prefixItems: [{ type: 'string', enum: ['a', 'b'], default: value }],
              items: { type: 'string' },
            },
          },
        });
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: ['x', 'y'] } };
        const { rerender } = render(<Form ref={ref} schema={withDefault('a')} {...props} />);

        rerender(<Form ref={ref} schema={withDefault('b')} {...props} />);

        expect(ref.current?.getFormData()).toStrictEqual({ list: ['x', 'y'] });
      });

      it('keeps an inner array as it is where the new entry rejects its prefix item, as sanitizeDataForNewSchema() does', () => {
        const nested = (values: string[]): RJSFSchema => ({
          type: 'object',
          properties: {
            list: {
              type: 'array',
              prefixItems: [{ type: 'array', prefixItems: [{ type: 'string', enum: values }] }],
            },
          },
        });
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData: { list: [['b']] } };
        const { rerender } = render(<Form ref={ref} schema={nested(['a', 'b'])} {...props} />);

        rerender(<Form ref={ref} schema={nested(['a'])} {...props} />);

        expect(ref.current?.getFormData()).toStrictEqual({ list: [['b']] });
      });
    });

    it.each(['__proto__', 'toString'])(
      'keeps the value of a property named %s when the default its parent declared for it goes',
      (key) => {
        const schemaWithDefault = (parentDefault: string) => {
          const schema: RJSFSchema = JSON.parse(
            `{"type":"object","properties":{"p":{"type":"object","default":${parentDefault},"properties":{"${key}":{"type":"object","properties":{"x":{"type":"string"}}},"y":{"type":"string"}}}}}`,
          );
          return schema;
        };
        const initialFormData: unknown = JSON.parse(`{"p":{"${key}":{"x":"d"},"y":"z"}}`);
        const ref = createRef<FormRef>();
        const props = { validator, initialFormData };
        const { rerender } = render(<Form ref={ref} schema={schemaWithDefault(`{"${key}":{"x":"d"}}`)} {...props} />);

        rerender(<Form ref={ref} schema={schemaWithDefault('{}')} {...props} />);

        const p: unknown = getByPath(ref.current?.getFormData(), 'p');
        expect(p).toEqual(JSON.parse(`{"${key}":{"x":"d"},"y":"z"}`));
        expect(Object.getPrototypeOf(p)).toBe(Object.prototype);
      },
    );
  });
});

describe('sanitizing an array as sanitizeDataForNewSchema() does (#5786)', () => {
  const ABSENT = Symbol('absent');
  const typedItems = (type: 'string' | 'number' | 'integer'): RJSFSchema => ({ type: 'array', items: { type } });
  const prefix = (...prefixItems: (RJSFSchema | boolean)[]): RJSFSchema => ({ type: 'array', prefixItems });
  const TYPE_LISTS_NAMING_ARRAY: RJSFSchema['type'][] = [
    ['object', 'array'],
    ['string', 'array'],
    ['array', 'object'],
  ];
  it.each<{
    name: string;
    from: RJSFSchema;
    to: RJSFSchema;
    data: unknown[];
    expected: unknown;
    formExpected?: unknown;
    behavior?: DefaultFormStateBehavior;
  }>([
    {
      name: 'keeps the items at a position that now declares nothing',
      from: typedItems('string'),
      to: { type: 'array' },
      data: ['a', 'b'],
      expected: ['a', 'b'],
    },
    {
      name: 'keeps the items past a prefix with no items after it',
      from: typedItems('string'),
      to: prefix({ type: 'string' }),
      data: ['a', 'b'],
      expected: ['a', 'b'],
    },
    {
      name: 'keeps the items whose position now also allows null',
      from: typedItems('string'),
      to: { type: 'array', items: { type: ['string', 'null'] } },
      data: ['a', 'b'],
      expected: ['a', 'b'],
    },
    {
      name: 'keeps the items whose type widens from integer to number',
      from: typedItems('integer'),
      to: typedItems('number'),
      data: [1, 2],
      expected: [1, 2],
    },
    {
      name: 'keeps a prefix item whose type widens from integer to number',
      from: prefix({ type: 'integer' }),
      to: prefix({ type: 'number' }),
      data: [1],
      expected: [1],
    },
    {
      name: 'keeps the items whose type widens from integer to a list naming number',
      from: typedItems('integer'),
      to: { type: 'array', items: { type: ['number', 'null'] } },
      data: [1],
      expected: [1],
    },
    {
      name: 'drops the items whose type narrows from number to integer, as any type change does',
      from: typedItems('number'),
      to: typedItems('integer'),
      data: [1, 1.5],
      expected: [],
    },
    {
      name: 'drops each item past the prefix whose type changed, keeping the array',
      from: typedItems('number'),
      to: typedItems('string'),
      data: [1, 2],
      expected: [],
    },
    {
      name: 'drops the items past the prefix whose type changed, keeping the prefix',
      from: { type: 'array', prefixItems: [{ type: 'string' }], items: { type: 'number' } },
      to: { type: 'array', prefixItems: [{ type: 'string' }], items: { type: 'string' } },
      data: ['a', 1, 2],
      expected: ['a'],
    },
    {
      // `Form` renders an array declaring no type as unsupported, so it doesn't read the old items without their types
      name: 'differs on an old array declaring no type: utils keeps the items, Form removes the array',
      from: { prefixItems: [{ type: 'number', enum: ['a'] }] },
      to: prefix({ type: 'string', enum: ['a'] }),
      data: ['b'],
      expected: ['b'],
      formExpected: ABSENT,
    },
    {
      // `Form` judges no field whose constraints didn't change, and utils checks a scalar item as a scalar property is
      name: 'differs on an unchanged scalar const: Form keeps the item it rejects, utils drops it',
      from: { type: 'array', title: 'Old', items: { type: 'string', const: 'a' } },
      to: { type: 'array', title: 'New', items: { type: 'string', const: 'a' } },
      data: ['b', 'a'],
      expected: ['a'],
      formExpected: ['b', 'a'],
    },
    {
      name: 'keeps a prefix item whose position becomes true',
      from: prefix({ type: 'string' }),
      to: prefix(true),
      data: ['a'],
      expected: ['a'],
    },
    {
      name: 'keeps a prefix item whose position becomes {}',
      from: prefix({ type: 'string' }),
      to: prefix({}),
      data: ['a'],
      expected: ['a'],
    },
    {
      name: 'clears the array where the new schema rejects a prefix item an old false position held',
      from: prefix(false),
      to: prefix({ enum: ['x'] }),
      data: ['y'],
      expected: ABSENT,
    },
    {
      name: 'keeps a prefix item whose selected option changed, which neither looks inside',
      from: prefix({ anyOf: [{ type: 'string', enum: ['a'] }, { type: 'number' }] }),
      to: prefix({ anyOf: [{ type: 'string', enum: ['b'] }, { type: 'number' }] }),
      data: ['a'],
      expected: ['a'],
    },
    {
      name: 'keeps the items past an unchanged maxItems, for validation to report',
      from: { type: 'array', title: 'Old', maxItems: 1, items: { type: 'string' } },
      to: { type: 'array', title: 'New', maxItems: 1, items: { type: 'string' } },
      data: ['a', 'b'],
      expected: ['a', 'b'],
    },
    {
      name: 'keeps a prefix item past an unchanged maxItems the new schema rejects, for validation to report',
      from: { type: 'array', maxItems: 1, prefixItems: [{ type: 'string' }, { type: 'string', enum: ['b'] }] },
      to: { type: 'array', maxItems: 1, prefixItems: [{ type: 'string' }, { type: 'string', enum: ['a'] }] },
      data: ['x', 'b'],
      expected: ['x', 'b'],
    },
    {
      name: 'keeps a prefix item past an unchanged maxItems whose position changes type, for validation to report',
      from: { type: 'array', maxItems: 1, prefixItems: [{ type: 'string' }, { type: 'string' }] },
      to: { type: 'array', maxItems: 1, prefixItems: [{ type: 'string' }, { type: 'number' }] },
      data: ['x', 'b'],
      expected: ['x', 'b'],
    },
    {
      name: 'keeps an item past an unchanged maxItems at a position the new schema closes, for validation to report',
      from: { type: 'array', maxItems: 1, prefixItems: [{ type: 'string' }], items: { type: 'string' } },
      to: { type: 'array', maxItems: 1, prefixItems: [{ type: 'string' }], items: false },
      data: ['x', 'b'],
      expected: ['x', 'b'],
    },
    {
      name: 'clears the array where the new schema rejects a prefix item the old one declared no items for',
      from: { type: 'array' },
      to: prefix({ type: 'string', enum: ['a'] }),
      data: ['b', 'c'],
      expected: ABSENT,
    },
    {
      name: 'clears the array where the new schema rejects a tuple item an old true items held',
      from: { type: 'array', items: true },
      to: { type: 'array', items: [{ enum: ['a'] }] },
      data: ['b'],
      expected: ABSENT,
      // The defaults fill the cleared tuple with a hole at each position
      formExpected: [undefined],
    },
    {
      name: 'drops an item past the prefix the new schema rejects where the old one declared no items',
      from: { type: 'array' },
      to: { type: 'array', items: { enum: ['a'] } },
      data: ['b', 'a'],
      expected: ['a'],
    },
    {
      // utils leaves the row for the defaults, which `Form` and an option switch fill
      name: 'empties a null item for the new default to fill, where its position changes and allows no null',
      from: typedItems('number'),
      to: { type: 'array', items: { type: 'string', default: 'x' } },
      data: [null],
      expected: [undefined],
      formExpected: ['x'],
    },
    {
      // utils leaves the row for the defaults, which `Form` and an option switch fill
      name: 'empties a null item holding its old null default for the new default to fill, where its position allows no null',
      from: { type: 'array', items: { type: 'string', default: null } },
      to: { type: 'array', items: { type: 'string', default: 'y' } },
      data: [null, 'q'],
      expected: [undefined, 'q'],
      formExpected: ['y', 'q'],
    },
    {
      name: 'prunes an object item whose new type list names object beside another type',
      from: { type: 'array', items: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } } } },
      to: { type: 'array', items: { type: ['string', 'object'], properties: { a: { type: 'number' } } } },
      data: [{ a: 1, b: 2 }],
      expected: [{ a: 1 }],
    },
    {
      name: 'prunes an object prefix item whose new type list names object beside another type',
      from: prefix({ type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } } }),
      to: prefix({ type: ['string', 'object'], properties: { a: { type: 'number' } } }),
      data: [{ a: 1, b: 2 }],
      expected: [{ a: 1 }],
    },
    {
      name: 'prunes an object item whose new type list names object after array',
      from: { type: 'array', items: { type: 'object', properties: { a: {}, b: {} } } },
      to: { type: 'array', items: { type: ['array', 'object'], properties: { a: {} } } },
      data: [{ a: 1, b: 2 }],
      expected: [{ a: 1 }],
    },
    {
      // utils leaves the hole for the defaults, which `Form` and an option switch fill
      name: 'keeps a hole under a type list naming object beside a type it renders first',
      from: {
        type: 'array',
        title: 'Old',
        items: { type: ['string', 'object'], properties: { a: { type: 'number' } } },
      },
      to: {
        type: 'array',
        title: 'New',
        items: { type: ['string', 'object'], properties: { a: { type: 'number' } }, default: 'z' },
      },
      data: ['a', undefined, 'b'],
      expected: ['a', undefined, 'b'],
      formExpected: ['a', 'z', 'b'],
    },
    {
      name: 'keeps a hole under a type list it renders as an object',
      from: { type: 'array', items: { type: ['object', 'string'], properties: { a: {}, b: {} } } },
      to: { type: 'array', items: { type: ['object', 'string'], properties: { a: {} } } },
      data: ['a', undefined, 'b'],
      expected: ['a', undefined, 'b'],
      formExpected: ['a', {}, 'b'],
    },
    {
      name: 'keeps a hole under a type list it renders as an array',
      from: { type: 'array', items: { type: ['array', 'string'], items: { type: 'number' } } },
      to: { type: 'array', items: { type: ['array', 'string'], items: { type: 'number' }, title: 'New' } },
      data: ['a', undefined, 'b'],
      expected: ['a', undefined, 'b'],
    },
    {
      name: 'keeps a hole under array items',
      from: { type: 'array', title: 'Old', items: { type: 'array', items: { type: 'number' } } },
      to: { type: 'array', title: 'New', items: { type: 'array', items: { type: 'number' } } },
      data: [[1], undefined, [2]],
      expected: [[1], undefined, [2]],
    },
    {
      name: 'keeps a hole under enum items',
      from: { type: 'array', title: 'Old', items: { type: 'string', enum: ['a'] } },
      to: { type: 'array', title: 'New', items: { type: 'string', enum: ['a'] } },
      data: ['a', undefined, 'a'],
      expected: ['a', undefined, 'a'],
    },
    {
      name: 'keeps an array item under a type list naming object first',
      from: {
        type: 'array',
        title: 'Old',
        items: { type: ['object', 'array'], properties: { a: {} }, items: { type: 'number' } },
      },
      to: {
        type: 'array',
        title: 'New',
        items: { type: ['object', 'array'], properties: { a: {} }, items: { type: 'number' } },
      },
      data: [[1, 2]],
      expected: [[1, 2]],
    },
    {
      name: 'keeps an array item under a type list naming array first',
      from: {
        type: 'array',
        title: 'Old',
        items: { type: ['array', 'object'], properties: { a: {} }, items: { type: 'number' } },
      },
      to: {
        type: 'array',
        title: 'New',
        items: { type: ['array', 'object'], properties: { a: {} }, items: { type: 'number' } },
      },
      data: [[1, 2]],
      expected: [[1, 2]],
    },
    {
      name: 'keeps an array item whose items become a type list naming object and array',
      from: { type: 'array', items: { type: 'object', properties: { a: {} } } },
      to: { type: 'array', items: { type: ['object', 'array'], properties: { a: {} }, items: { type: 'number' } } },
      data: [[1, 2]],
      expected: [[1, 2]],
    },
    ...TYPE_LISTS_NAMING_ARRAY.map((type) => ({
      name: `sanitizes an array item under ${JSON.stringify(type)} items as an array`,
      from: { type: 'array', items: { type, properties: { a: {} }, items: { type: 'string' } } } satisfies RJSFSchema,
      to: { type: 'array', items: { type, properties: { a: {} }, items: { type: 'number' } } } satisfies RJSFSchema,
      data: [['a', 'b']],
      expected: [[]],
    })),
    {
      name: 'sanitizes an array item as an array where its items become a type list naming object first',
      from: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
      to: { type: 'array', items: { type: ['object', 'array'], properties: { a: {} }, items: { type: 'number' } } },
      data: [['x']],
      expected: [[]],
    },
    {
      name: 'swaps the old default of a scalar item for the new one',
      from: { type: 'array', items: { type: 'string', default: 'x' } },
      to: { type: 'array', items: { type: 'string', default: 'y' } },
      data: ['x', 'q'],
      expected: ['y', 'q'],
    },
    {
      name: 'swaps the old default of a prefix item for the new one',
      from: prefix({ type: 'string', default: 'x' }),
      to: prefix({ type: 'string', default: 'y' }),
      data: ['x', 'q'],
      expected: ['y', 'q'],
    },
    {
      name: 'swaps the old default of an array item for the new one',
      from: { type: 'array', items: { type: 'array', items: { type: 'string' }, default: ['x'] } },
      to: { type: 'array', items: { type: 'array', items: { type: 'string' }, default: ['y'] } },
      data: [['x'], ['q']],
      expected: [['y'], ['q']],
    },
    {
      name: 'swaps an item holding an old null default for the new one (#5815)',
      from: { type: 'array', items: { type: ['string', 'null'], default: null } },
      to: { type: 'array', items: { type: ['string', 'null'], default: 'y' } },
      data: [null, 'q'],
      expected: ['y', 'q'],
    },
    {
      name: 'swaps an item holding the old default for a new null one (#5815)',
      from: { type: 'array', items: { type: ['string', 'null'], default: 'x' } },
      to: { type: 'array', items: { type: ['string', 'null'], default: null } },
      data: ['x', 'q'],
      expected: [null, 'q'],
    },
    {
      // An item's default is read as the fill reads it, an `anyOf`/`oneOf` option's included, as a property's is
      name: "swaps an item holding its option's old default for the new one",
      from: { type: 'array', items: { type: 'string', oneOf: [{ default: 'x' }] } },
      to: { type: 'array', items: { type: 'string', oneOf: [{ default: 'y' }] } },
      data: ['x', 'q'],
      expected: ['y', 'q'],
    },
    {
      name: "empties a null item for its option's new default to fill, where its position changes and allows no null",
      from: { type: 'array', items: { type: 'string', oneOf: [{ default: 'x' }] } },
      to: { type: 'array', items: { type: 'string', oneOf: [{ default: 'yy' }] } },
      data: [null],
      expected: [undefined],
      formExpected: ['yy'],
    },
    {
      name: 'keeps a scalar item a readOnly new default differs from',
      from: typedItems('string'),
      to: { type: 'array', items: { type: 'string', default: 'y', readOnly: true } },
      data: ['z'],
      expected: ['z'],
    },
    {
      name: 'keeps a scalar readOnly item whose new default replaces its old one',
      from: { type: 'array', items: { type: 'string', default: 'x', readOnly: true } },
      to: { type: 'array', items: { type: 'string', default: 'y', readOnly: true } },
      data: ['z'],
      expected: ['z'],
    },
    {
      // utils leaves the object for the defaults, which `Form` fills key by key
      name: 'keeps an object item holding its old default, for the defaults to fill key by key',
      from: { type: 'array', items: { type: 'object', properties: { x: {}, y: {} }, default: { x: 1 } } },
      to: { type: 'array', items: { type: 'object', properties: { x: {}, y: {} }, default: { y: 1 } } },
      data: [{ x: 1 }],
      expected: [{ x: 1 }],
      formExpected: [{ x: 1, y: 1 }],
    },
    {
      name: 'keeps an untyped object item holding its old default, for the defaults to fill key by key',
      from: { type: 'array', items: { properties: { x: {}, y: {} }, default: { x: 1 } } },
      to: { type: 'array', items: { properties: { x: {}, y: {} }, default: { y: 1 } } },
      data: [{ x: 1 }],
      expected: [{ x: 1 }],
      formExpected: [{ x: 1, y: 1 }],
    },
    {
      name: 'keeps an object item of object options holding its old default, for the defaults to fill key by key',
      from: { type: 'array', items: { anyOf: [{ type: 'object', properties: { x: {}, y: {} } }], default: { x: 1 } } },
      to: { type: 'array', items: { anyOf: [{ type: 'object', properties: { x: {}, y: {} } }], default: { y: 1 } } },
      data: [{ x: 1 }],
      expected: [{ x: 1 }],
      formExpected: [{ x: 1, y: 1 }],
    },
    {
      name: 'swaps the old default of an object item for the new one where its options render no object',
      from: { type: 'array', items: { anyOf: [{ type: 'object', properties: { x: {}, y: {} } }], default: { x: 1 } } },
      to: { type: 'array', items: { anyOf: [{ type: 'string' }], default: 'b' } },
      data: [{ x: 1 }],
      expected: ['b'],
    },
    {
      name: 'keeps an untyped object item of its own properties beside untyped options holding its old default',
      from: {
        type: 'array',
        items: { properties: { x: {}, y: {} }, anyOf: [{ required: ['x'] }, { required: ['y'] }], default: { x: 1 } },
      },
      to: {
        type: 'array',
        items: { properties: { x: {}, y: {} }, anyOf: [{ required: ['x'] }, { required: ['y'] }], default: { y: 1 } },
      },
      data: [{ x: 1 }],
      expected: [{ x: 1 }],
      formExpected: [{ x: 1, y: 1 }],
    },
    {
      name: 'swaps the old default of an object item of object options for a scalar new one',
      from: {
        type: 'array',
        items: { anyOf: [{ type: 'string' }, { type: 'object', properties: { x: {}, y: {} } }], default: { x: 1 } },
      },
      to: {
        type: 'array',
        items: { anyOf: [{ type: 'string' }, { type: 'object', properties: { x: {}, y: {} } }], default: 'b' },
      },
      data: [{ x: 1 }],
      expected: ['b'],
    },
    {
      name: 'swaps the old default of an untyped object item declaring only extra keys for the new one',
      from: { type: 'array', items: { additionalProperties: { type: 'number' }, default: { x: 1 } } },
      to: { type: 'array', items: { additionalProperties: { type: 'number' }, default: { y: 1 } } },
      data: [{ x: 1 }],
      expected: [{ y: 1 }],
    },
    {
      name: 'swaps the old default of an item picked from object options for the new one',
      from: { type: 'array', items: { type: 'object', enum: [{ a: 1 }, { a: 2 }], default: { a: 1 } } },
      to: { type: 'array', items: { type: 'object', enum: [{ a: 1 }, { a: 2 }], default: { a: 2 } } },
      data: [{ a: 1 }],
      expected: [{ a: 2 }],
    },
    // The defaults still fill an empty row under `skipDefaults`, so an item's default is still its own
    {
      name: "swaps the old default of an item for the new one under emptyObjectFields: 'skipDefaults'",
      from: { type: 'array', items: { type: 'string', default: 'x' } },
      to: { type: 'array', items: { type: 'string', default: 'y' } },
      data: ['x', 'q'],
      expected: ['y', 'q'],
      behavior: { emptyObjectFields: 'skipDefaults' },
    },
  ])('$name', ({ from, to, data, expected, formExpected = expected, behavior }) => {
    const wrap = (list: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { list } });
    const ref = createRef<FormRef<{ list?: unknown }>>();
    const props = { validator, initialFormData: { list: data }, defaultFormStateBehavior: behavior };
    const { rerender } = render(<Form ref={ref} schema={wrap(from)} {...props} />);

    rerender(<Form ref={ref} schema={wrap(to)} {...props} />);

    const formData = handleOf(ref).getFormData();
    expect(Object.hasOwn(formData, 'list') ? formData.list : ABSENT).toEqual(formExpected);
    const sanitized = createSchemaUtils({ validator, defaultFormStateBehavior: behavior }, to).sanitizeDataForNewSchema(
      to,
      from,
      data,
    );
    expect(sanitized === undefined ? ABSENT : sanitized).toEqual(expected);
  });
  // A property under a type list is sanitized through the object holding it, as the array table's items are through the
  // array, where the top-level call would read the list through `getSchemaType()` alone
  it.each<{
    name: string;
    from: RJSFSchema;
    to: RJSFSchema;
    data: unknown;
    expected: unknown;
    behavior?: DefaultFormStateBehavior;
  }>([
    ...TYPE_LISTS_NAMING_ARRAY.map((type) => ({
      name: `sanitizes an array property under ${JSON.stringify(type)} as an array`,
      from: { type, properties: { a: {} }, items: { type: 'string' } } satisfies RJSFSchema,
      to: { type, properties: { a: {} }, items: { type: 'number' } } satisfies RJSFSchema,
      data: ['a', 'b'],
      expected: [],
    })),
    ...(['array', 'string'] as const).map((first) => ({
      name: `prunes an object property under a type list naming ${first} first`,
      from: { type: [first, 'object'], title: 'Old', properties: { a: {}, b: {} } } satisfies RJSFSchema,
      to: { type: [first, 'object'], title: 'New', properties: { a: {} } } satisfies RJSFSchema,
      data: { a: 1, b: 2 },
      expected: { a: 1 },
    })),
    ...(['array', ['string', 'array']] satisfies RJSFSchema['type'][]).flatMap((type) => [
      {
        name: `swaps the old default of an array property under ${JSON.stringify(type)} for the new one`,
        from: { type, items: { type: 'string' }, default: ['x'] } satisfies RJSFSchema,
        to: { type, items: { type: 'string' }, default: ['y'] } satisfies RJSFSchema,
        data: ['x'],
        expected: ['y'],
      },
      {
        name: `keeps an array property under ${JSON.stringify(type)} a readOnly new default differs from`,
        from: { type, items: { type: 'string' } } satisfies RJSFSchema,
        to: { type, items: { type: 'string' }, default: ['y'], readOnly: true } satisfies RJSFSchema,
        data: ['z'],
        expected: ['z'],
      },
    ]),
    {
      name: 'swaps the old default of an object property under a type list rendered as another type',
      from: { type: ['string', 'object'], properties: { x: {}, y: {} }, default: { x: 1 } },
      to: { type: ['string', 'object'], properties: { x: {}, y: {} }, default: { y: 1 } },
      data: { x: 1 },
      expected: { y: 1 },
    },
    {
      name: 'replaces an object an enum under a type list rendered as a string no longer lists',
      from: { type: ['string', 'object'], properties: { a: {} }, enum: [{ a: 1 }, 'x'] },
      to: { type: ['string', 'object'], properties: { a: {} }, enum: [{ a: 2 }, 'x'], default: 'x' },
      data: { a: 1 },
      expected: 'x',
    },
    {
      name: 'replaces an array an enum under a type list rendered as a string no longer lists',
      from: { type: ['string', 'array'], items: {}, enum: [['a'], 'x'] },
      to: { type: ['string', 'array'], items: {}, enum: [['b'], 'x'], default: 'x' },
      data: ['a'],
      expected: 'x',
    },
    {
      name: 'swaps a property holding an old null default for the new one (#5815)',
      from: { type: ['string', 'null'], default: null },
      to: { type: ['string', 'null'], default: 'y' },
      data: null,
      expected: 'y',
    },
    {
      name: 'swaps a property holding the old default for a new null one (#5815)',
      from: { type: ['string', 'null'], default: 'x' },
      to: { type: ['string', 'null'], default: null },
      data: 'x',
      expected: null,
    },
    // A property's own `default: null` is what the defaults fill it with, not the default its parent's `default` gives it
    ...[
      { data: { v: null }, expected: { v: 'y' } },
      { data: { v: 'x' }, expected: { v: 'x' } },
    ].map(({ data, expected }) => {
      const withOwn = (own: string | null): RJSFSchema => ({
        type: 'object',
        properties: { v: { type: ['string', 'null'], default: own } },
        default: { v: 'x' },
      });
      return {
        name: `reads a property's own null default over its parent's, holding ${JSON.stringify(data.v)} (#5815)`,
        from: withOwn(null),
        to: withOwn('y'),
        data,
        expected,
      };
    }),
    // Under `ancestorWins` the parent's default fills a property that declares one of its own, so that is the one held
    ...['q', null].map((own) => {
      const withParent = (parent: string): RJSFSchema => ({
        type: 'object',
        default: { v: parent },
        properties: { v: { type: ['string', 'null'], default: own }, w: { type: 'string' } },
      });
      return {
        name: `swaps a property holding its parent's old default over its own ${JSON.stringify(own)} under ancestorWins (#5817)`,
        from: withParent('x'),
        to: withParent('z'),
        data: { v: 'x', w: 'k' },
        expected: { v: 'z', w: 'k' },
        behavior: { nestedDefaultsPrecedence: 'ancestorWins' } satisfies DefaultFormStateBehavior,
      };
    }),
    // A default reaches every level below the one declaring it, as the defaults hand it down
    ...[
      {
        where: 'on an ancestor, through an object declaring none',
        withDefault: (b: string): RJSFSchema => ({
          type: 'object',
          default: { a: { b } },
          properties: {
            a: { type: 'object', properties: { b: { type: 'string' }, d: { type: 'number' } } },
          },
        }),
      },
      {
        where: 'on its parent',
        withDefault: (b: string): RJSFSchema => ({
          type: 'object',
          properties: {
            a: { type: 'object', default: { b }, properties: { b: { type: 'string' }, d: { type: 'number' } } },
          },
        }),
      },
    ].map(({ where, withDefault }) => ({
      name: `swaps a property holding the old default declared ${where} for the new one (#5818)`,
      from: withDefault('x'),
      to: withDefault('y'),
      data: { a: { b: 'x', d: 1 } },
      expected: { a: { b: 'y', d: 1 } },
    })),
    // The defaults fill an object key by key, so a key the new default drops keeps the value the old one filled in
    {
      name: 'swaps each key of an object holding its old default, keeping a key the new default drops (#5818)',
      from: {
        type: 'object',
        default: { a: 'x', b: 'z' },
        properties: { a: { type: 'string' }, b: { type: 'string' } },
      },
      to: { type: 'object', default: { a: 'y' }, properties: { a: { type: 'string' }, b: { type: 'string' } } },
      data: { a: 'x', b: 'z' },
      expected: { a: 'y', b: 'z' },
    },
    // `sanitizeDataForNewSchema()` sanitizes a property key by key only where it declares an object type itself
    ...(
      [
        ['an untyped object property', { properties: { a: { type: 'string' }, b: { type: 'string' } } }],
        ['an object property of object options', { oneOf: [{ type: 'object', properties: { a: {}, b: {} } }] }],
      ] satisfies [string, RJSFSchema][]
    ).map(([what, schema]) => ({
      name: `swaps ${what} holding its old default whole`,
      from: { ...schema, default: { a: 'x', b: 'z' } },
      to: { ...schema, default: { a: 'y' } },
      data: { a: 'x', b: 'z' },
      expected: { a: 'y' },
    })),
    // A `true` key constrains nothing, so only the default it is filled with changes
    {
      name: 'swaps a true key of an object property holding its old default for its new default',
      from: { type: 'object', default: { a: 'x' }, properties: { a: true } },
      to: { type: 'object', default: { a: 'y' }, properties: { a: true } },
      data: { a: 'x' },
      expected: { a: 'y' },
    },
    {
      name: 'swaps a key of an object property that was true holding its old default for its new default',
      from: { type: 'object', default: { a: 'x' }, properties: { a: true } },
      to: { type: 'object', default: { a: 'y' }, properties: { a: { type: 'string' } } },
      data: { a: 'x' },
      expected: { a: 'y' },
    },
    {
      name: 'swaps a true key of an object property beside a key the new default drops for its new default',
      from: { type: 'object', default: { a: 'x', b: 'z' }, properties: { a: true, b: { type: 'string' } } },
      to: { type: 'object', default: { a: 'y' }, properties: { a: true, b: { type: 'string' } } },
      data: { a: 'x', b: 'z' },
      expected: { a: 'y', b: 'z' },
    },
    {
      name: 'swaps a true key of an object property beside an edited key for its new default',
      from: { type: 'object', default: { a: 'x', b: 'z' }, properties: { a: true, b: { type: 'string' } } },
      to: { type: 'object', default: { a: 'y', b: 'z' }, properties: { a: true, b: { type: 'string' } } },
      data: { a: 'x', b: 'k' },
      expected: { a: 'y', b: 'k' },
    },
    // Only an object `default` is filled key by key, so an object holding its old one takes a new `null` whole
    ...(
      [
        [
          'an object property',
          (d) => ({ type: ['object', 'null'], default: d, properties: { a: { type: 'string' } } }),
        ],
        [
          'an object item',
          (d) => ({
            type: 'array',
            items: { type: ['object', 'null'], default: d, properties: { a: { type: 'string' } } },
          }),
        ],
      ] satisfies [string, (d: RJSFSchema['default']) => RJSFSchema][]
    ).map(([what, withDefault], index) => ({
      name: `swaps ${what} holding its old object default for a new null one`,
      from: withDefault({ a: 'x' }),
      to: withDefault(null),
      data: index === 0 ? { a: 'x' } : [{ a: 'x' }],
      expected: index === 0 ? null : [null],
    })),
    // A value the new `enum` rejects takes the default the property computes, which is not gated by `emptyObjectFields`
    ...[
      { own: undefined, behavior: undefined, expected: 'c' },
      { own: 'd', behavior: undefined, expected: 'd' },
      { own: 'd', behavior: { nestedDefaultsPrecedence: 'ancestorWins' }, expected: 'c' },
      { own: undefined, behavior: { emptyObjectFields: 'skipDefaults' }, expected: 'c' },
    ].map(({ own, behavior, expected }) => {
      const withEnum = (parent: string, values: string[]): RJSFSchema => ({
        type: 'object',
        default: { v: parent },
        properties: { v: { type: 'string', enum: values, ...(own && { default: own }) }, w: { type: 'string' } },
      });
      return {
        name: `replaces a value its new enum rejects with its filled default, own ${JSON.stringify(own)} under ${JSON.stringify(behavior)} (#5818)`,
        from: withEnum('b', ['a', 'b']),
        to: withEnum('c', ['c', 'd']),
        data: { v: 'a', w: 'k' },
        expected: { v: expected, w: 'k' },
        behavior: behavior as DefaultFormStateBehavior | undefined,
      };
    }),
    // Under `skipDefaults` the defaults fill no property, so a value equal to its default is the user's
    {
      name: "keeps a property holding its old default under emptyObjectFields: 'skipDefaults'",
      from: { type: 'string', default: 'x' },
      to: { type: 'string', default: 'y' },
      data: 'x',
      expected: 'x',
      behavior: { emptyObjectFields: 'skipDefaults' },
    },
    {
      name: "keeps a property holding its parent's old default under emptyObjectFields: 'skipDefaults'",
      from: { type: 'object', default: { v: 'x' }, properties: { v: { type: 'string' } } },
      to: { type: 'object', default: { v: 'y' }, properties: { v: { type: 'string' } } },
      data: { v: 'x' },
      expected: { v: 'x' },
      behavior: { emptyObjectFields: 'skipDefaults' },
    },
    {
      name: "swaps an own null default giving way to its parent's for the parent's (#5818)",
      from: { type: 'object', properties: { v: { type: ['string', 'null'], default: null } } },
      to: { type: 'object', properties: { v: { type: ['string', 'null'] } }, default: { v: 'z' } },
      data: { v: null },
      expected: { v: 'z' },
    },
    {
      name: "swaps a parent's default giving way to an own null one for the null (#5818)",
      from: { type: 'object', properties: { v: { type: ['string', 'null'] } }, default: { v: 'x' } },
      to: { type: 'object', properties: { v: { type: ['string', 'null'], default: null } } },
      data: { v: 'x' },
      expected: { v: null },
    },
  ])('$name', ({ from, to, data, expected, behavior }) => {
    const wrap = (value: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { value } });
    const ref = createRef<FormRef<{ value?: unknown }>>();
    const props = { validator, initialFormData: { value: data }, defaultFormStateBehavior: behavior };
    const { rerender } = render(<Form ref={ref} schema={wrap(from)} {...props} />);

    rerender(<Form ref={ref} schema={wrap(to)} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual({ value: expected });
    const utils = createSchemaUtils({ validator, defaultFormStateBehavior: behavior }, wrap(to));
    const sanitized = utils.sanitizeDataForNewSchema(wrap(to), wrap(from), {
      value: data,
    });
    expect(sanitized).toEqual({ value: expected });
  });
  it('swaps a key of an object property that turns true holding its old default for its new default', () => {
    const wrap = (value: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { value } });
    const from: RJSFSchema = { type: 'object', default: { a: 'x' }, properties: { a: { type: 'string' } } };
    const to: RJSFSchema = { type: 'object', default: { a: 'y' }, properties: { a: true } };
    const ref = createRef<FormRef<{ value?: unknown }>>();
    const props = { validator, initialFormData: { value: { a: 'x' } } };
    const { rerender } = render(<Form ref={ref} schema={wrap(from)} {...props} />);

    rerender(<Form ref={ref} schema={wrap(to)} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual({ value: { a: 'y' } });
  });
  it("keeps a clear of a property holding its own null default when its parent's default changes (#5815)", () => {
    const schemaWith = (parentDefault: string): RJSFSchema => ({
      type: 'object',
      default: { v: parentDefault },
      properties: { v: { type: ['string', 'null'], default: null }, w: { type: 'string' } },
    });
    const from = schemaWith('x');
    const to = schemaWith('z');
    const data = { v: undefined, w: 'k' };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={from} validator={validator} initialFormData={data} />);

    rerender(<Form ref={ref} schema={to} validator={validator} initialFormData={data} />);

    expect(handleOf(ref).getFormData()).toStrictEqual(data);
    expect(createSchemaUtils({ validator }, to).sanitizeDataForNewSchema(to, from, data)).toStrictEqual(data);
  });
  it("gives way a clear of a property holding its own null default when its parent's default changes under ancestorWins (#5817)", () => {
    const schemaWith = (parentDefault: string): RJSFSchema => ({
      type: 'object',
      default: { v: parentDefault },
      properties: { v: { type: ['string', 'null'], default: null }, w: { type: 'string' } },
    });
    const from = schemaWith('x');
    const to = schemaWith('z');
    const data = { v: undefined, w: 'k' };
    const defaultFormStateBehavior: DefaultFormStateBehavior = { nestedDefaultsPrecedence: 'ancestorWins' };
    const props = { validator, initialFormData: data, defaultFormStateBehavior };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={from} {...props} />);

    rerender(<Form ref={ref} schema={to} {...props} />);

    expect(handleOf(ref).getFormData()).toStrictEqual({ v: 'z', w: 'k' });
    const utils = createSchemaUtils({ validator, defaultFormStateBehavior }, to);
    expect(utils.sanitizeDataForNewSchema(to, from, data)).toStrictEqual({ w: 'k' });
  });
  // The fill applies a property's conditions as for no data, not against its default, so a key they make required is
  // written, and its change gives way to a clear, only where they apply to a property holding nothing
  it.each<{ name: string; c: RJSFSchema; cDefault: (v: string) => Record<string, string>; refills: boolean }>([
    {
      name: 'an if its default fails, whose then requires the key',
      c: {
        type: 'object',
        properties: { a: { type: 'string' } },
        if: { properties: { a: { const: 'z' } } },
        then: { required: ['a'] },
      },
      cDefault: (a) => ({ a }),
      refills: true,
    },
    {
      name: 'an if its default meets, whose then declares and requires the key',
      c: {
        type: 'object',
        properties: { a: { type: 'string' } },
        if: { required: ['a'] },
        then: { properties: { b: { type: 'string' } }, required: ['b'] },
      },
      cDefault: (b) => ({ a: 'k', b }),
      refills: false,
    },
    {
      name: 'a dependency its default meets, which requires the key',
      c: {
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
        dependencies: { a: ['b'] },
      },
      cDefault: (b) => ({ a: 'k', b }),
      refills: false,
    },
  ])(
    "judges a clear of an object by the key a property's $name makes required, under emptyObjectFields: 'populateRequiredDefaults'",
    ({ c, cDefault, refills }) => {
      const schemaWith = (v: string): RJSFSchema => ({
        type: 'object',
        required: ['o'],
        properties: { o: { type: 'object', default: { c: cDefault(v) }, properties: { c } }, w: { type: 'string' } },
      });
      const from = schemaWith('x');
      const to = schemaWith('y');
      const data = { o: undefined, w: 'k' };
      const defaultFormStateBehavior: DefaultFormStateBehavior = { emptyObjectFields: 'populateRequiredDefaults' };
      const props = { validator, initialFormData: data, defaultFormStateBehavior };
      const ref = createRef<FormRef<Record<string, unknown>>>();
      const { rerender } = render(<Form ref={ref} schema={from} {...props} />);

      rerender(<Form ref={ref} schema={to} {...props} />);

      const utils = createSchemaUtils({ validator, defaultFormStateBehavior }, to);
      const filled = utils.getDefaultFormState(to, { w: 'k' }) as Record<string, unknown>;
      expect(handleOf(ref).getFormData()).toStrictEqual(refills ? filled : data);
      expect(utils.sanitizeDataForNewSchema(to, from, data)).toStrictEqual(refills ? { w: 'k' } : data);
    },
  );
  // The defaults write an optional key of an optional property nowhere, a `$ref` one or one typed by its option
  // included, so a change to its default leaves a clear of the object holding it alone
  it.each<{ name: string; c: RJSFSchema }>([
    { name: '$ref', c: { $ref: '#/definitions/C' } },
    { name: 'oneOf-typed', c: { oneOf: [{ $ref: '#/definitions/C' }] } },
  ])(
    "keeps a clear of an object whose $name property's default changes but is never written, under emptyObjectFields: 'populateRequiredDefaults'",
    ({ c }) => {
      const schemaWith = (a: number): RJSFSchema => ({
        type: 'object',
        required: ['o'],
        definitions: { C: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'string' } } } },
        properties: {
          o: { type: 'object', default: { c: { a } }, properties: { c } },
          w: { type: 'string' },
        },
      });
      const from = schemaWith(1);
      const to = schemaWith(2);
      const data = { o: undefined, w: 'k' };
      const defaultFormStateBehavior: DefaultFormStateBehavior = { emptyObjectFields: 'populateRequiredDefaults' };
      const props = { validator, initialFormData: data, defaultFormStateBehavior };
      const ref = createRef<FormRef<Record<string, unknown>>>();
      const { rerender } = render(<Form ref={ref} schema={from} {...props} />);

      rerender(<Form ref={ref} schema={to} {...props} />);

      expect(handleOf(ref).getFormData()).toStrictEqual(data);
      const utils = createSchemaUtils({ validator, defaultFormStateBehavior }, to);
      expect(utils.sanitizeDataForNewSchema(to, from, data)).toStrictEqual(data);
    },
  );
  // The default the defaults write into an object is built key by key, so a cleared object gives way once a key they
  // write changes, wherever its key or its requiredness is declared
  it.each<{
    name: string;
    schemaWith: (v: string) => RJSFSchema;
    filled: (v: string) => unknown;
    behavior?: DefaultFormStateBehavior;
    /** Whether the object sits in a required object listing no `required` of its own, rather than in the root */
    inRequiredObject?: boolean;
  }>([
    {
      name: 'a key its own properties declare beside its oneOf',
      schemaWith: (a) => ({
        type: 'object',
        properties: {
          o: {
            type: 'object',
            default: { a },
            properties: { a: { type: 'string' } },
            oneOf: [{ properties: { z: { type: 'string' } } }],
          },
          w: { type: 'string' },
        },
      }),
      filled: (a) => ({ a }),
    },
    {
      // The fill deep-merges a property the field and its option both declare, the option's `required` included
      name: 'a key its oneOf requires of a property the object declares too',
      schemaWith: (a) => ({
        type: 'object',
        properties: {
          o: {
            type: 'object',
            default: { c: { a } },
            properties: { c: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } } },
            oneOf: [{ properties: { c: { type: 'object', required: ['a'] } } }],
          },
          w: { type: 'string' },
        },
      }),
      filled: (a) => ({ c: { a } }),
    },
    {
      name: "a key its oneOf requires of a property the object declares too, under emptyObjectFields: 'populateRequiredDefaults'",
      schemaWith: (a) => ({
        type: 'object',
        required: ['o'],
        properties: {
          o: {
            type: 'object',
            default: { c: { a } },
            properties: { c: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } } },
            oneOf: [{ properties: { c: { type: 'object', required: ['a'] } } }],
          },
          w: { type: 'string' },
        },
      }),
      filled: (a) => ({ c: { a } }),
      behavior: { emptyObjectFields: 'populateRequiredDefaults' },
    },
    {
      name: "a key the object's property requires and its oneOf redeclares, under emptyObjectFields: 'populateRequiredDefaults'",
      schemaWith: (a) => ({
        type: 'object',
        required: ['o'],
        properties: {
          o: {
            type: 'object',
            default: { c: { a } },
            properties: {
              c: { type: 'object', required: ['a'], properties: { a: { type: 'string' }, b: { type: 'string' } } },
            },
            oneOf: [{ properties: { c: { type: 'object', properties: { b: { type: 'string' } } } } }],
          },
          w: { type: 'string' },
        },
      }),
      filled: (a) => ({ c: { a } }),
      behavior: { emptyObjectFields: 'populateRequiredDefaults' },
    },
    // The fill cuts a field holding no data by the option its own `default` matches, not the one `Form` shows for it
    {
      name: 'a key the option its default matches declares, not the option shown',
      schemaWith: (a): RJSFSchema => ({
        type: 'object',
        properties: {
          o: {
            type: 'object',
            default: { c: { a } },
            properties: { c: { type: 'object' } },
            oneOf: [
              {
                properties: {
                  c: { type: 'object', additionalProperties: false, properties: { b: { type: 'string' } } },
                },
              },
              { properties: { c: { type: 'object', properties: { a: { type: 'string' } } } } },
            ],
          },
          w: { type: 'string' },
        },
      }),
      filled: (a) => ({ c: { a } }),
    },
    {
      name: "a key the option its default matches requires, not the option shown, under emptyObjectFields: 'populateRequiredDefaults'",
      schemaWith: (a) => ({
        type: 'object',
        required: ['o'],
        properties: {
          o: {
            type: 'object',
            default: { c: { a } },
            properties: { c: { type: 'object', properties: { a: { type: 'string' } } } },
            oneOf: [
              {
                properties: {
                  c: { type: 'object', additionalProperties: false, properties: { b: { type: 'string' } } },
                },
              },
              { properties: { c: { type: 'object', required: ['a'] } }, required: ['c'] },
            ],
          },
          w: { type: 'string' },
        },
      }),
      filled: (a) => ({ c: { a } }),
      behavior: { emptyObjectFields: 'populateRequiredDefaults' },
    },
    {
      name: "a key the option its default's discriminator picks requires, under emptyObjectFields: 'populateRequiredDefaults'",
      schemaWith: (a) => ({
        type: 'object',
        required: ['o'],
        properties: {
          o: {
            type: 'object',
            default: { k: 'B', a },
            discriminator: { propertyName: 'k' },
            properties: { k: { type: 'string', enum: ['A', 'B'] }, a: { type: 'string' } },
            oneOf: [{ properties: { k: { const: 'A' } } }, { properties: { k: { const: 'B' } }, required: ['a'] }],
          },
          w: { type: 'string' },
        },
      }),
      filled: (a) => ({ k: 'B', a }),
      behavior: { emptyObjectFields: 'populateRequiredDefaults' },
    },
    {
      // The object hands the property its default, which picks the property's option under `ancestorWins`
      name: "a key the option its object's default picks requires, under nestedDefaultsPrecedence: 'ancestorWins'",
      schemaWith: (a) => ({
        type: 'object',
        required: ['o'],
        properties: {
          o: {
            type: 'object',
            required: ['c'],
            default: { c: { k: 'B', a } },
            properties: {
              c: {
                type: 'object',
                default: { k: 'A' },
                properties: { k: { type: 'string' }, a: { type: 'string' } },
                oneOf: [{ properties: { k: { const: 'A' } } }, { properties: { k: { const: 'B' } }, required: ['a'] }],
              },
            },
          },
          w: { type: 'string' },
        },
      }),
      filled: (a) => ({ c: { k: 'B', a } }),
      behavior: { nestedDefaultsPrecedence: 'ancestorWins', emptyObjectFields: 'populateRequiredDefaults' },
    },
    // The fill writes the default of a key whatever schema declares it, a `false` one an option declares included
    ...([{}, { b: { type: 'string' } }] as Record<string, RJSFSchema>[]).map((others) => ({
      name: `a key its oneOf declares false${Object.keys(others).length ? ' beside another' : ''}`,
      schemaWith: (a: string): RJSFSchema => ({
        type: 'object',
        properties: {
          o: {
            type: 'object',
            default: { a },
            properties: { a: { type: 'string' }, ...others },
            oneOf: [{ properties: { a: false } }],
          },
          w: { type: 'string' },
        },
      }),
      filled: (a: string) => ({ a }),
    })),
    {
      // The defaults hand an object its parent lists no `required` for none, so they fill its required keys as the root's
      name: "a required key of an object a required object lists no required for, under emptyObjectFields: 'populateRequiredDefaults'",
      schemaWith: (g) => ({
        type: 'object',
        required: ['o'],
        properties: {
          o: {
            type: 'object',
            default: { c: { g } },
            properties: { c: { type: 'object', required: ['g'], properties: { g: { type: 'string' } } } },
          },
          w: { type: 'string' },
        },
      }),
      filled: (g) => ({ c: { g } }),
      behavior: { emptyObjectFields: 'populateRequiredDefaults' },
    },
    {
      name: "a required key of an object in a required object listing no required, under emptyObjectFields: 'populateRequiredDefaults'",
      schemaWith: (a) => ({
        type: 'object',
        properties: {
          o: { type: 'object', required: ['a'], default: { a }, properties: { a: { type: 'string' } } },
          w: { type: 'string' },
        },
      }),
      filled: (a) => ({ a }),
      behavior: { emptyObjectFields: 'populateRequiredDefaults' },
      inRequiredObject: true,
    },
    // The fill merges a scalar key's `allOf` only under `allOf: 'populateDefaults'`, and its `if` not under
    // `skipEmptyDefaults`, behind a `$ref`, inside an option or beside a `$ref` alike
    ...(
      [
        { name: 'an allOf behind its $ref', c: { $ref: '#/definitions/A' } },
        {
          name: 'an allOf inside its oneOf option',
          c: { type: 'string', oneOf: [{ allOf: [{ default: 'own' }] }, { maxLength: 0 }] },
        },
        { name: 'an allOf beside its $ref', c: { $ref: '#/definitions/P', allOf: [{ default: 'own' }] } },
        {
          name: "an if behind its $ref under emptyObjectFields: 'skipEmptyDefaults'",
          c: { $ref: '#/definitions/I' },
          behavior: { emptyObjectFields: 'skipEmptyDefaults' },
        },
      ] as { name: string; c: RJSFSchema; behavior?: DefaultFormStateBehavior }[]
    ).map(({ name, c, behavior }) => ({
      name: `a scalar key whose own default ${name} declares, which the fill skips`,
      schemaWith: (a: string): RJSFSchema => ({
        type: 'object',
        definitions: {
          A: { allOf: [{ type: 'string' }, { default: 'own' }] },
          I: { type: 'string', if: { maxLength: 100 }, then: { default: 'own' } },
          P: { type: 'string' },
        },
        properties: { o: { type: 'object', default: { c: a }, properties: { c } }, w: { type: 'string' } },
      }),
      filled: (a: string) => ({ c: a }),
      behavior,
    })),
  ])(
    'gives way a clear of an object whose written default changes in $name',
    ({ schemaWith, filled, behavior, inRequiredObject }) => {
      const wrap = <V,>(inner: V) => (inRequiredObject ? { p: inner } : inner);
      const rootWith = (v: string): RJSFSchema =>
        inRequiredObject ? { type: 'object', required: ['p'], properties: { p: schemaWith(v) } } : schemaWith(v);
      const from = rootWith('x');
      const to = rootWith('y');
      const data = wrap({ o: undefined, w: 'k' });
      const props = { validator, initialFormData: data, defaultFormStateBehavior: behavior };
      const ref = createRef<FormRef<Record<string, unknown>>>();
      const { rerender } = render(<Form ref={ref} schema={from} {...props} />);

      rerender(<Form ref={ref} schema={to} {...props} />);

      expect(handleOf(ref).getFormData()).toStrictEqual(wrap({ o: filled('y'), w: 'k' }));
      const utils = createSchemaUtils({ validator, defaultFormStateBehavior: behavior }, to);
      expect(utils.sanitizeDataForNewSchema(to, from, data)).toStrictEqual(wrap({ w: 'k' }));
    },
  );
  // The fill picks the option of a field holding no data by the field's own `default`, not by an option's, and the
  // option it picks, not the one shown, is the one whose `default` it writes
  const optionMismatchWith = (a: string, extra: RJSFSchema['properties'] = {}): RJSFSchema => ({
    type: 'object',
    properties: {
      o: {
        type: 'object',
        properties: { c: { type: 'object' }, ...extra },
        oneOf: [
          {
            default: { c: { a }, ...(Object.keys(extra).length ? { d: 'keep' } : {}) },
            properties: { c: { type: 'object', additionalProperties: false, properties: { b: { type: 'string' } } } },
          },
          { properties: { c: { type: 'object', properties: { a: { type: 'string' } } } } },
        ],
      },
      w: { type: 'string' },
    },
  });
  it.each<{ name: string; from: RJSFSchema; to: RJSFSchema }>([
    {
      name: 'an object whose shown option declares a default another option matches better',
      from: optionMismatchWith('x', { d: { type: 'string' } }),
      to: optionMismatchWith('y', { d: { type: 'string' } }),
    },
    {
      name: 'an object whose shown option declares a default another option matches better, writing none of it',
      from: optionMismatchWith('x'),
      to: optionMismatchWith('y'),
    },
    {
      // The fill writes a property's own `default` over the one its object hands it
      name: "an object whose default for a key is overridden by that key's own",
      from: {
        type: 'object',
        properties: {
          o: { type: 'object', default: { c: 'x' }, properties: { c: { type: 'string', default: 'own' } } },
          w: { type: 'string' },
        },
      },
      to: {
        type: 'object',
        properties: {
          o: { type: 'object', default: { c: 'y' }, properties: { c: { type: 'string', default: 'own' } } },
          w: { type: 'string' },
        },
      },
    },
    // The fill reads a key's own default through the option it picks too
    ...(['oneOf', 'anyOf'] as const).map((keyword) => {
      const withDefault = (c: string): RJSFSchema => ({
        type: 'object',
        properties: {
          o: {
            type: 'object',
            default: { c },
            properties: { c: { type: 'string', [keyword]: [{ default: 'own' }, { maxLength: 0 }] } },
          },
          w: { type: 'string' },
        },
      });
      return {
        name: `an object whose default for a key is overridden by the one that key's ${keyword} option declares`,
        from: withDefault('x'),
        to: withDefault('y'),
      };
    }),
  ])('keeps a clear of $name when that default changes but the fill writes the same', ({ from, to }) => {
    const data = { o: undefined, w: 'k' };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={from} validator={validator} initialFormData={data} />);

    rerender(<Form ref={ref} schema={to} validator={validator} initialFormData={data} />);

    expect(handleOf(ref).getFormData()).toStrictEqual(data);
    expect(createSchemaUtils({ validator }, to).sanitizeDataForNewSchema(to, from, data)).toStrictEqual(data);
  });
  // Both sides are cut by the option the fill picks, so a clear whose default is unchanged stays cleared
  it('keeps a clear of an object whose default fits an option other than the one shown when only a sibling changes', () => {
    const schemaWith = (title?: string): RJSFSchema => ({
      type: 'object',
      properties: {
        o: {
          type: 'object',
          default: { c: { a: 'x' } },
          properties: { c: { type: 'object' } },
          oneOf: [
            {
              properties: {
                c: { type: 'object', additionalProperties: false, properties: { b: { type: 'string' } } },
              },
            },
            { properties: { c: { type: 'object', properties: { a: { type: 'string' } } } } },
          ],
        },
        w: { type: 'string', title },
      },
    });
    const data = { o: undefined, w: 'k' };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={schemaWith()} validator={validator} initialFormData={data} />);

    rerender(<Form ref={ref} schema={schemaWith('W')} validator={validator} initialFormData={data} />);

    expect(handleOf(ref).getFormData()).toStrictEqual(data);
  });
  // A clear reads the `default` of the option the fill picks for it, as it cuts its default by that option
  it.each<{ name: string; o: (v: string) => RJSFSchema; filled: (v: string) => unknown }>([
    {
      name: 'an object',
      o: (a) => ({ type: 'object', properties: { a: { type: 'string' } }, oneOf: [{ default: { a } }] }),
      filled: (a) => ({ a }),
    },
    {
      name: 'an untyped field',
      o: (v) => ({ oneOf: [{ type: 'string', default: v }, { type: 'number' }] }),
      filled: (v) => v,
    },
    {
      // The fill folds into the option it picks and picks again among that option's own options
      name: 'an object whose option offers options',
      o: (e) => ({ type: 'object', properties: { e: { type: 'string' } }, oneOf: [{ anyOf: [{ default: { e } }] }] }),
      filled: (e) => ({ e }),
    },
  ])('gives way a clear of $name whose option declares the changed default', ({ o, filled }) => {
    const schemaWith = (v: string): RJSFSchema => ({ type: 'object', properties: { o: o(v), w: { type: 'string' } } });
    const data = { o: undefined, w: 'k' };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(
      <Form ref={ref} schema={schemaWith('x')} validator={validator} initialFormData={data} />,
    );

    rerender(<Form ref={ref} schema={schemaWith('y')} validator={validator} initialFormData={data} />);

    expect(handleOf(ref).getFormData()).toStrictEqual({ o: filled('y'), w: 'k' });
    const to = schemaWith('y');
    expect(createSchemaUtils({ validator }, to).sanitizeDataForNewSchema(to, schemaWith('x'), data)).toStrictEqual({
      w: 'k',
    });
  });
  // The field's `additionalProperties` seeds an extra key beside its option, which declares none
  it('gives way a clear of an object whose extra key the object seeds beside its oneOf changes default', () => {
    const schemaWith = (q: string): RJSFSchema => ({
      type: 'object',
      properties: {
        o: {
          type: 'object',
          default: { q },
          properties: { a: { type: 'string' } },
          additionalProperties: { type: 'string' },
          oneOf: [{ properties: { z: { type: 'string' } } }],
        },
        w: { type: 'string' },
      },
    });
    const data = { o: undefined, w: 'k' };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(
      <Form ref={ref} schema={schemaWith('x')} validator={validator} initialFormData={data} />,
    );

    rerender(<Form ref={ref} schema={schemaWith('y')} validator={validator} initialFormData={data} />);

    expect(Object.entries(handleOf(ref).getFormData() ?? {})).not.toContainEqual(['o', undefined]);
    const to = schemaWith('y');
    expect(createSchemaUtils({ validator }, to).sanitizeDataForNewSchema(to, schemaWith('x'), data)).toStrictEqual({
      w: 'k',
    });
  });
  // The defaults still fill the root under `skipDefaults`, so its default is still its own
  it("swaps a root holding its old default for the new one under emptyObjectFields: 'skipDefaults'", () => {
    const ref = createRef<FormRef<string>>();
    const props = { validator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } as const };
    const { rerender } = render(<Form ref={ref} schema={{ type: 'string', default: 'x' }} {...props} />);

    rerender(<Form ref={ref} schema={{ type: 'string', default: 'y' }} {...props} />);

    expect(handleOf(ref).getFormData()).toBe('y');
  });
  // The schema holds the same objects, so only the settings say the field is filled with another default
  it('swaps a property holding the default the old settings filled in when only defaultFormStateBehavior changes', () => {
    const schema: RJSFSchema = {
      type: 'object',
      default: { v: 'x' },
      properties: { v: { type: 'string', default: 'q' }, w: { type: 'string' } },
    };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={schema} validator={validator} />);
    expect(handleOf(ref).getFormData()).toEqual({ v: 'q' });

    rerender(
      <Form
        ref={ref}
        schema={schema}
        validator={validator}
        defaultFormStateBehavior={{ nestedDefaultsPrecedence: 'ancestorWins' }}
      />,
    );

    expect(handleOf(ref).getFormData()).toEqual({ v: 'x' });
  });
  // A schema change judges a field as a switch does: a `readOnly` value gives way, and an old default filled out to
  // `minItems` is still the old default
  it.each<{ name: string; withDefault: (v: string) => RJSFSchema; data: Record<string, unknown>; expected: unknown }>([
    {
      name: 'swaps a saved readOnly value for the new default replacing its old one',
      withDefault: (v) => ({ type: 'object', properties: { v: { type: 'string', default: v, readOnly: true } } }),
      data: { v: 'k' },
      expected: { v: 'y' },
    },
    {
      name: 'swaps an array its old default filled out to minItems for its new default',
      withDefault: (v) => ({
        type: 'object',
        required: ['v'],
        properties: { v: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' }, default: [v] } },
      }),
      data: {},
      expected: { v: ['y', 'z'] },
    },
    {
      name: 'swaps an item its old default filled out to minItems for its new default in place',
      withDefault: (v) => ({
        type: 'object',
        required: ['list'],
        properties: {
          list: {
            type: 'array',
            items: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' }, default: [v] },
          },
        },
      }),
      data: {
        list: [
          ['x', 'z'],
          ['k', 'z'],
        ],
      },
      expected: {
        list: [
          ['y', 'z'],
          ['k', 'z'],
        ],
      },
    },
  ])('$name when a schema change changes it', ({ withDefault, data, expected }) => {
    const props = { validator, initialFormData: data };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={withDefault('x')} {...props} />);

    rerender(<Form ref={ref} schema={withDefault('y')} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual(expected);
  });
  it('swaps a root item its old default filled out to minItems for its new default in place', () => {
    const withDefault = (v: string): RJSFSchema => ({
      type: 'array',
      items: { type: 'array', minItems: 2, items: { type: 'string', default: 'z' }, default: [v] },
    });
    const props = {
      validator,
      initialFormData: [
        ['x', 'z'],
        ['k', 'z'],
      ],
    };
    const ref = createRef<FormRef>();
    const { rerender } = render(<Form ref={ref} schema={withDefault('x')} {...props} />);

    rerender(<Form ref={ref} schema={withDefault('y')} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual([
      ['y', 'z'],
      ['k', 'z'],
    ]);
  });
  // The field is filled alone with the uiSchemas along its path, so one on another field plays no part. What a
  // `ui:initialValue` below it filled out is filled out anew from the new default in place, as a fresh mount fills it,
  // since the fill applies the initial value only on mount
  it.each<{ name: string; uiSchema: UiSchema; expected: unknown }>([
    {
      name: 'a ui:initialValue',
      uiSchema: { other: { 'ui:initialValue': 'o' }, v: { b: { 'ui:initialValue': 'i' } } },
      expected: { other: 'o', v: { a: 'y', b: 'i' } },
    },
    {
      name: 'a ui:options initialValue',
      uiSchema: { v: { b: { 'ui:options': { initialValue: 'i' } } } },
      expected: { v: { a: 'y', b: 'i' } },
    },
  ])('fills an object its old default filled out through $name below it out anew', ({ uiSchema, expected }) => {
    const withDefault = (v: string): RJSFSchema => ({
      type: 'object',
      properties: {
        other: { type: 'string' },
        // Untyped, so its object default is judged whole rather than key by key
        v: { default: { a: v }, properties: { a: { type: 'string' }, b: { type: 'string' } } },
      },
    });
    const props = { validator, uiSchema };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={withDefault('x')} {...props} />);

    rerender(<Form ref={ref} schema={withDefault('y')} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual(expected);
  });
  // `LayoutMultiSchemaField` writes the selector, so a switch keeps it out of the keys put back. Here the old selector
  // value is what the defaults fill the new option's selector with too, so judging it would keep it
  it('keeps the selector LayoutMultiSchemaField writes when switching to an option whose selector the defaults fill alike', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      default: { p: { kind: 'a' } },
      properties: {
        p: {
          type: 'object',
          discriminator: { propertyName: 'kind' },
          oneOf: [
            { title: 'A', properties: { kind: { type: 'string', default: 'a' } } },
            { title: 'B', properties: { kind: { type: 'string', default: 'b' } } },
          ],
        },
      },
    };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { container } = render(
      <Form
        ref={ref}
        schema={schema}
        uiSchema={{ p: { 'ui:field': 'LayoutMultiSchemaField', 'ui:fieldReplacesAnyOrOneOf': true } }}
        validator={validator}
        defaultFormStateBehavior={{ nestedDefaultsPrecedence: 'ancestorWins' }}
      />,
    );
    expect(handleOf(ref).getFormData()).toEqual({ p: { kind: 'a' } });

    await user.click(input(container, 'root_p__1'));

    expect(handleOf(ref).getFormData()).toEqual({ p: { kind: 'b' } });
  });
  // An item is filled out by its array's `required`, and written whatever `emptyObjectFields` says of a property
  it.each<{ name: string; behavior: DefaultFormStateBehavior; expected: unknown }>([
    {
      name: 'keeps the padding an optional array never filled',
      behavior: { arrayMinItems: { populate: 'requiredOnly' } },
      expected: ['x', 'd'],
    },
    {
      name: 'drops the padding its old default was filled out to',
      behavior: { emptyObjectFields: 'skipDefaults' },
      expected: ['y', 'd'],
    },
  ])('$name in an item of an optional array', ({ behavior, expected }) => {
    const withDefault = (v: string): RJSFSchema => ({
      type: 'object',
      properties: {
        outer: {
          type: 'array',
          items: { type: 'array', minItems: 2, default: [v], items: { type: 'string', default: 'd' } },
        },
      },
    });
    const props = { validator, defaultFormStateBehavior: behavior, initialFormData: { outer: [['x', 'd']] } };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={withDefault('x')} {...props} />);

    rerender(<Form ref={ref} schema={withDefault('y')} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual({ outer: [expected] });
  });
  it('fills an object its old default filled out through a ui:definitions entry below it out anew', () => {
    const withDefault = (v: string): RJSFSchema => ({
      $defs: { V: { default: { a: v }, properties: { a: { type: 'string' }, b: { type: 'string' } } } },
      type: 'object',
      properties: { v: { $ref: '#/$defs/V' } },
    });
    const props = { validator, uiSchema: { 'ui:definitions': { '#/$defs/V': { b: { 'ui:initialValue': 'i' } } } } };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={withDefault('x')} {...props} />);
    expect(handleOf(ref).getFormData()).toEqual({ v: { a: 'x', b: 'i' } });

    rerender(<Form ref={ref} schema={withDefault('y')} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual({ v: { a: 'y', b: 'i' } });
  });
  // The field's own `ui:initialValue` replaced its `default`, which played no part in the value, as a fresh mount with
  // the new schema still shows
  it.each<{ name: string; field: (v: string) => RJSFSchema; initialValue: unknown; uiSchema?: UiSchema }>([
    { name: 'a scalar', field: (v) => ({ type: 'string', default: v }), initialValue: 'i' },
    {
      name: 'an object',
      // Untyped, so its object default is judged whole rather than key by key
      field: (v) => ({ default: { a: v }, properties: { a: { type: 'string' } } }),
      initialValue: { a: 'i' },
    },
    {
      name: "an object, through its $ref's ui:definitions entry,",
      field: (v) => ({ $ref: '#/$defs/V', $defs: { V: { default: { a: v }, properties: { a: { type: 'string' } } } } }),
      initialValue: { a: 'i' },
      uiSchema: { 'ui:definitions': { '#/$defs/V': { 'ui:initialValue': { a: 'i' } } } },
    },
  ])('keeps $name its own ui:initialValue filled when its default changes', ({ field, initialValue, uiSchema }) => {
    const withDefault = (v: string): RJSFSchema => {
      const { $defs, ...own } = field(v);
      return { type: 'object', $defs, properties: { v: own } };
    };
    const props = { validator, uiSchema: uiSchema ?? { v: { 'ui:initialValue': initialValue } } };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={withDefault('x')} {...props} />);
    expect(handleOf(ref).getFormData()).toEqual({ v: initialValue });

    rerender(<Form ref={ref} schema={withDefault('y')} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual({ v: initialValue });
  });
  // An `items` `ui:initialValue` replaces every item the default seeded, so the value holds none of the default, and a
  // fresh mount with the new schema still shows it
  it.each<{ name: string; array: (v: string) => RJSFSchema; initialFormData?: unknown; expected: string[] }>([
    {
      name: 'its one item',
      array: (v) => ({ type: 'array', items: { type: 'string' }, default: [v] }),
      expected: ['i'],
    },
    {
      name: 'its one saved item',
      array: (v) => ({ type: 'array', items: { type: 'string' }, default: [v] }),
      initialFormData: { t: ['i'] },
      expected: ['i'],
    },
    {
      name: 'its two items',
      array: (v) => ({ type: 'array', items: { type: 'string' }, default: [v, v] }),
      expected: ['i', 'i'],
    },
    {
      name: 'its items padded to minItems',
      array: (v) => ({ type: 'array', minItems: 2, items: { type: 'string' }, default: [v] }),
      expected: ['i', 'i'],
    },
  ])(
    "keeps an array $name its items' ui:initialValue filled when its default changes",
    ({ array, initialFormData, expected }) => {
      const withDefault = (v: string): RJSFSchema => ({ type: 'object', properties: { t: array(v) } });
      const props = { validator, uiSchema: { t: { items: { 'ui:initialValue': 'i' } } }, initialFormData };
      const ref = createRef<FormRef<Record<string, unknown>>>();
      const { rerender } = render(<Form ref={ref} schema={withDefault('x')} {...props} />);
      expect(handleOf(ref).getFormData()).toEqual({ t: expected });

      rerender(<Form ref={ref} schema={withDefault('y')} {...props} />);

      expect(handleOf(ref).getFormData()).toEqual({ t: expected });
    },
  );
  // The item is filled through the option it shows, which the field's own fill reads and a fill of its raw schema alone
  // doesn't
  it('takes the new default for an array whose items render through an option', () => {
    const option = (k: string) => ({ properties: { a: { type: 'string' }, k: { const: k, default: k } } }) as const;
    const withDefault = (v: string): RJSFSchema => ({
      type: 'object',
      properties: { t: { type: 'array', default: [{ a: v }], items: { oneOf: [option('A'), option('B')] } } },
    });
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={withDefault('x')} validator={validator} />);

    rerender(<Form ref={ref} schema={withDefault('y')} validator={validator} />);

    expect(handleOf(ref).getFormData()).toEqual({ t: [{ a: 'y' }] });
  });
  // Applied only on mount, the initial value is filled out anew from a default of another length, as a fresh mount
  // with the new schema fills it
  it.each<{ from: string[]; to: string[]; expected: string[] }>([
    { from: ['x'], to: ['x', 'x'], expected: ['i', 'i'] },
    { from: ['x'], to: ['y', 'y'], expected: ['i', 'i'] },
    { from: ['x', 'x'], to: ['y'], expected: ['i'] },
  ])(
    "fills an array its items' ui:initialValue filled out anew when its default turns from $from to $to",
    ({ from, to, expected }) => {
      const withDefault = (d: string[]): RJSFSchema => ({
        type: 'object',
        properties: { t: { type: 'array', items: { type: 'string' }, default: d } },
      });
      const props = { validator, uiSchema: { t: { items: { 'ui:initialValue': 'i' } } } };
      const ref = createRef<FormRef<Record<string, unknown>>>();
      const { rerender } = render(<Form ref={ref} schema={withDefault(from)} {...props} />);

      rerender(<Form ref={ref} schema={withDefault(to)} {...props} />);

      expect(handleOf(ref).getFormData()).toEqual({ t: expected });
      const fresh = createRef<FormRef<Record<string, unknown>>>();
      render(<Form ref={fresh} schema={withDefault(to)} {...props} />);
      expect(handleOf(fresh).getFormData()).toEqual({ t: expected });
    },
  );
  // The new default is filled out by the `required` the new schema gives the field, which `minItems` pads by
  it.each<{ from: boolean; to: boolean; fromDefault: string[]; expected: string[] }>([
    { from: true, to: false, fromDefault: ['x'], expected: ['i'] },
    { from: false, to: true, fromDefault: ['x', 'x', 'x'], expected: ['i', 'i'] },
  ])(
    "fills an array its items' ui:initialValue filled out anew as required $to from required $from",
    ({ from, to, fromDefault, expected }) => {
      const withDefault = (isRequired: boolean, d: string[]): RJSFSchema => ({
        type: 'object',
        required: isRequired ? ['t'] : [],
        properties: { t: { type: 'array', minItems: 2, items: { type: 'string' }, default: d } },
      });
      const props = {
        validator,
        uiSchema: { t: { items: { 'ui:initialValue': 'i' } } },
        defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } as DefaultFormStateBehavior,
      };
      const ref = createRef<FormRef<Record<string, unknown>>>();
      const { rerender } = render(<Form ref={ref} schema={withDefault(from, fromDefault)} {...props} />);

      rerender(<Form ref={ref} schema={withDefault(to, ['y'])} {...props} />);

      expect(handleOf(ref).getFormData()).toEqual({ t: expected });
      const fresh = createRef<FormRef<Record<string, unknown>>>();
      render(<Form ref={fresh} schema={withDefault(to, ['y'])} {...props} />);
      expect(handleOf(fresh).getFormData()).toEqual({ t: expected });
    },
  );
  // With no old default to tell them by, what the uiSchema filled in is kept as saved data is, as for any field
  it.each<{ name: string; uiSchema: UiSchema; initialFormData: Record<string, unknown>; expected: string }>([
    { name: 'a saved readOnly value', uiSchema: {}, initialFormData: { id: 'saved-123' }, expected: 'saved-123' },
    {
      name: 'the readOnly value a ui:initialValue filled in',
      uiSchema: { id: { 'ui:initialValue': 'a' } },
      initialFormData: {},
      expected: 'a',
    },
  ])('keeps $name when a conditional first gives it a default', async ({ uiSchema, initialFormData, expected }) => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { flag: { type: 'boolean' }, id: { type: 'string', readOnly: true } },
      if: { properties: { flag: { const: true } }, required: ['flag'] },
      then: { properties: { id: { default: 'gen' } } },
    };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { container } = render(
      <Form ref={ref} schema={schema} uiSchema={uiSchema} validator={validator} initialFormData={initialFormData} />,
    );

    await user.click(input(container, 'root_flag'));

    expect(handleOf(ref).getFormData()).toEqual({ flag: true, id: expected });
  });
  // A `readOnly` value gives way only to a new default, read from the field's own schema, as `sanitizeDataForNewSchema()`
  // reads it, a select's whole value included
  it.each<{ name: string; from: RJSFSchema; to: RJSFSchema; data: unknown; expected: unknown }>([
    {
      name: 'keeps a readOnly value when only its enum changes',
      from: { type: 'string', readOnly: true, default: 'draft', enum: ['draft', 'approved'] },
      to: { type: 'string', readOnly: true, default: 'draft', enum: ['draft', 'approved', 'final'] },
      data: 'approved',
      expected: 'approved',
    },
    {
      name: "swaps a readOnly select's object value for its new default",
      from: { type: 'object', readOnly: true, default: { a: 1 }, enum: [{ a: 1 }, { a: 2 }, { a: 3 }] },
      to: { type: 'object', readOnly: true, default: { a: 2 }, enum: [{ a: 1 }, { a: 2 }, { a: 3 }] },
      data: { a: 3 },
      expected: { a: 2 },
    },
    {
      name: 'keeps a readOnly object that is no select, judging it key by key',
      from: { type: 'object', readOnly: true, default: { a: 'x' }, properties: { a: { type: 'string' } } },
      to: { type: 'object', readOnly: true, default: { a: 'y' }, properties: { a: { type: 'string' } } },
      data: { a: 'k' },
      expected: { a: 'k' },
    },
    {
      name: 'keeps a value only its option declares readOnly',
      from: { default: 'x', oneOf: [{ type: 'string', readOnly: true }] },
      to: { default: 'y', oneOf: [{ type: 'string', readOnly: true }] },
      data: 'k',
      expected: 'k',
    },
  ])('$name', ({ from, to, data, expected }) => {
    const wrap = (value: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { value } });
    const props = { validator, initialFormData: { value: data } };
    const ref = createRef<FormRef<{ value?: unknown }>>();
    const { rerender } = render(<Form ref={ref} schema={wrap(from)} {...props} />);

    rerender(<Form ref={ref} schema={wrap(to)} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual({ value: expected });
  });
  // A key an old `true` held is judged by the schema it takes, as any field whose constraints changed
  it.each<{ name: string; to: RJSFSchema; data: Record<string, unknown>; expected: unknown }>([
    {
      name: 'swaps the value a new const rejects for the const',
      to: { type: 'object', properties: { a: { const: 'c' } } },
      data: { a: 'k' },
      expected: { a: 'c' },
    },
    {
      name: 'fills a clear with the new default',
      to: { type: 'object', default: { a: 'y' }, properties: { a: { type: 'string' } } },
      data: { a: undefined },
      expected: { a: 'y' },
    },
  ])('$name of a key that was true', ({ to, data, expected }) => {
    const from: RJSFSchema = { type: 'object', default: { a: 'x' }, properties: { a: true } };
    const props = { validator, initialFormData: data };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={from} {...props} />);

    rerender(<Form ref={ref} schema={to} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual(expected);
  });
  // Under `populateRequiredDefaults` the defaults fill a property only where it is required and so is its object, or its
  // object is the root, so a value equal to the default of any other is the user's
  it.each<{ name: string; withDefault: (v: string) => RJSFSchema; data: Record<string, unknown>; expected: unknown }>([
    {
      name: 'keeps an optional property holding its old default',
      withDefault: (v) => ({ type: 'object', properties: { v: { type: 'string', default: v } } }),
      data: { v: 'x' },
      expected: { v: 'x' },
    },
    {
      name: 'swaps a required property of the root holding its old default',
      withDefault: (v) => ({ type: 'object', required: ['v'], properties: { v: { type: 'string', default: v } } }),
      data: { v: 'x' },
      expected: { v: 'y' },
    },
    {
      name: 'keeps a required property of an optional object holding its old default',
      withDefault: (v) => ({
        type: 'object',
        required: [],
        properties: { o: { type: 'object', required: ['v'], properties: { v: { type: 'string', default: v } } } },
      }),
      data: { o: { v: 'x' } },
      expected: { o: { v: 'x' } },
    },
    {
      // The defaults hand such an object no `required`, so they fill its required properties as the root's
      name: 'swaps a required property of an object its parent lists no required for, holding its old default',
      withDefault: (v) => ({
        type: 'object',
        properties: { o: { type: 'object', required: ['v'], properties: { v: { type: 'string', default: v } } } },
      }),
      data: { o: { v: 'x' } },
      expected: { o: { v: 'y' } },
    },
    {
      name: 'swaps a required property of a required object holding its old default',
      withDefault: (v) => ({
        type: 'object',
        required: ['o'],
        properties: { o: { type: 'object', required: ['v'], properties: { v: { type: 'string', default: v } } } },
      }),
      data: { o: { v: 'x' } },
      expected: { o: { v: 'y' } },
    },
    // The defaults fill an object key by key, leaving its optional keys out of a default they write
    ...[
      { required: [], expected: { o: { a: 'x' } } },
      { required: ['a'], expected: { o: { a: 'y' } } },
    ].map(({ required, expected }) => ({
      name: `${required.length ? 'swaps a required' : 'keeps an optional'} key of a required object holding its old default`,
      withDefault: (a: string): RJSFSchema => ({
        type: 'object',
        required: ['o'],
        properties: {
          o: { type: 'object', required, default: { a }, properties: { a: { type: 'string' }, b: { type: 'string' } } },
        },
      }),
      data: { o: { a: 'x' } },
      expected,
    })),
    {
      // An object with a `true` property is judged whole, against the default the defaults write once they leave its
      // optional keys out
      name: 'keeps an optional key of a required object with a true property, holding its old default',
      withDefault: (a) => ({
        type: 'object',
        required: ['o'],
        properties: { o: { type: 'object', default: { a }, properties: { a: true } } },
      }),
      data: { o: { a: 'x' } },
      expected: { o: { a: 'x' } },
    },
  ])("$name under emptyObjectFields: 'populateRequiredDefaults'", ({ withDefault, data, expected }) => {
    const from = withDefault('x');
    const to = withDefault('y');
    const defaultFormStateBehavior: DefaultFormStateBehavior = { emptyObjectFields: 'populateRequiredDefaults' };
    const props = { validator, initialFormData: data, defaultFormStateBehavior };
    const ref = createRef<FormRef<Record<string, unknown>>>();
    const { rerender } = render(<Form ref={ref} schema={from} {...props} />);

    rerender(<Form ref={ref} schema={to} {...props} />);

    expect(handleOf(ref).getFormData()).toEqual(expected);
    const utils = createSchemaUtils({ validator, defaultFormStateBehavior }, to);
    expect(utils.sanitizeDataForNewSchema(to, from, data)).toEqual(expected);
  });
  // The option renders as the field showing it, so the field's own default is no ancestor's the option gives way to
  it.each<DefaultFormStateBehavior['nestedDefaultsPrecedence']>(['ancestorWins', undefined])(
    "swaps a property holding its option's old default over the field's own under nestedDefaultsPrecedence %s",
    (nestedDefaultsPrecedence) => {
      const schemaWith = (optionDefault: string): RJSFSchema => ({
        type: 'object',
        properties: { x: { default: 'a', oneOf: [{ type: 'string', default: optionDefault }] } },
      });
      const ref = createRef<FormRef<{ x?: string }>>();
      const props = { validator, defaultFormStateBehavior: { nestedDefaultsPrecedence } };
      const { rerender } = render(<Form ref={ref} schema={schemaWith('b')} {...props} />);
      expect(handleOf(ref).getFormData()).toEqual({ x: 'b' });

      rerender(<Form ref={ref} schema={schemaWith('c')} {...props} />);

      expect(handleOf(ref).getFormData()).toEqual({ x: 'c' });
    },
  );
});
