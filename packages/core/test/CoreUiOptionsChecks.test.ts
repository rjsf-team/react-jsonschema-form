import type { UiOptionsCheck, UiSchema } from '@rjsf/utils';

import type { CoreUiOptionsChecks } from '../src/index.ts';

// A self-referential shape (no depth cap), matching how a recursive `$ref` (e.g.
// packages/playground/src/samples/references.ts's `node` definition) actually behaves.
interface TreeNode {
  name: string;
  children: (TreeNode | null)[];
}

interface ReferencesFormData {
  billing_address: { street_address: string; city: string; state: string };
  tree: TreeNode;
  contact: { name: string; details: string };
}

describe('CoreUiOptionsChecks', () => {
  it("narrows ui:widget/ui:field/ui:options to @rjsf/core's real widget and field names", () => {
    type Checked = UiSchema<ReferencesFormData, any, any, CoreUiOptionsChecks>;

    const ui: Checked = {
      'ui:order': ['billing_address', 'contact', 'tree'],
      tree: {
        name: { 'ui:placeholder': 'Enter node name', 'ui:help': 'Applies at every recursion level' },
        children: { 'ui:options': { orderable: false }, items: { 'ui:help': 'Per-item help on a recursive element' } },
      },
      contact: {
        name: { 'ui:placeholder': 'Full name (e.g., John Doe)' },
        details: { 'ui:widget': 'TextareaWidget' },
      },
    };
    const badWidget: Checked = {
      tree: {
        // @ts-expect-error RangeWidget is a number widget; `name` is a string field
        name: { 'ui:widget': 'RangeWidget' },
      },
    };
    const badField: Checked = {
      tree: {
        // @ts-expect-error StringField is a string field's field implementation, not valid for `children`, an array
        children: { 'ui:field': 'StringField' },
      },
    };

    expect(ui.tree?.name?.['ui:placeholder']).toBe('Enter node name');
    expect(ui['ui:order']).toEqual(['billing_address', 'contact', 'tree']);
    expect([badWidget, badField]).toHaveLength(2);
  });

  it('closes the ui: namespace to just the options CoreUiOptionsChecks declares', () => {
    type Checked = UiSchema<{ bio: string }, any, any, CoreUiOptionsChecks>;

    const bad: Checked = {
      bio: {
        // @ts-expect-error `ui:wigdet` is a typo of `ui:widget` - no longer swallowed by a permissive index signature
        'ui:wigdet': 'TextWidget',
      },
    };

    expect(bad).toBeDefined();
  });

  it('keeps type-agnostic options (template overrides, global options) available under Checks', () => {
    type Checked = UiSchema<{ bio: string }, any, any, CoreUiOptionsChecks>;

    const ui: Checked = {
      'ui:label': false,
      'ui:ObjectFieldTemplate': () => null,
      'ui:enableMarkdownInDescription': true,
      bio: { 'ui:label': false },
    };

    expect(ui['ui:label']).toBe(false);
  });

  it('accepts the lowercase widget aliases getWidget resolves, alongside the PascalCase component names', () => {
    type Checked = UiSchema<ReferencesFormData, any, any, CoreUiOptionsChecks>;

    const ui: Checked = {
      contact: {
        name: { 'ui:widget': 'textarea' },
        details: { 'ui:widget': 'hidden' },
      },
    };

    expect(ui.contact?.name?.['ui:widget']).toBe('textarea');
  });

  it('allows hiding an array or object field, but only via the alias ObjectField/SchemaField actually check', () => {
    type Checked = UiSchema<ReferencesFormData, any, any, CoreUiOptionsChecks>;

    const hiddenArray: Checked = { tree: { children: { 'ui:widget': 'HiddenWidget' } } };
    const hiddenObject: Checked = { tree: { 'ui:widget': 'hidden' } };
    const badHiddenObject: Checked = {
      // @ts-expect-error `'HiddenWidget'` has no runtime effect on an object field - only `'hidden'` does
      tree: { 'ui:widget': 'HiddenWidget' },
    };

    expect(hiddenArray.tree?.children?.['ui:widget']).toBe('HiddenWidget');
    expect(hiddenObject.tree?.['ui:widget']).toBe('hidden');
    expect(badHiddenObject).toBeDefined();
  });

  it('makes emptyValue/placeholder/inline/filePreview available on every type that actually reads them', () => {
    type Checked = UiSchema<{ age: number; agree: boolean; tags: string[] }, any, any, CoreUiOptionsChecks>;

    const ui: Checked = {
      age: { 'ui:emptyValue': 0, 'ui:placeholder': 'Age', 'ui:options': { inline: true } },
      agree: { 'ui:emptyValue': false, 'ui:placeholder': 'Agree?', 'ui:options': { inline: true } },
      tags: { 'ui:options': { filePreview: true, emptyValue: [] } },
    };

    expect(ui.age?.['ui:emptyValue']).toBe(0);
    expect(ui.agree?.['ui:emptyValue']).toBe(false);
  });

  it('offers the enum options, optgroups included, on every type whose widgets read them', () => {
    type Checked = UiSchema<
      { pet: string; rank: number; agree: boolean; tags: string[]; home: { city: string } },
      any,
      any,
      CoreUiOptionsChecks
    >;

    const ui: Checked = {
      pet: { 'ui:options': { optgroups: { Mammals: ['cat', 'dog'], Birds: ['parrot'] } } },
      rank: { 'ui:options': { optgroups: { Low: [1, 2] } } },
      agree: { 'ui:options': { optgroups: { Answers: [true, false] } } },
      tags: { 'ui:options': { optgroups: { Colors: ['red'] } } },
    };
    const badOnObject: Checked = {
      // @ts-expect-error `optgroups` is an enum option; an object field never renders a select
      home: { 'ui:options': { optgroups: { Any: ['x'] } } },
    };

    expect(ui.pet?.['ui:options']?.optgroups).toEqual({ Mammals: ['cat', 'dog'], Birds: ['parrot'] });
    expect(badOnObject).toBeDefined();
  });

  it('narrows a readonly array field and does not mistake a length-bearing object for an array', () => {
    interface Track {
      length: number;
      title: string;
    }
    type Checked = UiSchema<{ tags: readonly string[]; track: Track }, any, any, CoreUiOptionsChecks>;

    const ui: Checked = {
      tags: { 'ui:options': { orderable: false } },
      track: { 'ui:options': { order: ['title'] } },
    };
    const badOnArray: Checked = {
      // @ts-expect-error `order` is an object option, not valid for the readonly array field `tags`
      tags: { 'ui:options': { order: ['title'] } },
    };

    expect(ui.tags?.['ui:options']).toEqual({ orderable: false });
    expect(badOnArray).toBeDefined();
  });

  it('does not widen the vocabulary for a Checks member that declares no widget/field key', () => {
    type NoWidgetCheck = UiOptionsCheck<string, { placeholder: string }>;
    type Checked = UiSchema<{ bio: string }, any, any, CoreUiOptionsChecks | NoWidgetCheck>;

    const bad: Checked = {
      bio: {
        // @ts-expect-error unioning in a widget-less/field-less check must not open ui:widget back up to `any`
        'ui:widget': 'NotARealWidget',
      },
    };

    expect(bad).toBeDefined();
  });
});
