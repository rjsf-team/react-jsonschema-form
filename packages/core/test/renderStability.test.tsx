import { useState } from 'react';
import type { FieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { IChangeEvent } from '../src/index.ts';
import Form, { FieldTemplate as DefaultFieldTemplate } from '../src/index.ts';
import { createFormComponent } from './testUtils.tsx';

const user = userEvent.setup();

/** Typing in one field must not re-render its siblings. That only holds while every prop a sibling receives keeps
 * its reference across a change, so a leak in any of them fails here.
 */
describe('render stability across sibling fields', () => {
  interface FormValue {
    first: string;
    second: string;
    nested: { inner: string };
  }
  const initialFormData = (): FormValue => ({ first: '', second: '', nested: { inner: '' } });
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
      formData: initialFormData(),
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
      formData: initialFormData(),
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

  it('typing in a layout grid cell does not re-render the other cells', async () => {
    const { node } = createFormComponent({
      schema,
      uiSchema: {
        'ui:field': 'LayoutGridField',
        'ui:layoutGrid': { 'ui:row': { children: [{ 'ui:col': { children: ['first', 'second', 'nested'] } }] } },
      },
      formData: initialFormData(),
      templates: { FieldTemplate: CountingFieldTemplate },
    });

    const secondBefore = renderCounts.root_second;
    const innerBefore = renderCounts.root_nested_inner;

    await user.type(node.querySelector('#root_first')!, 'abc');

    expect(renderCounts.root_second).toBe(secondBefore);
    expect(renderCounts.root_nested_inner).toBe(innerBefore);
  });

  it('a controlled parent accepting each change keeps sibling fields and unchanged subtrees stable', async () => {
    const seen: IChangeEvent<FormValue>[] = [];
    function Parent() {
      const [formData, setFormData] = useState(initialFormData);
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
    // Each proposal becomes the next prop, so it must share unchanged subtrees with the value it was applied to
    const nestedInstances = new Set(proposals.map((formData) => formData?.nested));
    expect(nestedInstances.size).toBe(1);
    expect(renderCounts.root_second).toBe(secondBefore);
    expect(renderCounts.root_nested).toBe(nestedBefore);
    expect(renderCounts.root_nested_inner).toBe(innerBefore);
  });
});
