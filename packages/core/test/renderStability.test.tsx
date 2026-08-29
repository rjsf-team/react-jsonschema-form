import type { FieldTemplateProps, RJSFSchema } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';

import { FieldTemplate as DefaultFieldTemplate } from '../src/index.ts';
import { createFormComponent } from './testUtils.tsx';

const user = userEvent.setup();

/** Guards the memoization contract: typing in one field must not re-render its sibling fields. `SchemaField` is
 * memoized with shallow comparison, which only holds if every prop a sibling receives keeps reference identity
 * across a change — the string `fieldPath`/`id`, the retained `formData`/`errorSchema` subtrees, the retained
 * `retrieveSchema()` results, and the stable callbacks. A regression in any of them fails this test.
 */
describe('render stability across sibling fields', () => {
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

    await user.type(node.querySelector('#root_nested_inner')!, 'abc');

    expect(renderCounts.root_nested_inner).toBeGreaterThan(renderCounts.root_second);
    expect(renderCounts.root_first).toBe(firstBefore);
    expect(renderCounts.root_second).toBe(secondBefore);
  });
});
