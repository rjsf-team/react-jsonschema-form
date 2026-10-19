import { formTests, themeTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form, { generateTemplates, generateTheme, generateWidgets } from '../src/index.ts';

formTests(Form);
themeTests({ generateTemplates, generateTheme, generateWidgets });

describe('a checkbox whose presentation gives its label and description to the template', () => {
  test('draws each once, from the template', () => {
    const { container } = render(
      <Form
        schema={{ type: 'boolean', title: 'Bee', description: 'Bee description' }}
        uiSchema={{ 'ui:widget': 'checkbox' }}
        presentation={{ widgets: { CheckboxWidget: { label: 'template', description: 'template' } } }}
        validator={validator}
      />,
    );

    expect(screen.getAllByText('Bee')).toHaveLength(1);
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Bee');
    expect(screen.getAllByText('Bee description')).toHaveLength(1);
    expect(container.querySelector('#root__description')).toHaveTextContent('Bee description');
  });
});
