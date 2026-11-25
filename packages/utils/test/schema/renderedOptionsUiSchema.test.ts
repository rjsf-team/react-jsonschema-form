import type { CustomMergeAllOf, RJSFSchema, UiSchema } from '../../src/index.ts';
import {
  englishStringTranslator,
  renderedOptionTitles,
  renderedOptionsUiSchema,
  retrieveSchema,
} from '../../src/index.ts';
import { writtenListOf } from '../../src/schema/fieldShownOption.ts';
import parseSchemaGraph from '../../src/schema/graph/parseSchemaGraph.ts';
import shallowAllOfMerge from '../../src/schema/shallowAllOfMerge.ts';
import getTestValidator from '../testUtils/getTestValidator.ts';

const testValidator = getTestValidator({});

const A: RJSFSchema = { properties: { a: { type: 'string' } } };
const B: RJSFSchema = { properties: { b: { type: 'string' } } };
const C: RJSFSchema = { properties: { c: { type: 'string' } } };
const D: RJSFSchema = { properties: { d: { type: 'string' } } };
const uiA: UiSchema = { 'ui:title': 'A' };
const uiB: UiSchema = { 'ui:title': 'B' };
const uiSchema: UiSchema = { oneOf: [uiA, uiB] };

/** The entries the field `field` of the root `root` reads, retrieved as `SchemaField` retrieves it */
function entriesOf(field: RJSFSchema, root: RJSFSchema = field, customMergeAllOf?: CustomMergeAllOf) {
  const view = retrieveSchema({ validator: testValidator, customMergeAllOf }, field, root);
  return renderedOptionsUiSchema(uiSchema, view, root);
}

describe('renderedOptionsUiSchema()', () => {
  it.each<[string, RJSFSchema]>([
    ['an allOf entry', { allOf: [{ oneOf: [C, D] }] }],
    ['a then', { if: true, then: { oneOf: [C, D] } }],
  ])(
    "gives each option %s's list rebuilds with the field's own the entry of the option it was built from",
    (_, rest) => {
      expect(entriesOf({ type: 'object', oneOf: [A, B], ...rest })).toEqual([uiA, uiA, uiB, uiB]);
    },
  );

  // The branch's `type` or `$ref` would win over the field option's, collapsing pairs built from different options
  it.each<[string, RJSFSchema['oneOf'], RJSFSchema]>([
    ['an integer meeting a number', [{ type: 'string' }, { type: 'number' }], { type: 'integer', minimum: 1 }],
    ['one of a list of types', [{ type: 'number' }, { type: ['string', 'null'] }], { type: 'null' }],
  ])(
    "gives the option a then's list rebuilds from the field's option sharing its type, %s, that option's entry",
    (_, oneOf, option) => {
      expect(entriesOf({ oneOf, if: true, then: { oneOf: [option] } })).toEqual([uiB]);
    },
  );

  it("hands back the entries as they stand where every pair of a then's list with the field's names different $refs", () => {
    const field: RJSFSchema = {
      definitions: { A, B, C, D },
      type: 'object',
      oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }],
      if: true,
      then: { oneOf: [{ $ref: '#/definitions/C' }, { $ref: '#/definitions/D' }] },
    };
    expect(entriesOf(field)).toEqual([uiA, uiB]);
  });

  it("gives each option a then's list rebuilds over an allOf entry's the entry of the field's option it was built from", () => {
    const E: RJSFSchema = { properties: { e: { type: 'string' } } };
    const F: RJSFSchema = { properties: { f: { type: 'string' } } };
    const field: RJSFSchema = {
      type: 'object',
      oneOf: [A, B],
      allOf: [{ oneOf: [C, D] }],
      if: true,
      then: { oneOf: [E, F] },
    };
    expect(entriesOf(field)).toEqual([uiA, uiA, uiA, uiA, uiB, uiB, uiB, uiB]);
  });

  it('follows a $ref to the list the field declares through it', () => {
    const root: RJSFSchema = {
      definitions: { field: { type: 'object', oneOf: [A, B], allOf: [{ oneOf: [C, D] }] } },
      type: 'object',
      properties: { p: { $ref: '#/definitions/field' } },
    };
    const field = root.properties?.p as RJSFSchema;
    expect(entriesOf(field, root)).toEqual([uiA, uiA, uiB, uiB]);
  });

  it("reads the list of the field's first declaration holding one, for a field declared in two places", () => {
    const root: RJSFSchema = {
      type: 'object',
      properties: { p: { type: 'object', oneOf: [A, B] } },
      allOf: [{ properties: { p: { oneOf: [C, D] } } }],
    };
    const view = retrieveSchema({ validator: testValidator }, root, root, {});
    expect(entriesOf(view.properties?.p as RJSFSchema, root)).toEqual([uiA, uiA, uiB, uiB]);
  });

  it('hands back the entries as they stand for a schema retrieveSchema() did not hand out', () => {
    const field: RJSFSchema = { type: 'object', oneOf: [A, B], allOf: [{ oneOf: [C, D] }] };
    expect(renderedOptionsUiSchema(uiSchema, field, field)).toBe(uiSchema.oneOf);
  });

  it('hands back the entries as they stand where no merge rebuilds the list', () => {
    expect(entriesOf({ type: 'object', oneOf: [A, B] })).toBe(uiSchema.oneOf);
  });

  // Each option then reads the entry at its own position, as the field's lists sit only in `allOf` entries
  it('hands back the entries as they stand where the field declares no list of its own', () => {
    expect(entriesOf({ type: 'object', allOf: [{ oneOf: [A, B] }, { oneOf: [C, D] }] })).toBe(uiSchema.oneOf);
  });

  it("hands back the entries as they stand where a customMergeAllOf's options keep no record of their sources", () => {
    const customMergeAllOf = (schema: RJSFSchema) => shallowAllOfMerge(schema) as RJSFSchema;
    expect(entriesOf({ type: 'object', oneOf: [A, B], allOf: [{ oneOf: [C, D] }] }, undefined, customMergeAllOf)).toBe(
      uiSchema.oneOf,
    );
  });

  it('gives none where the uiSchema lists no entries, or the field offers no options', () => {
    const view = retrieveSchema({ validator: testValidator }, { type: 'object', oneOf: [A, B] });
    expect(renderedOptionsUiSchema({}, view, view)).toBeUndefined();
    expect(renderedOptionsUiSchema(undefined, view, view)).toBeUndefined();
    const plain: RJSFSchema = { type: 'object' };
    expect(renderedOptionsUiSchema(uiSchema, plain, plain)).toBeUndefined();
  });
});

describe('writtenListOf()', () => {
  it('finds no list through a $ref to a boolean schema', () => {
    const graph = parseSchemaGraph({ definitions: { t: true }, $ref: '#/definitions/t' });
    expect(writtenListOf(graph, 0, 'oneOf')).toBeUndefined();
  });

  it('finds no list through a cycle of $refs holding none', () => {
    const graph = parseSchemaGraph({
      definitions: { x: { $ref: '#/definitions/y' }, y: { $ref: '#/definitions/x' } },
      $ref: '#/definitions/x',
    });
    expect(writtenListOf(graph, 0, 'oneOf')).toBeUndefined();
  });
});

describe('renderedOptionTitles()', () => {
  const titled = (title: string, option: RJSFSchema): RJSFSchema => ({ title, ...option });
  /** The titles the field `field` labels its options with, retrieved as `SchemaField` retrieves it */
  const titlesOf = (field: RJSFSchema, ui?: UiSchema) =>
    renderedOptionTitles(
      ui,
      retrieveSchema({ validator: testValidator }, field, field),
      field,
      englishStringTranslator,
    );
  const own = [titled('A', A), titled('B', B)];
  const other = [titled('C', C), titled('D', D)];

  it.each<[string, RJSFSchema]>([
    ['an allOf entry', { allOf: [{ oneOf: other }] }],
    ['a then', { if: true, then: { oneOf: other } }],
  ])("titles each option %s's list rebuilds with the field's own by the options it was built from", (_, rest) => {
    expect(titlesOf({ type: 'object', oneOf: own, ...rest })).toEqual(['A, C', 'A, D', 'B, C', 'B, D']);
  });

  it.each<[string, UiSchema]>([
    ['ui:title', { 'ui:title': 'UI-A' }],
    ['ui:options.title', { 'ui:options': { title: 'UI-A' } }],
  ])("titles the field's option by the %s of its entry, and the others by their titles", (_, entry) => {
    const ui: UiSchema = { oneOf: [entry, {}] };
    expect(titlesOf({ type: 'object', oneOf: own, allOf: [{ oneOf: other }] }, ui)).toEqual([
      'UI-A, C',
      'UI-A, D',
      'B, C',
      'B, D',
    ]);
  });

  it('titles each option a then rebuilds over an allOf entry by all three options it was built from', () => {
    const field: RJSFSchema = {
      type: 'object',
      oneOf: [titled('A', A)],
      allOf: [{ oneOf: [titled('C', C)] }],
      if: true,
      then: { oneOf: [titled('E', { properties: { e: { type: 'string' } } })] },
    };
    expect(titlesOf(field)).toEqual(['A, E, C']);
  });

  // An option written as a `$ref` is commonly titled in its definition, which `MultiSchemaField` labels a lone one by
  it.each<[string, RJSFSchema]>([
    ['an allOf entry', { allOf: [{ oneOf: other }] }],
    ['a then', { if: true, then: { oneOf: other } }],
  ])("titles an option written as a $ref by its definition's title, where %s's list rebuilds it", (_, rest) => {
    const field: RJSFSchema = {
      type: 'object',
      definitions: { A: titled('A', A), B: titled('B', B) },
      oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B', title: 'Own B' }],
      ...rest,
    };
    expect(titlesOf(field)).toEqual(['A, C', 'A, D', 'Own B, C', 'Own B, D']);
  });

  // `resolveUiSchema()` doesn't merge the entry under a field whose lists a merge rebuilds, as `MultiSchemaField` does
  it("titles the field's option written as a $ref by the ui:title its ui:definitions entry gives, under its entry's own", () => {
    const field: RJSFSchema = {
      type: 'object',
      definitions: { A: titled('A', A), B: titled('B', B) },
      oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }],
      allOf: [{ oneOf: other }],
    };
    const definitions = {
      '#/definitions/A': { 'ui:title': 'Alpha' },
      '#/definitions/B': { 'ui:title': 'Beta' },
    };
    const ui: UiSchema = { oneOf: [{}, { 'ui:title': 'Own B' }] };
    expect(
      renderedOptionTitles(
        ui,
        retrieveSchema({ validator: testValidator }, field, field),
        field,
        englishStringTranslator,
        definitions,
      ),
    ).toEqual(['Alpha, C', 'Alpha, D', 'Own B, C', 'Own B, D']);
  });

  it('names an option by its place in its list where its $ref resolves to nothing', () => {
    const field: RJSFSchema = {
      type: 'object',
      definitions: { A: titled('A', A) },
      oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/missing' }],
      allOf: [{ oneOf: other }],
    };
    expect(titlesOf(field)).toEqual(['A, C', 'A, D', 'Option 2, C', 'Option 2, D']);
  });

  // Otherwise every pair built from the titled option reads alike, as "A", "A", "B", "B"
  it.each<[string, (options: RJSFSchema[]) => RJSFSchema]>([
    ['an allOf entry', (options) => ({ allOf: [{ oneOf: options }] })],
    ['a then', (options) => ({ if: true, then: { oneOf: options } })],
  ])("names an untitled option by its place in its list, where %s's list rebuilds it", (_, rest) => {
    expect(titlesOf({ type: 'object', oneOf: own, ...rest([C, D]) })).toEqual([
      'A, Option 1',
      'A, Option 2',
      'B, Option 1',
      'B, Option 2',
    ]);
    expect(titlesOf({ type: 'object', oneOf: [A, B], ...rest(other) })).toEqual([
      'Option 1, C',
      'Option 1, D',
      'Option 2, C',
      'Option 2, D',
    ]);
  });

  it('numbers a true option of a then by its place in the order the merge took it', () => {
    const field: RJSFSchema = { type: 'object', oneOf: own, if: true, then: { oneOf: [true, D] } };
    expect(titlesOf(field)).toEqual(['A, Option 1', 'A, Option 2', 'B, Option 1', 'B, Option 2']);
  });

  // A×C is left out, so the merge takes D before C, the order an option outside the root is still numbered in
  it('numbers an untitled option by its place in its list where a pair built from it is left out, inside the root and outside it', () => {
    const field: RJSFSchema = {
      type: 'object',
      oneOf: [titled('A', { properties: { k: { const: 1 } } }), titled('B', B)],
      if: true,
      then: { oneOf: [{ properties: { k: { const: 2 } } }, D] },
    };
    expect(titlesOf(field)).toEqual(['A, Option 2', 'B, Option 1', 'B, Option 2']);
    const root: RJSFSchema = { type: 'object' };
    const view = retrieveSchema({ validator: testValidator }, field, root);
    expect(renderedOptionTitles(undefined, view, root, englishStringTranslator)).toEqual([
      'A, Option 1',
      'B, Option 2',
      'B, Option 1',
    ]);
  });

  it('titles none of an option built from options naming no two names', () => {
    const untitled = titled('', { properties: { e: { type: 'string' } } });
    expect(titlesOf({ type: 'object', oneOf: [titled('A', A)], allOf: [{ oneOf: [titled('A', C)] }] })).toEqual([
      undefined,
    ]);
    expect(titlesOf({ type: 'object', oneOf: [B, untitled], allOf: [{ oneOf: [D] }] })).toEqual([undefined, undefined]);
  });

  it('titles none of an option no merge built', () => {
    expect(titlesOf({ type: 'object', oneOf: own })).toEqual([undefined, undefined]);
  });

  // The entries describe the options at their positions, as no list of the field's own is there to describe
  it('titles none of an option whose entry names it, where the field holds no list of its own', () => {
    const ui: UiSchema = { oneOf: [{ 'ui:title': 'First' }] };
    expect(titlesOf({ type: 'object', allOf: [{ oneOf: own }, { oneOf: other }] }, ui)).toEqual([
      undefined,
      'A, D',
      'B, C',
      'B, D',
    ]);
  });

  it('gives none where the field offers no options', () => {
    const plain: RJSFSchema = { type: 'object' };
    expect(renderedOptionTitles(undefined, plain, plain, englishStringTranslator)).toBeUndefined();
  });
});
