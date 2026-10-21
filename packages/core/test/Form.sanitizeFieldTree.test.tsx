import { createRef, useEffect, useState } from 'react';
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
    await user.click(container.querySelector(`#${buttonId('root_list', 'add')}`)!);
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

  it('judges each edit of a parent-owned form against the value the parent rendered (#5250 controlled)', async () => {
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
    await user.selectOptions(container.querySelector('#root_pet_mode')!, ['0']);
    await user.selectOptions(container.querySelector('#root_pet_color')!, ['1']);
    await user.selectOptions(container.querySelector('#root_pet_mode')!, ['1']);
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
    await user.selectOptions(container.querySelector('#root_cond')!, ['1']);
    // The reset restores the initial data, which the next flip is judged against
    act(() => ref.current!.reset());
    // Flip again: judged against the restored data on the then branch, 'a' is a real difference and clears
    await user.selectOptions(container.querySelector('#root_cond')!, ['1']);
    const last = events[events.length - 1].formData;
    expect(last?.pick).toBeUndefined();
  });

  it('judges an edit against a proposal the parent accepted as a deep-equal copy (#5250 controlled)', async () => {
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
    // A store that clones on write: the value handed back to the form is never the proposal's reference
    const { container } = render(
      <TransformingParent<PetData>
        schema={schema}
        initialValue={{ pet: { mode: 'strict', color: 'r' } }}
        log={log}
        transform={(proposal) => (proposal === undefined ? proposal : structuredClone(proposal))}
      />,
    );
    await user.selectOptions(container.querySelector('#root_pet_mode')!, ['0']);
    await user.selectOptions(container.querySelector('#root_pet_color')!, ['1']);
    await user.selectOptions(container.querySelector('#root_pet_mode')!, ['1']);
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
    // A parent that widens the schema in the same update that hands the first proposal back, then accepts as usual
    function SwappingOnceParent() {
      const [value, setValue] = useState<PetData | undefined>({ pet: { mode: 'strict', color: 'r' } });
      const [schema, setSchema] = useState<RJSFSchema>(baseSchema);
      Object.assign(log, { value });
      return (
        <Form<PetData>
          schema={schema}
          validator={validator}
          formData={value}
          onChange={(event) => {
            log.proposals.push(event.formData);
            log.events.push(event);
            setValue(event.formData);
            setSchema(widenedSchema);
          }}
        />
      );
    }
    const { container } = render(<SwappingOnceParent />);
    await user.selectOptions(container.querySelector('#root_pet_mode')!, ['0']);
    await user.selectOptions(container.querySelector('#root_pet_color')!, ['1']);
    await user.selectOptions(container.querySelector('#root_pet_mode')!, ['1']);
    expect(log.value?.pet.color).toBe('r');
  });

  it('judges an edit against the value a parent pushed across a conditional branch (#5250)', async () => {
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
    const onChange = (event: IChangeEvent<ModeData>) => events.push(event);
    const props = {
      schema,
      validator,
      onChange,
    };
    // A parent-owned form whose parent pushes a value of its own that matches no proposal
    const { container, rerender } = render(<Form<ModeData> {...props} formData={{ mode: 'basic', colors: [] }} />);
    rerender(<Form<ModeData> {...props} formData={{ mode: 'advanced', color: 'c', colors: ['c'] }} />);
    await user.selectOptions(container.querySelector('#root_mode')!, ['0']);
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
    await user.click(container.querySelector(`#${buttonId('root_rows_0', 'remove')}`)!);
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

  it('keeps the surviving row paired with its own previous value in a parent-owned form (#5451)', async () => {
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
    await user.click(container.querySelector(`#${buttonId('root_rows_0', 'remove')}`)!);
    await user.type(input(container, 'root_note'), 'n');
    expect(log.value?.rows).toEqual([{ kind: 'y', tags: [null, null] }]);
  });

  it('keeps the rows of a parent push whose constraints an edit does not change (#5451)', async () => {
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
    const pusher: { push: (value: PairData | undefined) => void } = { push: () => undefined };
    // A parent that accepts proposals as usual, then pushes a value of its own that matches none of them
    function PushingParent() {
      const [value, setValue] = useState<PairData | undefined>({
        rows: [
          { kind: 'x', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
        ],
      });
      useEffect(() => {
        pusher.push = setValue;
      }, []);
      Object.assign(log, { value });
      return (
        <Form<PairData>
          schema={schema}
          validator={validator}
          formData={value}
          onChange={(event) => {
            log.proposals.push(event.formData);
            log.events.push(event);
            setValue(event.formData);
          }}
        />
      );
    }
    const { container } = render(<PushingParent />);
    // A push the form did not propose: the parent owns its value, and no sanitize runs on it
    act(() =>
      pusher.push({
        rows: [
          { kind: 'x', tags: [null, null] },
          { kind: 'x', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
        ],
      }),
    );
    await user.click(container.querySelector(`#${buttonId('root_rows_0', 'remove')}`)!);
    await user.type(input(container, 'root_note'), 'n');
    // The remove is paired by its announced move, so no row's constraints change and every placeholder stays
    expect(log.value?.rows).toEqual([
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
    await user.click(container.querySelector(`#${buttonId('root_rows', 'add')}`)!);
    await user.type(input(container, 'root_note'), 'n');
    const last = events[events.length - 1].formData;
    expect(last?.rows).toEqual([{ kind: 'x', tags: [null, null] }, { tags: [undefined, undefined] }]);
  });

  it('leaves a value a schema the parent swapped in rejects to the parent', async () => {
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
    // A parent that accepts every proposal and narrows color's enum in the same update that hands the first one back
    function SwappingParent() {
      const [value, setValue] = useState<SwapData | undefined>({ color: 'g' });
      const [schema, setSchema] = useState<RJSFSchema>(wideSchema);
      return (
        <Form<SwapData>
          schema={schema}
          validator={validator}
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
    // The narrow schema arrives beside the parent's push, which no sanitize judges, and the next edit changes no
    // constraint of `color`: the parent owns its value, and validation reports what the schema rejects
    await user.type(input(container, 'root_name'), 'a');
    await user.type(input(container, 'root_name'), 'b');
    const last = events[events.length - 1].formData;
    expect(last).toEqual({ color: 'g', name: 'ab' });
  });

  it('judges each edit of a live-validated parent-owned form', async () => {
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
    await user.selectOptions(container.querySelector('#root_mode')!, ['0']);
    await user.selectOptions(container.querySelector('#root_color')!, ['1']);
    // The flip back narrows color: 'g' cannot stand
    await user.selectOptions(container.querySelector('#root_mode')!, ['1']);
    expect(log.value?.color).toBe('r');
  });

  it("judges the second of two edits in one event against the first one's proposal", async () => {
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
          formData={value}
          onChange={(event) => {
            log?.proposals.push(event.formData);
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
    await user.click(container.querySelector(`#${buttonId('root_rows', 'add')}`)!);
    await user.selectOptions(container.querySelector('#root_rows_0_kind')!, ['1']);
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
    await user.click(container.querySelector(`#${buttonId('root_rows_1', 'moveUp')}`)!);
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
    await user.click(container.querySelector(`#${buttonId('root_rows', 'add')}`)!);
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
    await user.click(container.querySelector(`#${buttonId('root_rows', 'add')}`)!);
    await user.selectOptions(container.querySelector('#root_rows_0_kind')!, ['0']);
    // The narrowed branch filters the placeholder items, so the 'a' goes in through an explicit add
    await user.click(container.querySelector(`#${buttonId('root_rows_0_tags', 'add')}`)!);
    await user.selectOptions(container.querySelector('#root_rows_0_tags_0')!, ['0']);
    await user.selectOptions(container.querySelector('#root_rows_0_kind')!, ['1']);
    const last = events[events.length - 1].formData;
    expect(last?.rows?.[0]?.tags).toEqual([]);
  });
  it('keeps each row paired with its own previous value when the parent declines a reorder (#5451)', async () => {
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
      <TransformingParent<PairData>
        schema={schema}
        initialValue={{
          rows: [
            { kind: 'x', tags: [null, null] },
            { kind: 'y', tags: [null, null] },
          ],
        }}
        log={log}
        // A parent that declines any change to the leading row's kind, answering the reorder with the
        // value it already held
        transform={(proposal) => (proposal?.rows?.[0]?.kind !== log.value?.rows?.[0]?.kind ? log.value : proposal)}
      />,
    );
    // The reorder is declined, so the sibling edit is judged against the rows as the parent kept them, and both
    // rows keep the placeholders their branches offer
    await user.click(container.querySelector(`#${buttonId('root_rows_0', 'moveDown')}`)!);
    await user.type(input(container, 'root_note'), 'n');
    expect(log.value?.rows).toEqual([
      { kind: 'x', tags: [null, null] },
      { kind: 'y', tags: [null, null] },
    ]);
  });

  it('leaves a row the parent pushed unannounced to the parent (#5451)', async () => {
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
    let appended = false;
    const { container } = render(
      <TransformingParent<PairData>
        schema={schema}
        initialValue={{
          rows: [
            { kind: 'x', tags: [null, null] },
            { kind: 'y', tags: [null, null] },
          ],
        }}
        log={log}
        // A parent that appends a row of its own, unannounced, on the first note edit
        transform={(proposal) => {
          if (!appended && proposal?.note !== undefined) {
            appended = true;
            return { ...proposal, rows: [...(proposal.rows ?? []), { kind: 'y', tags: ['a', 'a'] }] };
          }
          return proposal;
        }}
      />,
    );
    await user.type(input(container, 'root_note'), 'n');
    await user.click(container.querySelector(`#${buttonId('root_rows_0', 'remove')}`)!);
    await user.type(input(container, 'root_note'), 'n');
    const rows = log.value?.rows;
    // The parent owns the row it pushed, and no edit changes its constraints, so it keeps the tags its branch
    // rejects for validation to report
    expect(rows?.[1]).toEqual({ kind: 'y', tags: ['a', 'a'] });
  });

  it('leaves a root-level row the parent pushed unannounced to the parent (#5451)', async () => {
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
    const log = createParentLog<Row[]>();
    let appended = false;
    const { container } = render(
      <TransformingParent<Row[]>
        schema={schema}
        initialValue={[
          { kind: 'x', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
        ]}
        log={log}
        // A parent that appends a row of its own, unannounced, on the first note edit
        transform={(proposal) => {
          if (!appended && proposal?.[0]?.note !== undefined) {
            appended = true;
            return [...(proposal ?? []), { kind: 'y', tags: ['a', 'a'] }];
          }
          return proposal;
        }}
      />,
    );
    await user.type(input(container, 'root_0_note'), 'n');
    await user.click(container.querySelector(`#${buttonId('root_0', 'remove')}`)!);
    await user.type(input(container, 'root_0_note'), 'n');
    const rows = log.value;
    // The parent owns the row it pushed, and no edit changes its constraints, so it keeps the tags its branch
    // rejects for validation to report
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
    await user.click(container.querySelector(`#${buttonId('root_0', 'moveDown')}`)!);
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
    await user.selectOptions(container.querySelector('#root_kind')!, 'b');
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

    it('leaves the value of a parent-owned form to the parent, at the push and at the next edit', async () => {
      const events: IChangeEvent<{ color?: string; unrelated?: string }>[] = [];
      const props = {
        validator,
        onChange: (event: IChangeEvent<{ color?: string; unrelated?: string }>) => events.push(event),
      };
      const { container, rerender } = render(
        <Form schema={colorSchema(['a', 'b'])} formData={{ color: 'b' }} {...props} />,
      );

      rerender(<Form schema={colorSchema(['a'])} formData={{ color: 'b' }} {...props} />);
      await user.type(input(container, 'root_unrelated'), 'x');

      expect(events[events.length - 1].formData).toEqual({ color: 'b', unrelated: 'x' });
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
