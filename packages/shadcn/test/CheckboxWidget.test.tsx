import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import CheckboxWidget from '../src/CheckboxWidget/index.ts';
import Form from '../src/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const schema: RJSFSchema = {
  type: 'object',
  properties: { flag: { type: 'boolean', title: 'Flag', description: 'About' } },
};

describe('CheckboxWidget', () => {
  // The field's own state, as core's `CheckboxWidget` marks the label and description it draws
  test('marks its label and description data-invalid while the field shows errors, and not otherwise', () => {
    const { container, rerender } = render(
      <Form schema={schema} extraErrors={{ flag: { __errors: ['wrong'] } }} validator={validator} />,
    );
    expect(container.querySelector('#root_flag__description')).toHaveAttribute('data-invalid', 'true');
    expect(container.querySelector('label[for="root_flag"]')).toHaveAttribute('data-invalid', 'true');

    rerender(<Form schema={schema} validator={validator} />);
    expect(container.querySelector('#root_flag__description')).not.toHaveAttribute('data-invalid');
    expect(container.querySelector('label[for="root_flag"]')).not.toHaveAttribute('data-invalid');
  });

  // Without a plan, core's `FieldTemplate` draws the description of a field whose `ui:widget` is the `checkbox` alias,
  // so the widget leaves it to the template there, as core's does
  test('draws no description of its own without a plan where ui:widget is the checkbox alias', () => {
    const props = makeWidgetMockProps({ schema: { type: 'boolean', description: 'About' }, value: false });
    const { container, rerender } = render(<CheckboxWidget {...props} uiSchema={{ 'ui:widget': 'checkbox' }} />);
    expect(container.querySelector('#_id__description')).toBeNull();

    rerender(<CheckboxWidget {...props} />);
    expect(container.querySelector('#_id__description')).toHaveTextContent('About');
  });
});
