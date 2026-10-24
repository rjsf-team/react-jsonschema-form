import { useId } from 'react';
import type {
  CustomValidator,
  ErrorTransformer,
  FieldProps,
  FieldTemplateProps,
  RJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { buttonId } from '@rjsf/utils';
import validator, { customizeValidator } from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { collectDeferredThrows } from '../../../testing/deferredThrows.ts';
import Form, { FieldTemplate as DefaultFieldTemplate } from '../src/index.ts';
import type { FormProps, IChangeEvent } from '../src/index.ts';
import { createFormRef, elementOf, handleOf, input, setupConsoleWarnSuppression } from './testUtils.tsx';

const user = userEvent.setup();

interface Person {
  first?: string;
  second?: string;
  nested?: { inner?: string };
}

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    first: { type: 'string' },
    second: { type: 'string' },
    nested: { type: 'object', properties: { inner: { type: 'string' } } },
  },
};

const seed = (): Person => ({ first: '', second: '', nested: { inner: '' } });

interface Root {
  a?: string;
}

/** Renders a `Form<D>` with `props`, recording what `onChange` reports */
function renderForm<D>(props: Omit<FormProps<D>, 'validator' | 'onChange'>) {
  const reported: IChangeEvent<D>[] = [];
  const { container: node, unmount } = render(
    <Form<D> {...props} validator={validator} onChange={(event) => reported.push(event)} />,
  );
  return { node, unmount, reported };
}

describe('transformChange', () => {
  const warnings = setupConsoleWarnSuppression();
  /** The warnings the form gave about a `transformChange` that returned nothing */
  const returnedNothingWarnings = () =>
    warnings.consoleSpy.mock.calls.filter(([message]) =>
      String(message).includes('`transformChange` returned `undefined`'),
    );

  it('warns once in development when it returns undefined for an edit that left data, as one with a missing return does', async () => {
    const { node, reported } = renderForm<Person>({
      schema,
      initialFormData: seed(),
      // A rule written with a block body that returns only on the path that refuses
      transformChange: (next, previous) => (next?.first === 'x' ? previous : undefined),
    });

    await user.type(input(node, 'root_first'), 'ab');

    expect(reported.at(-1)?.formData).toBeUndefined();
    expect(returnedNothingWarnings()).toHaveLength(1);
  });

  it('does not warn when it returns undefined for an edit that left no data', () => {
    const ref = createFormRef<string>();
    render(
      <Form<string>
        ref={ref}
        schema={{ type: 'string' }}
        validator={validator}
        initialFormData='a'
        transformChange={(next) => next}
      />,
    );

    act(() => handleOf(ref).setFieldValue('', undefined));

    expect(handleOf(ref).getFormData()).toBeUndefined();
    expect(returnedNothingWarnings()).toHaveLength(0);
  });

  it('refuses an edit by returning the data before it, with no ref call', async () => {
    const transformChange: FormProps<Person>['transformChange'] = (next, previous) =>
      next?.first?.includes('x') ? previous : next;
    const { node, reported } = renderForm<Person>({ schema, initialFormData: seed(), transformChange });

    await user.type(input(node, 'root_first'), 'abx');

    expect(input(node, 'root_first')).toHaveValue('ab');
    expect(reported.map(({ formData }) => formData.first)).toEqual(['a', 'ab', 'ab']);
  });

  it('normalizes an edit, and the form keeps and reports the normalized data', async () => {
    const transformChange: FormProps<Person>['transformChange'] = (next) =>
      next && { ...next, first: next.first?.trimStart() };
    const ref = createFormRef<Person>();
    const { node, reported } = renderForm<Person>({ ref, schema, initialFormData: seed(), transformChange });

    await user.type(input(node, 'root_first'), '  ab');

    expect(input(node, 'root_first')).toHaveValue('ab');
    expect(handleOf(ref).getFormData()).toEqual({ first: 'ab', second: '', nested: { inner: '' } });
    expect(reported.at(-1)?.formData).toEqual({ first: 'ab', second: '', nested: { inner: '' } });
  });

  it('goes through setFieldValue() as through a field', () => {
    const transformChange: FormProps<Person>['transformChange'] = (next) =>
      next && { ...next, second: next.second?.toUpperCase() };
    const ref = createFormRef<Person>();
    const { node } = renderForm<Person>({ ref, schema, initialFormData: seed(), transformChange });

    act(() => handleOf(ref).setFieldValue('second', 'abc'));

    expect(input(node, 'root_second')).toHaveValue('ABC');
  });

  describe('in development, gets data it cannot mutate', () => {
    it.each<[string, NonNullable<FormProps<Person>['transformChange']>]>([
      [
        'next',
        (next) => {
          if (next) {
            // oxlint-disable-next-line no-param-reassign -- the mutation is what the form has to refuse
            next.first = 'mutated';
          }
          return next;
        },
      ],
      [
        'a subtree next shares with the data before the edit',
        (next) => {
          if (next?.nested) {
            // oxlint-disable-next-line no-param-reassign -- the mutation is what the form has to refuse
            next.nested.inner = 'mutated';
          }
          return next;
        },
      ],
      [
        'previous',
        (next, previous) => {
          if (previous) {
            // oxlint-disable-next-line no-param-reassign -- the mutation is what the form has to refuse
            previous.first = 'mutated';
          }
          return next;
        },
      ],
    ])('so a mutation of %s throws, and the form keeps its data', (_, transformChange) => {
      const ref = createFormRef<Person>();
      renderForm<Person>({ ref, schema, initialFormData: seed(), transformChange });

      expect(() => act(() => handleOf(ref).setFieldValue('second', 'b'))).toThrow(TypeError);
      expect(handleOf(ref).getFormData()).toEqual(seed());
    });
  });

  it('validates the data it leaves, not the edit it replaced', async () => {
    const lengthSchema: RJSFSchema = { type: 'object', properties: { first: { type: 'string', minLength: 3 } } };
    const transformChange: FormProps<Person>['transformChange'] = (next) =>
      next && { ...next, first: next.first?.trim() };
    const { node, reported } = renderForm<Person>({
      schema: lengthSchema,
      initialFormData: { first: 'a' },
      transformChange,
      liveValidate: 'onChange',
    });

    // The edit, `ab `, is long enough; the trimmed data the form keeps is not
    await user.type(input(node, 'root_first'), 'b ');

    expect(input(node, 'root_first')).toHaveValue('ab');
    expect(reported.at(-1)?.errors.map(({ property }) => property)).toEqual(['.first']);
  });

  describe('a rewrite that switches a conditional', () => {
    interface Switched {
      kind?: string;
      note?: string;
      aOnly?: string;
      bOnly?: string;
    }
    const conditional: RJSFSchema = {
      type: 'object',
      properties: { kind: { type: 'string', enum: ['a', 'b'] }, note: { type: 'string' } },
      if: { properties: { kind: { const: 'a' } } },
      then: { properties: { aOnly: { type: 'string' } } },
      else: { properties: { bOnly: { type: 'string' } } },
    };
    const initialFormData: Switched = { kind: 'a', note: '', aOnly: 'kept under a' };

    it('drops the values of the branch the field switch leaves', async () => {
      const ref = createFormRef<Switched>();
      const { node } = renderForm<Switched>({ ref, schema: conditional, initialFormData });

      await user.selectOptions(elementOf(node, '#root_kind'), 'b');

      expect(handleOf(ref).getFormData()).toEqual({ kind: 'b', note: '' });
    });

    it('drops the values of the branch it leaves, as the same switch made in the field does', async () => {
      const ref = createFormRef<Switched>();
      const { node } = renderForm<Switched>({
        ref,
        schema: conditional,
        initialFormData,
        transformChange: (next) => next && { ...next, kind: next.note ? 'b' : next.kind },
      });

      await user.type(input(node, 'root_note'), 'x');

      expect(handleOf(ref).getFormData()).toEqual({ kind: 'b', note: 'x' });
    });
  });

  it("keeps a cleared field cleared when the rewrite derives another one, under 'useDefaultIfFormDataUndefined' (#5125)", async () => {
    interface Derived {
      a?: string;
      length?: number;
    }
    const derivedSchema: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string', default: 'A' }, length: { type: 'number' } },
    };
    const transformChange: FormProps<Derived>['transformChange'] = (next) =>
      next && { ...next, length: next.a?.length ?? 0 };
    const ref = createFormRef<Derived>();
    const { node } = renderForm<Derived>({
      ref,
      schema: derivedSchema,
      initialFormData: { a: 'xy' },
      transformChange,
      defaultFormStateBehavior: { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
    });

    await user.clear(input(node, 'root_a'));

    expect(input(node, 'root_a')).toHaveValue('');
    expect(handleOf(ref).getFormData()).toEqual({ a: undefined, length: 0 });
  });

  it('refuses an array reorder, and the rows keep their own previous values on the next edit (#5451)', async () => {
    interface Row {
      kind?: string;
      tags?: (string | null)[];
    }
    interface PairData {
      note?: string;
      rows?: Row[];
    }
    const rowsSchema: RJSFSchema = {
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
    const transformChange: FormProps<PairData>['transformChange'] = (next, previous) =>
      next?.rows?.[0]?.kind !== previous?.rows?.[0]?.kind ? previous : next;
    const ref = createFormRef<PairData>();
    const { node } = renderForm<PairData>({
      ref,
      schema: rowsSchema,
      initialFormData: {
        rows: [
          { kind: 'x', tags: [null, null] },
          { kind: 'y', tags: [null, null] },
        ],
      },
      transformChange,
    });

    await user.click(elementOf(node, `#${buttonId('root_rows_0', 'moveDown')}`));
    await user.type(input(node, 'root_note'), 'n');

    expect(handleOf(ref).getFormData().rows).toEqual([
      { kind: 'x', tags: [null, null] },
      { kind: 'y', tags: [null, null] },
    ]);
  });

  it('refuses an array reorder, and each row keeps the state it holds with its own item', async () => {
    // Both options take a string, so the option each row shows is the row's own state, not something its data says
    const choiceSchema: RJSFSchema = {
      type: 'array',
      items: {
        oneOf: [
          { title: 'A', type: 'string' },
          { title: 'B', type: 'string' },
        ],
      },
    };
    // Refuses an edit that puts the second item first, which the reorder below does and the switch does not
    const refuseReorder: FormProps<string[]>['transformChange'] = (next, previous) =>
      (previous?.length ?? 0) > 1 && next?.[0] === previous?.[1] ? previous : next;
    const { node } = renderForm<string[]>({
      schema: choiceSchema,
      initialFormData: ['x', 'y'],
      transformChange: refuseReorder,
    });
    const optionOf = (index: number) => elementOf(node, `#root_${index}__oneof_select`);
    // A switch between two string options clears the item, so it is typed again under the option picked
    await user.selectOptions(optionOf(0), 'B');
    await user.type(input(node, 'root_0'), 'x');

    await user.click(elementOf(node, `#${buttonId('root_0', 'moveDown')}`));
    expect(optionOf(0)).toHaveValue('1');
    expect(optionOf(1)).toHaveValue('0');

    // The rows a later handler starts from are the ones on screen, not the ones the refused reorder sent
    await user.click(elementOf(node, `#${buttonId('root_1', 'remove')}`));
    expect(node.querySelectorAll('.rjsf-array-item')).toHaveLength(1);
    expect(optionOf(0)).toHaveValue('1');
  });

  it('refuses an array reorder with a copy of the data before it, and each row keeps its own state', async () => {
    const choiceSchema: RJSFSchema = {
      type: 'array',
      items: {
        oneOf: [
          { title: 'A', type: 'string' },
          { title: 'B', type: 'string' },
        ],
      },
    };
    // A copy of the data before the edit refuses it as that data itself does
    const refuseWithCopy: FormProps<string[]>['transformChange'] = (next, previous) =>
      (previous?.length ?? 0) > 1 && next?.[0] === previous?.[1] ? [...(previous ?? [])] : next;
    const { node } = renderForm<string[]>({
      schema: choiceSchema,
      initialFormData: ['x', 'y'],
      transformChange: refuseWithCopy,
    });
    const optionOf = (index: number) => elementOf(node, `#root_${index}__oneof_select`);
    await user.selectOptions(optionOf(0), 'B');
    await user.type(input(node, 'root_0'), 'x');

    await user.click(elementOf(node, `#${buttonId('root_0', 'moveDown')}`));

    expect(input(node, 'root_0')).toHaveValue('x');
    expect(optionOf(0)).toHaveValue('1');
    expect(optionOf(1)).toHaveValue('0');
  });

  it('refuses a reorder of two equal items by returning the data before it, and each row keeps its own state', async () => {
    const choiceSchema: RJSFSchema = {
      type: 'array',
      items: {
        oneOf: [
          { title: 'A', type: 'string' },
          { title: 'B', type: 'string' },
        ],
      },
    };
    // The reorder leaves data equal to the data before it, which `previous` still refuses. Only such an edit is
    // refused, so the switch, which clears the item, and typing it again are taken
    const { node } = renderForm<string[]>({
      schema: choiceSchema,
      initialFormData: ['x', 'x'],
      transformChange: (next, previous) => (JSON.stringify(next) === JSON.stringify(previous) ? previous : next),
    });
    const optionOf = (index: number) => elementOf(node, `#root_${index}__oneof_select`);
    await user.selectOptions(optionOf(0), 'B');
    await user.type(input(node, 'root_0'), 'x');

    await user.click(elementOf(node, `#${buttonId('root_0', 'moveDown')}`));

    expect(optionOf(0)).toHaveValue('1');
    expect(optionOf(1)).toHaveValue('0');
  });

  it('takes an option switch that leaves the data as it was when it returns a copy of the data', async () => {
    const optionsSchema: RJSFSchema = {
      oneOf: [
        { title: 'A', type: 'object', properties: { v: { type: 'string' } } },
        { title: 'B', type: 'object', properties: { v: { type: 'string' } } },
      ],
    };
    const { node, reported } = renderForm<Record<string, unknown>>({
      schema: optionsSchema,
      initialFormData: { v: 'x' },
      // Rebuilds the data on every edit, as one that rewrites a field does
      transformChange: (next) => next && { ...next },
    });
    const select = elementOf(node, '#root__oneof_select');

    await user.selectOptions(select, 'B');

    // The selector's option values are the option indexes: '1' is B
    expect(select).toHaveValue('1');
    expect(reported.at(-1)?.formData).toEqual({ v: 'x' });
  });

  it('refuses an option switch that leaves the data as it was by returning the data before it', async () => {
    const optionsSchema: RJSFSchema = {
      oneOf: [
        { title: 'A', type: 'object', properties: { v: { type: 'string' } } },
        { title: 'B', type: 'object', properties: { v: { type: 'string' } } },
      ],
    };
    const { node } = renderForm<Record<string, unknown>>({
      schema: optionsSchema,
      initialFormData: { v: 'x' },
      transformChange: (_next, previous) => previous,
    });
    const select = elementOf(node, '#root__oneof_select');

    await user.selectOptions(select, 'B');

    expect(select).toHaveValue('0');
  });

  it('takes a reorder of two equal items by returning the data after it', async () => {
    const choiceSchema: RJSFSchema = {
      type: 'array',
      items: {
        oneOf: [
          { title: 'A', type: 'string' },
          { title: 'B', type: 'string' },
        ],
      },
    };
    const { node } = renderForm<string[]>({
      schema: choiceSchema,
      initialFormData: ['x', 'x'],
      transformChange: (next) => next,
    });
    const optionOf = (index: number) => elementOf(node, `#root_${index}__oneof_select`);
    await user.selectOptions(optionOf(0), 'B');

    await user.click(elementOf(node, `#${buttonId('root_0', 'moveDown')}`));

    expect(optionOf(0)).toHaveValue('0');
    expect(optionOf(1)).toHaveValue('1');
  });

  describe('rewrites an array add or reorder, and no row hands its instance to another item', () => {
    /** Shows its item, and which instance of the widget shows it: the state a row holds, as focus or a draft would be */
    function InstanceWidget({ id, value }: WidgetProps) {
      return <input id={id} data-instance={useId()} value={value ?? ''} readOnly />;
    }
    const itemsSchema: RJSFSchema = { type: 'array', items: { type: 'string', default: 'new' } };
    /** Each item shown, with the instance that shows it */
    const shown = (node: Element) =>
      Array.from(node.querySelectorAll<HTMLInputElement>('input[data-instance]'), (row) => [
        row.value,
        row.dataset.instance,
      ]);
    /** Whether every row that shows an item after an edit was either made for it or showed that same item before */
    const keepsItsItem = (before: (string | undefined)[][], after: (string | undefined)[][]) => {
      const itemOf = new Map(before.map(([item, instance]) => [instance, item]));
      return after.every(([item, instance]) => !itemOf.has(instance) || itemOf.get(instance) === item);
    };

    it.each<[string, NonNullable<FormProps<string[]>['transformChange']>, string[], string, string[]]>([
      [
        'an add the rewrite puts first',
        (next, previous) =>
          next && previous && next.length > previous.length ? [...next.slice(-1), ...previous] : next,
        ['b', 'c'],
        '.rjsf-array-item-add',
        ['new', 'b', 'c'],
      ],
      [
        'a reorder the rewrite sorts',
        (next) => next && [...next].sort(),
        ['c', 'b', 'a'],
        `#${buttonId('root_0', 'moveDown')}`,
        ['a', 'b', 'c'],
      ],
    ])('%s', async (_, transformChange, initialFormData, button, kept) => {
      const { node } = renderForm<string[]>({
        schema: itemsSchema,
        uiSchema: { items: { 'ui:widget': InstanceWidget } },
        initialFormData,
        transformChange,
      });
      const before = shown(node);

      await user.click(elementOf(node, button));

      const after = shown(node);
      expect(after.map(([item]) => item)).toEqual(kept);
      expect(keepsItsItem(before, after)).toBe(true);
    });

    it('a reorder whose transformChange throws leaves every row where it was', async () => {
      const deferred = collectDeferredThrows();
      const { node } = renderForm<string[]>({
        schema: itemsSchema,
        uiSchema: { items: { 'ui:widget': InstanceWidget } },
        initialFormData: ['a', 'b'],
        transformChange: (next, previous) => {
          if (next?.[0] !== previous?.[0]) {
            throw new Error('boom');
          }
          return next;
        },
      });
      const before = shown(node);

      await user.click(elementOf(node, `#${buttonId('root_0', 'moveDown')}`));
      await deferred.settle();

      expect(deferred.thrown).toEqual([new Error('boom')]);
      expect(shown(node)).toEqual(before);
    });
  });

  it.each([
    ['rewrites', (next: Root | undefined) => next && { ...next, a: next.a?.trim() }],
    ['copies', (next: Root | undefined) => next && { ...next }],
  ])('%s the edit of a root field that raises errors with it, and keeps the raise', async (_, transformChange) => {
    function RaisingRootField({ formData, onChange, fieldPath }: FieldProps<Root>) {
      return (
        <button
          type='button'
          id='raise'
          onClick={() => onChange({ ...formData, a: ' v ' }, fieldPath, { __errors: ['Root raise'] })}
        >
          Raise
        </button>
      );
    }
    const { node, reported } = renderForm<Root>({
      schema: { type: 'object', properties: { a: { type: 'string' } } },
      uiSchema: { 'ui:field': RaisingRootField },
      initialFormData: {},
      transformChange,
    });

    await user.click(elementOf(node, '#raise'));

    expect(reported.at(-1)?.errorSchema).toEqual({ __errors: ['Root raise'] });
    expect(reported.at(-1)?.errors.map(({ message }) => message)).toEqual(['Root raise']);
  });

  describe.each(['oneOf', 'anyOf'] as const)('an %s option switch', (keyword) => {
    interface Status {
      by?: string;
      reason?: string;
      until?: string;
    }
    interface Decision {
      status?: Status;
    }
    // Each option requires its own property, so the data alone says which option it fits
    const decisionSchema: RJSFSchema = {
      type: 'object',
      properties: {
        status: {
          [keyword]: [
            { title: 'Approved', type: 'object', properties: { by: { type: 'string' } }, required: ['by'] },
            { title: 'Rejected', type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] },
            { title: 'Deferred', type: 'object', properties: { until: { type: 'string' } }, required: ['until'] },
          ],
        },
      },
    };
    const selector = (node: ParentNode) => elementOf(node, `#root_status__${keyword.toLowerCase()}_select`);

    it('refused, returns the selector to the option the data fits', async () => {
      const transformChange = vi.fn<NonNullable<FormProps<Decision>['transformChange']>>((_next, previous) => previous);
      const ref = createFormRef<Decision>();
      const { node, reported } = renderForm<Decision>({
        ref,
        schema: decisionSchema,
        initialFormData: { status: { by: 'me' } },
        transformChange,
      });

      await user.selectOptions(selector(node), 'Rejected');

      expect(transformChange).toHaveBeenCalled();
      expect(selector(node)).toHaveValue('0');
      expect(node.querySelector('#root_status_by')).toHaveValue('me');
      expect(node.querySelector('#root_status_reason')).not.toBeInTheDocument();
      expect(handleOf(ref).getFormData()).toEqual({ status: { by: 'me' } });
      expect(reported.filter(({ formData }) => formData.status?.by !== 'me')).toEqual([]);
    });

    it('refused, leaves the selector on the option it showed when the data fits the refused option too', async () => {
      // No option requires a property, so the data fits both and only the refusal says which option stays
      const looseSchema: RJSFSchema = {
        type: 'object',
        properties: {
          status: {
            [keyword]: [
              { title: 'Approved', type: 'object', properties: { by: { type: 'string' } } },
              { title: 'Rejected', type: 'object', properties: { reason: { type: 'string' } } },
            ],
          },
        },
      };
      const transformChange = vi.fn<NonNullable<FormProps<Decision>['transformChange']>>((_next, previous) => previous);
      const ref = createFormRef<Decision>();
      const { node } = renderForm<Decision>({
        ref,
        schema: looseSchema,
        initialFormData: { status: {} },
        transformChange,
      });

      await user.selectOptions(selector(node), 'Rejected');

      expect(transformChange).toHaveBeenCalled();
      expect(selector(node)).toHaveValue('0');
      expect(node.querySelector('#root_status_by')).toBeInTheDocument();
      expect(node.querySelector('#root_status_reason')).not.toBeInTheDocument();
      expect(handleOf(ref).getFormData()).toEqual({ status: {} });
    });

    it.each([
      { rewrite: { by: 'you' }, option: '0', field: 'by', value: 'you', gone: 'reason' },
      { rewrite: { until: 'later' }, option: '2', field: 'until', value: 'later', gone: 'reason' },
      { rewrite: { reason: 'n/a' }, option: '1', field: 'reason', value: 'n/a', gone: 'by' },
    ])(
      'rewritten to $rewrite, puts the selector on the option the data the form keeps fits',
      async ({ rewrite, option, field, value, gone }) => {
        const transformChange: FormProps<Decision>['transformChange'] = (next, previous) =>
          next?.status?.by === previous?.status?.by ? next : { status: rewrite };
        const ref = createFormRef<Decision>();
        const { node, reported } = renderForm<Decision>({
          ref,
          schema: decisionSchema,
          initialFormData: { status: { by: 'me' } },
          transformChange,
        });

        await user.selectOptions(selector(node), 'Rejected');

        expect(selector(node)).toHaveValue(option);
        expect(node.querySelector(`#root_status_${field}`)).toHaveValue(value);
        expect(node.querySelector(`#root_status_${gone}`)).not.toBeInTheDocument();
        expect(handleOf(ref).getFormData()).toEqual({ status: rewrite });
        expect(reported.at(-1)?.formData).toEqual({ status: rewrite });
      },
    );
  });

  describe('under liveValidate', () => {
    interface Name {
      first?: string;
    }
    const lengthSchema: RJSFSchema = { type: 'object', properties: { first: { type: 'string', minLength: 3 } } };
    const upperCase: FormProps<Name>['transformChange'] = (next) =>
      next && { ...next, first: next.first?.toUpperCase() };
    const refuseX: FormProps<Name>['transformChange'] = (next, previous) =>
      next?.first?.includes('x') ? previous : next;

    /** Renders a live-validated form with its own validator, whose validations are counted from after mount */
    function renderValidated(transformChange: FormProps<Name>['transformChange']) {
      const customValidate = vi.fn<CustomValidator<Name>>((_formData, errors) => errors);
      const transformErrors = vi.fn<ErrorTransformer>((errors) => errors);
      const ownValidator = customizeValidator();
      const validateFormData = vi.spyOn(ownValidator, 'validateFormData');
      const reported: IChangeEvent<Name>[] = [];
      const { container: node } = render(
        <Form<Name>
          schema={lengthSchema}
          validator={ownValidator}
          initialFormData={{ first: '' }}
          liveValidate='onChange'
          transformChange={transformChange}
          customValidate={customValidate}
          transformErrors={transformErrors}
          onChange={(event) => reported.push(event)}
        />,
      );
      customValidate.mockClear();
      transformErrors.mockClear();
      validateFormData.mockClear();
      return { node, reported, customValidate, transformErrors, validateFormData };
    }

    it('validates a rewritten edit once per keystroke, and only the data the form keeps', async () => {
      const { node, customValidate, transformErrors, validateFormData } = renderValidated(upperCase);

      await user.type(input(node, 'root_first'), 'ab');

      expect(validateFormData.mock.calls.map(([formData]) => formData)).toEqual([{ first: 'A' }, { first: 'AB' }]);
      expect(customValidate.mock.calls.map(([formData]) => formData)).toEqual([{ first: 'A' }, { first: 'AB' }]);
      expect(transformErrors).toHaveBeenCalledTimes(2);
    });

    it('validates nothing for a refused edit and leaves the errors as they were', async () => {
      const { node, reported, customValidate, transformErrors, validateFormData } = renderValidated(refuseX);

      await user.type(input(node, 'root_first'), 'a');
      const errorsBefore = reported.at(-1)?.errors;
      customValidate.mockClear();
      transformErrors.mockClear();
      validateFormData.mockClear();
      await user.type(input(node, 'root_first'), 'x');

      expect(input(node, 'root_first')).toHaveValue('a');
      expect(validateFormData).not.toHaveBeenCalled();
      expect(customValidate).not.toHaveBeenCalled();
      expect(transformErrors).not.toHaveBeenCalled();
      expect(errorsBefore?.map(({ property }) => property)).toEqual(['.first']);
      expect(reported.at(-1)?.errors).toEqual(errorsBefore);
    });

    it('validates a taken edit once per keystroke', async () => {
      const { node, customValidate, transformErrors, validateFormData } = renderValidated(refuseX);

      await user.type(input(node, 'root_first'), 'ab');

      expect(validateFormData).toHaveBeenCalledTimes(2);
      expect(customValidate.mock.calls.map(([formData]) => formData)).toEqual([{ first: 'a' }, { first: 'ab' }]);
      expect(transformErrors).toHaveBeenCalledTimes(2);
    });
  });

  describe('sibling renders', () => {
    const onFieldTemplateRender = vi.fn<(id: string) => void>();
    function CountingFieldTemplate(props: FieldTemplateProps) {
      onFieldTemplateRender(props.id);
      return <DefaultFieldTemplate {...props} />;
    }
    const renderCount = (id: string) => onFieldTemplateRender.mock.calls.filter(([calledId]) => calledId === id).length;

    /** The render counts of every field while `text` is typed into `first`, after mount */
    async function countsWhileTyping(text: string, transformChange?: FormProps<Person>['transformChange']) {
      onFieldTemplateRender.mockClear();
      const { node, unmount } = renderForm<Person>({
        schema,
        initialFormData: seed(),
        transformChange,
        templates: { FieldTemplate: CountingFieldTemplate },
      });
      const ids = ['root', 'root_first', 'root_second', 'root_nested', 'root_nested_inner'];
      const before = Object.fromEntries(ids.map((id) => [id, renderCount(id)]));
      await user.type(input(node, 'root_first'), text);
      const counts = Object.fromEntries(ids.map((id) => [id, renderCount(id) - before[id]]));
      unmount();
      return counts;
    }

    it('a transform touching one field renders what a plain edit of that field renders', async () => {
      const plain = await countsWhileTyping('AB');
      const transformed = await countsWhileTyping(
        'ab',
        (next) => next && { ...next, first: next.first?.toUpperCase() },
      );

      expect(transformed).toEqual(plain);
      expect(transformed.root_second).toBe(0);
      expect(transformed.root_nested).toBe(0);
      expect(transformed.root_nested_inner).toBe(0);
    });

    it('a refused edit renders no field', async () => {
      const counts = await countsWhileTyping('x', (next, previous) => (next?.first?.includes('x') ? previous : next));

      expect(counts).toEqual({ root: 0, root_first: 0, root_second: 0, root_nested: 0, root_nested_inner: 0 });
    });
  });
});
