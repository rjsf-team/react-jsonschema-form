import type { CustomValidator, ErrorTransformer, FieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import { buttonId } from '@rjsf/utils';
import validator, { customizeValidator } from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form, { FieldTemplate as DefaultFieldTemplate } from '../src/index.ts';
import type { FormProps, IChangeEvent } from '../src/index.ts';
import { createFormRef, elementOf, handleOf, input } from './testUtils.tsx';

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

/** Renders a `Form<D>` with `props`, recording what `onChange` reports */
function renderForm<D>(props: Omit<FormProps<D>, 'validator' | 'onChange'>) {
  const reported: IChangeEvent<D>[] = [];
  const { container: node, unmount } = render(
    <Form<D> {...props} validator={validator} onChange={(event) => reported.push(event)} />,
  );
  return { node, unmount, reported };
}

describe('transformChange', () => {
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

  it('validates the data it leaves, not the edit it replaced', async () => {
    const lengthSchema: RJSFSchema = { type: 'object', properties: { first: { type: 'string', minLength: 3 } } };
    const transformChange: FormProps<Person>['transformChange'] = (next) =>
      next && { ...next, first: next.first?.trim() };
    const { node, reported } = renderForm<Person>({
      schema: lengthSchema,
      initialFormData: { first: 'ab' },
      transformChange,
      liveValidate: 'onChange',
    });

    await user.type(input(node, 'root_first'), ' ');

    expect(input(node, 'root_first')).toHaveValue('ab');
    expect(reported.at(-1)?.errors.map(({ property }) => property)).toEqual(['.first']);
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
