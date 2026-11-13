import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import type { ChakraGlobalUISchemaOptions } from '../src/index.ts';
import Form from './WrappedForm.tsx';

const checkboxesSchema: RJSFSchema = { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true };
const checkboxes = { 'ui:widget': 'checkboxes' };
// The widget's own fieldset, the one inside the `FieldTemplate`'s
const widgetFieldset = 'fieldset fieldset';
const globalChakra: ChakraGlobalUISchemaOptions = { chakra: { mb: 8 } };

const cases: [name: string, schema: RJSFSchema, uiSchema: UiSchema, root: string][] = [
  [
    'a FieldsetRoot widget through ui:options',
    checkboxesSchema,
    { ...checkboxes, 'ui:options': { chakra: { mb: 8 } } },
    widgetFieldset,
  ],
  [
    'a FieldsetRoot widget through the ui:chakra shorthand',
    checkboxesSchema,
    { ...checkboxes, 'ui:chakra': { mb: 8 } },
    widgetFieldset,
  ],
  [
    'a FieldsetRoot widget through ui:globalOptions',
    checkboxesSchema,
    { ...checkboxes, 'ui:globalOptions': globalChakra },
    widgetFieldset,
  ],
  [
    'a Field-wrapped widget, the BaseInputTemplate of a string',
    { type: 'string' },
    { 'ui:options': { chakra: { mb: 8 } } },
    '.chakra-field__root',
  ],
  [
    'AltDateWidget',
    { type: 'string', format: 'date' },
    { 'ui:widget': 'alt-date', 'ui:options': { chakra: { mb: 8 } } },
    widgetFieldset,
  ],
];

describe('chakra option', () => {
  it.each(cases)('applies the style props to the root of %s', (_, schema, uiSchema, root) => {
    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    // jsdom computes no style from Chakra's layered rules, so this reads the rule Emotion wrote for the widget's root
    const emotionClass = container.querySelector(root)?.className.split(' ').at(-1);
    const css = Array.from(document.querySelectorAll('style'), (style) => style.textContent).join('');

    expect(emotionClass).toMatch(/^css-/);
    expect(css).toMatch(new RegExp(`\\.${emotionClass}\\{[^}]*margin-bottom:var\\(--chakra-spacing-8\\)`));
  });
});
