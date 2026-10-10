import type { IChangeEvent, RJSFSchema } from '@rjsf/utils';
import { buttonId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { fireEvent, render } from '@testing-library/react';

import Form from '../src/index.ts';
import { AcceptingParent, createParentLog, input } from './testUtils.tsx';

type ColorListData = { color?: string; list?: (string | null)[]; name?: string };

describe('settled snapshot sanitization', () => {
  it('sees a top-level conditional flipped by a declined change from the settled side (#5250)', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        list: { type: 'array', items: { type: 'string' } },
        color: { type: 'string', enum: ['r', 'g'] },
        name: { type: 'string' },
      },
      allOf: [{ if: { properties: { list: { minItems: 2 } } }, then: { properties: { color: { enum: ['r'] } } } }],
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
    fireEvent.click(container.querySelector(`#${buttonId('root_list', 'add')}`)!);
    fireEvent.change(input(container, 'root_name'), { target: { value: 'a' } });
    const last = events[events.length - 1].formData;
    expect(last?.color).toBe('r');
  });

  it('advances the snapshot when a parent accepts a sanitized proposal unchanged (#5250 controlled)', () => {
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
    fireEvent.change(container.querySelector('#root_pet_mode')!, { target: { value: '0' } });
    fireEvent.change(container.querySelector('#root_pet_color')!, { target: { value: '1' } });
    fireEvent.change(container.querySelector('#root_pet_mode')!, { target: { value: '1' } });
    expect(log.value?.pet.color).toBe('r');
  });

  it('keeps placeholders in shifted rows after a declined remove (#5451 array pairing)', () => {
    type Row = { kind?: string; tags?: (string | null)[] };
    type PairData = { note?: string; rows?: Row[] };
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
    // The remove is declined, so the snapshot still holds the removed row; a later sanitize must not pair
    // the shifted row with its old neighbour and filter its placeholders away
    fireEvent.click(container.querySelector(`#${buttonId('root_rows_0', 'remove')}`)!);
    fireEvent.change(input(container, 'root_note'), { target: { value: 'n' } });
    const last = events[events.length - 1].formData;
    expect(last?.rows).toEqual([{ kind: 'y', tags: [null, null] }]);
  });
});
