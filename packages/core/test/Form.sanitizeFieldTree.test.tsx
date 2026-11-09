import { createRef, useState } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { buttonId, getByPath } from '@rjsf/utils';
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
      }: { whenAbsent?: 'allow'; initialFormData?: KindData } = {},
    ) {
      const events: IChangeEvent<KindData>[] = [];
      const { container } = render(
        <Form<KindData>
          schema={schema}
          validator={validator}
          additionalPropertiesWhenAbsent={whenAbsent}
          initialFormData={initialFormData}
          onChange={(event) => events.push(event)}
        />,
      );
      await user.selectOptions(elementOf(container, '#root_kind'), 't');
      return { container, formData: events[events.length - 1].formData };
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

    it('drops an array inside a kept object, leaving the object its extra key renders', async () => {
      const schema = kindOf(
        ifThen({ type: 'object', properties: { b: { type: 'array', items: { type: 'string' } } } }),
      );
      const { container, formData } = await selectT(schema, {
        whenAbsent: 'allow',
        initialFormData: { kind: 's', a: { b: ['x'] } },
      });

      expect(formData).toEqual({ kind: 't', a: {} });
      expect(container.querySelector('#root_a__key')).not.toBeNull();
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
    it.each<{ filled: string; schema: RJSFSchema; initialFormData?: KindData }>([
      {
        filled: 'a default',
        schema: kindOf({ ...ifThen({ type: 'string', default: 'd' }), additionalProperties: true }),
      },
      { filled: 'a const', schema: kindOf({ ...ifThen({ type: 'string', const: 'x' }), additionalProperties: true }) },
      {
        filled: "a required object's empty object",
        schema: kindOf({
          ...ifThen({ type: 'object', properties: { b: { type: 'string' } } }),
          required: ['a'],
          additionalProperties: true,
        }),
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
    ])('drops $filled rather than keeping it as an extra key', async ({ schema, initialFormData = { kind: 's' } }) => {
      const { container, formData } = await selectT(schema, { initialFormData });

      expect(formData).toEqual({ kind: 't' });
      expect(container.querySelector('#root_a__key')).toBeNull();
    });

    it('drops a value the user chose that equals the default, which no data tells apart from the default', async () => {
      const schema = kindOf({
        ...ifThen({ type: 'string', enum: ['d', 'e'], default: 'd' }),
        additionalProperties: true,
      });
      const { formData } = await selectT(schema, { initialFormData: { kind: 's', a: 'd' } });

      expect(formData).toEqual({ kind: 't' });
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
