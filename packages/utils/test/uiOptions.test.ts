import { expectTypeOf } from 'vitest';

import type { FormContextType, RJSFSchema, UiOptions, UiOptionsCheck } from '../src/index.ts';

// These assertions carry no runtime behavior; their value is entirely in what `tsc` does with them (via `pnpm run
// typecheck` at the repo root, which covers this `test/` project). A wrong assignment below should fail to compile,
// and is asserted with `// @ts-expect-error` so an accidental fix that stops narrowing shows up as an unused
// `@ts-expect-error` compile error instead of silently passing.

interface Address {
  street_address: string;
  city: string;
  state: string;
}

// Self-referential, matching how a recursive `$ref` (packages/playground/src/samples/references.ts's `node`
// definition) actually behaves - no artificial depth cap.
interface TreeNode {
  name: string;
  children: (TreeNode | null)[];
}

interface Contact {
  name: string;
  details: string;
}

interface ReferencesFormData {
  billing_address: Address;
  shipping_address: Address;
  tree: TreeNode;
  contact: Contact;
}

describe('UiOptions', () => {
  it('narrows widgets per field type on a recursive, nested form-data shape', () => {
    const uiSchema: UiOptions<ReferencesFormData> = {
      'ui:order': ['shipping_address', 'billing_address', 'contact', 'tree'],
      shipping_address: {
        street_address: {
          'ui:placeholder': 'Shipping street (leave empty for pickup)',
        },
      },
      tree: {
        name: {
          'ui:placeholder': 'Enter node name',
          'ui:help': 'Applies at every recursion level',
        },
        children: {
          'ui:options': {
            orderable: false,
          },
          items: {
            'ui:help': 'Per-item help on a recursive array element',
          },
        },
      },
      contact: {
        name: { 'ui:placeholder': 'Full name (e.g., John Doe)' },
        details: { 'ui:widget': 'TextareaWidget' },
      },
    };

    expectTypeOf(uiSchema).toBeObject();
  });

  it('rejects a widget that is not valid for the field type', () => {
    const bad: UiOptions<ReferencesFormData> = {
      tree: {
        // @ts-expect-error RangeWidget is a number widget; `name` is a string field
        name: { 'ui:widget': 'RangeWidget' },
      },
    };
    expectTypeOf(bad).toBeObject();
  });

  it('rejects a raw option nested under the wrong field type', () => {
    const bad: UiOptions<ReferencesFormData> = {
      tree: {
        // @ts-expect-error `rows` (a string/textarea option) is not valid for `children`, an array field
        children: { 'ui:rows': 4 },
      },
    };
    expectTypeOf(bad).toBeObject();
  });

  it('supports both the `ui:optionName` and `ui:options: { optionName }` forms', () => {
    interface FormData {
      bio: string;
    }
    const viaPrefix: UiOptions<FormData> = { bio: { 'ui:placeholder': 'Tell us about yourself' } };
    const viaOptions: UiOptions<FormData> = { bio: { 'ui:options': { placeholder: 'Tell us about yourself' } } };
    expectTypeOf(viaPrefix).toBeObject();
    expectTypeOf(viaOptions).toBeObject();
  });

  it('still type-checks the fixed keys of a field whose shape also has an index signature (additionalProperties)', () => {
    // Mirrors what packages/playground/src/samples/patternProperties.ts's formData shape compiles to in TS.
    interface PatternPropsFormData {
      firstName: string;
      lastName: string;
      [dynamicKey: string]: string;
    }

    const uiSchema: UiOptions<PatternPropsFormData> = {
      firstName: { 'ui:autofocus': true },
      assKickCount: { 'ui:placeholder': 'a dynamic, non-declared key still type-checks as `string`' },
    };
    expectTypeOf(uiSchema).toBeObject();

    const bad: UiOptions<PatternPropsFormData> = {
      // @ts-expect-error firstName is `string`; RangeWidget is a number widget
      firstName: { 'ui:widget': 'RangeWidget' },
    };
    expectTypeOf(bad).toBeObject();
  });

  it('lets a theme/consumer extend the widget and option vocabulary via a Checks union', () => {
    type MyThemeChecks =
      | UiOptionsCheck<boolean, { widget?: 'ToggleWidget' }>
      | UiOptionsCheck<number, { widget?: 'SliderWidget' }>;

    interface FormData {
      active: boolean;
    }

    const uiSchema: UiOptions<FormData, RJSFSchema, FormContextType, MyThemeChecks> = {
      active: { 'ui:widget': 'ToggleWidget' },
    };
    expectTypeOf(uiSchema).toBeObject();
  });

  it('still restricts ui:widget to known names when no type parameter is provided (unlike UiSchema)', () => {
    const uiSchema: UiOptions = {
      anything: { 'ui:widget': 'TextWidget' },
    };
    expectTypeOf(uiSchema).toBeObject();

    const bad: UiOptions = {
      // @ts-expect-error `T` defaulting to `any` does not open up ui:widget to arbitrary strings the way
      // `UiSchema`'s `Widget<T,S,F> | string` does - it stays limited to the names in CoreUiOptionsChecks/Checks.
      anything: { 'ui:widget': 'NotARealWidgetName' },
    };
    expectTypeOf(bad).toBeObject();
  });
});
