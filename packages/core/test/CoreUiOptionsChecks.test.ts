import type { UiSchema } from '@rjsf/utils';

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
});
