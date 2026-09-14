import type { UiSchema } from '../src/index.ts';

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
