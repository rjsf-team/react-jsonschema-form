import type { ComponentType, ReactNode } from 'react';
import {
  ColorInput,
  createTheme,
  FileInput,
  MantineProvider,
  MultiSelect,
  NumberInput,
  PasswordInput,
  Select,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

const enumSchema: RJSFSchema = { type: 'string', enum: ['a', 'b'] };

// Each widget, with the Mantine input it renders, whose theme `defaultProps` the widget resolves as that input does
const inputs: [string, ComponentType<any>, RJSFSchema, UiSchema?][] = [
  ['TextInput', TextInput, { type: 'string' }],
  ['NumberInput', NumberInput, { type: 'number' }],
  ['Textarea', Textarea, { type: 'string' }, { 'ui:widget': 'textarea' }],
  ['Select', Select, enumSchema],
  ['MultiSelect', MultiSelect, { type: 'array', items: enumSchema, uniqueItems: true }],
  ['FileInput', FileInput, { type: 'string', format: 'data-url' }],
  ['TimeInput', TimeInput, { type: 'string', format: 'time' }],
  ['ColorInput', ColorInput, { type: 'string', format: 'color' }],
  ['PasswordInput', PasswordInput, { type: 'string' }, { 'ui:widget': 'password' }],
  ['DateInput', DateInput, { type: 'string', format: 'date' }],
];

// Every theme component an input's props may be resolved from
const sharedComponents = ['InputWrapper', 'Input', 'InputBase', 'PillsInput'];

/** Each single theme component and each pair of them, so that the precedence between any two is compared */
function themeComponentSets(component: string) {
  const names = [...sharedComponents, component];
  return names.flatMap((first, i) => [[first], ...names.slice(i + 1).map((second) => [first, second])]);
}

function markedTheme(names: string[]) {
  return createTheme({
    components: Object.fromEntries(
      names.map((name) => [
        name,
        {
          defaultProps: {
            inputContainer: (children: ReactNode) => <div data-container={name}>{children}</div>,
            errorProps: { 'data-error-from': name },
          },
        },
      ]),
    ),
  });
}

function markers(container: HTMLElement) {
  return {
    inputContainer: container.querySelector('[data-container]')?.getAttribute('data-container'),
    errorProps: container.querySelector('[data-error-from]')?.getAttribute('data-error-from'),
  };
}

// The widgets resolve these as Mantine's inputs do, from a list of theme components that must follow how each Mantine
// input passes its props on to `InputBase`, `PillsInput`, `Input` and `Input.Wrapper`. Comparing against the Mantine
// input itself fails if a Mantine release changes that.
describe.each(inputs)('%s theme defaults', (component, MantineInput, schema, uiSchema) => {
  test.each(themeComponentSets(component).map((names) => [names.join(' and '), names]))(
    'resolve from %s as Mantine does',
    (_, names) => {
      const theme = markedTheme(names);
      const mantine = render(
        <MantineProvider theme={theme}>
          <MantineInput label='A title' error='An error' />
        </MantineProvider>,
      );
      const expected = markers(mantine.container);
      mantine.unmount();

      const { container } = render(
        <MantineProvider theme={theme}>
          <Form
            schema={{ title: 'A title', ...schema }}
            uiSchema={uiSchema}
            validator={validator}
            extraErrors={{ __errors: ['An error'] }}
            showErrorList={false}
          />
        </MantineProvider>,
      );

      expect(markers(container)).toEqual(expected);
    },
  );
});
