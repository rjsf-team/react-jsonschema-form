import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import { generateWidgets } from '@rjsf/core';
import type { RegistryWidgetsType, RJSFSchema, UiSchema } from '@rjsf/utils';
import { besideOptionsId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, isInaccessible, render, screen, waitFor } from '@testing-library/react';

import { WIDGET_FIXTURES } from './widgetFixtures.ts';

const TITLE = 'Field title';
const DESCRIPTION = 'Field description';
const HELP = 'Field help';
const ERROR = 'Field error';

const CONTROLS = [
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'button',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="radio"]',
  '[role="radiogroup"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
].join(', ');
const GROUP = 'fieldset, [role="group"]';
/** The ids the group of the field each case renders, a container, may carry: its own, or the one beside its options */
const CONTAINER_IDS = new Set(['root_field', besideOptionsId('root_field')]);
const LABELABLE = 'button, input:not([type="hidden"]), meter, output, progress, select, textarea';
const REFERENCES = [
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-activedescendant',
  'aria-errormessage',
];

interface ContractCase {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
  formData?: unknown;
  /** Whether the field draws no title, description or help, as a hidden widget doesn't */
  presentsNothing?: boolean;
}

/** The ids `element`'s `attribute` lists */
function idsIn(element: Element, attribute: string) {
  return (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);
}

/** A repeat of each id carried by more than one of `elements`, as `testing/duplicateIds.ts` finds them, which this
 * published package can't import
 */
function duplicateIds(elements: Element[]) {
  const seen = new Set<string>();
  const repeats: string[] = [];
  for (const { id } of elements) {
    if (seen.has(id)) {
      repeats.push(id);
    } else {
      seen.add(id);
    }
  }
  return repeats;
}

function expectContract(container: HTMLElement, { presentsNothing }: ContractCase, errored: boolean, exempt?: string) {
  const checked = (selector: string) =>
    [...container.querySelectorAll<HTMLElement>(selector)].filter((element) => !exempt || !element.matches(exempt));

  expect(duplicateIds(checked('[id]'))).toEqual([]);

  for (const label of checked('label[for]')) {
    const target = label.getAttribute('for');
    expect(container.querySelector(`[id="${target}"]`)?.matches(LABELABLE), `label for="${target}"`).toBe(true);
  }
  for (const element of checked(REFERENCES.map((attribute) => `[${attribute}]`).join(', '))) {
    for (const id of REFERENCES.flatMap((attribute) => idsIn(element, attribute))) {
      expect(container.querySelector(`[id="${id}"]`), `the element ${id} names`).toBeInTheDocument();
    }
    if (element.matches(GROUP) && CONTAINER_IDS.has(element.id)) {
      // A container's group is described by its errors but not marked invalid, which ARIA doesn't allow on a `group`
      expect(element, `${element.outerHTML} is not invalid`).not.toHaveAttribute('aria-invalid');
    } else if (idsIn(element, 'aria-describedby').some((id) => id.endsWith('__error'))) {
      // A theme may mark a radio group invalid rather than each radio in it, but no other ancestor stands in
      expect(
        element.matches('[aria-invalid="true"]') || element.closest('[role="radiogroup"][aria-invalid="true"]'),
        `${element.outerHTML} is invalid`,
      ).toBeTruthy();
    }
  }
  if (!errored) {
    expect(checked('[aria-invalid="true"]').map(({ outerHTML }) => outerHTML)).toEqual([]);
  }

  for (const control of checked(CONTROLS).filter((element) => !isInaccessible(element))) {
    expect(control, control.outerHTML).toHaveAccessibleName();
    if ('labels' in control) {
      expect((control as HTMLInputElement).labels!.length, `labels of ${control.outerHTML}`).toBeLessThanOrEqual(1);
    }
  }

  const shown = presentsNothing ? 0 : 1;
  expect(screen.queryAllByText(DESCRIPTION)).toHaveLength(shown);
  expect(screen.queryAllByText(HELP)).toHaveLength(shown);
  expect(screen.queryAllByText(ERROR)).toHaveLength(errored ? shown : 0);
  if (errored && !presentsNothing) {
    // Whoever draws the error, it is drawn under an error id, and some element is described by it
    const errorId = screen.getByText(ERROR).closest('[id$="__error"]')?.id;
    expect(errorId, 'the id the error is drawn under').toBeDefined();
    expect(checked(`[aria-describedby~="${errorId}"]`), `the elements ${errorId} describes`).not.toEqual([]);
  }
}

/** Pins the presentation contract every theme's fields keep, the same way in core and every theme: an accessible name
 * and at most one label per control, including an option selector's and each date part's, one description, help and
 * error per field, every id a label or an ARIA reference names on the page, `aria-invalid` on each control an error
 * describes, or on its radio group, and nowhere while clean, and no id carried twice (#5592). Each case is drawn once
 * clean and once with an error.
 *
 * @param Form - The theme's `Form` component
 * @param widgets - The widgets the theme registers, merged over core's defaults to decide the widgets that render
 * @param [fixtures] - Schemas for widgets this package does not know, keyed by the name they are registered under
 * @param [exempt] - A selector for the elements a theme knows break the contract, which the checks skip; each part of
 *        it should name the open issue that tracks the break
 */
export function presentationContractTests(
  Form: ComponentType<FormProps>,
  widgets: RegistryWidgetsType,
  fixtures: Record<string, RJSFSchema> = {},
  exempt?: string,
) {
  const allFixtures = { ...WIDGET_FIXTURES, ...fixtures };
  const allWidgets = { ...generateWidgets(), ...widgets };
  const presented = { title: TITLE, description: DESCRIPTION };
  const options: RJSFSchema[] = [
    { title: 'Text', type: 'string' },
    { title: 'Number', type: 'number' },
  ];
  const objectOptions: RJSFSchema = {
    type: 'object',
    properties: { name: { type: 'string' } },
    anyOf: [
      { title: 'Dog', properties: { bark: { type: 'string' } } },
      { title: 'Cat', properties: { meow: { type: 'string' } } },
    ],
  };

  const cases: [string, ContractCase][] = [
    ...Object.keys(allWidgets)
      .sort()
      .map((widgetName): [string, ContractCase] => [
        widgetName,
        {
          schema: { ...allFixtures[widgetName], ...presented },
          uiSchema: {
            // Only the `hidden` alias hides the field's title, description and help along with its control
            'ui:widget': widgetName === 'HiddenWidget' ? 'hidden' : widgetName,
            // Only the alt-date widgets read this, and its default runs to the current year
            ...(widgetName.startsWith('AltDate') ? { 'ui:options': { yearsRange: [2020, 2024] } } : {}),
          },
          presentsNothing: widgetName === 'HiddenWidget',
        },
      ]),
    ['a oneOf rendering its option', { schema: { ...presented, oneOf: options }, formData: 'a' }],
    ['an untitled oneOf rendering its option', { schema: { description: DESCRIPTION, oneOf: options }, formData: 'a' }],
    // An optional object's `anyOf` renders no selector or option while it has no data (#5401)
    [
      'an anyOf rendering no option',
      {
        schema: { ...objectOptions, ...presented },
        uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
      },
    ],
    [
      'an untitled anyOf rendering no option',
      {
        schema: { ...objectOptions, description: DESCRIPTION },
        uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
      },
    ],
    ['an array', { schema: { ...presented, type: 'array', items: { type: 'string' } }, formData: ['a'] }],
    // Most themes draw a multiple select with a component of their own (#5478, #5492)
    [
      'a multiple select',
      {
        schema: { ...presented, type: 'array', uniqueItems: true, items: { type: 'string', enum: ['north', 'south'] } },
        uiSchema: { 'ui:widget': 'SelectWidget' },
        formData: ['north'],
      },
    ],
    ['an object', { schema: { ...presented, type: 'object', properties: { a: { type: 'string' } } }, formData: {} }],
    ['a fallback value', { schema: presented, formData: 'a' }],
    // The value draws its own heading below the type selector, whichever type the list names first
    ...(
      [
        ['string', 'object'],
        ['object', 'string'],
      ] as const
    ).map((type): [string, ContractCase] => [
      `a type list naming ${type[0]} first, holding an object`,
      { schema: { ...presented, type: [...type], properties: { a: { type: 'string' } } }, formData: { a: 'x' } },
    ]),
  ];

  describe('every field keeps the presentation contract', () => {
    describe.each([
      ['clean', false],
      ['errored', true],
    ])('%s', (_, errored) => {
      test.each(cases)('%s', (name, contractCase) => {
        // A widget with no fixture is one this suite would silently skip
        if (name in allWidgets) {
          expect(Object.hasOwn(allFixtures, name)).toBe(true);
        }
        const { schema, uiSchema = {}, formData } = contractCase;
        const { 'ui:globalOptions': globalOptions, ...fieldUiSchema } = uiSchema;
        const { container } = render(
          <Form
            schema={{ type: 'object', properties: { field: schema } }}
            uiSchema={{
              ...(globalOptions ? { 'ui:globalOptions': globalOptions } : {}),
              field: { ...fieldUiSchema, 'ui:help': HELP },
            }}
            initialFormData={formData === undefined ? undefined : { field: formData }}
            validator={validator}
            showErrorList={false}
            // Without it a schema with no type renders `UnsupportedField`'s message rather than the fallback UI
            useFallbackUiForUnsupportedType
            extraErrors={errored ? { field: { __errors: [ERROR] } } : undefined}
          />,
        );

        expectContract(container, contractCase, errored, exempt);
      });
    });
  });

  // An object's or an array's own error is about none of the fields in it, so focus doesn't go into them
  describe("a container's own error focuses none of its fields", () => {
    test.each<[string, RJSFSchema, unknown]>([
      [
        'an object',
        { type: 'object', minProperties: 2, properties: { a: { type: 'string' }, b: { type: 'string' } } },
        { a: 'x' },
      ],
      ['an array', { type: 'array', minItems: 2, items: { type: 'string' } }, ['x']],
      ['an empty array', { type: 'array', minItems: 1, items: { type: 'string' } }, []],
    ])('%s', async (_, schema, formData) => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { field: { ...schema, title: TITLE } } }}
          initialFormData={{ field: formData }}
          validator={validator}
          focusOnFirstError
        />,
      );
      // A DOM click, as user-event isn't among this package's peer dependencies
      act(() => container.querySelector<HTMLElement>('[type="submit"]')!.click());

      await waitFor(() => expect(container.querySelector('[id$="__error"]')).toBeInTheDocument());
      // Neither one of its fields nor a part of it, such as its add button, whatever id the theme gives it
      expect(document.body).toHaveFocus();
    });
  });
}
