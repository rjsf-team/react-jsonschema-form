import { useState } from 'react';
import type { FieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { IChangeEvent } from '../src/index.ts';
import Form, { FieldTemplate as DefaultFieldTemplate } from '../src/index.ts';
import { createFormComponent } from './testUtils.tsx';

const user = userEvent.setup();

/** Guards the memoization contract: typing in one field must not re-render its sibling fields. `SchemaField` is
 * memoized with shallow comparison, which only holds if every prop a sibling receives keeps reference identity
 * across a change — the string `fieldPath`/`id`, the retained `formData`/`errorSchema` subtrees, the retained
 * `retrieveSchema()` results, and the stable callbacks. A regression in any of them fails this test.
 */
describe('render stability across sibling fields', () => {
  interface FormValue {
    first: string;
    second: string;
    nested: { inner: string };
  }
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      first: { type: 'string' },
      second: { type: 'string' },
      nested: {
        type: 'object',
        properties: {
          inner: { type: 'string' },
        },
      },
    },
  };

  let renderCounts: Record<string, number>;

  function CountingFieldTemplate(props: FieldTemplateProps) {
    renderCounts[props.id] = (renderCounts[props.id] ?? 0) + 1;
    return <DefaultFieldTemplate {...props} />;
  }

  beforeEach(() => {
    renderCounts = {};
  });

  it('typing in one field does not re-render sibling fields', async () => {
    const { node } = createFormComponent({
      schema,
      formData: { first: '', second: '', nested: { inner: '' } },
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const secondBefore = renderCounts.root_second;
    const nestedBefore = renderCounts.root_nested;
    const innerBefore = renderCounts.root_nested_inner;
    const firstBefore = renderCounts.root_first;

    await user.type(node.querySelector('#root_first')!, 'abc');

    expect(renderCounts.root_first).toBeGreaterThan(firstBefore);
    expect(renderCounts.root_second).toBe(secondBefore);
    expect(renderCounts.root_nested).toBe(nestedBefore);
    expect(renderCounts.root_nested_inner).toBe(innerBefore);
  });

  it('typing in a nested field does not re-render fields outside its branch', async () => {
    const { node } = createFormComponent({
      schema,
      formData: { first: '', second: '', nested: { inner: '' } },
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const firstBefore = renderCounts.root_first;
    const secondBefore = renderCounts.root_second;
    const innerBefore = renderCounts.root_nested_inner;

    await user.type(node.querySelector('#root_nested_inner')!, 'abc');

    expect(renderCounts.root_nested_inner).toBeGreaterThan(innerBefore);
    expect(renderCounts.root_first).toBe(firstBefore);
    expect(renderCounts.root_second).toBe(secondBefore);
  });

  it('a controlled parent accepting each change keeps sibling fields and unchanged subtrees stable', async () => {
    const seen: IChangeEvent<FormValue>[] = [];
    function Parent() {
      const [formData, setFormData] = useState<FormValue>({ first: '', second: '', nested: { inner: '' } });
      return (
        <Form
          schema={schema}
          validator={validator}
          formData={formData}
          templates={{ FieldTemplate: CountingFieldTemplate }}
          onChange={(event) => {
            seen.push(event);
            setFormData(event.formData);
          }}
        />
      );
    }
    const { container } = render(<Parent />);

    const secondBefore = renderCounts.root_second;
    const nestedBefore = renderCounts.root_nested;
    const innerBefore = renderCounts.root_nested_inner;

    await user.type(container.querySelector('#root_first')!, 'abc');

    const proposals = seen.map((event) => event.formData);
    expect(proposals.map((formData) => formData?.first)).toEqual(['a', 'ab', 'abc']);
    // Each accepted proposal is what the parent hands back as the next value, so it must share every unchanged
    // subtree with the value it was applied to for the sibling fields' props to stay reference-equal
    const nestedInstances = new Set(proposals.map((formData) => formData?.nested));
    expect(nestedInstances.size).toBe(1);
    expect(renderCounts.root_second).toBe(secondBefore);
    expect(renderCounts.root_nested).toBe(nestedBefore);
    expect(renderCounts.root_nested_inner).toBe(innerBefore);
  });
});
