import { createRef, useEffect, useState } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { buttonId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormRef, IChangeEvent } from '../src/index.ts';
import Form from '../src/index.ts';
import { AcceptingParent, createParentLog, handleOf, input, TransformingParent } from './testUtils.tsx';

interface ColorListData {
  color?: string;
  list?: (string | null)[];
  name?: string;
}

const user = userEvent.setup();

describe('settled snapshot sanitization', () => {
  it('sees a top-level conditional flipped by a declined change from the settled side (#5250)', async () => {
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
    // The array write is declined, but it flips the conditional: the settled snapshot must remember the
    // schema the settled data was resolved under, not the committed data's schema with the `then` merged in
    await user.click(container.querySelector(`#${buttonId('root_list', 'add')}`)!);
    await user.type(input(container, 'root_name'), 'a');
    const last = events[events.length - 1].formData;
    expect(last?.color).toBe('r');
  });

  it('advances the snapshot when a parent accepts a sanitized proposal unchanged (#5250 controlled)', async () => {
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

  it('settles the snapshot on reset, so a flip back to the restored branch filters again (#5250)', async () => {
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
    // Flip to the else branch: 'a' is outside its enum and clears, and the snapshot settles there
    await user.selectOptions(container.querySelector('#root_cond')!, ['1']);
    // The reset restores the initial data; the snapshot must settle on it, or the next flip is judged against
    // the else branch the first flip left behind
    act(() => ref.current!.reset());
    // Flip again: judged against the restored data on the then branch, 'a' is a real difference and clears
    await user.selectOptions(container.querySelector('#root_cond')!, ['1']);
    const last = events[events.length - 1].formData;
    expect(last?.pick).toBeUndefined();
  });

  it('settles a proposal the parent accepted as a deep-equal copy (#5250 controlled)', async () => {
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

  it('keeps settling accepted proposals after the parent changed the schema once (#5451)', async () => {
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

  it('sanitizes a parent push that crossed a conditional branch without settling (#5250)', async () => {
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
    // The remove is declined, but the snapshot's rows move with the data's, so the surviving row still
    // pairs with its own previous value: the sibling edit's sanitize finds no schema change for it and
    // keeps the placeholders its branch offers
    await user.click(container.querySelector(`#${buttonId('root_rows_0', 'remove')}`)!);
    await user.type(input(container, 'root_note'), 'n');
    const last = events[events.length - 1].formData;
    expect(last?.rows).toEqual([{ kind: 'y', tags: [null, null] }]);
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

  it('drops the pairing view when an unannounced change desynced its length from the data (#5451)', async () => {
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
    // A push the form did not propose desyncs the pairing view's length from the data's
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
    // The desynced length drops only the rows array from the view, so each row pairs with no previous value
    // and is filtered against its own branch: a stale value is never kept, though the placeholders go with it
    expect(log.value?.rows).toEqual([
      { kind: 'x', tags: [] },
      { kind: 'y', tags: [] },
      { kind: 'y', tags: [] },
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

  it('does not settle an accepted proposal under a schema the parent swapped in beside the push', async () => {
    interface SwapData {
      color?: string;
      name?: string;
    }
    // The conditional on `name` makes every edit run the sanitize pass; without one an edit resolves the same
    // schema and nothing is checked, the same as the existing swap tests
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
    // The proposal carrying 'g' is accepted, but the narrow schema arrives beside the push, so the snapshot must
    // not settle under it
    await user.type(input(container, 'root_name'), 'a');
    // The next edit sanitizes without a settled counterpart, so a value the narrow schema rejects is replaced
    // with the option left, the way a swap with no proposal in flight is handled
    await user.type(input(container, 'root_name'), 'b');
    const last = events[events.length - 1].formData;
    expect(last).toEqual({ color: 'r', name: 'ab' });
  });

  it('settles an accepted proposal in a live-validated form', async () => {
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
    // The flip back narrows color against the snapshot the accepted proposals settled: 'g' cannot stand
    await user.selectOptions(container.querySelector('#root_mode')!, ['1']);
    expect(log.value?.color).toBe('r');
  });

  it('settles the stacked proposal two edits in one event propose', async () => {
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
    // Two edits in one event: the second is stacked on the first's pending proposal, and that stacked proposal
    // is the one the parent answers
    act(() => {
      handleOf(ref).setFieldValue('mode', 'open');
      handleOf(ref).setFieldValue('color', 'g');
    });
    // With the stacked proposal settled under 'open', flipping to strict filters 'g'; a snapshot stuck at
    // construction resolves 'strict' on both sides and keeps it
    act(() => handleOf(ref).setFieldValue('mode', 'strict'));
    expect(log.value).toEqual({ mode: 'strict', color: 'r' });
  });

  it('settles the value actually sent when an edit clears a field', async () => {
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
    // first built; that answered value is the one that must settle
    await user.clear(input(container, 'root_note'));
    // The conditional is off while the note is clear, so 'g' settles with it; writing the note back flips it
    // on and the settled side still accepts 'g', so the filter replaces it
    await user.type(input(container, 'root_note'), 'x');
    expect(log.value).toEqual({ note: 'x', color: 'r' });
  });

  it('filters a flipped row against its own value when an unchecked insert left no trusted previous row', async () => {
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
    // The add is an array write, so no sanitize runs and the snapshot keeps its one row; the kind flip then
    // faces two committed rows against one settled one, so the flipped row is filtered against its own
    // value alone and the 'a' the y-branch rejects goes, the way v7 and 99229b1 removed it
    await user.click(container.querySelector(`#${buttonId('root_rows', 'add')}`)!);
    await user.selectOptions(container.querySelector('#root_rows_0_kind')!, ['1']);
    const last = events[events.length - 1].formData;
    expect(last?.rows?.[0]).toEqual({ kind: 'y', tags: [] });
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
    // The reorder is declined, but the snapshot's rows move with the data's, so each row still pairs with
    // its own previous value: the sibling edit's sanitize finds no schema change for either and keeps the
    // placeholders their branches offer
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
    // The add is declined, but the snapshot's rows move with the data's: the first row still pairs with its
    // own previous value, so the sibling edit's sanitize keeps its placeholders, and the added row has no
    // previous value of its own
    await user.click(container.querySelector(`#${buttonId('root_rows', 'add')}`)!);
    await user.type(input(container, 'root_note'), 'n');
    const last = events[events.length - 1].formData;
    expect(last?.rows?.[0]).toEqual({ kind: 'x', tags: [null, null] });
    expect(last?.rows).toHaveLength(2);
  });

  it('filters a row flipping into the narrowed branch when no previous array settled', async () => {
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
    // The row is added and filled without a settled array behind it, so its filter runs the way v7 ran every
    // row's: the flip into the y-branch is a real difference and the 'a' it rejects goes. Resolving the old
    // side against `undefined` instead would satisfy both `if`s vacuously, read the merge as agreement, and
    // keep the stale value
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
    // The reorder is declined, so the moved view never adopts: the sibling edit pairs each row with its
    // own previous value, and both rows keep the placeholders their branches offer
    await user.click(container.querySelector(`#${buttonId('root_rows_0', 'moveDown')}`)!);
    await user.type(input(container, 'root_note'), 'n');
    expect(log.value?.rows).toEqual([
      { kind: 'x', tags: [null, null] },
      { kind: 'y', tags: [null, null] },
    ]);
  });

  it('filters a row the parent pushed unannounced instead of pairing it with a surviving row (#5451)', async () => {
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
    // The desynced length drops only the rows array from the view, so the pushed row pairs with no
    // previous value and is filtered against its own branch: the tags 'y' never offered go
    expect(rows?.[1]).toEqual({ kind: 'y', tags: [] });
  });

  it('filters a root-level row the parent pushed unannounced after a length desync (#5451)', async () => {
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
    // The dropped root view reads as no settled data at all, so the pushed row pairs with no previous
    // value and is filtered against its own branch: the tags 'y' never offered go, as on v7
    expect(rows?.[1]).toEqual({ kind: 'y', tags: [] });
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
});
