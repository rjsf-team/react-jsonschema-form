import type { ReactNode } from 'react';
import { formTests, themeTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';
import WrappedForm from './WrappedForm.tsx';

const user = userEvent.setup();

function BareFieldTemplate({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}

formTests(WrappedForm);
themeTests({ generateTemplates, generateTheme, generateWidgets });

describe('chakra-ui AltDateWidget', () => {
  test('alt-datetime renders the time selects and its Now button emits a date-time', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <WrappedForm
        schema={{ type: 'string', format: 'date-time' }}
        uiSchema={{ 'ui:widget': 'alt-datetime' }}
        validator={validator}
        onChange={onChange}
      />,
    );

    expect(container.querySelector('[id="select:root_hour"]')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Now' }));
    expect(onChange.mock.lastCall?.[0].formData).toMatch(/T\d{2}:\d{2}:\d{2}/);
  });

  test.each(['Now', 'Clear'])('a readonly alt-date ignores its %s button', async (button) => {
    const onChange = vi.fn();
    render(
      <WrappedForm
        schema={{ type: 'string', format: 'date' }}
        uiSchema={{ 'ui:widget': 'alt-date', 'ui:readonly': true }}
        formData='2020-01-02'
        validator={validator}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: button }));
    expect(onChange).not.toHaveBeenCalled();
  });

  // The stock `FieldTemplate` renders a disabled field inside a disabled `<fieldset>`, which blocks the click before it
  // reaches the hook, so only a template without one shows the widget honoring `disabled` itself
  test.each(['Now', 'Clear'])(
    'a disabled alt-date under a custom FieldTemplate ignores its %s button',
    async (button) => {
      const onChange = vi.fn();
      render(
        <WrappedForm
          schema={{ type: 'string', format: 'date' }}
          uiSchema={{ 'ui:widget': 'alt-date', 'ui:disabled': true }}
          formData='2020-01-02'
          templates={{ FieldTemplate: BareFieldTemplate }}
          validator={validator}
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole('button', { name: button }));
      expect(onChange).not.toHaveBeenCalled();
    },
  );
});
