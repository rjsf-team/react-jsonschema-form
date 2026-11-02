import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

describe('RangeWidget', () => {
  // Fluent's own 120px minimum would push the slider out of a narrower layout grid column
  test("lets the slider shrink below Fluent's minimum width", () => {
    const { container } = render(
      <Form
        schema={{ type: 'number', minimum: 0, maximum: 10 }}
        uiSchema={{ 'ui:widget': 'range' }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.fui-Slider')).toHaveStyle({ minWidth: '0px' });
  });
});
