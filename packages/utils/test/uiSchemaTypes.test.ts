import type { CoreUiOptionsChecks, FormContextType, RJSFSchema, UiOptionsCheck, UiSchema } from '../src/index.ts';

interface Data {
  name: string;
  address: { city: string };
  optionalAddress?: { city: string };
  tags: string[];
  items: { label: string }[];
  thing: { common: string; onlyA: string } | { common: string; onlyB: number };
  listOrObject: string[] | { foo: string };
  scalarOrObject: string | { city: string };
  pair: [string, { city: string }];
  when: Date;
  upload: File;
  counts: Map<string, number>;
  loose: unknown;
}

type Known = UiSchema<Data>;

describe('UiSchema type', () => {
  it('accepts the field names of typed form data', () => {
    const ui: Known = {
      'ui:title': 'Form',
      name: { 'ui:widget': 'textarea' },
      address: { city: { 'ui:placeholder': 'City' } },
      optionalAddress: { city: { 'ui:placeholder': 'City' } },
      tags: { items: { 'ui:widget': 'text' } },
      items: { items: { label: { 'ui:title': 'Label' } } },
    };

    expect(ui.name?.['ui:widget']).toBe('textarea');
    expect(ui.address?.city?.['ui:placeholder']).toBe('City');
    expect(ui.items?.items).toBeDefined();
  });

  it('types additionalProperties by the index signature and leaves it open without one', () => {
    const open: Known = { additionalProperties: { city: { 'ui:placeholder': 'City' } } };
    const indexed: UiSchema<Record<string, { city: string }>> = {
      additionalProperties: { city: { 'ui:placeholder': 'City' } },
    };
    const wrong: UiSchema<Record<string, { city: string }>> = {
      // @ts-expect-error: TS2353, `zip` is not a field of the index signature's value
      additionalProperties: { zip: { 'ui:placeholder': 'Zip' } },
    };

    expect(open.additionalProperties?.city).toBeDefined();
    expect([indexed, wrong]).toHaveLength(2);
  });

  it('accepts a key from any branch of a union-typed field', () => {
    const ui: Known = {
      thing: {
        common: { 'ui:title': 'Common' },
        onlyA: { 'ui:title': 'A' },
        onlyB: { 'ui:title': 'B' },
      },
    };

    expect(ui.thing?.onlyA?.['ui:title']).toBe('A');
  });

  it('takes no field names from an array branch of a union-typed field', () => {
    const ui: Known = { listOrObject: { foo: { 'ui:title': 'Foo' } } };
    const nested: Known = { listOrObject: { items: { 'ui:widget': 'text' } } };
    const wrong: Known = {
      // @ts-expect-error: TS2353, `toLocaleString` is an Array method, not a field of Data['listOrObject']
      listOrObject: { toLocaleString: { 'ui:title': 'Nope' } },
    };

    expect(ui.listOrObject?.foo?.['ui:title']).toBe('Foo');
    expect(nested.listOrObject?.items).toBeDefined();
    expect(wrong.listOrObject).toBeDefined();
  });

  it('accepts a key from the object branch of a union with a primitive, as a oneOf of mixed types produces', () => {
    const ui: Known = { scalarOrObject: { city: { 'ui:title': 'City' } } };
    const asLeaf: Known = { scalarOrObject: { 'ui:widget': 'text' } };

    expect(ui.scalarOrObject?.city?.['ui:title']).toBe('City');
    expect(asLeaf.scalarOrObject?.['ui:widget']).toBe('text');
  });

  it("types a tuple's items entry by what any position can hold", () => {
    const ui: Known = { pair: { items: { city: { 'ui:title': 'City' } } } };

    expect(ui.pair?.items).toBeDefined();
  });

  it('treats a value that holds no form fields of its own as a leaf', () => {
    const ui: Known = { when: { 'ui:widget': 'alt-date' }, upload: { 'ui:widget': 'file' } };
    const wrong: Known = {
      // @ts-expect-error: TS2353, `getTime` is a Date method, not a field of Data['when']
      when: { getTime: { 'ui:title': 'Nope' } },
    };

    expect(ui.when?.['ui:widget']).toBe('alt-date');
    expect(wrong.when).toBeDefined();
  });

  it('treats any built-in class instance as a leaf, not only Date and File', () => {
    const ui: Known = { counts: { 'ui:widget': 'counts' } };
    const wrong: Known = {
      // @ts-expect-error: TS2353, `size` is a Map property, not a field of Data['counts']
      counts: { size: { 'ui:title': 'Nope' } },
    };

    expect(ui.counts?.['ui:widget']).toBe('counts');
    expect(wrong.counts).toBeDefined();
  });

  it('leaves a field whose type says nothing about its data unconstrained', () => {
    const ui: Known = { loose: { nested: { 'ui:title': 'Nested' } } };

    expect(ui.loose?.nested?.['ui:title']).toBe('Nested');
  });

  it('keeps the ui: namespace open for theme and application directives', () => {
    const ui: Known = { 'ui:order': ['name', '*'], 'ui:myTheme:thing': 42 };

    expect(ui['ui:myTheme:thing']).toBe(42);
  });

  it('leaves an untyped uiSchema as permissive as it has always been', () => {
    const ui: UiSchema = { whatever: 1, nested: { deeper: { 'ui:widget': 'text' } }, 'ui:wigdet': 'typo' };

    expect(ui.nested.deeper['ui:widget']).toBe('text');
  });

  it('rejects a field name the data does not have', () => {
    const ui: Known = {
      // @ts-expect-error: TS2353, `nmae` is not a field of Data
      nmae: { 'ui:widget': 'text' },
    };
    const nested: Known = {
      // @ts-expect-error: TS2353, `ctiy` is not a field of Data['address']
      address: { ctiy: { 'ui:title': 'City' } },
    };
    const branch: Known = {
      // @ts-expect-error: TS2353, `onlyC` is in no branch of Data['thing']
      thing: { onlyC: { 'ui:title': 'C' } },
    };

    expect([ui, nested, branch]).toHaveLength(3);
  });
});

describe('UiSchema key openness', () => {
  it('closes field names and keeps ui: directives open for typed data', () => {
    const fieldNamesClosed: string extends keyof Known ? false : true = true;
    const directivesOpen: `ui:${string}` extends keyof Known ? true : false = true;

    expect([fieldNamesClosed, directivesOpen]).toEqual([true, true]);
  });
});

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

describe('UiSchema Checks parameter (vocabulary narrowing)', () => {
  it('leaves UiSchema fully open when Checks is omitted, same as ever - passing a Checks union is what narrows it', () => {
    const ui: UiSchema<ReferencesFormData> = {
      tree: { name: { 'ui:widget': 'AnyStringWhatsoever' } },
    };

    expect(ui.tree?.name?.['ui:widget']).toBe('AnyStringWhatsoever');
  });

  it('narrows widgets per field type on a recursive, nested form-data shape, using just the core vocabulary', () => {
    // CoreUiOptionsChecks is always included once any Checks is passed - pass it directly for "core vocabulary,
    // no theme/consumer extensions".
    type Checked = UiSchema<ReferencesFormData, RJSFSchema, FormContextType, CoreUiOptionsChecks>;

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
    const badRawOption: Checked = {
      tree: {
        // @ts-expect-error `rows` (a string/textarea option) is not valid for `children`, an array field
        children: { 'ui:rows': 4 },
      },
    };

    expect(ui.tree?.name?.['ui:placeholder']).toBe('Enter node name');
    expect([badWidget, badRawOption]).toHaveLength(2);
  });

  it('supports both the `ui:optionName` and `ui:options: { optionName }` forms once Checks is supplied', () => {
    type Checked = UiSchema<{ bio: string }, RJSFSchema, FormContextType, CoreUiOptionsChecks>;

    const viaPrefix: Checked = { bio: { 'ui:placeholder': 'Tell us about yourself' } };
    const viaOptions: Checked = { bio: { 'ui:options': { placeholder: 'Tell us about yourself' } } };

    expect(viaPrefix.bio?.['ui:placeholder']).toBe('Tell us about yourself');
    expect(viaOptions.bio?.['ui:options']?.placeholder).toBe('Tell us about yourself');
  });

  it('still type-checks the fixed keys of a field whose shape also has an index signature (additionalProperties)', () => {
    // Mirrors what packages/playground/src/samples/patternProperties.ts's formData shape compiles to in TS.
    interface PatternPropsFormData {
      firstName: string;
      lastName: string;
      [dynamicKey: string]: string;
    }
    type Checked = UiSchema<PatternPropsFormData, RJSFSchema, FormContextType, CoreUiOptionsChecks>;

    const ui: Checked = {
      firstName: { 'ui:autofocus': true },
      assKickCount: { 'ui:placeholder': 'a dynamic, non-declared key still type-checks as `string`' },
    };
    const bad: Checked = {
      // @ts-expect-error firstName is `string`; RangeWidget is a number widget
      firstName: { 'ui:widget': 'RangeWidget' },
    };

    expect(ui.firstName?.['ui:autofocus']).toBe(true);
    expect(bad).toBeDefined();
  });

  it('lets a theme/consumer extend the widget and option vocabulary via a Checks union', () => {
    type MyThemeChecks =
      | UiOptionsCheck<boolean, { widget?: 'ToggleWidget' }>
      | UiOptionsCheck<number, { widget?: 'SliderWidget' }>;
    type Checked = UiSchema<{ active: boolean }, RJSFSchema, FormContextType, MyThemeChecks>;

    const ui: Checked = { active: { 'ui:widget': 'ToggleWidget' } };

    expect(ui.active?.['ui:widget']).toBe('ToggleWidget');
  });
});
