import { objectTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import type { UiSchema as MantineUiSchema } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

objectTests(WrappedForm);

describe('ObjectFieldTemplate', () => {
  test("takes gridCols from ui:globalOptions beneath the field's own", () => {
    const uiSchema: MantineUiSchema = { 'ui:globalOptions': { gridCols: 2 }, inner: { 'ui:options': { gridCols: 3 } } };
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { inner: { type: 'object', properties: { a: { type: 'string' } } }, b: { type: 'string' } },
        }}
        uiSchema={uiSchema}
        validator={validator}
      />,
    );

    // `SimpleGrid` sets its columns in an inline stylesheet, one rule per grid, outermost first
    const rules = Array.from(
      container.querySelectorAll('style[data-mantine-styles="inline"]'),
      (style) => style.textContent?.match(/--sg-cols:(\d+)/)?.[1],
    );
    expect(rules).toEqual(['2', '3']);
  });

  test('leaves out a deprecated property hidden by deprecatedHandling, as one hidden by ui:widget', () => {
    const { container } = render(
      <WrappedForm
        schema={{
          type: 'object',
          properties: { a: { type: 'string' }, b: { type: 'string', deprecated: true }, c: { type: 'string' } },
        }}
        uiSchema={{ 'ui:globalOptions': { deprecatedHandling: 'hide' }, c: { 'ui:widget': 'hidden' } }}
        validator={validator}
      />,
    );

    const grid = container.querySelector('.mantine-SimpleGrid-root');
    expect(grid?.children).toHaveLength(1);
    expect(grid?.querySelector('#root_a')).toBeInTheDocument();
  });
});
