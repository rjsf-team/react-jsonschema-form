import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import Form from '../src/index.ts';

describe('ArrayFieldItemTemplate', () => {
  it.each<{
    named: string;
    items: RJSFSchema;
    uiSchema?: UiSchema;
    formData: unknown[];
    marginTop: string;
    fallbackUi?: boolean;
  }>([
    {
      named: 'a text input, whose label sits above it',
      items: { type: 'string', title: 'Tag' },
      formData: ['a', 'b'],
      marginTop: '26px',
    },
    {
      named: 'a select, whose label sits above it',
      items: { type: 'string', title: 'Size', enum: ['s', 'm'] },
      formData: ['s', 'm'],
      marginTop: '26px',
    },
    {
      named: 'a checkbox, whose label sits beside it',
      items: { type: 'boolean', title: 'Flag' },
      formData: [true, false],
      marginTop: '0px',
    },
    {
      named: "a type list under the fallback UI, whose type selector's label sits above it",
      items: { type: ['string', 'number'], title: 'Value' },
      formData: ['a', 'b'],
      marginTop: '26px',
      fallbackUi: true,
    },
    {
      named: "an untitled type list under the fallback UI, whose type selector's label sits above it",
      items: { type: ['string', 'number'] },
      formData: ['a', 'a'],
      marginTop: '26px',
      fallbackUi: true,
    },
    {
      named: 'a type list with a hidden value under the fallback UI, whose type selector is hidden with it',
      items: { type: ['string', 'number'], title: 'Value' },
      uiSchema: { items: { 'ui:widget': 'hidden' } },
      formData: ['a', 'a'],
      marginTop: '0px',
      fallbackUi: true,
    },
    {
      named:
        'a deprecated type list hidden by ui:deprecatedHandling under the fallback UI, whose type selector is hidden with it',
      items: { type: ['string', 'number'], title: 'Value', deprecated: true },
      uiSchema: { items: { 'ui:deprecatedHandling': 'hide' } },
      formData: ['a', 'a'],
      marginTop: '0px',
      fallbackUi: true,
    },
    {
      named: 'a hidden text input, with no control on screen to draw a label above',
      items: { type: 'string', title: 'Tag' },
      uiSchema: { items: { 'ui:widget': 'hidden' } },
      formData: ['a', 'b'],
      marginTop: '0px',
    },
    {
      named: 'a hidden text input under the fallback UI, with no control on screen to draw a label above',
      items: { type: 'string', title: 'Tag' },
      uiSchema: { items: { 'ui:widget': 'hidden' } },
      formData: ['a', 'b'],
      marginTop: '0px',
      fallbackUi: true,
    },
  ])('lines the buttons of $named up with the control', ({ items, uiSchema, formData, marginTop, fallbackUi }) => {
    const { container } = render(
      <Form
        schema={{ type: 'array', items }}
        uiSchema={uiSchema}
        initialFormData={formData}
        validator={validator}
        useFallbackUiForUnsupportedType={fallbackUi}
      />,
    );

    expect(container.querySelector('#root_0__moveDown')?.parentElement).toHaveStyle({ marginTop });
  });
});
