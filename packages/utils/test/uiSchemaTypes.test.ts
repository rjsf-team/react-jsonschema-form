import type { UiSchema } from '../src/index.ts';

interface Data {
  name: string;
  address: { city: string };
  optionalAddress?: { city: string };
  tags: string[];
  items: { label: string }[];
  thing: { common: string; onlyA: string } | { common: string; onlyB: number };
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
