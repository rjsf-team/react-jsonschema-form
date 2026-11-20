import { createDeepAllOfMerge } from '@x0k/json-schema-merge';
import type { MockInstance } from 'vitest';

import type {
  CustomMergeAllOf,
  DefaultFormStateBehavior,
  FormFieldState,
  GenericObjectType,
  RJSFSchema,
  UiSchema,
} from '../../src/index.ts';
import { createSchemaUtils, fieldPathFromList, getDefaultFormState, isObject, noop } from '../../src/index.ts';
import fieldShownOption from '../../src/schema/fieldShownOption.ts';
import {
  computeDefaultBasedOnSchemaTypeAndDefaults,
  computeDefaults,
  getArrayDefaults,
  getDefaultBasedOnSchemaType,
  getObjectDefaults,
  ensureFormDataMatchingSchema,
} from '../../src/schema/getDefaultFormState.ts';
import { AdditionalItemsHandling, getInnerSchemaForArrayItem } from '../../src/schema/getInnerSchemaForArrayItem.ts';
import shallowAllOfMerge from '../../src/schema/shallowAllOfMerge.ts';
import {
  PET_RESOURCE_DEEP_SCHEMA,
  PET_RESOURCE_SCHEMA,
  RECURSIVE_REF,
  RECURSIVE_REF_ALLOF,
} from '../testUtils/testData.ts';
import { check } from './graph/miniValidator.ts';
import type { IsValidAnswer, TestValidatorType } from './types.ts';

/** Answers the mock validator's `isValid()` for the schema and data of each call, as the real validators do, for a test
 * whose outcome an `if` decides: the answers hold whatever order the fill checks its conditions in
 */
const asRealValidator: IsValidAnswer = (schema, formData, rootSchema) => check(schema, formData, rootSchema);

const ENUM_WITH_DEFAULT: RJSFSchema = { type: 'string', enum: ['x', 'y'], default: 'x' };

/** Runs the `getDefaultFormState()` suite against `testValidator`
 *
 * @param testValidator - The validator the suite runs against
 * @param [readsTupleItems=true] - Whether the validator's dialect reads an array-valued `items` as a tuple, which
 *        Ajv's 2020-12 class rejects: a condition the form validates by its place in such a root is then checked
 *        against a root that validator cannot compile, and fails as validating the whole root does
 */
export default function getDefaultFormStateTest(testValidator: TestValidatorType, readsTupleItems = true) {
  describe('getDefaultFormState()', () => {
    let consoleWarnSpy: MockInstance;
    beforeAll(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop); // mock this to avoid actually warning in the tests
    });
    afterAll(() => {
      consoleWarnSpy.mockRestore();
    });
    // A fresh spy on a view of `testValidator`, since `vi.spyOn()` on the utils mock's own `vi.fn()` would count the
    // calls of earlier tests and reset its implementation on restore
    function withIsValidSpy() {
      const isValid = vi.fn<TestValidatorType['isValid']>((...args) => testValidator.isValid(...args));
      const validator: TestValidatorType = Object.assign(Object.create(testValidator) as TestValidatorType, {
        isValid,
      });
      return { validator, isValid };
    }
    describe('an object naming no additionalProperties', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: { a: { type: 'string' } },
        default: { a: 'x', extra: 'y' },
      };
      it('seeds the extra keys of its default where the context allows them', () => {
        const allowing = createSchemaUtils(
          { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' },
          schema,
        );
        expect(allowing.getDefaultFormState(schema)).toEqual({ a: 'x', extra: 'y' });
      });
      it('seeds none of them where the context forbids them', () => {
        expect(createSchemaUtils({ validator: testValidator }, schema).getDefaultFormState(schema)).toEqual({ a: 'x' });
      });
      it('fills the defaults of an option beside dependencies whose properties name nothing only where it forbids extra keys', () => {
        const dependent: RJSFSchema = {
          type: 'object',
          properties: { kind: { type: 'string' } },
          dependencies: { kind: ['kind'] },
          oneOf: [
            { properties: {} },
            { properties: { b: { type: 'string' }, c: { type: 'string', default: 'filled' } } },
          ],
        };
        const forbidding = createSchemaUtils({ validator: testValidator }, dependent);
        const allowing = createSchemaUtils(
          { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' },
          dependent,
        );
        expect(forbidding.getDefaultFormState(dependent, { b: 'x' })).toEqual({ b: 'x', c: 'filled' });
        expect(allowing.getDefaultFormState(dependent, { b: 'x' })).toEqual({ b: 'x' });
        expect(forbidding.getDefaultFormState(dependent, { b: 'x' })).toEqual({ b: 'x', c: 'filled' });
      });
    });
    describe('a const and the defaults beneath it (#5819)', () => {
      const fill = (schema: RJSFSchema, behavior?: DefaultFormStateBehavior, formData?: unknown) =>
        getDefaultFormState({ validator: testValidator, defaultFormStateBehavior: behavior }, { schema, formData });
      const declaredDefault: RJSFSchema = {
        type: 'object',
        const: { a: 1 },
        properties: { a: { type: 'number', default: 2 } },
      };
      const extraDefault: RJSFSchema = { type: 'object', const: { x: 1 }, additionalProperties: { default: 6 } };
      const grandchildDefault: RJSFSchema = {
        type: 'object',
        const: { p: { a: 1 } },
        properties: { p: { type: 'object', properties: { a: { type: 'number', default: 2 } } } },
      };
      const middleDefault: RJSFSchema = {
        type: 'object',
        const: { p: { a: 1 } },
        properties: {
          p: {
            type: 'object',
            default: { a: 3, c: 4 },
            properties: { a: { type: 'number', default: 2 }, c: { type: 'number' } },
          },
        },
      };
      const undeclaredBelow: RJSFSchema = {
        type: 'object',
        const: { k: { x: 1 } },
        properties: { k: { type: 'object' } },
      };
      describe.each<[string, DefaultFormStateBehavior]>([
        ['descendantWins', {}],
        ['ancestorWins', { nestedDefaultsPrecedence: 'ancestorWins' }],
      ])('under %s', (_name, behavior) => {
        it("takes a parent's object const over a declared key's own default", () => {
          expect(fill(declaredDefault, behavior)).toStrictEqual({ a: 1 });
        });
        it("takes a parent's object const over an additionalProperties default", () => {
          expect(fill(extraDefault, behavior)).toStrictEqual({ x: 1 });
        });
        it("takes a grandparent's object const over a grandchild's default", () => {
          expect(fill(grandchildDefault, behavior)).toStrictEqual({ p: { a: 1 } });
        });
        it('takes the const over the default of the object between them, which still gives the keys the const leaves out', () => {
          expect(fill(middleDefault, behavior)).toStrictEqual({ p: { a: 1, c: 4 } });
        });
        it("fills the keys of an ancestor's const that a nested object declares no property for", () => {
          expect(fill(undeclaredBelow, behavior)).toStrictEqual({ k: { x: 1 } });
        });
      });
      it.each([false, true])(
        "gives a row of an array the data holds the const's value, its own or an ancestor's, initialDefaultsGenerated %s",
        (initialDefaultsGenerated) => {
          const item: RJSFSchema = { type: 'object', properties: { v: { type: 'number', default: 9 } } };
          const fillRows = (schema: RJSFSchema) =>
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { l: [{}] }, initialDefaultsGenerated },
            );
          expect(
            fillRows({ type: 'object', const: { l: [{ v: 1 }] }, properties: { l: { type: 'array', items: item } } }),
          ).toStrictEqual({ l: [{ v: 1 }] });
          expect(
            fillRows({ type: 'object', properties: { l: { type: 'array', const: [{ v: 1 }], items: item } } }),
          ).toStrictEqual({ l: [{ v: 1 }] });
          expect(fillRows({ type: 'object', properties: { l: { type: 'array', items: item } } })).toStrictEqual({
            l: [{ v: 9 }],
          });
        },
      );
      it("leaves out a key only the shown option declares under an ancestor's const, as under the object's own", () => {
        const option: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'number' } },
          oneOf: [{ properties: { q: { type: 'string', default: 'd' } } }],
        };
        expect(fill({ type: 'object', const: { o: { a: 1 } }, properties: { o: option } })).toStrictEqual({
          o: { a: 1 },
        });
        expect(fill({ type: 'object', properties: { o: { ...option, const: { a: 1 } } } })).toStrictEqual({
          o: { a: 1 },
        });
        expect(fill({ type: 'object', properties: { o: option } })).toStrictEqual({ o: { q: 'd' } });
      });
      it("leaves out a key only the shown option declares in an array row the const gives, the array's own or an ancestor's", () => {
        const option: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'number' } },
          oneOf: [{ properties: { q: { type: 'string', default: 'd' } } }],
        };
        const list: RJSFSchema = { type: 'array', items: { type: 'object', properties: { o: option } } };
        const rows = [{ o: { a: 1 } }];
        expect(fill({ type: 'object', const: { l: rows }, properties: { l: list } })).toStrictEqual({ l: rows });
        expect(fill({ type: 'object', properties: { l: { ...list, const: rows } } })).toStrictEqual({ l: rows });
        expect(fill({ type: 'object', properties: { l: { ...list, default: rows } } })).toStrictEqual({
          l: [{ o: { a: 1, q: 'd' } }],
        });
      });
      it("keeps the keys of a ui:initialValue and of the field's own default beside the shown option under an ancestor's const", () => {
        const option: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'number' } },
          additionalProperties: { type: 'number' },
          oneOf: [{ properties: { q: { type: 'string' } } }],
        };
        const uiSchema: UiSchema = { o: { 'ui:initialValue': { a: 1, q: 'z' } } };
        for (const schema of [
          { type: 'object', const: { o: { a: 1 } }, properties: { o: option } },
          { type: 'object', properties: { o: { ...option, const: { a: 1 } } } },
        ] satisfies RJSFSchema[]) {
          expect(getDefaultFormState({ validator: testValidator }, { schema, uiSchema })).toStrictEqual({
            o: { a: 1, q: 'z' },
          });
        }
        // As the same field keeps them beside no options
        const ownDefault: RJSFSchema = { ...option, default: { z: 9 } };
        expect(fill({ type: 'object', const: { o: { a: 1 } }, properties: { o: ownDefault } })).toStrictEqual({
          o: { a: 1, z: 9 },
        });
        expect(
          fill({ type: 'object', const: { o: { a: 1 } }, properties: { o: { ...ownDefault, oneOf: undefined } } }),
        ).toStrictEqual({ o: { a: 1, z: 9 } });
      });
      it("keeps a field's own default over the default of an object between it and the const, for a key the const doesn't name", () => {
        const schema: RJSFSchema = {
          type: 'object',
          const: { p: { q: { a: 1 } } },
          properties: {
            p: {
              type: 'object',
              default: { q: { b: 2 } },
              properties: {
                q: {
                  type: 'object',
                  default: { a: 3, b: 4 },
                  properties: { a: { type: 'number' }, b: { type: 'number' } },
                },
              },
            },
          },
        };
        expect(fill(schema)).toStrictEqual({ p: { q: { a: 1, b: 4 } } });
        expect(fill(schema, { nestedDefaultsPrecedence: 'ancestorWins' })).toStrictEqual({ p: { q: { a: 1, b: 2 } } });
      });
      it("hands out the arrays an ancestor's const gives a field with a default of its own as copies", () => {
        const items = [1, 2];
        const withDefault: RJSFSchema = { type: 'object', default: { b: 1 }, properties: { a: {}, b: {} } };
        const filled = fill({ type: 'object', const: { p: { a: items } }, properties: { p: withDefault } });
        expect(filled).toStrictEqual({ p: { a: [1, 2], b: 1 } });
        expect(isObject(filled) && isObject(filled.p) && filled.p.a).not.toBe(items);
      });
      it('gives a declared key and an extra key the const alike', () => {
        const mixed: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'number', default: 5 } },
          additionalProperties: { type: 'number', default: 6 },
          const: { a: 1, b: 2 },
        };
        expect(fill(mixed)).toStrictEqual({ a: 1, b: 2 });
      });
      it("keeps the extra keys a nested object's data and default hold under an ancestor's const, under constAsDefaults: 'always'", () => {
        const always: DefaultFormStateBehavior = { constAsDefaults: 'always' };
        const open: RJSFSchema = { type: 'object', additionalProperties: { type: 'number' } };
        const nested: RJSFSchema = { type: 'object', const: { k: { x: 1 } }, properties: { k: open } };
        for (const initialDefaultsGenerated of [false, true]) {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: always },
              { schema: nested, formData: { k: { x: 1, y: 2 } }, initialDefaultsGenerated },
            ),
          ).toStrictEqual({ k: { x: 1, y: 2 } });
        }
        const withDefault: RJSFSchema = { ...nested, properties: { k: { ...open, default: { y: 5 } } } };
        expect(fill(withDefault, always)).toStrictEqual({ k: { x: 1, y: 5 } });
        // The object's own `const` still drops them
        expect(
          fill({ type: 'object', properties: { k: { ...open, const: { x: 1 } } } }, always, {
            k: { x: 1, y: 2 },
          }),
        ).toStrictEqual({ k: { x: 1 } });
      });
      it("leaves out a key of an ancestor's const that the user removed where a nested object's allOf takes extra keys", () => {
        const schema: RJSFSchema = {
          type: 'object',
          const: { k: { x: 1 } },
          properties: { k: { type: 'object', allOf: [{ additionalProperties: { type: 'number' } }] } },
        };
        expect(fill(schema)).toStrictEqual({ k: { x: 1 } });
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { k: { y: 2 } }, initialDefaultsGenerated: true },
          ),
        ).toStrictEqual({ k: { y: 2 } });
      });
      it("keeps the order of keys the defaults have where an ancestor's const meets a nested default", () => {
        const schema: RJSFSchema = {
          type: 'object',
          const: { k: { x: 1, n: { a: 1 } } },
          properties: {
            k: { type: 'object', additionalProperties: true, default: { y: 5, n: { b: 2, a: 3 }, x: 4 } },
          },
        };
        const filled = fill(schema);
        expect(filled).toStrictEqual({ k: { x: 1, n: { a: 1, b: 2 }, y: 5 } });
        expect(isObject(filled) && isObject(filled.k) && Object.keys(filled.k)).toStrictEqual(['x', 'n', 'y']);
      });
      it.each<[string, RJSFSchema]>([
        [
          "an ancestor's const",
          {
            type: 'object',
            const: { p: { a: 1, b: 2 } },
            properties: {
              p: {
                type: 'object',
                properties: { a: { type: 'number' }, b: { type: 'number', default: 7 } },
              },
            },
          },
        ],
        [
          "the object's own const",
          {
            type: 'object',
            properties: {
              p: {
                type: 'object',
                const: { a: 1, b: 2 },
                properties: { a: { type: 'number' }, b: { type: 'number', default: 7 } },
              },
            },
          },
        ],
      ])(
        'gives a key beneath a ui:initialValue, which stands in the place of %s, its own default on every pass',
        (_name, schema) => {
          const uiSchema: UiSchema = { p: { 'ui:initialValue': { a: 5 } } };
          const pass = (formData: unknown, initialDefaultsGenerated: boolean) =>
            getDefaultFormState({ validator: testValidator }, { schema, formData, uiSchema, initialDefaultsGenerated });
          expect(pass(undefined, false)).toStrictEqual({ p: { a: 5, b: 7 } });
          expect(pass({ p: { a: 5 } }, true)).toStrictEqual({ p: { a: 5, b: 7 } });
        },
      );
      it("gives the shown option and the field beneath a ui:initialValue their own default over an ancestor's const once the defaults were generated", () => {
        const uiSchema: UiSchema = { f: { 'ui:initialValue': { a: 1 } } };
        const pass = (f: RJSFSchema, formData: unknown, initialDefaultsGenerated: boolean) =>
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: { type: 'object', const: { f: { a: 1, b: 9 } }, properties: { f } },
              formData,
              uiSchema,
              initialDefaultsGenerated,
            },
          );
        const optionDefault: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'number' } },
          oneOf: [{ default: { b: 2 }, properties: { b: { type: 'number' } } }],
        };
        const fieldDefault: RJSFSchema = {
          type: 'object',
          default: { b: 2 },
          properties: { a: { type: 'number' }, b: { type: 'number' } },
        };
        expect(pass(optionDefault, { f: { a: 1 } }, true)).toStrictEqual({ f: { a: 1, b: 2 } });
        expect(pass(fieldDefault, undefined, false)).toStrictEqual({ f: { a: 1 } });
        expect(pass(fieldDefault, { f: { a: 1 } }, true)).toStrictEqual({ f: { a: 1, b: 2 } });
      });
      it("gives a tuple the items of an ancestor's const over its own item defaults, as its own const does", () => {
        const tuple: RJSFSchema = { type: 'array', items: [{ type: 'number' }, { type: 'number', default: 5 }] };
        expect(fill({ type: 'object', const: { t: [1] }, properties: { t: tuple } })).toStrictEqual({ t: [1] });
        expect(fill({ type: 'object', properties: { t: { ...tuple, const: [1] } } })).toStrictEqual({ t: [1] });
        expect(fill({ type: 'object', default: { t: [1] }, properties: { t: tuple } })).toStrictEqual({ t: [1, 5] });
      });
      it("selects the option an ancestor's const matches, and seeds none of the keys only that option declares", () => {
        const kinds: RJSFSchema = {
          type: 'object',
          oneOf: [
            { properties: { kind: { const: 'x' }, p: { type: 'number', default: 1 } } },
            { properties: { kind: { const: 'y' }, q: { type: 'number', default: 2 } } },
          ],
        };
        // The mock validator can't tell the options apart, so it answers each check as the real ones do
        testValidator.setReturnValues({ isValid: asRealValidator });
        try {
          expect(fill({ type: 'object', const: { o: { kind: 'y' } }, properties: { o: kinds } })).toStrictEqual({
            o: { kind: 'y' },
          });
          expect(fill({ type: 'object', default: { o: { kind: 'y' } }, properties: { o: kinds } })).toStrictEqual({
            o: { kind: 'x', p: 1 },
          });
        } finally {
          testValidator.reset?.();
        }
      });
      it("hands none of an ancestor's const to the children of a field whose type can't hold the value it gives", () => {
        const schema: RJSFSchema = {
          type: 'object',
          const: { p: ['a'] },
          properties: { p: { type: 'object', properties: { '0': { type: 'string', default: 'z' } } } },
        };
        expect(fill(schema)).toStrictEqual({ p: { '0': 'z' } });
      });
      it("still takes the defaults beneath where constAsDefaults is 'never'", () => {
        const never: DefaultFormStateBehavior = { constAsDefaults: 'never' };
        expect(fill(declaredDefault, never)).toStrictEqual({ a: 2 });
        expect(fill(extraDefault, never)).toStrictEqual({});
        expect(fill(grandchildDefault, never)).toStrictEqual({ p: { a: 2 } });
      });
      it('keeps the form data over the const', () => {
        expect(fill(declaredDefault, {}, { a: 3 })).toStrictEqual({ a: 3 });
        expect(fill(extraDefault, {}, { x: 3 })).toStrictEqual({ x: 3 });
        expect(fill(grandchildDefault, {}, { p: { a: 3 } })).toStrictEqual({ p: { a: 3 } });
      });
      it("gives an extra key the const's value past emptyObjectFields: 'skipDefaults', which skips its own empty default", () => {
        const skipDefaults: DefaultFormStateBehavior = { emptyObjectFields: 'skipDefaults' };
        const withConst: RJSFSchema = {
          type: 'object',
          additionalProperties: { type: 'object', default: {} },
          const: { k: { x: 1 } },
        };
        const withDefault: RJSFSchema = { ...withConst, const: undefined, default: { k: { x: 1 } } };
        expect(fill(withConst, skipDefaults)).toStrictEqual({ k: { x: 1 } });
        expect(fill(withDefault, skipDefaults)).toStrictEqual({});
      });
      it.each([false, true])(
        'fills a partial nested value under a const key whether or not the key is declared, initialDefaultsGenerated %s',
        (initialDefaultsGenerated) => {
          const undeclared: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', const: { a: { b: 1, c: 2 } } } },
          };
          const declared: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', properties: { a: { type: 'object' } }, const: { a: { b: 1, c: 2 } } } },
          };
          for (const schema of [undeclared, declared]) {
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { x: { a: { b: 1 } } }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ x: { a: { b: 1, c: 2 } } });
          }
        },
      );
    });
    describe('the extra keys of an object const or default, seeded through the schema that describes each (#5819)', () => {
      const fill = (schema: RJSFSchema, formData?: unknown, behavior?: DefaultFormStateBehavior, generated = false) =>
        getDefaultFormState(
          { validator: testValidator, defaultFormStateBehavior: behavior },
          { schema, formData, initialDefaultsGenerated: generated },
        );
      const patterned: RJSFSchema = { type: 'object', patternProperties: { '^x': { type: 'number' } } };
      const unevaluated: RJSFSchema = { type: 'object', unevaluatedProperties: { type: 'number' } };
      describe.each([
        ['forbids', {}],
        ['allows', { additionalPropertiesWhenAbsent: 'allow' as const }],
      ])('where the context %s extra keys', (_name, absent) => {
        const fillIn = (schema: RJSFSchema, formData?: unknown, generated = false) =>
          getDefaultFormState(
            { validator: testValidator, ...absent },
            { schema, formData, initialDefaultsGenerated: generated },
          );
        it('seeds the keys of a const or default where only patternProperties or unevaluatedProperties take extra keys', () => {
          expect(fillIn({ ...patterned, const: { x1: 1 } })).toStrictEqual({ x1: 1 });
          expect(fillIn({ ...patterned, default: { x1: 1 } })).toStrictEqual({ x1: 1 });
          expect(fillIn({ ...unevaluated, const: { a: 1 } })).toStrictEqual({ a: 1 });
          expect(fillIn({ ...unevaluated, default: { a: 1 } })).toStrictEqual({ a: 1 });
        });
        it('seeds no key of a default once the defaults were generated, nor beside the extra keys the data holds, as additionalProperties seeds none', () => {
          const additional: RJSFSchema = { type: 'object', additionalProperties: { type: 'number' } };
          for (const open of [additional, patterned, unevaluated]) {
            const schema: RJSFSchema = { ...open, default: { x1: 1 } };
            expect(fillIn(schema, {}, true)).toStrictEqual({});
            const nested: RJSFSchema = { type: 'object', properties: { o: schema } };
            expect(fillIn(nested, { o: { x2: 5 } })).toStrictEqual({ o: { x2: 5 } });
            expect(fillIn(nested, { o: {} })).toStrictEqual({ o: { x1: 1 } });
          }
        });
      });
      it('folds a key a pattern matches through that pattern, even beside additionalProperties', () => {
        const patternDefault: RJSFSchema = {
          type: 'object',
          patternProperties: { '^x': { type: 'number', default: 7 } },
        };
        const besideAdditional: RJSFSchema = {
          ...patternDefault,
          additionalProperties: { type: 'number', default: 6 },
        };
        expect(fill({ ...patternDefault, default: { x1: 1 } })).toStrictEqual({ x1: 7 });
        expect(
          fill({ ...patternDefault, default: { x1: 1 } }, undefined, { nestedDefaultsPrecedence: 'ancestorWins' }),
        ).toStrictEqual({ x1: 1 });
        expect(fill({ ...besideAdditional, default: { x1: 1, y: 2 } })).toStrictEqual({ x1: 7, y: 6 });
        // The `const` wins over the pattern's `default` as over any other
        expect(fill({ ...besideAdditional, const: { x1: 1 } })).toStrictEqual({ x1: 1 });
      });
      it('folds a key no pattern matches through unevaluatedProperties, and seeds none the object rejects', () => {
        const unevaluatedDefault: RJSFSchema = {
          type: 'object',
          unevaluatedProperties: { type: 'number', default: 4 },
          default: { a: 1 },
        };
        const closedBeside: RJSFSchema = {
          ...patterned,
          additionalProperties: false,
          default: { x1: 1, y: 2 },
        };
        expect(fill(unevaluatedDefault)).toStrictEqual({ a: 4 });
        expect(fill({ ...unevaluatedDefault, unevaluatedProperties: true })).toStrictEqual({ a: 1 });
        expect(fill(closedBeside)).toStrictEqual({ x1: 1 });
      });
      it("folds no key a member's pattern matches through the unevaluatedProperties beside it, which doesn't apply to it", () => {
        const member: RJSFSchema = {
          patternProperties: { '^x': { type: 'object', properties: { p: { default: 'p' } } } },
        };
        const unevaluated: RJSFSchema = { type: 'object', properties: { u: { default: 'u' } } };
        for (const schema of [
          { type: 'object', unevaluatedProperties: unevaluated, allOf: [member], default: { x1: {}, y: {} } },
          { type: 'object', unevaluatedProperties: unevaluated, oneOf: [member], default: { x1: {}, y: {} } },
        ] satisfies RJSFSchema[]) {
          expect(fill(schema)).toStrictEqual({ x1: { p: 'p' }, y: { u: 'u' } });
        }
        const closed: RJSFSchema = {
          type: 'object',
          unevaluatedProperties: false,
          allOf: [{ patternProperties: { '^x': { type: 'number' } } }],
        };
        expect(fill({ ...closed, const: { x1: 1 } })).toStrictEqual({ x1: 1 });
        expect(fill({ ...closed, default: { x1: 1, y: 2 } }, undefined, { allOf: 'populateDefaults' })).toStrictEqual({
          x1: 1,
        });
      });
      it("folds a key one chain's pattern matches through the additionalProperties of another chain as well", () => {
        const schema: RJSFSchema = {
          type: 'object',
          patternProperties: { '^x': { type: 'object', properties: { z: { default: 9 } } } },
          oneOf: [{ additionalProperties: { type: 'object', properties: { w: { default: 8 } } } }],
          default: { x1: {}, y: {} },
        };
        expect(fill(schema)).toStrictEqual({ x1: { z: 9, w: 8 }, y: { w: 8 } });
        // As the key the data holds is folded
        expect(fill(schema, { x1: {} })).toStrictEqual({ x1: { z: 9, w: 8 }, y: { w: 8 } });
        // A `false` in any chain rejects the key
        expect(fill({ ...schema, oneOf: [{ additionalProperties: false }] })).toStrictEqual({});
        expect(
          fill({
            type: 'object',
            patternProperties: { '^x': false },
            additionalProperties: { default: 3 },
            default: { x1: 1, y: 2 },
          }),
        ).toStrictEqual({ y: 3 });
      });
      it("seeds a default's key no pattern matches only where the context allows it, as omitExtraData keeps it, unless the const names it", () => {
        const schema: RJSFSchema = { ...patterned, default: { x1: 1, y: 2 } };
        expect(fill(schema)).toStrictEqual({ x1: 1 });
        expect(
          getDefaultFormState(
            { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' },
            { schema, initialDefaultsGenerated: false },
          ),
        ).toStrictEqual({ x1: 1, y: 2 });
        expect(fill({ type: 'object', properties: { o: schema } })).toStrictEqual({ o: { x1: 1 } });
        expect(fill({ ...patterned, const: { x1: 1, y: 2 } })).toStrictEqual({ x1: 1, y: 2 });
      });
    });
    describe('an object const naming keys no property declares', () => {
      const constProperty: RJSFSchema = { type: 'object', const: { a: 2 } };
      const withParentDefault: RJSFSchema = {
        type: 'object',
        default: { x: { a: 2 } },
        properties: { x: constProperty },
      };
      const withoutParentDefault: RJSFSchema = { type: 'object', properties: { x: constProperty } };
      const bare: RJSFSchema = { type: 'object', const: { a: 1 } };
      describe.each([
        ['forbids', {}],
        ['allows', { additionalPropertiesWhenAbsent: 'allow' as const }],
      ])('where the context %s extra keys', (_, absent) => {
        const utils = (schema: RJSFSchema, defaultFormStateBehavior?: DefaultFormStateBehavior) =>
          createSchemaUtils({ validator: testValidator, defaultFormStateBehavior, ...absent }, schema);
        it('defaults a property to its const, beside a parent default and without one', () => {
          expect(utils(withParentDefault).getDefaultFormState(withParentDefault)).toStrictEqual({ x: { a: 2 } });
          expect(utils(withoutParentDefault).getDefaultFormState(withoutParentDefault)).toStrictEqual({ x: { a: 2 } });
        });
        it('defaults a bare object const to its value', () => {
          expect(utils(bare).getDefaultFormState(bare)).toStrictEqual({ a: 1 });
          expect(utils(bare, { constAsDefaults: 'skipOneOf' }).getDefaultFormState(bare)).toStrictEqual({ a: 1 });
          const prototypeNamed: RJSFSchema = { type: 'object', const: { toString: 1 } };
          expect(utils(prototypeNamed).getDefaultFormState(prototypeNamed, {})).toStrictEqual({ toString: 1 });
        });
        it('fills the const into empty object data, and keeps the keys the data holds', () => {
          expect(utils(withoutParentDefault).getDefaultFormState(withoutParentDefault, { x: {} })).toStrictEqual({
            x: { a: 2 },
          });
          expect(utils(bare).getDefaultFormState(bare, { a: 3 })).toStrictEqual({ a: 3 });
        });
        it('keeps a nested object of the const whole', () => {
          const nested: RJSFSchema = { type: 'object', const: { a: { b: 1 } } };
          expect(utils(nested).getDefaultFormState(nested)).toStrictEqual({ a: { b: 1 } });
        });
        it('fills the keys no property declares beside the ones its properties compute', () => {
          const declared: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'number' } },
            const: { a: 1, b: 2 },
          };
          expect(utils(declared).getDefaultFormState(declared)).toStrictEqual({ a: 1, b: 2 });
        });
        it('takes the const over the defaults its properties and additionalProperties give a key (#5819)', () => {
          const ownDefaults: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'number', default: 5 } },
            additionalProperties: { type: 'number', default: 6 },
            const: { a: 1, b: 2 },
          };
          expect(utils(ownDefaults).getDefaultFormState(ownDefaults)).toStrictEqual({ a: 1, b: 2 });
        });
        it('leaves the extra keys the data holds once the defaults were generated, as for a default', () => {
          const extra: RJSFSchema = { type: 'object', additionalProperties: { type: 'number' }, const: { b: 2 } };
          expect(utils(extra).getDefaultFormState(extra, {}, false, true)).toStrictEqual({});
          expect(utils(extra).getDefaultFormState(extra, { c: 2 }, false, true)).toStrictEqual({ c: 2 });
          // On the first pass the defaults are computed without the data and merged beneath it, as for a `default`
          expect(utils(extra).getDefaultFormState(extra, { c: 2 })).toStrictEqual({ c: 2, b: 2 });
          const withDefault: RJSFSchema = { ...extra, const: undefined, default: { b: 2 } };
          expect(utils(withDefault).getDefaultFormState(withDefault, { c: 2 })).toStrictEqual({ c: 2, b: 2 });
        });
        it('seeds the keys of a nested open object const beside the extra keys the data holds on the first pass', () => {
          const nested: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', additionalProperties: { type: 'number' }, const: { b: 2 } } },
          };
          expect(utils(nested).getDefaultFormState(nested, { x: { c: 3 } })).toStrictEqual({ x: { c: 3, b: 2 } });
          expect(utils(nested).getDefaultFormState(nested, { x: { c: 3 } }, false, true)).toStrictEqual({
            x: { c: 3 },
          });
        });
        it('seeds only the keys of the const beside the extra keys the data holds, read from a ui:initialValue', () => {
          const nested: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', additionalProperties: { type: 'number' }, const: { b: 2 } } },
          };
          const data = { x: { c: 3 } };
          const initialValue = (value: object) => ({ x: { 'ui:initialValue': value } });
          expect(utils(nested).getDefaultFormState(nested, data, false, false, initialValue({ z: 9 }))).toStrictEqual({
            x: { c: 3 },
          });
          expect(
            utils(nested).getDefaultFormState(nested, data, false, false, initialValue({ b: 5, z: 9 })),
          ).toStrictEqual({ x: { c: 3, b: 5 } });
        });
        it('seeds the keys of the const where patternProperties or unevaluatedProperties take extra keys, as additionalProperties does (#5819)', () => {
          const patterned: RJSFSchema = {
            type: 'object',
            patternProperties: { '^x': { type: 'number' } },
            const: { x1: 1 },
          };
          const unevaluated: RJSFSchema = {
            type: 'object',
            unevaluatedProperties: { type: 'number' },
            const: { a: 1 },
          };
          expect(utils(patterned).getDefaultFormState(patterned, {})).toStrictEqual({ x1: 1 });
          expect(utils(patterned).getDefaultFormState(patterned, { x2: 1 })).toStrictEqual({ x2: 1, x1: 1 });
          expect(utils(patterned).getDefaultFormState(patterned, {}, false, true)).toStrictEqual({});
          expect(utils(unevaluated).getDefaultFormState(unevaluated, {})).toStrictEqual({ a: 1 });
        });
        it('fills the keys of a const that closes the object whatever the data holds, and once the defaults were generated', () => {
          const two: RJSFSchema = { type: 'object', const: { a: 1, b: 2 } };
          expect(utils(two).getDefaultFormState(two, { a: 3 })).toStrictEqual({ a: 3, b: 2 });
          expect(utils(two, { constAsDefaults: 'always' }).getDefaultFormState(two, { a: 1 })).toStrictEqual({
            a: 1,
            b: 2,
          });
          expect(utils(bare).getDefaultFormState(bare, {}, false, true)).toStrictEqual({ a: 1 });
          const unevaluatedClosed: RJSFSchema = { ...bare, unevaluatedProperties: false };
          expect(utils(unevaluatedClosed).getDefaultFormState(unevaluatedClosed, {}, false, true)).toStrictEqual({
            a: 1,
          });
          const regenerated = utils(withoutParentDefault).getDefaultFormState(
            withoutParentDefault,
            undefined,
            false,
            true,
          );
          expect(regenerated).toStrictEqual({ x: { a: 2 } });
        });
        it('refills a nested object of a const that closes the object where the data holds part of it', () => {
          const nested: RJSFSchema = { type: 'object', const: { a: { b: 1, c: 2 } } };
          expect(utils(nested).getDefaultFormState(nested, { a: { b: 1 } })).toStrictEqual({ a: { b: 1, c: 2 } });
          expect(utils(nested).getDefaultFormState(nested, { a: { b: 1 } }, false, true)).toStrictEqual({
            a: { b: 1, c: 2 },
          });
          expect(utils(nested).getDefaultFormState(nested, { a: { b: 3 } }, false, true)).toStrictEqual({
            a: { b: 3, c: 2 },
          });
        });
        it('fills a key of a const that closes the object where the data holds it as undefined, which a declared key keeps', () => {
          expect(utils(bare).getDefaultFormState(bare, { a: undefined })).toStrictEqual({ a: 1 });
          expect(utils(bare).getDefaultFormState(bare, { a: undefined }, false, true)).toStrictEqual({ a: 1 });
          const declared: RJSFSchema = { ...bare, properties: { a: { type: 'number' } } };
          expect(utils(declared).getDefaultFormState(declared, { a: undefined }, false, true)).toStrictEqual({
            a: undefined,
          });
        });
        it('fills a key of a const that closes the object where the data holds it as null, at any depth', () => {
          expect(utils(bare).getDefaultFormState(bare, { a: null })).toStrictEqual({ a: 1 });
          expect(utils(bare).getDefaultFormState(bare, { a: null }, false, true)).toStrictEqual({ a: 1 });
          const nested: RJSFSchema = { type: 'object', const: { a: { b: 1, c: 2 } } };
          expect(utils(nested).getDefaultFormState(nested, { a: { b: null } }, false, true)).toStrictEqual({
            a: { b: 1, c: 2 },
          });
          const declared: RJSFSchema = { ...bare, properties: { a: { type: ['number', 'null'] } } };
          expect(utils(declared).getDefaultFormState(declared, { a: null }, false, true)).toStrictEqual({ a: null });
        });
        it('completes an array of a const that closes the object where the data holds fewer items', () => {
          const list: RJSFSchema = { type: 'object', const: { a: [1, 2] } };
          expect(utils(list).getDefaultFormState(list, { a: [1] })).toStrictEqual({ a: [1, 2] });
          expect(utils(list).getDefaultFormState(list, { a: [1] }, false, true)).toStrictEqual({ a: [1, 2] });
          expect(utils(list).getDefaultFormState(list, { a: [3, 4, 5] }, false, true)).toStrictEqual({ a: [3, 4, 5] });
          const rows: RJSFSchema = { type: 'object', const: { a: [{ x: 1, y: 2 }, { x: 3 }] } };
          expect(utils(rows).getDefaultFormState(rows, { a: [{ x: 1 }] }, false, true)).toStrictEqual({
            a: [{ x: 1, y: 2 }, { x: 3 }],
          });
        });
        it('fills a key of a const that closes the object held as NaN, and keeps one held as another kind of object', () => {
          expect(utils(bare).getDefaultFormState(bare, { a: Number.NaN }, false, true)).toStrictEqual({ a: 1 });
          class Holder {
            b = 2;
          }
          const held = new Holder();
          const nested: RJSFSchema = { type: 'object', const: { a: { b: 1, c: 2 } } };
          const state = utils(nested).getDefaultFormState(nested, { a: held }, false, true);
          expect(isObject(state) && state.a).toBe(held);
        });
        it("keeps an array of a const that closes the object as the user's where its items differ from the const's", () => {
          const list: RJSFSchema = { type: 'object', const: { a: [1, 2] } };
          expect(utils(list).getDefaultFormState(list, { a: [3] })).toStrictEqual({ a: [3] });
          expect(utils(list).getDefaultFormState(list, { a: [3] }, false, true)).toStrictEqual({ a: [3] });
          const rows: RJSFSchema = { type: 'object', const: { a: [{ x: 1 }, { x: 2 }] } };
          expect(utils(rows).getDefaultFormState(rows, { a: [{ x: 5 }] }, false, true)).toStrictEqual({
            a: [{ x: 5 }],
          });
        });
        it('getObjectDefaults seeds only the keys of the const that the defaults it is handed hold', () => {
          const context = { validator: testValidator, ...absent };
          expect(getObjectDefaults(context, bare, { includeUndefinedValues: true })).toStrictEqual({});
          expect(getObjectDefaults(context, bare, { includeUndefinedValues: true }, { a: 1 })).toStrictEqual({ a: 1 });
          // A `const` an `allOf` gives the object is read from the object retrieved
          const viaAllOf: RJSFSchema = { type: 'object', allOf: [{ const: { a: 1 } }] };
          expect(getObjectDefaults(context, viaAllOf, {}, { a: 1 })).toStrictEqual({ a: 1 });
        });
        it('keeps an empty object the const holds', () => {
          const emptyMeta: RJSFSchema = { type: 'object', const: { meta: {} } };
          expect(utils(emptyMeta).getDefaultFormState(emptyMeta)).toStrictEqual({ meta: {} });
          const open: RJSFSchema = { ...emptyMeta, additionalProperties: true };
          expect(utils(open).getDefaultFormState(open)).toStrictEqual({ meta: {} });
        });
        it('seeds no key of a ui:initialValue that the const closing the object does not name', () => {
          const closed: RJSFSchema = { type: 'object', const: { a: 1 }, additionalProperties: false };
          const uiSchema = { 'ui:initialValue': { z: 1 } };
          expect(utils(closed).getDefaultFormState(closed, undefined, false, false, uiSchema)).toStrictEqual({});
        });
        it('seeds no key of a const beside a ui:initialValue, on the first pass or once the defaults were generated', () => {
          const uiSchema = { 'ui:initialValue': { z: 1 } };
          expect(utils(bare).getDefaultFormState(bare, undefined, false, false, uiSchema)).toStrictEqual({});
          expect(utils(bare).getDefaultFormState(bare, {}, false, true, uiSchema)).toStrictEqual({});
        });
        it('leaves out a key of a const that closes the object which a ui:initialValue gives as undefined, unless undefined values are included', () => {
          const two: RJSFSchema = { type: 'object', const: { a: 1, b: 2 } };
          const uiSchema = { 'ui:initialValue': { a: 5, b: undefined } };
          const withUndefined = (include: boolean | 'excludeObjectChildren') =>
            utils(two).getDefaultFormState(two, undefined, include, false, uiSchema);
          expect(withUndefined(false)).toStrictEqual({ a: 5 });
          expect(withUndefined('excludeObjectChildren')).toStrictEqual({ a: 5, b: undefined });
          expect(withUndefined(true)).toStrictEqual({ a: 5, b: undefined });
        });
        it('reads the keys of a const that closes the object from a ui:initialValue, as a declared key is', () => {
          const uiSchema = { 'ui:initialValue': { a: 5, z: 1 } };
          const closed: RJSFSchema = { ...bare, additionalProperties: false };
          const declared: RJSFSchema = { ...bare, properties: { a: { type: 'number' } } };
          const two: RJSFSchema = { type: 'object', const: { a: 1, b: 2 } };
          for (const schema of [bare, closed, declared, two]) {
            expect(utils(schema).getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual({
              a: 5,
            });
          }
          expect(utils(two).getDefaultFormState(two, { a: 5 }, false, true, uiSchema)).toStrictEqual({ a: 5 });
        });
        it('reads the ui:initialValue of an object const beside options whether or not the uiSchema spells out its options', () => {
          const schema: RJSFSchema = {
            type: 'object',
            const: { a: 1 },
            oneOf: [{ properties: { a: { type: 'number' } } }, { properties: { b: { type: 'number' } } }],
          };
          for (const initialValue of [{ a: 5 }, { z: 1 }]) {
            const parentOnly = { 'ui:initialValue': initialValue };
            const spelled = { ...parentOnly, oneOf: [{}, {}] };
            // A list the uiSchema spells out with a hole at the option gives the option the field's uiSchema, and one
            // with `null` there, which only untyped code can write, gives it none
            const holeyOptions: UiSchema[] = [];
            holeyOptions[1] = {};
            const holey = { ...parentOnly, oneOf: holeyOptions };
            const nulled = { ...parentOnly, oneOf: [null, {}] as unknown as UiSchema[] };
            const firstPass = utils(schema).getDefaultFormState(schema, undefined, false, false, parentOnly);
            const later = utils(schema).getDefaultFormState(schema, {}, false, true, parentOnly);
            for (const uiSchema of [spelled, holey, nulled]) {
              expect(utils(schema).getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual(
                firstPass,
              );
              expect(utils(schema).getDefaultFormState(schema, {}, false, true, uiSchema)).toStrictEqual(later);
            }
          }
          expect(
            utils(schema).getDefaultFormState(schema, undefined, false, false, {
              'ui:initialValue': { a: 5 },
              oneOf: [{}, {}],
            }),
          ).toStrictEqual({ a: 5 });
        });
        it('hands out the keys of a const that closes the object read from a ui:initialValue as copies', () => {
          const nested: RJSFSchema = { type: 'object', const: { a: { b: 1 } } };
          const initialValue = { a: { b: 1 } };
          const state = utils(nested).getDefaultFormState(nested, undefined, false, false, {
            'ui:initialValue': initialValue,
          });
          expect(state).toStrictEqual({ a: { b: 1 } });
          expect(isObject(state) && state.a).not.toBe(initialValue.a);
        });
        it('asks whether an object takes extra keys, and which keys it declares, of the field with its allOf merged', () => {
          const open: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', const: { a: 1 }, allOf: [{ additionalProperties: true }] } },
          };
          expect(utils(open).getDefaultFormState(open)).toStrictEqual({ x: { a: 1 } });
          expect(utils(open).getDefaultFormState(open, { x: {} }, false, true)).toStrictEqual({ x: {} });
          const declared: RJSFSchema = {
            type: 'object',
            properties: {
              x: { type: 'object', const: { a: 1 }, allOf: [{ properties: { a: { type: 'number' } } }] },
            },
          };
          expect(utils(declared).getDefaultFormState(declared, { x: { a: undefined } }, false, true)).toStrictEqual({
            x: { a: undefined },
          });
        });
        it('fills a key of a const that only a property its fold leaves unmerged declares, which keeps a value the user cleared', () => {
          const declared: RJSFSchema = {
            type: 'object',
            properties: {
              x: { type: 'object', const: { a: 1 }, allOf: [{ properties: { a: { type: 'number' } } }] },
            },
          };
          expect(utils(declared).getDefaultFormState(declared)).toStrictEqual({ x: { a: 1 } });
          expect(utils(declared).getDefaultFormState(declared, { x: {} }, false, true)).toStrictEqual({ x: { a: 1 } });
          const conditional: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                const: { a: 1, b: 2 },
                properties: { a: {} },
                if: { properties: { a: { const: 1 } } },
                then: { properties: { b: {} } },
              },
            },
          };
          const skipEmpty: DefaultFormStateBehavior = { emptyObjectFields: 'skipEmptyDefaults' };
          expect(utils(conditional, skipEmpty).getDefaultFormState(conditional)).toStrictEqual({ x: { a: 1, b: 2 } });
          expect(
            utils(conditional, skipEmpty).getDefaultFormState(conditional, { x: { a: 1, b: undefined } }, false, true),
          ).toStrictEqual({ x: { a: 1, b: undefined } });
        });
        it('keeps the value a key of a const that only an unmerged allOf declares folds to, null fills included', () => {
          const nullInside: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                allOf: [
                  {
                    properties: {
                      a: { type: 'object', additionalProperties: true, properties: { n: { type: 'null' } } },
                    },
                  },
                ],
                const: { a: { b: 1 } },
              },
            },
          };
          expect(utils(nullInside).getDefaultFormState(nullInside)).toStrictEqual({ x: { a: { b: 1, n: null } } });
        });
        it('fills the nulls of a key of a const that only an unmerged allOf declares as a declared key, its $ref, recursion and dependencies included', () => {
          const A: RJSFSchema = { type: 'object', properties: { n: { type: 'null' } } };
          const R: RJSFSchema = {
            type: 'object',
            properties: { n: { type: 'null' }, child: { $ref: '#/definitions/R' } },
          };
          const D: RJSFSchema = {
            type: 'object',
            properties: { p: { type: 'string' } },
            dependencies: { p: { properties: { q: { type: 'null' } } } },
          };
          const both = (a: RJSFSchema, aConst: Record<string, string>) => {
            const x = (declared: boolean): RJSFSchema => ({
              definitions: { A, R, D },
              type: 'object',
              properties: {
                x: declared
                  ? { type: 'object', properties: { a }, const: { a: aConst } }
                  : { type: 'object', allOf: [{ properties: { a } }], const: { a: aConst } },
              },
            });
            return [x(false), x(true)];
          };
          const cases: [RJSFSchema, Record<string, string>, unknown][] = [
            [{ $ref: '#/definitions/A' }, {}, { x: { a: { n: null } } }],
            [{ $ref: '#/definitions/R' }, {}, { x: { a: { n: null, child: { n: null } } } }],
            // The `dependencies` are read from the value the `const` gives the key
            [{ $ref: '#/definitions/D' }, { p: 'x' }, { x: { a: { p: 'x', q: null } } }],
            [D, { p: 'x' }, { x: { a: { p: 'x', q: null } } }],
          ];
          for (const [a, aConst, expected] of cases) {
            for (const schema of both(a, aConst)) {
              expect(utils(schema).getDefaultFormState(schema)).toStrictEqual(expected);
            }
          }
        });
        it("skips the required of an allOf the fold leaves unmerged for a key of a const only it declares, as allOf: 'skipDefaults' skips its defaults", () => {
          const k: RJSFSchema = {
            type: 'object',
            properties: { n: { type: 'string', default: 'd' } },
            required: ['n'],
          };
          const z: RJSFSchema = { type: 'string' };
          const inAllOf: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                properties: { z },
                required: ['z'],
                allOf: [{ properties: { k }, required: ['k'] }],
                const: { k: {} },
              },
            },
          };
          const declared: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', properties: { z, k }, required: ['z', 'k'], const: { k: {} } } },
          };
          const requiredOnly: DefaultFormStateBehavior = { emptyObjectFields: 'populateRequiredDefaults' };
          expect(utils(declared, requiredOnly).getDefaultFormState(declared)).toStrictEqual({ x: { k: { n: 'd' } } });
          expect(
            utils(inAllOf, { ...requiredOnly, allOf: 'populateDefaults' }).getDefaultFormState(inAllOf),
          ).toStrictEqual({ x: { k: { n: 'd' } } });
          expect(utils(inAllOf, requiredOnly).getDefaultFormState(inAllOf)).toStrictEqual({ x: { k: {} } });
        });
        it('folds the keys of an open object const from the additionalProperties an allOf merges in beside its own', () => {
          const merged: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                additionalProperties: { type: 'number' },
                allOf: [{ additionalProperties: { type: 'number', default: 7 } }],
                const: { c: 1 },
              },
            },
          };
          const plain: RJSFSchema = {
            type: 'object',
            properties: {
              x: { type: 'object', additionalProperties: { type: 'number', default: 7 }, const: { c: 1 } },
            },
          };
          // The `const` wins over an `additionalProperties` default for a key it computes, wherever it is declared
          for (const schema of [merged, plain]) {
            expect(utils(schema).getDefaultFormState(schema)).toStrictEqual({ x: { c: 1 } });
          }
        });
        it("stubs the data's extra keys of a root whose option holds the const as the option written into it does", () => {
          const other: RJSFSchema = { properties: { c: { type: 'string' } } };
          const pairs: [RJSFSchema, RJSFSchema][] = [
            [
              {
                type: 'object',
                additionalProperties: false,
                properties: { a: { type: 'string' } },
                oneOf: [
                  { const: { b: 1 }, properties: { b: { type: 'number' } }, additionalProperties: { type: 'null' } },
                  other,
                ],
              },
              {
                type: 'object',
                additionalProperties: false,
                properties: { a: { type: 'string' }, b: { type: 'number' } },
                const: { b: 1 },
              },
            ],
            [
              {
                type: 'object',
                properties: { a: { type: 'string' } },
                oneOf: [
                  { const: { b: 1 }, properties: { b: { type: 'number' } }, additionalProperties: { type: 'null' } },
                  other,
                ],
              },
              {
                type: 'object',
                properties: { a: { type: 'string' }, b: { type: 'number' } },
                additionalProperties: { type: 'null' },
                const: { b: 1 },
              },
            ],
          ];
          const cases: [unknown, boolean][] = [
            [{ e: 5 }, false],
            [{ e: undefined, b: 1 }, false],
            [{ e: null }, true],
          ];
          for (const [withOption, written] of pairs) {
            for (const [formData, generated] of cases) {
              expect(utils(withOption).getDefaultFormState(withOption, formData, false, generated)).toStrictEqual(
                utils(written).getDefaultFormState(written, formData, false, generated),
              );
            }
          }
        });
        it('defaults a nested object to a const only an unmerged allOf or if branch gives it, and still skips its defaults', () => {
          const viaAllOf: RJSFSchema = {
            type: 'object',
            required: ['x'],
            properties: { x: { type: 'object', allOf: [{ const: { a: 1 } }] } },
          };
          expect(utils(viaAllOf).getDefaultFormState(viaAllOf)).toStrictEqual({ x: { a: 1 } });
          expect(utils(viaAllOf).getDefaultFormState(viaAllOf, { x: {} })).toStrictEqual({ x: { a: 1 } });
          const viaThen: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', if: {}, then: { const: { a: 1 } } } },
          };
          expect(utils(viaThen).getDefaultFormState(viaThen)).toStrictEqual({ x: { a: 1 } });
          // Under `allOf: 'skipDefaults'` a plain default in the same `allOf` is still skipped
          const plainDefault: RJSFSchema = {
            type: 'object',
            required: ['x'],
            properties: { x: { type: 'object', allOf: [{ properties: { b: { type: 'number', default: 2 } } }] } },
          };
          expect(utils(plainDefault).getDefaultFormState(plainDefault)).toStrictEqual({ x: {} });
        });
        it('leaves out an optional object const the optional data controls show behind their add control', () => {
          const schema: RJSFSchema = { type: 'object', properties: { x: { type: 'object', const: { a: 2 } } } };
          const uiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object' as const] } };
          expect(utils(schema).getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual({});
          // Once the user adds it, the `const` fills it
          expect(utils(schema).getDefaultFormState(schema, { x: {} }, false, true, uiSchema)).toStrictEqual({
            x: { a: 2 },
          });
          expect(utils(schema).getDefaultFormState(schema)).toStrictEqual({ x: { a: 2 } });
          const required: RJSFSchema = { ...schema, required: ['x'] };
          expect(utils(required).getDefaultFormState(required, undefined, false, false, uiSchema)).toStrictEqual({
            x: { a: 2 },
          });
          // Where constants are never defaults, the object is collapsed as one without a `const` is
          const never: DefaultFormStateBehavior = { constAsDefaults: 'never' };
          expect(utils(schema, never).getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual({});
        });
        it('opens an optional object the optional data controls show whose option holding no const gives it a value', () => {
          const uiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object' as const] } };
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                oneOf: [{ properties: { k: { type: 'string', default: 'd' } } }, { const: { k: 'c' } }],
              },
            },
          };
          expect(utils(schema).getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual({
            x: { k: 'd' },
          });
        });
        it('collapses an optional object const behind the optional data controls only where nothing else gives it a value', () => {
          const uiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object' as const] } };
          const withY: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', const: { a: 2 } }, y: { type: 'string' } },
          };
          // A `null` the data holds is kept, as for an object without a `const`
          expect(utils(withY).getDefaultFormState(withY, { x: null, y: 'k' }, false, false, uiSchema)).toStrictEqual({
            x: null,
            y: 'k',
          });
          // A `const` an unmerged `allOf` gives the object collapses it as its own `const` does
          const viaAllOf: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', allOf: [{ const: { a: 2 } }] } },
          };
          expect(utils(viaAllOf).getDefaultFormState(viaAllOf, undefined, false, false, uiSchema)).toStrictEqual({});
          // So does one whose `type` comes through the `allOf` too, written there or in the definition a `$ref` names
          const typedInAllOf: RJSFSchema = { allOf: [{ type: 'object', const: { a: 2 } }] };
          const typedViaAllOf: RJSFSchema = { type: 'object', properties: { x: typedInAllOf } };
          const typedViaRef: RJSFSchema = {
            type: 'object',
            properties: { x: { $ref: '#/$defs/X' } },
            $defs: { X: typedInAllOf },
          };
          for (const schema of [typedViaAllOf, typedViaRef]) {
            expect(utils(schema).getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual({});
            expect(utils(schema).getDefaultFormState(schema)).toStrictEqual({ x: { a: 2 } });
          }
          // A default of its own, or one the object's defaults give it, opens it
          const ownDefault: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', const: { a: 2 }, default: { a: 2 } } },
          };
          const parentDefault: RJSFSchema = {
            type: 'object',
            default: { x: { a: 2 } },
            properties: { x: { type: 'object', const: { a: 2 } } },
          };
          for (const schema of [ownDefault, parentDefault]) {
            expect(utils(schema).getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual({
              x: { a: 2 },
            });
          }
          // So does a `ui:initialValue`
          const withProperty: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', const: { a: 2 }, properties: { a: { type: 'number' } } } },
          };
          const initialValue = { ...uiSchema, x: { 'ui:initialValue': { a: 2 } } };
          for (const schema of [withProperty, withY]) {
            expect(utils(schema).getDefaultFormState(schema, undefined, false, false, initialValue)).toStrictEqual({
              x: { a: 2 },
            });
          }
          // The `const` of the option the object shows collapses it as its own does
          const viaOption: RJSFSchema = {
            type: 'object',
            properties: {
              x: { type: 'object', oneOf: [{ const: { a: 1 } }, { properties: { b: { type: 'string' } } }] },
            },
          };
          expect(utils(viaOption).getDefaultFormState(viaOption, undefined, false, false, uiSchema)).toStrictEqual({});
          // An optional object without a `const` that a default of one of its properties gives a value opens, with the
          // `null` of its `null` field
          const withNull: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                properties: { n: { type: 'null' }, s: { type: 'string', default: 'd' } },
              },
            },
          };
          expect(utils(withNull).getDefaultFormState(withNull, undefined, false, false, uiSchema)).toStrictEqual({
            x: { n: null, s: 'd' },
          });
          // and stays out where the form adds only the defaults of what is required
          const requiredInside: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                required: ['s'],
                properties: { n: { type: 'null' }, s: { type: 'string', default: 'd' } },
              },
            },
          };
          expect(
            utils(requiredInside, { emptyObjectFields: 'populateRequiredDefaults' }).getDefaultFormState(
              requiredInside,
              undefined,
              false,
              false,
              uiSchema,
            ),
          ).toStrictEqual({});
          // An item `minItems` adds collapses it as an item the data holds does
          const items: RJSFSchema = { type: 'object', properties: { x: { type: 'object', const: { a: 2 } } } };
          const filled: RJSFSchema = { type: 'array', minItems: 1, items };
          expect(utils(filled).getDefaultFormState(filled, undefined, false, false, uiSchema)).toStrictEqual([{}]);
          const held: RJSFSchema = { type: 'array', items };
          expect(utils(held).getDefaultFormState(held, [{}], false, false, uiSchema)).toStrictEqual([{}]);
        });
        it('collapses the optional object consts inside an optional object const that opens, as inside one without a const', () => {
          const uiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object' as const] } };
          const inside: RJSFSchema = {
            type: 'object',
            properties: { b: { type: 'string', default: 's' }, y: { type: 'object', const: { c: 1 } } },
          };
          const schema: RJSFSchema = {
            type: 'object',
            properties: { x: { ...inside, const: { a: 1 } }, z: inside },
          };
          expect(utils(schema).getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual({
            x: { b: 's', a: 1 },
            z: { b: 's' },
          });
        });
        it('includes an optional object behind the optional data controls as an empty one under includeUndefinedValues, with or without a const', () => {
          const uiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object' as const] } };
          const viaAllOf: RJSFSchema = { type: 'object', allOf: [{ properties: { a: { type: 'string' } } }] };
          const shapes: RJSFSchema[] = [
            { type: 'object', properties: { x: viaAllOf } },
            { type: 'object', properties: { x: { $ref: '#/$defs/X' } }, $defs: { X: viaAllOf } },
            { type: 'object', properties: { x: { type: 'object', const: { a: 2 } } } },
          ];
          for (const schema of shapes) {
            expect(utils(schema).getDefaultFormState(schema, undefined, true, false, uiSchema)).toStrictEqual({
              x: {},
            });
          }
        });
        it('opens an optional object that a property const gives a value, and collapses only an object const', () => {
          const uiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object' as const] } };
          const shapes: [RJSFSchema, unknown][] = [
            [{ type: 'object', properties: { a: { type: 'string', const: 'k' } } }, { a: 'k' }],
            [
              { type: 'object', properties: { kind: { type: 'string', const: 'k' }, name: { type: 'string' } } },
              { kind: 'k' },
            ],
            [
              { type: 'object', properties: { a: { type: 'string', oneOf: [{ const: 'p' }, { const: 'q' }] } } },
              { a: 'p' },
            ],
            [
              {
                type: 'object',
                properties: { o: { type: 'object', properties: { a: { type: 'string', const: 'k' } } } },
              },
              { o: { a: 'k' } },
            ],
          ];
          for (const [x, expected] of shapes) {
            const schema: RJSFSchema = { type: 'object', properties: { x } };
            expect(utils(schema).getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual({
              x: expected,
            });
          }
          // A select over object constants is filled from the option it shows, and collapses as its own `const` does
          const select: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { a: 2 } }] } },
          };
          expect(utils(select).getDefaultFormState(select, undefined, false, false, uiSchema)).toStrictEqual({});
          expect(utils(select).getDefaultFormState(select)).toStrictEqual({ x: { a: 1 } });
          // A field that may also be `null` and defaults to it still opens with its `const`
          const nullable: RJSFSchema = {
            type: 'object',
            properties: { x: { type: ['object', 'null'], const: { a: 1 }, default: null } },
          };
          expect(utils(nullable).getDefaultFormState(nullable, undefined, false, false, uiSchema)).toStrictEqual({
            x: { a: 1 },
          });
          // The shown option's defaults for keys the `const` doesn't name, which the `const` leaves out, don't open it
          const withOption: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                const: { a: 1 },
                oneOf: [
                  { properties: { b: { type: 'string', default: 'd' } } },
                  { properties: { c: { type: 'string' } } },
                ],
              },
            },
          };
          expect(utils(withOption).getDefaultFormState(withOption, undefined, false, false, uiSchema)).toStrictEqual(
            {},
          );
          // A `patternProperties` the property matches can give it the object `const` too
          const patterned: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object' } },
            patternProperties: { '^x$': { const: { a: 1 } } },
          };
          expect(utils(patterned).getDefaultFormState(patterned, undefined, false, false, uiSchema)).toStrictEqual({});
          // A `null` field beside the object `const` doesn't open it either
          const withNull: RJSFSchema = {
            type: 'object',
            properties: {
              x: { type: 'object', const: { a: 2 }, properties: { a: { type: 'number' }, n: { type: 'null' } } },
            },
          };
          expect(utils(withNull).getDefaultFormState(withNull, undefined, false, false, uiSchema)).toStrictEqual({});
          // Nor does a `ui:initialValue` once the defaults were generated, where it no longer applies
          const initialValue = { ...uiSchema, x: { 'ui:initialValue': { a: 2 } } };
          expect(utils(withNull).getDefaultFormState(withNull, {}, false, true, initialValue)).toStrictEqual({});
          // An array is filled from its `const` under the controls for arrays, as without them
          const arrays = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['array' as const] } };
          const list: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'array', const: ['a'], items: { type: 'string' } } },
          };
          expect(utils(list).getDefaultFormState(list, undefined, false, false, arrays)).toStrictEqual({ x: ['a'] });
        });
        it('takes a primitive const an unmerged allOf gives a field, but not one an if branch gives an empty field', () => {
          const viaAllOf: RJSFSchema = {
            type: 'object',
            properties: { s: { type: 'string', allOf: [{ const: 'x' }] } },
          };
          expect(utils(viaAllOf).getDefaultFormState(viaAllOf)).toStrictEqual({ s: 'x' });
          const viaThen: RJSFSchema = {
            type: 'object',
            properties: { s: { type: 'string', if: {}, then: { const: 'x' } } },
          };
          expect(utils(viaThen, { emptyObjectFields: 'skipEmptyDefaults' }).getDefaultFormState(viaThen)).toStrictEqual(
            {},
          );
        });
        it("keeps an extra key the option's own retrieve stubs as the user's once the defaults were generated", () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                properties: { p: { type: 'string' } },
                oneOf: [
                  {
                    const: { a: { z: 1 } },
                    additionalProperties: { type: 'object', properties: { m: { type: 'number', default: 3 } } },
                  },
                  { properties: { q: { type: 'string' } } },
                ],
              },
            },
          };
          // `a` is an extra key of the open object, not a property the option declares, so it isn't filled again (#3759)
          expect(utils(schema).getDefaultFormState(schema, { x: { a: {} } }, false, true)).toStrictEqual({
            x: { a: {} },
          });
        });
        it('asks whether an object const beside options takes extra keys with the shown option joined', () => {
          const open: RJSFSchema = {
            type: 'object',
            const: { a: 1 },
            oneOf: [{ additionalProperties: true }, { properties: { q: { type: 'string' } } }],
          };
          expect(utils(open).getDefaultFormState(open)).toStrictEqual({ a: 1 });
          // A key the user removed or renamed stays so once the defaults were generated (#3759)
          expect(utils(open).getDefaultFormState(open, {}, false, true)).toStrictEqual({});
          expect(utils(open).getDefaultFormState(open, { b: 1 }, false, true)).toStrictEqual({ b: 1 });
          const nested: RJSFSchema = { type: 'object', properties: { x: open } };
          expect(utils(nested).getDefaultFormState(nested, { x: {} }, false, true)).toStrictEqual({ x: {} });
        });
        it("leaves out a key only the shown option beside an object const declares, which the const doesn't name", () => {
          const schema: RJSFSchema = {
            type: 'object',
            const: { k: 'x' },
            properties: { k: { type: 'string' } },
            oneOf: [{ properties: { z: { type: 'string', default: 'q' } } }, { properties: { w: { type: 'string' } } }],
          };
          expect(utils(schema).getDefaultFormState(schema)).toStrictEqual({ k: 'x' });
          expect(utils(schema).getDefaultFormState(schema, { k: 'x', z: 'r' })).toStrictEqual({ k: 'x', z: 'r' });
        });
        it('keeps a key the ui:initialValue of an object const beside options names, which the const does not', () => {
          const options: RJSFSchema[] = [
            { properties: { b: { type: 'string', default: 'q' } } },
            { properties: { c: { type: 'string' } } },
          ];
          const open: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', additionalProperties: true, const: { a: 1 }, oneOf: options } },
          };
          const initialValue = (value: object) => ({ x: { 'ui:initialValue': value } });
          const withoutOptions: RJSFSchema = {
            type: 'object',
            properties: { x: { type: 'object', additionalProperties: true, const: { a: 1 } } },
          };
          const extraKey = initialValue({ a: 5, z: 1 });
          expect(utils(open).getDefaultFormState(open, undefined, false, false, extraKey)).toStrictEqual({
            x: { a: 5, z: 1 },
          });
          expect(
            utils(withoutOptions).getDefaultFormState(withoutOptions, undefined, false, false, extraKey),
          ).toStrictEqual({ x: { a: 5, z: 1 } });
          // A default of the shown option for a key neither names is still left out, open as the object is
          expect(utils(open).getDefaultFormState(open)).toStrictEqual({ x: { a: 1 } });
        });
        it('folds a key of an object const beside options as the shown option declares or takes it', () => {
          const declared: RJSFSchema = {
            type: 'object',
            const: { a: 1 },
            oneOf: [{ properties: { a: { type: 'number', default: 5 } } }],
          };
          const extra: RJSFSchema = {
            type: 'object',
            const: { a: 1 },
            oneOf: [{ additionalProperties: { type: 'number', default: 6 } }],
          };
          // The object's `const` wins over a key's own field's default, wherever the field is declared
          expect(utils(declared).getDefaultFormState(declared)).toStrictEqual({ a: 1 });
          expect(utils(extra).getDefaultFormState(extra)).toStrictEqual({ a: 1 });
        });
        it('folds a key of a const that only an unmerged allOf declares from that property, not the extra-key schema', () => {
          const withDefault: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                const: { a: 1 },
                additionalProperties: { type: 'number', default: 6 },
                allOf: [{ properties: { a: { type: 'number', default: 5 } } }],
              },
            },
          };
          const declared: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                const: { a: 1 },
                additionalProperties: { type: 'number', default: 6 },
                properties: { a: { type: 'number', default: 5 } },
              },
            },
          };
          // The object's `const` wins over a property's own default, whether `properties` or a populated `allOf`
          // declares it, and the `allOf`'s is skipped with it where it is not populated
          expect(utils(declared).getDefaultFormState(declared)).toStrictEqual({ x: { a: 1 } });
          expect(utils(withDefault, { allOf: 'populateDefaults' }).getDefaultFormState(withDefault)).toStrictEqual({
            x: { a: 1 },
          });
          expect(utils(withDefault).getDefaultFormState(withDefault)).toStrictEqual({ x: { a: 1 } });
        });
        it("skips the defaults of a key of a const that only an unmerged allOf declares, as allOf: 'skipDefaults' skips that allOf's", () => {
          const inAllOf: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                allOf: [{ const: { a: 1 }, properties: { a: { type: 'number', default: 9 } } }],
              },
            },
          };
          expect(utils(inAllOf).getDefaultFormState(inAllOf)).toStrictEqual({ x: { a: 1 } });
          expect(utils(inAllOf).getDefaultFormState(inAllOf, { x: {} }, false, true)).toStrictEqual({ x: { a: 1 } });
          expect(utils(inAllOf, { allOf: 'populateDefaults' }).getDefaultFormState(inAllOf)).toStrictEqual({
            x: { a: 1 },
          });
          expect(utils(inAllOf).getDefaultFormState(inAllOf, { x: { a: 7 } }, false, true)).toStrictEqual({
            x: { a: 7 },
          });
          // Nor does the skipped default give an optional object the optional data controls show a value of its own
          const uiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object' as const] } };
          expect(utils(inAllOf).getDefaultFormState(inAllOf, undefined, false, false, uiSchema)).toStrictEqual({});
          // Below the key the `allOf`'s defaults stay skipped, while its `null` fills are filled in
          const nested: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                const: { a: { c: 3 } },
                allOf: [
                  {
                    properties: {
                      a: {
                        type: 'object',
                        properties: { c: { type: 'number' }, n: { type: 'number', default: 9 }, z: { type: 'null' } },
                      },
                    },
                  },
                ],
              },
            },
          };
          expect(utils(nested).getDefaultFormState(nested)).toStrictEqual({ x: { a: { c: 3, z: null } } });
          expect(utils(nested).getDefaultFormState(nested, { x: { a: { c: 4 } } }, false, true)).toStrictEqual({
            x: { a: { c: 4, z: null } },
          });
        });
        it("keeps the object data of a key of a const that only an unmerged allOf declares beside a ui:initialValue that doesn't name it", () => {
          const b: RJSFSchema = { type: 'object', properties: { b: { type: 'number' } } };
          const x = (declared: boolean): RJSFSchema => ({
            type: 'object',
            const: { a: { b: 1 } },
            ...(declared ? { properties: { a: b } } : { allOf: [{ properties: { a: b } }] }),
          });
          const uiSchema = { x: { 'ui:initialValue': { z: 1 } } };
          for (const declared of [false, true]) {
            const schema: RJSFSchema = { type: 'object', properties: { x: x(declared) } };
            for (const initialDefaultsGenerated of [false, true]) {
              expect(
                utils(schema).getDefaultFormState(
                  schema,
                  { x: { a: { b: 5 } } },
                  false,
                  initialDefaultsGenerated,
                  uiSchema,
                ),
              ).toStrictEqual({ x: { a: { b: 5 } } });
            }
          }
        });
        it('keeps a null the data holds for a key of a const that only an unmerged allOf declares', () => {
          const a: RJSFSchema = { type: ['number', 'null'] };
          for (const declared of [false, true]) {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                x: {
                  type: 'object',
                  const: { a: 1 },
                  ...(declared ? { properties: { a } } : { allOf: [{ properties: { a } }] }),
                },
              },
            };
            for (const initialDefaultsGenerated of [false, true]) {
              expect(
                utils(schema).getDefaultFormState(schema, { x: { a: null } }, false, initialDefaultsGenerated),
              ).toStrictEqual({ x: { a: null } });
            }
          }
        });
        it('adds the default of a property that names const, as undefined, under skipDefaults', () => {
          const spread: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'string', const: undefined, default: 'd' } },
          };
          expect(utils(spread, { emptyObjectFields: 'skipDefaults' }).getDefaultFormState(spread)).toStrictEqual({
            a: 'd',
          });
        });
        it("asks whether an option's parent takes extra keys of the parent with its allOf merged", () => {
          const parent: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                allOf: [{ additionalProperties: true }],
                oneOf: [{ const: { b: 1 } }, { properties: { c: { type: 'string' } } }],
              },
            },
          };
          expect(utils(parent).getDefaultFormState(parent, { x: {} }, false, true)).toStrictEqual({ x: {} });
          const typedByAllOf: RJSFSchema = {
            type: 'object',
            properties: {
              x: {
                allOf: [{ type: 'object', additionalProperties: true }],
                oneOf: [{ const: { b: 1 } }, { properties: { c: { type: 'string' } } }],
              },
            },
          };
          expect(utils(typedByAllOf).getDefaultFormState(typedByAllOf)).toStrictEqual({ x: { b: 1 } });
          expect(utils(typedByAllOf).getDefaultFormState(typedByAllOf, { x: {} }, false, true)).toStrictEqual({
            x: {},
          });
        });
        it("fills a mixed oneOf option's const under skipOneOf, whether or not the option declares its keys", () => {
          const skipOneOf: DefaultFormStateBehavior = { constAsDefaults: 'skipOneOf' };
          const other: RJSFSchema = { properties: { b: { type: 'string' } } };
          const undeclared: RJSFSchema = { type: 'object', oneOf: [{ const: { a: 1 } }, other] };
          const declared: RJSFSchema = {
            type: 'object',
            oneOf: [{ const: { a: 1 }, properties: { a: { type: 'number' } } }, other],
          };
          expect(utils(undeclared, skipOneOf).getDefaultFormState(undeclared)).toStrictEqual({ a: 1 });
          expect(utils(declared, skipOneOf).getDefaultFormState(declared)).toStrictEqual({ a: 1 });
        });
        it('defaults to none of it when constants are never defaults', () => {
          const never: DefaultFormStateBehavior = { constAsDefaults: 'never' };
          expect(utils(withoutParentDefault, never).getDefaultFormState(withoutParentDefault)).toStrictEqual({});
          expect(utils(bare, never).getDefaultFormState(bare)).toStrictEqual({});
        });
      });
      test("keeps the guards for an option's const where the parent's field takes extra keys, as an explicit additionalProperties does", () => {
        const options: RJSFSchema = {
          type: 'object',
          oneOf: [{ const: { b: 1 } }, { required: ['z'], properties: { z: { type: 'string' } } }],
        };
        const allowing = createSchemaUtils(
          { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' },
          options,
        );
        const explicit: RJSFSchema = { ...options, additionalProperties: true };
        const explicitUtils = createSchemaUtils({ validator: testValidator }, explicit);
        for (const [utils, schema] of [
          [allowing, options],
          [explicitUtils, explicit],
        ] as const) {
          expect(utils.getDefaultFormState(schema, {})).toStrictEqual({ b: 1 });
          expect(utils.getDefaultFormState(schema, {}, false, true)).toStrictEqual({});
          expect(utils.getDefaultFormState(schema, { c: 1 }, false, true)).toStrictEqual({ c: 1 });
        }
        const closed = createSchemaUtils({ validator: testValidator }, options);
        expect(closed.getDefaultFormState(options, {}, false, true)).toStrictEqual({ b: 1 });
      });
      test("keeps the guards for an option's const where the option offers options of its own", () => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: true,
          oneOf: [
            {
              const: { b: 1 },
              anyOf: [
                { properties: { x: { type: 'string' } } },
                { properties: { y: { type: 'number' } }, required: ['y'] },
              ],
            },
            { properties: { z: { type: 'string' } }, required: ['z'] },
          ],
        };
        const utils = createSchemaUtils({ validator: testValidator }, schema);
        expect(utils.getDefaultFormState(schema, {}, false, true)).toStrictEqual({});
        expect(utils.getDefaultFormState(schema, { c: 1 }, false, true)).toStrictEqual({ c: 1 });
      });
      test("folds the keys of an option's const through the extra-key schema of the field that decides they close the object", () => {
        const schema: RJSFSchema = {
          type: 'object',
          additionalProperties: false,
          oneOf: [
            { const: { b: 1 }, additionalProperties: { type: 'number', default: 7 } },
            { properties: { z: { type: 'string' } }, required: ['z'] },
          ],
        };
        const utils = createSchemaUtils({ validator: testValidator }, schema);
        expect(utils.getDefaultFormState(schema, {})).toStrictEqual({ b: 1 });
        expect(utils.getDefaultFormState(schema, {}, false, true)).toStrictEqual({ b: 1 });
      });
      test('folds the keys of a const that closes the object without the uiSchema of its additional properties', () => {
        const schema: RJSFSchema = { type: 'object', const: { a: 1 } };
        const uiSchema = { additionalProperties: { 'ui:initialValue': 7 } };
        const utils = createSchemaUtils({ validator: testValidator }, schema);
        expect(utils.getDefaultFormState(schema, undefined, false, false, uiSchema)).toStrictEqual({ a: 1 });
        expect(utils.getDefaultFormState(schema, {}, false, true, uiSchema)).toStrictEqual({ a: 1 });
      });
      test('computeDefaults gives the const without data, which getDefaultFormState merges in', () => {
        expect(computeDefaults({ validator: testValidator }, bare, { rawFormData: { a: 3 } })).toStrictEqual({ a: 1 });
      });
    });
    describe('an explicitly undefined property schema', () => {
      // A JS-authored schema can conditionally omit a property with `{ properties: { foo: cond ? {...} : undefined } }`
      const schema = {
        type: 'object',
        properties: { foo: undefined, bar: { type: 'string' } },
      } as unknown as RJSFSchema;

      test('getObjectDefaults treats it as an empty schema', () => {
        expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({});
      });

      test('ensureFormDataMatchingSchema treats it as an empty schema', () => {
        const allOfSchema = {
          allOf: [schema],
          type: 'object',
          properties: { foo: undefined },
        } as unknown as RJSFSchema;
        expect(
          ensureFormDataMatchingSchema(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            allOfSchema,
            allOfSchema,
            { foo: 'a value' },
          ),
        ).toEqual({ foo: 'a value' });
      });
    });

    it('throws error when schema is not an object', () => {
      expect(() =>
        getDefaultFormState({ validator: testValidator }, { schema: null as unknown as RJSFSchema }),
      ).toThrow('Invalid schema:');
    });
    it('reports a schema that is a circular array or a BigInt, which JSON.stringify() would throw for', () => {
      const circular: unknown[] = [];
      circular.push(circular);
      expect(() =>
        getDefaultFormState({ validator: testValidator }, { schema: circular as unknown as RJSFSchema }),
      ).toThrow('Invalid schema:');
      expect(() =>
        getDefaultFormState({ validator: testValidator }, { schema: BigInt(1) as unknown as RJSFSchema }),
      ).toThrow('Invalid schema: 1');
    });

    describe('object schemas', () => {
      describe('schema with a ref', () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: 'number',
              default: 42,
            },
            testdef: {
              type: 'object',
              properties: {
                foo: {
                  $ref: '#/definitions/foo',
                },
              },
            },
          },
          $ref: '#/definitions/testdef',
        };
        const expected = {
          foo: 42,
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema }, expected),
          ).toBe(undefined);
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema }, expected)).toEqual({});
        });
      });

      describe('schema with anyOf containing $ref AND default should preserve existing formData', () => {
        // This test verifies the fix for a bug where anyOf schemas with $ref AND default
        // would incorrectly override existing formData with the default value.
        // The bug occurs when:
        // 1. anyOf with default gets merged with the matched $ref option
        // 2. parentDefaults accumulates during recursion
        // 3. The "merge defaults" branch catches anyOf/$ref schemas
        const schema: RJSFSchema = {
          $defs: {
            Inner: {
              type: 'object',
              properties: {
                str: { type: 'string', default: 'default_str' },
                extra: { type: 'object', default: { key: 'value' } },
              },
            },
            Wrapper: {
              type: 'object',
              properties: {
                inner: {
                  $ref: '#/$defs/Inner',
                  default: { str: 'default_str', extra: { key: 'value' } },
                },
              },
            },
          },
          type: 'object',
          properties: {
            outer: {
              anyOf: [{ $ref: '#/$defs/Wrapper' }],
              default: { inner: { str: 'default_str', extra: { key: 'value' } } },
            },
          },
        };

        test('getDefaultFormState should preserve existing formData when anyOf has $ref and default', () => {
          const existingFormData = {
            outer: {
              inner: {
                str: 'user_value', // User's change - should be preserved
                extra: { key: 'value' },
              },
            },
          };

          const result = getDefaultFormState(
            { validator: testValidator },
            { schema, formData: existingFormData, rootSchema: schema },
          ) as { outer?: { inner?: { str?: string } } };

          // The user's value should be preserved, NOT overridden by the default
          expect(result?.outer?.inner?.str).toBe('user_value');
        });

        test('getDefaultFormState should apply defaults when formData is undefined', () => {
          const result = getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema }) as {
            outer?: { inner?: { str?: string } };
          };

          // Defaults should be applied when no formData exists
          expect(result?.outer?.inner?.str).toBe('default_str');
        });
      });

      describe('schema with a const property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: {
              type: 'string',
              const: 'test',
            },
          },
        };
        const expected = {
          test: 'test',
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(
            expected,
          );
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        describe('constAsDefaults is never', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'never',
          };
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });
        });
      });

      describe('a property written as a $ref to a const', () => {
        const schema: RJSFSchema = {
          definitions: { K: { type: 'string', const: 'k' } },
          type: 'object',
          properties: { constInPlace: { type: 'string', const: 'k' }, constViaRef: { $ref: '#/definitions/K' } },
        };
        it.each<NonNullable<DefaultFormStateBehavior['emptyObjectFields']>>([
          'skipDefaults',
          'populateRequiredDefaults',
        ])(
          'fills the const behind the $ref as the const written in place, under emptyObjectFields %s',
          (emptyObjectFields) => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ constInPlace: 'k', constViaRef: 'k' });
          },
        );
      });

      describe('an object with an optional property that has a nested required property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const expected = {
          requiredProperty: 'foo',
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(
            expected,
          );
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });
      });

      describe('an object with an optional property that has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                  default: '',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const expected = {
          requiredProperty: 'foo',
          optionalProperty: { nestedRequiredProperty: '' },
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(
            expected,
          );
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });
      });

      describe('an object with an optional property that has a nested required property and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const includeUndefinedValues = true;
        const expected = {
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: 'foo',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });
      });

      describe("an object with an optional property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNumberProperty: {
              type: 'number',
            },
            optionalObjectProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected = {
          optionalNumberProperty: undefined,
          optionalObjectProperty: {
            nestedRequiredProperty: {},
          },
          requiredProperty: 'foo',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });
      });

      describe("an object with an null-type property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNullProperty: {
              type: 'null',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        // A `null` schema allows one value, so a missing one is that value
        const expected = {
          optionalNullProperty: null,
          requiredProperty: 'foo',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });
      });

      describe('required boolean properties default to false when no default is provided', () => {
        it('sets required boolean to false when no default is given', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean' },
            },
            required: ['agree'],
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
            agree: false,
          });
        });

        it('preserves an explicit schema default of true for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean', default: true },
            },
            required: ['agree'],
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
            agree: true,
          });
        });

        it('does not set a default for an optional boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean' },
            },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
        });

        it('preserves existing formData true for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean' },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { agree: true }, rootSchema: schema },
            ),
          ).toEqual({ agree: true });
        });

        it('preserves existing formData false for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean' },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { agree: false }, rootSchema: schema },
            ),
          ).toEqual({ agree: false });
        });

        it('sets no false for a type list resolving to boolean whose widget renders another listed type', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { agree: { type: ['null', 'boolean', 'string'] } },
            required: ['agree'],
          };
          const uiSchema: UiSchema = { agree: { 'ui:widget': 'textarea' } };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema })).toEqual(
            {},
          );
        });

        describe('a type list resolving to a container whose widget renders another listed type', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              v: {
                type: ['null', 'object', 'string'],
                properties: { a: { type: 'string', default: 'x' }, b: { type: 'string', default: 'y' } },
              },
            },
          };
          const uiSchema: UiSchema = { v: { 'ui:widget': 'textarea' } };
          it("doesn't fill the object in behind the textarea", () => {
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema })).toEqual(
              {},
            );
          });
          it('fills in an object it already holds, which keeps its own field', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, rootSchema: schema, uiSchema, formData: { v: { a: 'q' } } },
              ),
            ).toEqual({ v: { a: 'q', b: 'y' } });
          });
          it('fills the object in for a widget the form registers under the alias', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, widgets: { textarea: () => null } },
                { schema, rootSchema: schema, uiSchema },
              ),
            ).toEqual({ v: { a: 'x', b: 'y' } });
          });
        });

        it('sets no false for a select over a type list naming boolean first among several non-null types', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { agree: { type: ['null', 'boolean', 'string'], enum: [null, true, 'a'] } },
            required: ['agree'],
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
        });

        it('sets false for a select over a nullable boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { agree: { type: ['null', 'boolean'], enum: [null, true, false] } },
            required: ['agree'],
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
            agree: false,
          });
        });

        it('sets false for a type list whose checkbox widget renders its boolean type', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { agree: { type: ['number', 'boolean'] } },
            required: ['agree'],
          };
          const uiSchema: UiSchema = { agree: { 'ui:widget': 'checkbox' } };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema })).toEqual({
            agree: false,
          });
        });
      });

      // The list resolves to its container type, but the value it holds is of another type it names, which the
      // container's defaults would be spread into or put in place of
      describe('a type list holding a value of another listed type', () => {
        it('spreads no array defaults into an object held by a list resolving to array', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              v: { type: ['null', 'array', 'object'], items: { type: 'string', default: 'q' }, minItems: 2 },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, rootSchema: schema, formData: { v: { a: 'x' } } },
            ),
          ).toEqual({ v: { a: 'x' } });
        });

        it.each<[string, RJSFSchema]>([
          ['object', { type: ['null', 'object', 'string'], properties: { a: { type: 'string', default: 'x' } } }],
          ['object', { type: ['null', 'object'], properties: { a: { type: 'string', default: 'x' } } }],
          ['array', { type: ['null', 'array', 'string'], items: { type: 'string' }, minItems: 1 }],
        ])('keeps a null held by a list resolving to %s', (_, schema) => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: null }),
          ).toBe(null);
        });

        it.each<[string, RJSFSchema]>([
          [
            'object',
            {
              type: ['null', 'object', 'string'],
              default: 'abc',
              properties: { a: { type: 'string', default: 'x' } },
            },
          ],
          ['array', { type: ['null', 'array', 'string'], default: 'abc', items: { type: 'string' }, minItems: 1 }],
        ])('keeps a default of another listed type on a list resolving to %s', (_, schema) => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toBe('abc');
        });

        it('fills in the defaults when the list holds no value yet', () => {
          const schema: RJSFSchema = {
            type: ['null', 'object', 'string'],
            properties: { a: { type: 'string', default: 'x' } },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({ a: 'x' });
        });

        it('fills in the array defaults of a list naming object behind a oneOf', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              list: { oneOf: [{ type: ['array', 'object'], items: { type: 'string', default: 'x' }, minItems: 2 }] },
            },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
            list: ['x', 'x'],
          });
        });

        it('fills in the array defaults of a list naming object with dependencies', () => {
          const schema: RJSFSchema = {
            type: ['array', 'object'],
            items: { type: 'string', default: 'x' },
            minItems: 2,
            dependencies: {},
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(['x', 'x']);
        });
      });

      describe('required boolean properties and the requiredBooleanDefault flag', () => {
        const defaultFormStateBehavior: DefaultFormStateBehavior = {
          requiredBooleanDefault: 'skip',
        };
        const requiredBooleanSchema: RJSFSchema = {
          type: 'object',
          properties: {
            agree: { type: 'boolean' },
          },
          required: ['agree'],
        };

        it('leaves a required boolean undefined when no default is given', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({});
        });

        it('leaves a required nullable boolean undefined when no default is given', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: ['boolean', 'null'] },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, rootSchema: schema, includeUndefinedValues: false },
            ),
          ).toEqual({});
        });

        it('still applies an explicit schema default for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              agree: { type: 'boolean', default: true },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, rootSchema: schema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: true });
        });

        it('still applies a parent default for a required boolean', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: { agree: false },
            properties: {
              agree: { type: 'boolean' },
            },
            required: ['agree'],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, rootSchema: schema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: false });
        });

        it('preserves existing formData false for a required boolean', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: requiredBooleanSchema,
                formData: { agree: false },
                rootSchema: requiredBooleanSchema,
                includeUndefinedValues: false,
              },
            ),
          ).toEqual({ agree: false });
        });

        it('populates false again when the flag is populateFalse', () => {
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: {
                  requiredBooleanDefault: 'populateFalse',
                },
              },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: false });
        });

        it('returns undefined from getDefaultBasedOnSchemaType for a required boolean when skip is set', () => {
          const schema: RJSFSchema = { type: 'boolean' };
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
              rootSchema: schema,
              required: true,
            }),
          ).toBeUndefined();
        });

        it('populates false when the flag is omitted', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: {} },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({
            agree: false,
          });
        });

        it('populates false for an unrecognized string value instead of silently skipping', () => {
          // An untyped JS consumer or a deserialized setting can hand in a value the type does not admit
          const misspelled = {
            requiredBooleanDefault: 'populatefalse',
          } as unknown as DefaultFormStateBehavior;
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: misspelled },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: false });
        });

        it('populates false for a non-string value instead of silently skipping', () => {
          const wrongType = { requiredBooleanDefault: true } as unknown as DefaultFormStateBehavior;
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: wrongType },
              { schema: requiredBooleanSchema, rootSchema: requiredBooleanSchema, includeUndefinedValues: false },
            ),
          ).toEqual({ agree: false });
        });
      });

      describe('an object with an additionalProperties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          additionalProperties: true,
          required: ['requiredProperty'],
          default: {
            foo: 'bar',
          },
        };
        const expected = {
          requiredProperty: 'foo',
          foo: 'bar',
        };

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema }, { foo: 'bar' }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema }, { foo: 'bar' }),
          ).toEqual(expected);
        });
      });

      describe('an object with an additionalProperties and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          additionalProperties: {
            type: 'string',
          },
          required: ['requiredProperty'],
          default: {
            foo: 'bar',
          },
        };
        const includeUndefinedValues = true;
        const expected = {
          requiredProperty: 'foo',
          foo: 'bar',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType(
              { validator: testValidator },
              schema,
              { rootSchema: schema, includeUndefinedValues },
              { foo: 'bar' },
            ),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults(
              { validator: testValidator },
              schema,
              { rootSchema: schema, includeUndefinedValues },
              { foo: 'bar' },
            ),
          ).toEqual(expected);
        });
      });

      describe('an object with additionalProperties type object with defaults and formdata', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: {
              title: 'Test',
              type: 'object',
              properties: {
                foo: {
                  type: 'string',
                },
              },
              additionalProperties: {
                type: 'object',
                properties: {
                  host: {
                    title: 'Host',
                    type: 'string',
                    default: 'localhost',
                  },
                  port: {
                    title: 'Port',
                    type: 'integer',
                    default: 389,
                  },
                },
              },
            },
          },
        };
        const rawFormData = { test: { foo: 'x', newKey: {} } };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
          ).toEqual({
            test: {
              foo: 'x',
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          });
        });

        test('computeDefaults', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual({
            test: {
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          });
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
          ).toEqual({
            test: {
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          });
        });

        test('getObjectDefaults', () => {
          expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual({
            test: {
              newKey: {
                host: 'localhost',
                port: 389,
              },
            },
          });
        });

        describe('an object with schema-level default and renamed additionalProperties key in formData', () => {
          // Regression: when a schema has a top-level `default` that seeds additionalProperties keys,
          // renaming one of those keys in formData should NOT re-inject the stale default key.
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              options: {
                type: 'object',
                title: 'Options',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    option_name: { type: 'string', title: 'Option Name' },
                  },
                },
                default: { efs: { option_name: 'EFS' } },
              },
            },
          };

          test('getDefaultFormState does not re-inject default key when formData has a renamed key', () => {
            const rawFormData = { options: { efsKey: { option_name: 'EFS' } } };
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
            ).toEqual({
              options: { efsKey: { option_name: 'EFS' } },
            });
          });

          test('getDefaultFormState seeds default keys when options formData is empty', () => {
            const rawFormData = { options: {} };
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
            ).toEqual({
              options: { efs: { option_name: 'EFS' } },
            });
          });

          test('getDefaultFormState seeds default when options is absent from formData', () => {
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: {}, rootSchema: schema }),
            ).toEqual({
              options: { efs: { option_name: 'EFS' } },
            });
          });

          test('getObjectDefaults does not re-inject default key when formData has a renamed key', () => {
            const rawFormData = { options: { efsKey: { option_name: 'EFS' } } };
            // getObjectDefaults only computes schema defaults, not formData values, so efsKey gets {}
            // (the additionalProperties schema has no value defaults). The key point is that the stale
            // schema-level default key 'efs' is NOT present in the result.
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({ options: { efsKey: {} } });
          });
        });

        describe('an object with additionalProperties type object with formdata and no defaults', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              test: {
                title: 'Test',
                type: 'object',
                properties: {
                  foo: {
                    type: 'string',
                  },
                },
                additionalProperties: {
                  type: 'object',
                  properties: {
                    host: {
                      title: 'Host',
                      type: 'string',
                    },
                    port: {
                      title: 'Port',
                      type: 'integer',
                    },
                  },
                },
              },
            },
          };
          const rawFormData = { test: { foo: 'x', newKey: {} } };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
            ).toEqual({
              test: {
                foo: 'x',
                newKey: {},
              },
            });
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual({
              test: {
                newKey: {},
              },
            });
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({
              test: {
                newKey: {},
              },
            });
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({
              test: {
                newKey: {},
              },
            });
          });
        });

        describe('an object with additionalProperties type object with no defaults and non-object formdata', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              test: {
                title: 'Test',
                type: 'object',
                properties: {
                  foo: {
                    type: 'string',
                  },
                },
                additionalProperties: {
                  type: 'object',
                  properties: {
                    host: {
                      title: 'Host',
                      type: 'string',
                    },
                    port: {
                      title: 'Port',
                      type: 'integer',
                    },
                  },
                },
              },
            },
          };
          const rawFormData = {};
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual(
              expected,
            );
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual(expected);
          });
        });

        describe('an object with deep nested dependencies with formData', () => {
          beforeEach(() => {
            // The mock validator cannot evaluate a dependency's `oneOf`, so it answers each check as the real ones do
            testValidator.setReturnValues({ isValid: asRealValidator });
          });
          afterAll(() => {
            // Reset the testValidator
            if (typeof testValidator.reset === 'function') {
              testValidator?.reset();
            }
          });

          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              nestedObject: {
                type: 'object',
                properties: {
                  first: {
                    type: 'string',
                    enum: ['no', 'yes'],
                    default: 'no',
                  },
                },
                dependencies: {
                  first: {
                    oneOf: [
                      {
                        properties: {
                          first: {
                            enum: ['yes'],
                          },
                          second: {
                            type: 'object',
                            properties: {
                              deeplyNestedThird: {
                                type: 'string',
                                enum: ['before', 'after'],
                                default: 'before',
                              },
                            },
                          },
                        },
                      },
                      {
                        properties: {
                          first: {
                            enum: ['no'],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          };
          const rawFormData = {
            nestedObject: {
              first: 'yes',
            },
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                {
                  validator: testValidator,
                  defaultFormStateBehavior: {
                    emptyObjectFields: 'populateAllDefaults',
                    allOf: 'skipDefaults',
                    arrayMinItems: {
                      // @ts-expect-error: TS2322, an unknown `populate` value is what this case checks
                      populate: 'populate',
                      mergeExtraDefaults: false,
                    },
                    mergeDefaultsIntoFormData: 'useFormDataIfPresent',
                  },
                },
                { schema, formData: rawFormData, rootSchema: schema, includeUndefinedValues: false },
              ),
            ).toEqual({
              nestedObject: {
                first: 'yes',
                second: {
                  deeplyNestedThird: 'before',
                },
              },
            });
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData })).toEqual({
              nestedObject: {
                first: 'no',
                second: {
                  deeplyNestedThird: 'before',
                },
              },
            });
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({
              nestedObject: {
                first: 'no',
                second: {
                  deeplyNestedThird: 'before',
                },
              },
            });
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, rawFormData }),
            ).toEqual({
              nestedObject: {
                first: 'no',
                second: {
                  deeplyNestedThird: 'before',
                },
              },
            });
          });
        });

        describe('handling an invalid property schema', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              invalidProperty: 'not a valid property value',
            },
          } as RJSFSchema;
          const includeUndefinedValues = 'excludeObjectChildren';
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
                rootSchema: schema,
                includeUndefinedValues,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
            ).toEqual(expected);
          });
        });

        describe('a recursive schema', () => {
          const schema = RECURSIVE_REF;
          // NOTE: defined at L410
          // const includeUndefinedValues = 'excludeObjectChildren';

          test('getDefaultFormState', () => {
            // NOTE: `includeUndefinedValues` is not used L861
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
              children: {
                name: '',
              },
              name: '',
            });
          });

          test('computeDefaults', () => {
            // NOTE: `includeUndefinedValues` is not used L1275
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({
              children: {
                name: '',
              },
              name: '',
            });
          });

          test('getDefaultBasedOnSchemaType', () => {
            // NOTE: `includeUndefinedValues` is not used L1598
            expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toBe(
              undefined,
            );
          });

          test('getObjectDefaults', () => {
            // NOTE: `includeUndefinedValues` is not used L1930
            expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({});
          });
        });

        describe('a recursive schema whose then branch refers back to it', () => {
          const node: RJSFSchema = {
            type: 'object',
            properties: { name: { type: 'string', default: 'n' } },
            if: {},
            then: { properties: { child: { $ref: '#/definitions/node' } } },
          };
          const schema: RJSFSchema = { definitions: { node }, $ref: '#/definitions/node' };

          test('getDefaultFormState stops at the recursion the branch expanded', () => {
            // The recursion is reached through the branch's expanded `$ref`, which the retrieve of the `if` leaves in
            // place for the `$ref` check to stop at
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
              name: 'n',
              child: { name: 'n' },
            });
          });
        });

        describe('a recursive schema whose anyOf option refers back to it', () => {
          const nodeWith = (c: RJSFSchema): RJSFSchema => ({
            definitions: {
              node: { type: 'object', properties: { name: { type: 'string', default: 'n' }, c } },
            },
            $ref: '#/definitions/node',
          });
          const ref: RJSFSchema = { $ref: '#/definitions/node' };
          const formData = { c: { c: { c: { c: {} } } } };

          test.each<[string, RJSFSchema]>([
            ['as an option', { anyOf: [ref, { type: 'null' }] }],
            ['as an option of an object', { type: 'object', anyOf: [ref, { properties: { z: { type: 'string' } } }] }],
            ['as a property', ref],
          ])('getDefaultFormState stops where the schema does, whatever the data holds below, %s', (_, c) => {
            const schema = nodeWith(c);
            expect(getDefaultFormState({ validator: testValidator }, { schema, formData, rootSchema: schema })).toEqual(
              {
                name: 'n',
                c: { name: 'n', c: { c: { c: {} } } },
              },
            );
          });
        });

        describe('a schema resolved from a $ref whose then branch is a $ref to a recursive definition', () => {
          const kid: RJSFSchema = {
            type: 'object',
            properties: { tag: { type: 'string', default: 't' }, kid: { $ref: '#/definitions/kid' } },
          };
          const parent: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'string' } },
            if: {},
            then: { $ref: '#/definitions/kid' },
          };
          const schema: RJSFSchema = {
            definitions: { parent, kid },
            type: 'object',
            properties: { p: { $ref: '#/definitions/parent' } },
          };

          test('getDefaultFormState fills one level of the recursion, as it does for a $ref property', () => {
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
              p: { tag: 't', kid: { tag: 't' } },
            });
          });
        });

        describe('a recursive schema whose dependencies entry refers back to it', () => {
          const node: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'string', default: 'x' } },
            dependencies: { a: { properties: { child: { $ref: '#/definitions/node' } } } },
          };
          const expected = { a: 'x', child: { a: 'x' } };

          test.each<[string, RJSFSchema, unknown]>([
            ['the root', { definitions: { node }, $ref: '#/definitions/node' }, expected],
            [
              'a property',
              { definitions: { node }, type: 'object', properties: { p: { $ref: '#/definitions/node' } } },
              { p: expected },
            ],
          ])('getDefaultFormState stops at the recursion the entry declares, from %s', (_, schema, defaults) => {
            // The default meets the dependency at every level, so the entry applies wherever the definition is reached
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(defaults);
          });
        });

        describe('a branch beside a $ref that uses the definition a second time', () => {
          const Q: RJSFSchema = { type: 'object', properties: { name: { type: 'string', default: 'd' } } };
          const friend: RJSFSchema = { properties: { friend: { $ref: '#/definitions/Q' } } };

          test.each<[string, RJSFSchema]>([
            ['an allOf entry', { allOf: [friend] }],
            ['a then branch', { if: {}, then: friend }],
            ['a dependencies entry', { dependencies: { name: friend } }],
          ])('getDefaultFormState fills in the property %s declares', (_, sibling) => {
            // The branch is not part of the definition, so its `$ref` to the definition is not a recursion to stop at
            const schema: RJSFSchema = {
              definitions: { Q },
              type: 'object',
              properties: { b: { $ref: '#/definitions/Q', ...sibling } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ b: { name: 'd', friend: { name: 'd' } } });
          });

          it('getDefaultFormState fills in the items an allOf beside the $ref of an array declares', () => {
            // The array's `allOf` is merged by `computeDefaults()` itself rather than by `getObjectDefaults()`, and
            // the same schema written without the `$ref` beside the `allOf` gets these defaults
            const L: RJSFSchema = { type: 'array', minItems: 1, items: {} };
            const schema: RJSFSchema = {
              definitions: { L },
              type: 'object',
              required: ['p'],
              properties: { p: { $ref: '#/definitions/L', allOf: [{ items: { $ref: '#/definitions/L' } }] } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ p: [[undefined]] });
          });
        });

        describe('a recursive schema whose if has its properties resolved', () => {
          // Resolving the `if` expands the `$ref` back to the definition in place, so the recursion is reached through
          // the expanded property rather than through the `$ref` the plain schema holds; both pin the same result
          const recursion: RJSFSchema = { $ref: '#/definitions/node' };
          const withDefault = (child: RJSFSchema): RJSFSchema => ({
            type: 'object',
            properties: { name: { type: 'string', default: 'n' }, child },
            default: { child: { child: { name: 'deep' } } },
          });
          const withItems = (items: RJSFSchema): RJSFSchema => ({
            type: 'object',
            properties: { name: { type: 'string', default: 'n' }, kids: { type: 'array', minItems: 1, items } },
            required: ['kids'],
          });
          const rooted = (node: RJSFSchema): RJSFSchema => ({ definitions: { node }, $ref: '#/definitions/node' });
          const defaults = (schema: RJSFSchema, uiSchema?: UiSchema) =>
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema });

          test('keeps the parent and own defaults at the recursion, as a $ref to it does', () => {
            const expected = { name: 'n', child: { name: 'n', child: { name: 'deep', child: { name: 'deep' } } } };
            expect(defaults(rooted(withDefault(recursion)))).toEqual(expected);
            expect(defaults(rooted({ ...withDefault(recursion), if: {} }))).toEqual(expected);
          });

          test('takes the ui:initialValue at the recursion, as a $ref to it does', () => {
            const uiSchema: UiSchema = { child: { child: { 'ui:initialValue': { name: 'init' } } } };
            const expected = { name: 'n', child: { name: 'n', child: { name: 'init' } } };
            const node: RJSFSchema = {
              type: 'object',
              properties: { name: { type: 'string', default: 'n' }, child: recursion },
            };
            expect(defaults(rooted(node), uiSchema)).toEqual(expected);
            expect(defaults(rooted({ ...node, if: {} }), uiSchema)).toEqual(expected);
          });

          test('stops at a recursion reached through array items', () => {
            const expected = { name: 'n', kids: [{ name: 'n', kids: [undefined] }] };
            expect(defaults(rooted(withItems(recursion)))).toEqual(expected);
            expect(defaults(rooted({ ...withItems(recursion), if: {} }))).toEqual(expected);
          });

          test('stops at a recursion an allOf around the $ref hides from the $ref check', () => {
            const schema = rooted(withDefault({ allOf: [recursion] }));
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ name: 'n', child: { name: 'n', child: { name: 'deep', child: { name: 'deep' } } } });
          });

          test('expands a $ref back to the definition whose allOf merged another $ref in once', () => {
            const schema: RJSFSchema = {
              definitions: {
                outer: {
                  allOf: [{ $ref: '#/definitions/inner' }, { properties: { extra: { type: 'string', default: 'e' } } }],
                },
                inner: {
                  type: 'object',
                  properties: { name: { type: 'string', default: 'n' }, back: { $ref: '#/definitions/outer' } },
                },
              },
              type: 'object',
              properties: { a: { $ref: '#/definitions/outer' } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              ),
            ).toEqual({ a: { name: 'n', extra: 'e', back: { name: 'n', extra: 'e' } } });
          });

          test('stops a recursion under a populated allOf where it stops the same one without it', () => {
            const tags: RJSFSchema = { type: 'array', minItems: 1, items: { $ref: '#/definitions/tags' } };
            const populated = (definition: RJSFSchema) => {
              const schema: RJSFSchema = {
                definitions: { tags: definition },
                type: 'object',
                required: ['t'],
                properties: { t: { $ref: '#/definitions/tags' } },
              };
              return getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
                { schema, rootSchema: schema },
              );
            };
            expect(populated(tags)).toEqual({ t: [[undefined]] });
            expect(populated({ ...tags, allOf: [{ minItems: 1 }] })).toEqual({ t: [[undefined]] });
          });
        });

        describe('a recursive schema whose typed property resolves its way back to it', () => {
          // The property is an object or holds one, so `getObjectDefaults()` is what resolves its `allOf` or `then`,
          // and what expands the `$ref` back to the definition where the `$ref` check cannot see it
          const recursion: RJSFSchema = { $ref: '#/definitions/node' };
          const throughAllOf: RJSFSchema = { type: 'object', allOf: [recursion] };
          const rooted = (node: RJSFSchema): RJSFSchema => ({
            definitions: { node: { type: 'object', ...node } },
            $ref: '#/definitions/node',
          });
          const withChild = (child: RJSFSchema): RJSFSchema =>
            rooted({ properties: { name: { type: 'string', default: 'n' }, child } });
          const defaults = (schema: RJSFSchema, allOf?: 'populateDefaults') =>
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf } },
              { schema, rootSchema: schema },
            );

          test('stops at a recursion reached through the allOf of a property', () => {
            expect(defaults(withChild(throughAllOf), 'populateDefaults')).toEqual({ name: 'n', child: { name: 'n' } });
          });

          test('stops at a recursion reached through the then branch of a property', () => {
            expect(defaults(withChild({ type: 'object', if: {}, then: recursion }))).toEqual({
              name: 'n',
              child: { name: 'n' },
            });
          });

          test('stops at a recursion reached through the allOf of array items', () => {
            const schema = withChild({ type: 'array', minItems: 1, items: throughAllOf });
            expect(defaults(schema, 'populateDefaults')).toEqual({ name: 'n', child: [{ name: 'n', child: [{}] }] });
          });

          test('stops at a recursion reached through the allOf of additionalProperties', () => {
            // The keys come from a default, which names one at the recursion without holding data for it
            const schema: RJSFSchema = {
              ...rooted({ properties: { name: { type: 'string', default: 'n' } }, additionalProperties: throughAllOf }),
              default: { extra: { extra: {} } },
            };
            expect(defaults(schema, 'populateDefaults')).toEqual({ name: 'n', extra: { name: 'n' } });
          });
        });

        describe('a recursive allof schema', () => {
          const schema = RECURSIVE_REF_ALLOF;
          const expected = {
            value: [undefined],
          };

          test('getDefaultFormState', () => {
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(
              expected,
            );
          });

          test('getObjectDefaults', () => {
            expect(getObjectDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
          });
        });

        describe('a simple schema and no optional args', () => {
          const schema: RJSFSchema = { type: 'string' };
          const expected = undefined;

          test('getDefaultFormState', () => {
            expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema)).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema)).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(getObjectDefaults({ validator: testValidator }, schema)).toEqual({});
          });
        });

        describe('an object const value merge with formData', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              localConst: {
                type: 'string',
                const: 'local',
              },
              RootConst: {
                type: 'object',
                properties: {
                  attr1: {
                    type: 'number',
                  },
                  attr2: {
                    type: 'boolean',
                  },
                },
                const: {
                  attr1: 1,
                  attr2: true,
                },
              },
              RootAndLocalConst: {
                type: 'string',
                const: 'FromLocal',
              },
              fromFormData: {
                type: 'string',
              },
            },
            const: {
              RootAndLocalConst: 'FromRoot',
            },
          };
          const rawFormData = {
            fromFormData: 'fromFormData',
          };
          const includeUndefinedValues = false;
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            emptyObjectFields: 'skipDefaults',
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, formData: rawFormData, rootSchema: schema, includeUndefinedValues },
              ),
            ).toEqual({
              localConst: 'local',
              RootConst: {
                attr1: 1,
                attr2: true,
              },
              RootAndLocalConst: 'FromLocal',
              fromFormData: 'fromFormData',
            });
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                includeUndefinedValues,
              }),
            ).toEqual({
              localConst: 'local',
              RootConst: {
                attr1: 1,
                attr2: true,
              },
              RootAndLocalConst: 'FromLocal',
            });
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                includeUndefinedValues,
              }),
            ).toEqual({
              localConst: 'local',
              RootConst: {
                attr1: 1,
                attr2: true,
              },
              RootAndLocalConst: 'FromLocal',
            });
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                includeUndefinedValues,
              }),
            ).toEqual({
              localConst: 'local',
              RootConst: {
                attr1: 1,
                attr2: true,
              },
              RootAndLocalConst: 'FromLocal',
            });
          });

          describe('constAsDefault is never', () => {
            const defaultFormStateBehavior: DefaultFormStateBehavior = {
              emptyObjectFields: 'skipDefaults',
              constAsDefaults: 'never',
            };

            test('getDefaultFormState', () => {
              expect(
                getDefaultFormState(
                  { validator: testValidator, defaultFormStateBehavior },
                  { schema, formData: rawFormData, rootSchema: schema, includeUndefinedValues },
                ),
              ).toEqual({
                fromFormData: 'fromFormData',
              });
            });

            test('computeDefaults', () => {
              expect(
                computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                  rootSchema: schema,
                  rawFormData,
                  includeUndefinedValues,
                }),
              ).toEqual({});
            });

            test('getDefaultBasedOnSchemaType', () => {
              expect(
                getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                  rootSchema: schema,
                }),
              ).toEqual({});
            });

            test('getObjectDefaults', () => {
              expect(
                getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                  rootSchema: schema,
                }),
              ).toEqual({});
            });
          });
        });
      });

      describe('an object with non valid formData for enum properties', () => {
        beforeEach(() => {
          // The mock validator cannot evaluate a dependency's `oneOf`, so it answers each check as the real ones do
          testValidator.setReturnValues({ isValid: asRealValidator });
        });
        afterAll(() => {
          // Reset the testValidator
          if (typeof testValidator.reset === 'function') {
            testValidator?.reset();
          }
        });

        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            animal: {
              enum: ['Cat', 'Fish'],
            },
          },
          dependencies: {
            animal: {
              oneOf: [
                {
                  properties: {
                    animal: {
                      enum: ['Cat'],
                    },
                    food: {
                      type: 'string',
                      enum: ['meat', 'grass', 'fish'],
                      default: 'meat',
                    },
                  },
                },
                {
                  properties: {
                    animal: {
                      enum: ['Fish'],
                    },
                    food: {
                      type: 'string',
                      enum: ['insect', 'worms'],
                      default: 'worms',
                    },
                    water: {
                      type: 'string',
                      enum: ['lake', 'sea'],
                      default: 'sea',
                    },
                  },
                },
              ],
            },
          },
        };
        const rawFormData = {
          animal: 'Fish',
          food: 'meat',
          water: null,
        };
        const shouldMergeDefaultsIntoFormData = true;

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
          ).toEqual({
            animal: 'Fish',
            food: 'worms',
            water: null,
          });
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData,
            }),
          ).toEqual({
            animal: 'Fish',
            food: 'worms',
            water: null,
          });
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData,
            }),
          ).toEqual({
            animal: 'Fish',
            food: 'meat',
            water: null,
          });
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData,
            }),
          ).toEqual({
            animal: 'Fish',
            food: 'meat',
            water: null,
          });
        });

        describe('mergeDefaultsIntoFormData set to "useDefaultIfFormDataUndefined"', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
          };
          const expected = {
            animal: 'Fish',
            food: 'worms',
            water: 'sea',
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, formData: rawFormData, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                shouldMergeDefaultsIntoFormData,
              }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                shouldMergeDefaultsIntoFormData,
              }),
            ).toEqual({
              animal: 'Fish',
              food: 'meat',
              water: null,
            });
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                shouldMergeDefaultsIntoFormData,
              }),
            ).toEqual({
              animal: 'Fish',
              food: 'meat',
              water: null,
            });
          });
        });
      });

      it.each<[string, RJSFSchema]>([
        ['an untyped field', { default: { a: 1 } }],
        [
          'an object field declaring the key',
          { type: 'object', properties: { a: { type: 'number' } }, default: { a: 1 } },
        ],
        [
          'an anyOf/oneOf field',
          {
            oneOf: [{ type: 'string' }, { type: 'object', properties: { a: { type: 'number' } } }],
            default: { a: 1 },
          },
        ],
      ])(
        'fills in a key the data leaves undefined from the default of %s, under useDefaultIfFormDataUndefined',
        (_, p) => {
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
              },
              { schema: { type: 'object', properties: { p } }, formData: { p: { a: undefined, b: 2 } } },
            ),
          ).toEqual({ p: { a: 1, b: 2 } });
        },
      );

      it.each<[string, Record<string, RJSFSchema>, GenericObjectType, GenericObjectType]>([
        ['at the top', { b: ENUM_WITH_DEFAULT }, { b: 'zz' }, { b: 'x' }],
        [
          'one level down',
          { a: { type: 'object', properties: { b: ENUM_WITH_DEFAULT } } },
          { a: { b: 'zz' } },
          { a: { b: 'x' } },
        ],
        [
          'two levels down',
          { a: { type: 'object', properties: { c: { type: 'object', properties: { b: ENUM_WITH_DEFAULT } } } } },
          { a: { c: { b: 'zz' } } },
          { a: { c: { b: 'x' } } },
        ],
      ])(
        'replaces a value its enum no longer offers with the default %s (#5523)',
        (_, properties, formData, expected) => {
          const schema: RJSFSchema = { type: 'object', properties };
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
        },
      );

      it('replaces an object value its enum no longer offers with the default one level down (#5523)', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: { type: 'string', enum: [{ label: 'a' }, { label: 'b' }], default: { label: 'a' } },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { test: { label: 'z' } } }),
        ).toEqual({ test: { label: 'a' } });
      });

      describe('an object with a valid formData and enum property with default value', () => {
        test('getDefaultFormState', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              test: {
                type: 'string',
                enum: [
                  { label: 'a', value: 'a' },
                  { label: 'b', value: 'b' },
                ],
                default: { label: 'a', value: 'a' },
              },
            },
          };

          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { test: { label: 'b', value: 'b' } } },
            ),
          ).toEqual({
            test: { label: 'b', value: 'b' },
          });
        });
      });

      describe('an enum property wrapped in allOf', () => {
        const COLOR: RJSFSchema = { type: 'string', enum: ['red', 'green', 'blue'] };
        const SHAPE: RJSFSchema = { oneOf: [{ const: { k: 'a' } }, { const: { k: 'b' } }] };
        const KIND: RJSFSchema = {
          discriminator: { propertyName: 'kind' },
          oneOf: [
            { const: { kind: 'a', v: 1 }, properties: { kind: { const: 'a' } } },
            { const: { kind: 'b', v: 1 }, properties: { kind: { const: 'b' } } },
          ],
        };
        const NESTED: RJSFSchema = { type: 'object', properties: { q: { enum: ['a', 'b'], default: 'a' } } };
        const definitions = { Color: COLOR, Shape: SHAPE, Kind: KIND, Nested: NESTED };
        it.each<[string, RJSFSchema, unknown, unknown]>([
          ['keeps a valid value of a $ref', { allOf: [{ $ref: '#/definitions/Color' }] }, 'green', 'green'],
          [
            'keeps a valid value of a $ref with a default',
            { allOf: [{ $ref: '#/definitions/Color' }], default: 'red' },
            'green',
            'green',
          ],
          ['keeps a valid value of an inline enum', { allOf: [COLOR] }, 'green', 'green'],
          [
            'keeps a valid value of an inline enum with a default',
            { allOf: [COLOR], default: 'red' },
            'green',
            'green',
          ],
          [
            'replaces a value outside the enum with the default',
            { allOf: [{ $ref: '#/definitions/Color' }], default: 'red' },
            'purple',
            'red',
          ],
          [
            'keeps a valid value of a oneOf of constants',
            { allOf: [{ oneOf: [{ const: 'red' }, { const: 'green' }] }], default: 'red' },
            'green',
            'green',
          ],
          [
            'keeps a valid value of an enum an allOf picks by a condition on the value',
            { allOf: [{ type: 'string', if: { const: 'x' }, then: { enum: ['x'] }, else: { enum: ['y', 'z'] } }] },
            'x',
            'x',
          ],
          [
            'replaces a value an allOf leaves out of the enum with the default',
            { ...COLOR, allOf: [{ enum: ['red', 'green'] }], default: 'red' },
            'blue',
            'red',
          ],
          [
            'replaces object data outside the enum with the default',
            { allOf: [{ $ref: '#/definitions/Color' }], default: 'red' },
            { x: 1 },
            'red',
          ],
          [
            'keeps a null the enum leaves out rather than filling it with the default, as a plain enum does',
            { allOf: [{ $ref: '#/definitions/Color' }], default: 'red' },
            null,
            null,
          ],
          [
            'keeps a value of an allOf that narrows the enum to one value, as a field declaring one value does',
            { allOf: [{ enum: ['a'] }], default: 'a' },
            'b',
            'b',
          ],
          [
            "replaces a value outside the field's own enum with the default where the allOf narrows it to one value",
            { type: 'string', enum: ['a', 'b'], allOf: [{ enum: ['a'] }], default: 'a' },
            'c',
            'a',
          ],
          [
            "keeps a value of the field's own enum where the allOf narrows it to one value",
            { type: 'string', enum: ['a', 'b'], allOf: [{ enum: ['a'] }], default: 'a' },
            'b',
            'b',
          ],
          [
            'keeps a value outside the enum of a property declared inside the allOf, whose own default skipDefaults skips',
            { allOf: [{ type: 'object', properties: { c: { enum: ['red', 'green'], default: 'red' } } }] },
            { c: 'purple', d: 1 },
            { c: 'purple', d: 1 },
          ],
          [
            "replaces a value outside the enum of a property declared inside the allOf with the field's default",
            { allOf: [{ type: 'object', properties: { c: { enum: ['red', 'green'] } } }], default: { c: 'red' } },
            { c: 'purple' },
            { c: 'red' },
          ],
          [
            "replaces a value outside the oneOf constants of a property declared inside the allOf with the field's default, as the enum does",
            {
              allOf: [{ type: 'object', properties: { c: { oneOf: [{ const: 'red' }, { const: 'green' }] } } }],
              default: { c: 'red' },
            },
            { c: 'purple' },
            { c: 'red' },
          ],
          [
            'keeps a value outside the enum nested in a $ref property declared inside the allOf, whose default skipDefaults skips',
            { allOf: [{ properties: { n: { $ref: '#/definitions/Nested' } } }] },
            { n: { q: 'z' }, d: 1 },
            { n: { q: 'z' }, d: 1 },
          ],
          [
            'keeps a valid value nested in a $ref property declared inside the allOf',
            { allOf: [{ properties: { n: { $ref: '#/definitions/Nested' } } }] },
            { n: { q: 'b' } },
            { n: { q: 'b' } },
          ],
          [
            "keeps a value outside the enum of a property declared inside an object field's allOf, whose own default skipDefaults skips",
            { type: 'object', allOf: [{ properties: { c: { enum: ['red', 'green'], default: 'red' } } }] },
            { c: 'purple', d: 1 },
            { c: 'purple', d: 1 },
          ],
          [
            "replaces a value outside the enum of a property declared inside an object field's allOf with the field's default",
            { type: 'object', allOf: [{ properties: { c: { enum: ['a', 'b'] } } }], default: { c: 'a' } },
            { c: 'z' },
            { c: 'a' },
          ],
          [
            "keeps a value outside the enum nested in object data of a property declared inside an object field's allOf, with no default",
            {
              type: 'object',
              allOf: [{ properties: { c: { type: 'object', properties: { d: { enum: ['a', 'b'] } } } } }],
            },
            { c: { d: 'z' } },
            { c: { d: 'z' } },
          ],
          [
            "drops object data of a property an object field's allOf types as a string",
            { type: 'object', allOf: [{ properties: { c: { type: 'string' } } }] },
            { c: { z: 1 }, d: 1 },
            { d: 1 },
          ],
          [
            "keeps a valid value of a property declared inside an object field's allOf",
            { type: 'object', allOf: [{ properties: { c: { enum: ['red', 'green'], default: 'red' } } }] },
            { c: 'green', d: 1 },
            { c: 'green', d: 1 },
          ],
          [
            'keeps a valid value of a property declared inside the allOf',
            { allOf: [{ type: 'object', properties: { c: { enum: ['red', 'green'], default: 'red' } } }] },
            { c: 'green', d: 1 },
            { c: 'green', d: 1 },
          ],
          [
            "drops object data of a field declared inside a parent's allOf that types it as a string",
            { allOf: [{ properties: { c: { allOf: [{ type: 'string' }] } } }] },
            { c: { z: 1 }, d: 1 },
            { d: 1 },
          ],
          [
            "replaces a value outside the allOf enum of a property declared inside the allOf with the field's default",
            { default: { c: 'red' }, allOf: [{ properties: { c: { allOf: [{ enum: ['red', 'green'] }] } } }] },
            { c: 'purple' },
            { c: 'red' },
          ],
          [
            "replaces a value outside the allOf enum of a property declared inside an object field's allOf with the field's default",
            {
              type: 'object',
              default: { c: 'red' },
              allOf: [{ properties: { c: { allOf: [{ enum: ['red', 'green'] }] } } }],
            },
            { c: 'purple' },
            { c: 'red' },
          ],
          [
            "keeps a value outside the allOf enum of a property declared inside an object field's allOf, with no default",
            { type: 'object', allOf: [{ properties: { c: { allOf: [{ enum: ['red', 'green'] }] } } }] },
            { c: 'purple', d: 1 },
            { c: 'purple', d: 1 },
          ],
          [
            'keeps a null the enum offers',
            { allOf: [{ type: ['string', 'null'], enum: ['red', null] }], default: 'red' },
            null,
            null,
          ],
          [
            "replaces a value outside a oneOf of constants with the field's default, as the field's own oneOf does",
            { allOf: [{ oneOf: [{ const: 'red' }, { const: 'green' }] }], default: 'red' },
            'blue',
            'red',
          ],
          ['keeps a valid value of an inline object-valued select', { allOf: [SHAPE] }, { k: 'b' }, { k: 'b' }],
          [
            'keeps a valid value of an object-valued select through a $ref',
            { allOf: [{ $ref: '#/definitions/Shape' }] },
            { k: 'b' },
            { k: 'b' },
          ],
          [
            'replaces an invalid value of an inline object-valued select with the default',
            { allOf: [SHAPE], default: { k: 'a' } },
            { k: 'z' },
            { k: 'a' },
          ],
          [
            'replaces an invalid value of an object-valued select through a $ref with the default',
            { allOf: [{ $ref: '#/definitions/Shape' }], default: { k: 'a' } },
            { k: 'z' },
            { k: 'a' },
          ],
          [
            'keeps a value of an object-valued select its discriminator names',
            { allOf: [{ $ref: '#/definitions/Kind' }] },
            { kind: 'b', v: 9 },
            { kind: 'b', v: 9 },
          ],
          ['drops object data an allOf types as a string', { allOf: [{ type: 'string' }] }, { x: 1 }, undefined],
          [
            'keeps object data a condition in the allOf types as an object',
            {
              allOf: [
                {
                  if: { required: ['kind'] },
                  then: { type: 'object', properties: { kind: { type: 'string' } } },
                  else: { type: 'string' },
                },
              ],
            },
            { kind: 'a' },
            { kind: 'a' },
          ],
          [
            'keeps a valid value of an object-valued select a condition in the allOf picks',
            {
              allOf: [
                {
                  if: { properties: { k: { const: 'a' } }, required: ['k'] },
                  then: { oneOf: [{ const: { k: 'a' } }] },
                  else: { oneOf: [{ const: { k: 'b' } }] },
                },
              ],
            },
            { k: 'a' },
            { k: 'a' },
          ],
        ])('%s', (_name, color, value, expected) => {
          const schema: RJSFSchema = { type: 'object', properties: { color }, definitions };
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: { color: value } }),
          ).toStrictEqual({ color: expected });
        });

        it.each<[string, RJSFSchema, unknown, unknown]>([
          [
            'replaces an invalid value of an object-valued select with the default',
            { allOf: [SHAPE], default: { k: 'a' } },
            { k: 'z' },
            { k: 'a' },
          ],
          [
            'replaces object data an allOf types as a string with the default',
            { allOf: [{ type: 'string' }], default: 'd' },
            { x: 1 },
            'd',
          ],
          [
            'keeps a valid value of an object-valued select',
            { allOf: [SHAPE], default: { k: 'a' } },
            { k: 'b' },
            { k: 'b' },
          ],
        ])('%s once the defaults are generated', (_name, color, value, expected) => {
          const schema: RJSFSchema = { type: 'object', properties: { color }, definitions };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { color: value }, initialDefaultsGenerated: true },
            ),
          ).toStrictEqual({ color: expected });
        });

        it('keeps a null the enum leaves out under populateDefaults too', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { color: { allOf: [{ $ref: '#/definitions/Color' }], default: 'red' } },
            definitions,
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
              { schema, formData: { color: null } },
            ),
          ).toStrictEqual({ color: null });
        });

        it('replaces the data with the const an allOf holds under constAsDefaults always', () => {
          const schema: RJSFSchema = { type: 'object', properties: { color: { allOf: [{ const: 'red' }] } } };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { color: 'blue' } },
            ),
          ).toEqual({ color: 'red' });
        });

        it('replaces the data of a property declared inside the allOf with its const under constAsDefaults always', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { color: { allOf: [{ properties: { c: { const: 'red' } } }] } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { color: { c: 'blue' } } },
            ),
          ).toStrictEqual({ color: { c: 'red' } });
        });

        it("keeps the data of an object field whose allOf's const is no object under constAsDefaults always", () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { color: { type: 'object', allOf: [{ const: 'k' }] } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { color: { d: 1 } } },
            ),
          ).toStrictEqual({ color: { d: 1 } });
        });

        it('fills an empty field with the const an allOf holds under constAsDefaults always', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { plain: { const: 'red' }, wrapped: { allOf: [{ const: 'red' }] } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: {} },
            ),
          ).toStrictEqual({ plain: 'red', wrapped: 'red' });
        });

        it.each<[DefaultFormStateBehavior['constAsDefaults'], GenericObjectType]>([
          [undefined, { plain: 'k', wrapped: 'k' }],
          ['skipOneOf', { plain: 'k', wrapped: 'k' }],
          ['never', {}],
        ])(
          'fills an empty field with the const an allOf holds as with its own, constAsDefaults %s',
          (constAsDefaults, expected) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: { plain: { const: 'k' }, wrapped: { allOf: [{ const: 'k' }] } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: constAsDefaults ? { constAsDefaults } : {} },
                { schema, formData: {} },
              ),
            ).toStrictEqual(expected);
          },
        );

        it.each([[[]], [['plain', 'wrapped']]])(
          'fills an empty object field with the object const its allOf holds under constAsDefaults always, as with its own, required %j',
          (required) => {
            const schema: RJSFSchema = {
              type: 'object',
              required,
              properties: {
                plain: { type: 'object', const: { a: 1 } },
                wrapped: { type: 'object', allOf: [{ const: { a: 1 } }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
                { schema, formData: {} },
              ),
            ).toStrictEqual({ plain: { a: 1 }, wrapped: { a: 1 } });
          },
        );

        it.each<[string, RJSFSchema, GenericObjectType, GenericObjectType]>([
          ['drops a key it does not name', { type: 'object' }, { b: 'x' }, { a: 1 }],
          ['keeps the data of a key it names', { type: 'object' }, { a: 2, b: 'x' }, { a: 2 }],
          [
            'fills a property it names that the data lacks',
            { type: 'object', properties: { a: { type: 'number' } } },
            { b: 'x' },
            { a: 1 },
          ],
        ])(
          "%s, for an object field's allOf const under constAsDefaults always as for its own const",
          (_name, field, value, expected) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: { own: { ...field, const: { a: 1 } }, wrapped: { ...field, allOf: [{ const: { a: 1 } }] } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
                { schema, formData: { own: value, wrapped: value } },
              ),
            ).toStrictEqual({ own: expected, wrapped: expected });
          },
        );

        it.each([false, true])(
          "keeps the data of the keys an untyped field's allOf const names under constAsDefaults always as for its own const, initialDefaultsGenerated %s",
          (initialDefaultsGenerated) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: { own: { const: { a: 1 } }, wrapped: { allOf: [{ const: { a: 1 } }] } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
                { schema, formData: { own: { a: 2, b: 3 }, wrapped: { a: 2, b: 3 } }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ own: { a: 2 }, wrapped: { a: 2 } });
          },
        );

        it.each<[string, GenericObjectType, GenericObjectType]>([
          ['drops a key it does not name', { a: 'y', extra: 1 }, { a: 'y' }],
          ['fills a property it names that the data lacks', {}, { a: 'x' }],
        ])(
          '%s, for an object const a condition left unmerged holds under constAsDefaults always',
          (_name, formData, expected) => {
            const field: RJSFSchema = {
              type: 'object',
              properties: { a: { type: 'string' } },
              if: { properties: { a: { type: 'string' } } },
              then: { const: { a: 'x' } },
            };
            const schema: RJSFSchema = { type: 'object', properties: { field } };
            expect(
              getDefaultFormState(
                {
                  validator: testValidator,
                  defaultFormStateBehavior: { constAsDefaults: 'always', emptyObjectFields: 'skipEmptyDefaults' },
                },
                { schema, formData: { field: formData } },
              ),
            ).toStrictEqual({ field: expected });
          },
        );

        it("pins the data to an object field's dependencies const on a key only a default fills, beside an allOf", () => {
          const field: RJSFSchema = {
            type: 'object',
            properties: { k: { type: 'string', default: 'd' } },
            allOf: [{ properties: { a: { type: 'number' } } }],
            dependencies: { k: { const: { k: 'd', a: 1 } } },
          };
          const schema: RJSFSchema = { type: 'object', properties: { field } };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { field: { a: 5, b: 6 } } },
            ),
          ).toStrictEqual({ field: { k: 'd', a: 5 } });
        });

        it.each<[string, RJSFSchema]>([
          ['its own', { type: 'string', const: { $data: '1/a' } }],
          ['an allOf', { allOf: [{ type: 'string', const: { $data: '1/a' } }] }],
        ])('keeps the data over an AJV $data const of %s under constAsDefaults always', (_name, b) => {
          const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' }, b } };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { a: 'x', b: 'y' } },
            ),
          ).toStrictEqual({ a: 'x', b: 'y' });
        });

        it.each([false, true])(
          'pins no keys from a dependency option only the data without its defaults matches beside an allOf under constAsDefaults always, initialDefaultsGenerated %s',
          (initialDefaultsGenerated) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                o: {
                  type: 'object',
                  properties: { k: { type: 'string', default: 'b' }, j: { type: 'string', default: 'b' } },
                  allOf: [{ properties: { other: { type: 'string' } } }],
                  dependencies: {
                    k: {
                      anyOf: [
                        { properties: { z: { type: 'string' } }, const: { k: 'b', j: 'b', pinned: 'A' } },
                        { properties: { j: { type: 'string' } } },
                      ],
                    },
                  },
                },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
                { schema, formData: { o: { other: 'x' } }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ o: { k: 'b', j: 'b', other: 'x' } });
          },
        );

        it.each<[string, RJSFSchema, string]>([
          ['no const', { type: 'string', enum: ['a', 'b'] }, 'b'],
          ['a const', { const: 'a' }, 'a'],
        ])(
          'reads a field whose allOf reaches one definition twice beside a boolean entry and %s under constAsDefaults always',
          (_name, definition, expected) => {
            const schema: RJSFSchema = {
              definitions: { d: definition },
              type: 'object',
              properties: { a: { allOf: [true, { $ref: '#/definitions/d' }, { $ref: '#/definitions/d' }] } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
                { schema, formData: { a: 'b' } },
              ),
            ).toStrictEqual({ a: expected });
          },
        );

        it('keeps the data of a field beside an allOf whose const is undefined under constAsDefaults always', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { a: { allOf: [{ type: 'string' }], const: undefined } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { a: 'x' } },
            ),
          ).toStrictEqual({ a: 'x' });
        });

        it.each<[string, RJSFSchema]>([
          ['an object field', { type: 'object', allOf: [{ properties: { c: { enum: ['red', 'green'] } } }] }],
          [
            'an untyped field',
            { allOf: [{ type: 'object', properties: { c: { enum: ['red', 'green'], default: 'red' } } }] },
          ],
        ])('keeps a null the enum of a property declared inside the allOf of %s leaves out', (_name, color) => {
          const schema: RJSFSchema = { type: 'object', properties: { color } };
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: { color: { c: null, d: 1 } } }),
          ).toStrictEqual({ color: { c: null, d: 1 } });
        });

        it.each([0, false, '', null])('replaces the data with a const of %j under constAsDefaults always', (value) => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { plain: { const: value }, wrapped: { allOf: [{ const: value }] } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { plain: 5, wrapped: 5 } },
            ),
          ).toStrictEqual({ plain: value, wrapped: value });
        });

        it.each<[string, GenericObjectType, boolean]>([
          ['a key', { c: undefined }, false],
          ['a key nested one level deeper', { n: { c: undefined } }, false],
          ['a key', { c: undefined }, true],
        ])(
          'keeps %s the user left undefined below an allOf whose enum declares it, initialDefaultsGenerated %s',
          (_name, value, initialDefaultsGenerated) => {
            const enumProperty: RJSFSchema = { properties: { c: { enum: ['a', 'b'] } } };
            const schema: RJSFSchema = {
              type: 'object',
              properties: { obj: { allOf: [{ properties: { ...enumProperty.properties, n: enumProperty } }] } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { obj: value }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ obj: value });
          },
        );

        it.each([false, true])(
          'keeps a key the user left undefined that an allOf declares through an allOf of its own, initialDefaultsGenerated %s',
          (initialDefaultsGenerated) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: { obj: { allOf: [{ properties: { c: { allOf: [{ enum: ['a', 'b'] }] } } }] } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { obj: { c: undefined } }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ obj: { c: undefined } });
          },
        );

        it.each<[string, RJSFSchema, GenericObjectType]>([
          ['an object field', { type: 'object' }, { extra: { a: 1 } }],
          ['an untyped field', {}, { extra: { a: 1 }, c: 'x' }],
          [
            'an object field, for a value nested in it',
            { type: 'object', additionalProperties: { type: 'object', properties: { n: { type: 'string' } } } },
            { extra: { n: { a: 1 } } },
          ],
        ])(
          "keeps the object data of an extra key its schema can't take beside the allOf of %s once the defaults are generated",
          (_name, field, value) => {
            const o: RJSFSchema = {
              additionalProperties: { type: 'string' },
              allOf: [{ properties: { c: { type: 'string' } } }],
              ...field,
            };
            const schema: RJSFSchema = { type: 'object', properties: { o } };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { o: value }, initialDefaultsGenerated: true },
              ),
            ).toStrictEqual({ o: value });
          },
        );

        it.each<[string, string, boolean, GenericObjectType]>([
          ['keeps', 'zz', false, { c: 'zz' }],
          ['keeps', 'zz', true, { c: 'zz' }],
          ['keeps', 'g', false, { c: 'g' }],
          ['keeps', 'g', true, { c: 'g' }],
        ])(
          '%s a value %j of a key only the allOf of an object taking extra keys declares, as its enum offers it or not, initialDefaultsGenerated %s',
          (_name, value, initialDefaultsGenerated, expected) => {
            const o: RJSFSchema = {
              type: 'object',
              properties: { a: { type: 'string' } },
              additionalProperties: true,
              allOf: [{ properties: { c: { enum: ['r', 'g'] } } }],
            };
            const schema: RJSFSchema = { type: 'object', properties: { o } };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { o: { c: value } }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ o: expected });
          },
        );

        it.each([false, true])(
          'keeps a value the options of an allOf leave out where the field has no default, as a plain enum does, initialDefaultsGenerated %s',
          (initialDefaultsGenerated) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                plain: { type: 'string', enum: ['r', 'g'] },
                wrapped: { allOf: [{ type: 'string', enum: ['r', 'g'] }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { plain: 'zz', wrapped: 'zz' }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ plain: 'zz', wrapped: 'zz' });
          },
        );

        it.each<[RJSFSchema, GenericObjectType, boolean]>(
          [{}, { additionalProperties: true }].flatMap((beside) =>
            [{}, { e: 'q' }].flatMap((value) =>
              [false, true].map((generated): [RJSFSchema, GenericObjectType, boolean] => [beside, value, generated]),
            ),
          ),
        )(
          "fills a key a nested object's allOf declares from the object's default as its own property, beside %j, with %j, initialDefaultsGenerated %s",
          (beside, value, initialDefaultsGenerated) => {
            const c: RJSFSchema = { type: 'string' };
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', properties: { c }, default: { c: 'a' }, ...beside },
                wrapped: { type: 'object', allOf: [{ properties: { c } }], default: { c: 'a' }, ...beside },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { own: value, wrapped: value }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ own: { c: 'a', ...value }, wrapped: { c: 'a', ...value } });
          },
        );

        it.each<[string, 'skipDefaults' | 'populateDefaults', unknown, unknown]>([
          ['a property', 'skipDefaults', 'c', 'a'],
          ['a property', 'populateDefaults', 'c', 'a'],
          ['the root', 'skipDefaults', 'c', 'a'],
          ['the root', 'populateDefaults', 'c', 'a'],
          ['a property', 'populateDefaults', 'b', 'b'],
          ['the root', 'skipDefaults', 'b', 'b'],
        ])(
          "gives %s whose allOf narrows its own enum to one value, under allOf %s, %j the outcome %j by the field's own options",
          (where, allOf, value, expected) => {
            const w: RJSFSchema = { enum: ['a', 'b'], allOf: [{ enum: ['a'] }], default: 'a' };
            const options = { validator: testValidator, defaultFormStateBehavior: { allOf } };
            const result =
              where === 'the root'
                ? getDefaultFormState(options, { schema: w, formData: value })
                : getDefaultFormState(options, {
                    schema: { type: 'object', properties: { w } },
                    formData: { w: value },
                  });
            expect(result).toStrictEqual(where === 'the root' ? expected : { w: expected });
          },
        );

        it("fills a key an object's allOf requires through its fold as required under populateRequiredDefaults, without the defaults the allOf nests in it", () => {
          const b: RJSFSchema = {
            type: 'object',
            required: ['c'],
            properties: { c: { type: 'string', default: 'z' } },
          };
          const zz: RJSFSchema = { type: 'string' };
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              own: { type: 'object', required: ['zz', 'b'], properties: { zz, b }, default: { b: {} } },
              wrapped: {
                type: 'object',
                required: ['zz'],
                properties: { zz },
                default: { b: {} },
                allOf: [{ required: ['b'], properties: { b } }],
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
              { schema, formData: { own: {}, wrapped: {} } },
            ),
          ).toStrictEqual({ own: { b: { c: 'z' } }, wrapped: { b: {} } });
        });

        it.each<[DefaultFormStateBehavior]>([
          [{ constAsDefaults: 'always' }],
          [{ emptyObjectFields: 'populateRequiredDefaults' }],
          [{ emptyObjectFields: 'skipDefaults' }],
        ])(
          "fills a key the data lacks with the const of an object's allOf property, as of its own, under %j",
          (behavior) => {
            const a: RJSFSchema = { const: 'c' };
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', properties: { a } },
                wrapped: { type: 'object', allOf: [{ properties: { a } }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: behavior },
                { schema, formData: { own: {}, wrapped: {} } },
              ),
            ).toStrictEqual({ own: { a: 'c' }, wrapped: { a: 'c' } });
          },
        );

        it("keeps a key an object's allOf declares that the data holds as undefined under useDefaultIfFormDataUndefined where only the allOf gives it a default", () => {
          const a: RJSFSchema = { enum: ['x', 'y'], default: 'x' };
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              own: { type: 'object', properties: { a } },
              wrapped: { type: 'object', allOf: [{ properties: { a } }] },
            },
          };
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
              },
              { schema, formData: { own: { a: undefined }, wrapped: { a: undefined } } },
            ),
          ).toStrictEqual({ own: { a: 'x' }, wrapped: { a: undefined } });
        });

        it.each([false, true])(
          "matches a key an object's allOf declares that an object const pins, at any depth, taking the const over its own default, initialDefaultsGenerated %s",
          (initialDefaultsGenerated) => {
            const c: RJSFSchema = { enum: ['a', 'b'], default: 'a' };
            const d: RJSFSchema = { type: 'object', properties: { d: c } };
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', allOf: [{ const: { c: 'b', n: { d: 'a' } } }], properties: { c, n: d } },
                wrapped: { type: 'object', allOf: [{ const: { c: 'b', n: { d: 'a' } } }, { properties: { c, n: d } }] },
              },
            };
            const value = { c: 'zz', n: { d: 'zz' } };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
                { schema, formData: { own: value, wrapped: value }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ own: { c: 'b', n: { d: 'a' } }, wrapped: { c: 'b', n: { d: 'a' } } });
          },
        );

        describe.each<[string, RJSFSchema]>([
          ['the enum', { enum: ['red', 'green'] }],
          ['the anyOf constants', { anyOf: [{ const: 'red' }, { const: 'green' }] }],
          ['the oneOf constants', { oneOf: [{ const: 'red' }, { const: 'green' }] }],
        ])('%s', (list, options) => {
          it.each<[string, DefaultFormStateBehavior, string | number | null, string]>([
            ["the property's own", {}, 'red', 'green'],
            ["the object's under ancestorWins", { nestedDefaultsPrecedence: 'ancestorWins' }, 'red', 'red'],
            [
              "the property's own under ancestorWins where its type can't hold the object's number",
              { nestedDefaultsPrecedence: 'ancestorWins' },
              5,
              'green',
            ],
            [
              "the property's own under ancestorWins where its type can't hold the object's null",
              { nestedDefaultsPrecedence: 'ancestorWins' },
              null,
              'green',
            ],
          ])(
            `replaces a value outside ${list} of a key an object's allOf declares with the object's default, where its own property takes %s default`,
            (_name, behavior, objectDefault, expected) => {
              const c: RJSFSchema = { type: 'string', ...options, default: 'green' };
              const schema: RJSFSchema = {
                type: 'object',
                properties: {
                  own: { type: 'object', default: { c: objectDefault }, properties: { c } },
                  wrapped: { type: 'object', default: { c: objectDefault }, allOf: [{ properties: { c } }] },
                },
              };
              expect(
                getDefaultFormState(
                  { validator: testValidator, defaultFormStateBehavior: behavior },
                  { schema, formData: { own: { c: 'zz' }, wrapped: { c: 'zz' } } },
                ),
              ).toStrictEqual({ own: { c: expected }, wrapped: { c: objectDefault } });
            },
          );
        });

        it.each<[string, DefaultFormStateBehavior, boolean, RJSFSchema]>([
          ['anyOf', {}, false, {}],
          ['oneOf', {}, false, {}],
          ['anyOf', {}, true, {}],
          ['anyOf', { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' }, false, {}],
          ['anyOf', {}, false, { enum: ['red', 'green'] }],
          ['oneOf', {}, true, { enum: ['red', 'green'] }],
        ])(
          "replaces a value the %s constants of a property don't offer with its default, and keeps it for a key an object's allOf declares, whose own default skipDefaults skips, under %j, initialDefaultsGenerated %s, beside %j",
          (keyword, behavior, initialDefaultsGenerated, beside) => {
            const c: RJSFSchema = {
              type: 'string',
              ...beside,
              [keyword]: [{ const: 'red' }, { const: 'green' }],
              default: 'green',
            };
            const nested: RJSFSchema = { type: 'object', properties: { c } };
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', properties: { c, x: nested } },
                wrapped: { type: 'object', allOf: [{ properties: { c, x: nested } }] },
              },
            };
            const value = { c: 'zz', x: { c: 'zz' } };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: behavior },
                { schema, formData: { own: value, wrapped: value }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ own: { c: 'green', x: { c: 'green' } }, wrapped: value });
          },
        );

        describe.each<[string, RJSFSchema]>([
          ['an enum', { type: 'string', enum: ['red', 'green'] }],
          ['a oneOf of constants', { type: 'string', oneOf: [{ const: 'red' }, { const: 'green' }] }],
          ['an anyOf of constants', { type: 'string', anyOf: [{ const: 'red' }, { const: 'green' }] }],
          ['an allOf enum', { allOf: [{ type: 'string', enum: ['red', 'green'] }] }],
        ])('a value %s offers none of', (_list, list) => {
          it.each<DefaultFormStateBehavior['allOf']>([undefined, 'populateDefaults', 'skipDefaults'])(
            'is kept with no default, at the root as for a property, under allOf %s',
            (allOf) => {
              const context = { validator: testValidator, defaultFormStateBehavior: { allOf } };
              const property: RJSFSchema = { type: 'object', properties: { c: list } };
              expect(getDefaultFormState(context, { schema: list, formData: 'zz' })).toBe('zz');
              expect(getDefaultFormState(context, { schema: property, formData: { c: 'zz' } })).toStrictEqual({
                c: 'zz',
              });
            },
          );

          it("is replaced by the field's default, at the root as for a property", () => {
            const withDefault: RJSFSchema = { ...list, default: 'green' };
            const property: RJSFSchema = { type: 'object', properties: { c: withDefault } };
            const context = { validator: testValidator };
            expect(getDefaultFormState(context, { schema: withDefault, formData: 'zz' })).toBe('green');
            expect(getDefaultFormState(context, { schema: property, formData: { c: 'zz' } })).toStrictEqual({
              c: 'green',
            });
          });
        });

        it.each<[string, RJSFSchema]>([
          ['a number', { type: 'number' }],
          ['an integer', { type: 'integer' }],
          ['an untyped', {}],
        ])(
          'keeps a NaN %s field with no default holds, at the root as for a property and an array item',
          (_, field) => {
            const context = { validator: testValidator };
            for (const initialDefaultsGenerated of [false, true]) {
              expect(
                getDefaultFormState(context, { schema: field, formData: NaN, initialDefaultsGenerated }),
              ).toBeNaN();
              expect(
                getDefaultFormState(context, {
                  schema: { type: 'object', properties: { n: field } },
                  formData: { n: NaN },
                  initialDefaultsGenerated,
                }),
              ).toStrictEqual({ n: NaN });
              expect(
                getDefaultFormState(context, {
                  schema: { type: 'array', items: field },
                  formData: [NaN],
                  initialDefaultsGenerated,
                }),
              ).toStrictEqual([NaN]);
            }
            expect(getDefaultFormState(context, { schema: { ...field, default: 2 }, formData: NaN })).toBe(2);
          },
        );

        it("replaces a value the $ref'd constants of a property don't offer with its default, and keeps it for a key an object's allOf declares, whose own default skipDefaults skips", () => {
          const c: RJSFSchema = {
            type: 'string',
            anyOf: [{ $ref: '#/definitions/Red' }, { $ref: '#/definitions/Green' }],
            default: 'green',
          };
          const schema: RJSFSchema = {
            type: 'object',
            definitions: { Red: { const: 'red' }, Green: { const: 'green' } },
            properties: {
              own: { type: 'object', properties: { c } },
              wrapped: { type: 'object', allOf: [{ properties: { c } }] },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { own: { c: 'zz' }, wrapped: { c: 'zz' } } },
            ),
          ).toStrictEqual({ own: { c: 'green' }, wrapped: { c: 'zz' } });
        });

        it.each<[string, RJSFSchema]>([
          ['an enum beside options that are no constants', { enum: ['red', 'green'], anyOf: [{ maxLength: 9 }] }],
          ['object constants', { type: 'object', anyOf: [{ const: { k: 1 } }, { const: { k: 2 } }] }],
        ])(
          "replaces a value a property rejects with its default where it has %s, and drops object data or keeps any other value for a key only an object's allOf declares, whose own default skipDefaults skips",
          (name, options) => {
            const objectValued = name === 'object constants';
            const c: RJSFSchema = { ...options, default: objectValued ? { k: 1 } : 'green' };
            const value = objectValued ? { k: 9 } : 'zz';
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', properties: { c } },
                wrapped: { type: 'object', allOf: [{ properties: { c } }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { own: { c: value }, wrapped: { c: value } } },
              ),
            ).toStrictEqual({ own: { c: c.default }, wrapped: objectValued ? {} : { c: value } });
          },
        );

        it.each<[string, RJSFSchema, unknown]>([
          [
            'an enum of objects',
            {
              type: 'object',
              properties: { x: { type: 'number', default: 1 }, y: { type: 'string' } },
              enum: [
                { x: 1, y: 'p' },
                { x: 2, y: 'q' },
              ],
              default: { y: 'p' },
            },
            'z',
          ],
          ['an untyped enum of objects', { enum: [{ y: 'p' }, { y: 'q' }], default: { y: 'p' } }, 5],
          ['an enum of a string and an object', { enum: ['p', { y: 'p' }], default: 'p' }, 'z'],
          [
            'an enum of arrays',
            { type: 'array', items: { type: 'string' }, enum: [['p'], ['q']], default: ['p'] },
            ['z'],
          ],
        ])(
          "keeps a value of another type that a key an object's allOf declares with %s doesn't offer, as for its own property",
          (_, c, value) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', properties: { c } },
                wrapped: { type: 'object', allOf: [{ properties: { c } }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { own: { c: value }, wrapped: { c: value } } },
              ),
            ).toStrictEqual({ own: { c: value }, wrapped: { c: value } });
          },
        );

        it("gives an untyped field's allOf key the field's default under ancestorWins where its value is rejected, as for a typed one", () => {
          const c: RJSFSchema = { enum: ['a', 'b'], default: 'a' };
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              typed: { type: 'object', default: { c: 'b' }, allOf: [{ properties: { c } }] },
              untyped: { default: { c: 'b' }, allOf: [{ properties: { c } }] },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' } },
              { schema, formData: { typed: { c: 'z' }, untyped: { c: 'z' } } },
            ),
          ).toStrictEqual({ typed: { c: 'b' }, untyped: { c: 'b' } });
        });

        it.each<[string, RJSFSchema]>([
          ['options of other types', { anyOf: [{ type: 'string' }, { type: 'number' }] }],
          ['a type list that takes it whole', { type: ['string', 'object'] }],
        ])(
          "gives a nested value an untyped field's allOf rejects the field's object default where it has %s, as where it has none",
          (_, keywords) => {
            const allOf: RJSFSchema[] = [{ properties: { c: { enum: ['a', 'b'] } } }];
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                plain: { allOf, default: { c: 'a' } },
                w: { ...keywords, allOf, default: { c: 'a' } },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { plain: { c: 'z' }, w: { c: 'z' } } },
              ),
            ).toStrictEqual({ plain: { c: 'a' }, w: { c: 'a' } });
          },
        );

        it("gives a nested value an untyped field's allOf rejects the default its object gives it where it has options of other types, as where it has none", () => {
          const allOf: RJSFSchema[] = [{ properties: { c: { enum: ['a', 'b'] } } }];
          const schema: RJSFSchema = {
            type: 'object',
            default: { plain: { c: 'b' }, w: { c: 'b' } },
            properties: { plain: { allOf }, w: { anyOf: [{ type: 'string' }, { type: 'number' }], allOf } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { plain: { c: 'z' }, w: { c: 'z' } } },
            ),
          ).toStrictEqual({ plain: { c: 'b' }, w: { c: 'b' } });
        });

        it("keeps a value the $ref'd constants of an untyped field's allOf key don't offer, as for a typed one", () => {
          const c: RJSFSchema = {
            anyOf: [{ $ref: '#/definitions/Red' }, { $ref: '#/definitions/Green' }],
            default: 'green',
          };
          const schema: RJSFSchema = {
            type: 'object',
            definitions: { Red: { const: 'red' }, Green: { const: 'green' } },
            properties: {
              typed: { type: 'object', allOf: [{ properties: { c } }] },
              untyped: { allOf: [{ properties: { c } }] },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { typed: { c: 'zz' }, untyped: { c: 'zz' } } },
            ),
          ).toStrictEqual({ typed: { c: 'zz' }, untyped: { c: 'zz' } });
        });

        it.each<DefaultFormStateBehavior['emptyObjectFields']>(['skipDefaults', 'populateRequiredDefaults'])(
          "fills the null of a key an object's allOf declares inside the object's default for it under %s, as for its own property",
          (emptyObjectFields) => {
            const n: RJSFSchema = { type: 'object', properties: { z: { type: 'null' }, a: { type: 'number' } } };
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', default: { n: {} }, properties: { n } },
                wrapped: { type: 'object', default: { n: {} }, allOf: [{ properties: { n } }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
                { schema, formData: { own: {}, wrapped: {} } },
              ),
            ).toStrictEqual({ own: { n: { z: null } }, wrapped: { n: { z: null } } });
          },
        );

        it("gives a nullable key an object's allOf requires the object's default over its null, as its own property", () => {
          const c: RJSFSchema = { type: 'null' };
          const schema: RJSFSchema = {
            type: 'object',
            required: ['own', 'wrapped'],
            properties: {
              own: { type: 'object', default: { c: 'x' }, required: ['c'], properties: { c } },
              wrapped: { type: 'object', default: { c: 'x' }, allOf: [{ required: ['c'], properties: { c } }] },
            },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toStrictEqual({
            own: { c: 'x' },
            wrapped: { c: 'x' },
          });
        });

        it.each<[RJSFSchema, string]>([
          [{ const: 'q' }, 'q'],
          [{ type: 'string' }, 'r'],
        ])(
          "keeps a key an object's allOf declares that the data holds beside an object const that doesn't name it, as its own property %j",
          (c, expected) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', allOf: [{ const: { a: 1 } }], properties: { c } },
                wrapped: { type: 'object', allOf: [{ const: { a: 1 } }, { properties: { c } }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
                { schema, formData: { own: { c: 'r', a: 1 }, wrapped: { c: 'r', a: 1 } } },
              ),
            ).toStrictEqual({ own: { c: expected, a: 1 }, wrapped: { c: expected, a: 1 } });
          },
        );

        it("keeps the null fill of a key only an unmerged then declares that the object's default names", () => {
          const schema: RJSFSchema = {
            type: 'object',
            required: ['w'],
            properties: {
              w: {
                type: 'object',
                default: { c: 'x' },
                if: true,
                then: { required: ['c'], properties: { c: { type: 'null' } } },
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
              { schema, formData: {} },
            ),
          ).toStrictEqual({ w: { c: null } });
        });

        it.each([false, true])(
          'keeps the data of an object whose properties are null, beside an allOf or not, with constAsDefaults always %s',
          (always) => {
            const plain: RJSFSchema = { type: 'object' };
            const withAllOf: RJSFSchema = { type: 'object', allOf: [{ properties: { k: { type: 'string' } } }] };
            // Generated schemas can hold a `properties: null` no JSON Schema type allows
            Reflect.set(plain, 'properties', null);
            Reflect.set(withAllOf, 'properties', null);
            const context = {
              validator: testValidator,
              defaultFormStateBehavior: always ? { constAsDefaults: 'always' as const } : undefined,
            };
            expect(getDefaultFormState(context, { schema: plain, formData: { x: 1 } })).toStrictEqual({ x: 1 });
            expect(getDefaultFormState(context, { schema: withAllOf, formData: { x: 1 } })).toStrictEqual({ x: 1 });
          },
        );

        it.each<[string, RJSFSchema]>([
          [
            'typed, its options in an allOf',
            { type: 'object', allOf: [{ enum: [{ a: 1 }, { a: 2 }] }], default: { a: 1 } },
          ],
          ['untyped, its options in an allOf', { allOf: [{ enum: [{ a: 1 }, { a: 2 }] }], default: { a: 1 } }],
          ['its options its own', { type: 'object', enum: [{ a: 1 }, { a: 2 }], default: { a: 1 } }],
        ])("replaces object data a select over object constants doesn't offer with its default, %s", (_name, o) => {
          const schema: RJSFSchema = { type: 'object', properties: { o } };
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: { o: { a: 3 } } }),
          ).toStrictEqual({ o: { a: 1 } });
        });

        it.each<[string, RJSFSchema]>([
          ['through an allOf $ref', { allOf: [{ $ref: '#/definitions/E' }], default: { a: 1 } }],
          ['of its own', { type: 'object', enum: [{ a: 1 }, { b: 2 }], default: { a: 1 } }],
        ])(
          "gives a select over object constants its own default unblended with an ancestor's, its options %s",
          (_name, o) => {
            const schema: RJSFSchema = {
              type: 'object',
              default: { o: { b: 2 } },
              properties: { o },
              definitions: { E: { type: 'object', enum: [{ a: 1 }, { b: 2 }] } },
            };
            expect(getDefaultFormState({ validator: testValidator }, { schema })).toStrictEqual({ o: { a: 1 } });
          },
        );

        it("keeps the data's key order for a key only an object's allOf declares beside a key its allOf const names", () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              o: { type: 'object', allOf: [{ const: { a: 1 } }, { properties: { k: { type: 'string' } } }] },
            },
          };
          const defaults = getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
            { schema, formData: { o: { a: 1, k: 'v' } } },
          );
          expect(defaults).toStrictEqual({ o: { a: 1, k: 'v' } });
          expect(isObject(defaults) && isObject(defaults.o) ? Object.keys(defaults.o) : []).toStrictEqual(['a', 'k']);
        });

        it("fills a key an object's allOf declares beside an object const that doesn't name it, as its own property", () => {
          const b: RJSFSchema = { const: 'q' };
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              own: { type: 'object', allOf: [{ const: { a: 1 } }], properties: { b } },
              wrapped: { type: 'object', allOf: [{ const: { a: 1 } }, { properties: { b } }] },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { own: {}, wrapped: {} } },
            ),
          ).toStrictEqual({ own: { b: 'q', a: 1 }, wrapped: { b: 'q', a: 1 } });
        });

        it("fills a key an object's allOf declares with a boolean schema from the object's default, as its own", () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              own: { type: 'object', default: { t: 5 }, properties: { t: true } },
              wrapped: { type: 'object', default: { t: 5 }, allOf: [{ properties: { t: true } }] },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: { own: {}, wrapped: {} } }),
          ).toStrictEqual({ own: { t: 5 }, wrapped: { t: 5 } });
        });

        it("folds the object's default for a key its allOf declares through that property, without the defaults the allOf nests in it", () => {
          const o: RJSFSchema = { type: 'object', properties: { y: { type: 'string', default: 'Y' } } };
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              own: { type: 'object', default: { o: { x: 1 } }, properties: { o } },
              wrapped: { type: 'object', default: { o: { x: 1 } }, allOf: [{ properties: { o } }] },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: { own: {}, wrapped: {} } }),
          ).toStrictEqual({ own: { o: { y: 'Y' } }, wrapped: {} });
        });

        it.each<[string, GenericObjectType, DefaultFormStateBehavior, unknown, unknown]>([
          ['skipDefaults', {}, {}, 'q', 'p'],
          ['skipDefaults', { k: 'z' }, {}, 'q', 'p'],
          ['populateDefaults', {}, { allOf: 'populateDefaults' }, 'p', 'p'],
          ['ancestorWins', {}, { nestedDefaultsPrecedence: 'ancestorWins' }, 'q', 'q'],
        ])(
          "gives a key only an object's allOf declares the object's default over its own under %s, with %j",
          (_name, value, defaultFormStateBehavior, wrapped, own) => {
            const k: RJSFSchema = { enum: ['p', 'q'], default: 'p' };
            const o: RJSFSchema = { type: 'object', additionalProperties: true, default: { k: 'q' } };
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { ...o, properties: { k } },
                wrapped: { ...o, allOf: [{ properties: { k } }] },
                untyped: { default: { k: 'q' }, allOf: [{ properties: { k } }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, formData: { own: value, wrapped: value, untyped: value } },
              ),
            ).toStrictEqual({ own: { k: own }, wrapped: { k: wrapped }, untyped: { k: wrapped } });
          },
        );

        it.each<[string, GenericObjectType, DefaultFormStateBehavior]>([
          ['skipDefaults', { k: {} }, {}],
          ['populateDefaults', { k: { y: 'Y', n: [1] } }, { allOf: 'populateDefaults' }],
        ])(
          "gives a key only an object's allOf declares the defaults nested in that allOf under %s as %j",
          (_name, wrapped, defaultFormStateBehavior) => {
            const k: RJSFSchema = {
              type: 'object',
              properties: {
                y: { type: 'string', default: 'Y' },
                n: { type: 'array', minItems: 1, items: { default: 1 } },
              },
            };
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', properties: { k } },
                wrapped: { type: 'object', allOf: [{ properties: { k } }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, formData: { own: { k: {} }, wrapped: { k: {} } } },
              ),
            ).toStrictEqual({ own: { k: { y: 'Y', n: [1] } }, wrapped });
          },
        );

        it("leaves an array key only an object's allOf declares as the object's default gives it under skipDefaults, without padding it to its minItems, as below an untyped field's allOf", () => {
          const allOf: RJSFSchema[] = [
            { properties: { arr: { type: 'array', minItems: 2, items: { type: 'string', default: 'i' } } } },
          ];
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              typed: { type: 'object', default: { arr: [] }, allOf },
              untyped: { default: { arr: [] }, allOf },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: { typed: {}, untyped: {} } }),
          ).toStrictEqual({ typed: { arr: [] }, untyped: { arr: [] } });
        });

        it("leaves a required boolean of a key only an object's allOf declares unfilled under skipDefaults, typed or not, where the object's own property fills it", () => {
          const schema: RJSFSchema = {
            definitions: {
              Model: {
                type: 'object',
                properties: { a: { type: 'object', required: ['flag'], properties: { flag: { type: 'boolean' } } } },
              },
            },
            type: 'object',
            properties: {
              own: { $ref: '#/definitions/Model' },
              typed: { type: 'object', allOf: [{ $ref: '#/definitions/Model' }] },
              untyped: { allOf: [{ $ref: '#/definitions/Model' }] },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { own: { a: {} }, typed: { a: {} }, untyped: { a: {} } } },
            ),
          ).toStrictEqual({ own: { a: { flag: false } }, typed: { a: {} }, untyped: { a: {} } });
        });

        it.each<[string, DefaultFormStateBehavior, string]>([
          ['deepest-wins', {}, 'own'],
          ['ancestorWins', { nestedDefaultsPrecedence: 'ancestorWins' }, 'parent'],
        ])(
          'gives a nested value a field with options rejects its own default over the inherited one under %s, as a field without options',
          (_name, defaultFormStateBehavior, expected) => {
            const o: RJSFSchema = {
              default: { k: 'own' },
              allOf: [{ properties: { k: { enum: ['a', 'own', 'parent'] } } }],
            };
            const schema: RJSFSchema = {
              type: 'object',
              default: { plain: { k: 'parent' }, w: { k: 'parent' } },
              properties: { plain: o, w: { ...o, anyOf: [{ type: 'string' }, { type: 'number' }] } },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, formData: { plain: { k: 'z' }, w: { k: 'z' } } },
              ),
            ).toStrictEqual({ plain: { k: expected }, w: { k: expected } });
          },
        );

        it.each(['populateRequiredDefaults', 'skipDefaults'] as const)(
          'adds an optional property whose allOf holds a const as one with its own, under emptyObjectFields %s',
          (emptyObjectFields) => {
            const schema: RJSFSchema = {
              type: 'object',
              definitions: { K: { const: 'a' } },
              properties: {
                own: { type: 'string', const: 'a' },
                wrapped: { type: 'string', allOf: [{ const: 'a' }] },
                ref: { $ref: '#/definitions/K' },
                wrappedRef: { allOf: [{ $ref: '#/definitions/K' }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
                { schema, formData: {} },
              ),
            ).toStrictEqual({ own: 'a', wrapped: 'a', ref: 'a', wrappedRef: 'a' });
          },
        );

        it.each<[GenericObjectType, GenericObjectType]>([
          [{}, {}],
          [{ c: 'z' }, { c: 'z' }],
        ])(
          "reads a key the merge leaves out of an object's allOf beside additionalProperties false as an extra key, with %j",
          (value, expected) => {
            const w: RJSFSchema = {
              type: 'object',
              additionalProperties: false,
              default: { c: 'b' },
              allOf: [{ properties: { c: { type: 'string', enum: ['a', 'b'], default: 'a' } } }],
            };
            const schema: RJSFSchema = { type: 'object', properties: { w } };
            expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { w: value } })).toStrictEqual(
              { w: expected },
            );
          },
        );

        it.each<[string, RJSFSchema, RJSFSchema, string | null]>([
          [
            'keeps it beside its own null default, which skipDefaults skips',
            { enum: ['red', 'green', null], default: null },
            {},
            'purple',
          ],
          [
            "replaces it with the object's null default",
            { enum: ['red', 'green', null] },
            { default: { c: null } },
            null,
          ],
        ])("%s, for a value outside the enum of a key an object's allOf declares", (_name, c, field, expected) => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { color: { ...field, allOf: [{ type: 'object', properties: { c } }] } },
          };
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: { color: { c: 'purple' } } }),
          ).toStrictEqual({ color: { c: expected } });
        });

        it("fills a key an object's allOf declares that the data holds as undefined from the object's default under useDefaultIfFormDataUndefined, as its own property", () => {
          const c: RJSFSchema = { type: 'string' };
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              own: { type: 'object', default: { c: 'D' }, properties: { c } },
              wrapped: { type: 'object', default: { c: 'D' }, allOf: [{ properties: { c } }] },
            },
          };
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
              },
              { schema, formData: { own: { c: undefined }, wrapped: { c: undefined } } },
            ),
          ).toStrictEqual({ own: { c: 'D' }, wrapped: { c: 'D' } });
        });

        it("fills a key an object's allOf requires from the object's default under populateRequiredDefaults, as its own required property", () => {
          const properties: Record<string, RJSFSchema> = { c: { type: 'string' }, d: { type: 'string' } };
          const schema: RJSFSchema = {
            type: 'object',
            required: ['own', 'wrapped'],
            properties: {
              own: { type: 'object', default: { c: 'x', d: 'y' }, required: ['c'], properties },
              wrapped: { type: 'object', default: { c: 'x', d: 'y' }, allOf: [{ required: ['c'], properties }] },
            },
          };
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' },
              },
              { schema, formData: {} },
            ),
          ).toStrictEqual({ own: { c: 'x' }, wrapped: { c: 'x' } });
        });

        it.each<[RJSFSchema, unknown, boolean]>([
          [{ enum: ['a', 'b'] }, 'z', false],
          [{ enum: ['a', 'b'] }, 'z', true],
          [{ enum: ['a', 'b'], default: 'a' }, 'a', false],
          [{ enum: ['a', 'b'], default: 'a' }, 'a', true],
        ])(
          "keeps a value outside the enum of a key a nested object's allOf declares, as %j, where the object's own property takes %j, initialDefaultsGenerated %s",
          (c, expected, initialDefaultsGenerated) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                own: { type: 'object', properties: { c } },
                wrapped: { type: 'object', allOf: [{ properties: { c } }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                {
                  schema,
                  formData: { own: { c: 'z', d: 1 }, wrapped: { c: 'z', d: 1 } },
                  initialDefaultsGenerated,
                },
              ),
            ).toStrictEqual({ own: { c: expected, d: 1 }, wrapped: { c: 'z', d: 1 } });
          },
        );

        it.each<[string, RJSFSchema]>([
          ['without an allOf', {}],
          ['beside an unrelated allOf', { allOf: [{ title: 'x' }] }],
        ])('matches no key only an unmerged then declares %s, see #5816', (_name, beside) => {
          const o: RJSFSchema = {
            type: 'object',
            properties: { k: { type: 'string' } },
            if: { properties: { k: { const: 'x' } } },
            then: { properties: { c: { enum: ['red', 'green'] } } },
            ...beside,
          };
          const schema: RJSFSchema = { type: 'object', properties: { o } };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
              { schema, formData: { o: { k: 'x', c: 'blue' } } },
            ),
          ).toStrictEqual({ o: { k: 'x', c: 'blue' } });
        });

        it.each<[GenericObjectType, boolean, GenericObjectType]>([
          [{}, false, { a: 'x' }],
          [{ a: 'y' }, false, { a: 'y' }],
          [{ a: 'y' }, true, { a: 'y' }],
          [{ a: 'z' }, false, { a: 'x' }],
          [{ a: 'z' }, true, { a: 'x' }],
        ])(
          "reads a key an object's allOf declares by that property whether its value comes from the data %j or the default, initialDefaultsGenerated %s",
          (value, initialDefaultsGenerated, expected) => {
            const o: RJSFSchema = {
              type: 'object',
              additionalProperties: { type: 'number' },
              default: { a: 'x' },
              allOf: [{ properties: { a: { enum: ['x', 'y'] } } }],
            };
            const schema: RJSFSchema = { type: 'object', properties: { o } };
            expect(
              getDefaultFormState(
                { validator: testValidator },
                { schema, formData: { o: value }, initialDefaultsGenerated },
              ),
            ).toStrictEqual({ o: expected });
          },
        );

        it("keeps the data of a key an object's allOf declares beside null additionalProperties once the defaults are generated, as for its own property", () => {
          const n: RJSFSchema = { type: 'number' };
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              own: { type: 'object', additionalProperties: { type: 'null' }, properties: { n } },
              wrapped: { type: 'object', additionalProperties: { type: 'null' }, allOf: [{ properties: { n } }] },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { own: { n: 5 }, wrapped: { n: 5 } }, initialDefaultsGenerated: true },
            ),
          ).toStrictEqual({ own: { n: 5 }, wrapped: { n: 5 } });
        });

        it.each<[string, RJSFSchema]>([
          ['no if', { type: 'object' }],
          ['an if testing a const', { type: 'object', if: { const: {} }, then: {} }],
        ])('folds an untyped field whose allOf holds %s alike under constAsDefaults always', (_name, member) => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { f: { default: { d: 1 }, allOf: [member] } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { f: { a: 2 } } },
            ),
          ).toStrictEqual({ f: { d: 1, a: 2 } });
        });

        it.each<[string, RJSFSchema]>([
          ['no const', {}],
          ['a const', { const: { k: 'e' } }],
        ])(
          "folds an untyped field whose allOf's else, which the data doesn't take, holds %s alike under constAsDefaults always",
          (_name, otherwise) => {
            const schema: RJSFSchema = {
              type: 'object',
              properties: {
                f: { default: { d: 1 }, allOf: [{ type: 'object' }, { if: true, then: {}, else: otherwise }] },
              },
            };
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
                { schema, formData: { f: { a: 2 } } },
              ),
            ).toStrictEqual({ f: { d: 1, a: 2 } });
          },
        );

        it.each<[string, RJSFSchema, DefaultFormStateBehavior]>([
          ['its allOf', { type: 'number', allOf: [{ if: { minimum: 10 }, then: { const: 10 } }] }, {}],
          [
            'its allOf under skipEmptyDefaults',
            { type: 'number', allOf: [{ if: { minimum: 10 }, then: { const: 10 } }] },
            { emptyObjectFields: 'skipEmptyDefaults' },
          ],
          [
            'itself under skipEmptyDefaults',
            { type: 'number', if: { minimum: 10 }, then: { const: 10 } },
            { emptyObjectFields: 'skipEmptyDefaults' },
          ],
          [
            'itself under constAsDefaults always and skipEmptyDefaults',
            { type: 'number', if: { minimum: 0 }, then: { const: 10 }, else: { const: 10 } },
            { constAsDefaults: 'always', emptyObjectFields: 'skipEmptyDefaults' },
          ],
          [
            'the else of its allOf',
            { type: 'number', allOf: [{ if: { maximum: 10 }, then: {}, else: { const: 10 } }] },
            {},
          ],
        ])(
          'leaves an empty field the const of a then/else in %s, which no data takes, unfilled',
          (_name, n, defaultFormStateBehavior) => {
            const schema: RJSFSchema = { type: 'object', required: ['n'], properties: { n } };
            expect(
              getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
            ).toStrictEqual({});
          },
        );

        it('fills a field with the const of a then its data takes', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { n: { type: 'number', allOf: [{ if: { minimum: 10 }, then: { const: 10 } }] } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
              { schema, formData: { n: 12 } },
            ),
          ).toStrictEqual({ n: 10 });
        });
      });

      it("skips the constant default of a schema's anyOf under skipOneOf when it also has a oneOf", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            field: { type: 'string', anyOf: [{ const: 'a' }, { const: 'b' }], oneOf: [{ const: 'a' }] },
          },
          required: ['field'],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'skipOneOf' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({});
      });

      it("takes the constant default of a schema's anyOf under skipOneOf when the oneOf beside it is empty", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { field: { type: 'string', anyOf: [{ const: 'a' }, { const: 'b' }], oneOf: [] } },
          required: ['field'],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'skipOneOf' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ field: 'a' });
      });

      it('takes the constant default from the oneOf of a schema whose anyOf is empty', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { field: { anyOf: [], oneOf: [{ const: 'a' }] } },
          required: ['field'],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ field: 'a' });
      });

      it('takes the constant default from the anyOf of a schema that also has a oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            field: { anyOf: [{ const: 1 }, { const: 2 }], oneOf: [{ const: 'a' }] },
          },
          required: ['field'],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ field: 1 });
      });

      it.each<[string, RJSFSchema, GenericObjectType, GenericObjectType]>([
        [
          'at the root',
          { type: 'object', const: { a: 1 }, properties: { a: { type: 'number' } } },
          { a: 2, b: 5 },
          { a: 2 },
        ],
        [
          'inside an object',
          {
            type: 'object',
            properties: { o: { type: 'object', const: { a: 1 }, properties: { a: { type: 'number' } } } },
          },
          { o: { a: 2, b: 5 } },
          { o: { a: 2 } },
        ],
        [
          'at the root, where the object takes extra keys',
          {
            type: 'object',
            const: { a: 1 },
            additionalProperties: { type: 'number' },
            properties: { a: { type: 'number' } },
          },
          { a: 2, b: 5 },
          { a: 2 },
        ],
        [
          'inside an object that takes extra keys',
          {
            type: 'object',
            properties: {
              o: {
                type: 'object',
                const: { a: 1 },
                additionalProperties: { type: 'number' },
                properties: { a: { type: 'number' } },
              },
            },
          },
          { o: { a: 2, b: 5 } },
          { o: { a: 2 } },
        ],
        [
          'inside an object whose extra keys a pattern describes',
          {
            type: 'object',
            properties: {
              o: {
                type: 'object',
                const: { a: 1 },
                patternProperties: { '^b': { type: 'number' } },
                properties: { a: { type: 'number' } },
              },
            },
          },
          { o: { a: 2, b: 5 } },
          { o: { a: 2 } },
        ],
      ])('keeps only the data keys an object const names %s', (_name, schema, formData, expected) => {
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'always' } },
            { schema, formData },
          ),
        ).toEqual(expected);
      });

      describe('oneOf with const values', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            oneOfField: {
              title: 'One Of Field',
              type: 'string',
              oneOf: [
                {
                  const: 'username',
                  title: 'Username and password',
                },
                {
                  const: 'secret',
                  title: 'SSO',
                },
              ],
            },
          },
          required: ['oneOfField'],
        };

        describe('constAsDefaults is always', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'always',
          };
          const expected = {
            oneOfField: 'username',
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });
        });

        describe('constAsDefaults is skipOneOf', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'skipOneOf',
          };
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });
        });

        describe('constAsDefaults is never', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'never',
          };
          const expected = {};

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
              }),
            ).toEqual(expected);
          });

          test('getObjectDefaults', () => {
            expect(
              getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toEqual(expected);
          });
        });
      });

      describe('a oneOf or anyOf of scalar constants, as an enum', () => {
        const list = (keyword: 'oneOf' | 'anyOf'): RJSFSchema => ({
          [keyword]: [{ const: 'red' }, { const: 'green' }],
        });
        const cases: [string, RJSFSchema, DefaultFormStateBehavior][] = [
          ["the field's own oneOf", { type: 'string', ...list('oneOf') }, {}],
          ["the field's own anyOf", { type: 'string', ...list('anyOf') }, {}],
          ["a oneOf the field's allOf brings in, under skipDefaults", { allOf: [list('oneOf')] }, {}],
          [
            "a oneOf the field's allOf brings in, under populateDefaults",
            { allOf: [list('oneOf')] },
            { allOf: 'populateDefaults' },
          ],
          ["an anyOf the field's allOf brings in, under skipDefaults", { allOf: [list('anyOf')] }, {}],
        ];
        it.each(cases)("replaces a value outside %s with the field's default", (_name, field, behavior) => {
          const color: RJSFSchema = { ...field, default: 'red' };
          const context = { validator: testValidator, defaultFormStateBehavior: behavior };
          expect(getDefaultFormState(context, { schema: color, formData: 'blue' })).toBe('red');
          const schema: RJSFSchema = { type: 'object', properties: { color } };
          expect(getDefaultFormState(context, { schema, formData: { color: 'blue' } })).toStrictEqual({
            color: 'red',
          });
        });
        it.each(cases)('keeps a value outside %s where the field has no default', (_name, color, behavior) => {
          const context = { validator: testValidator, defaultFormStateBehavior: behavior };
          expect(getDefaultFormState(context, { schema: color, formData: 'blue' })).toBe('blue');
          const schema: RJSFSchema = { type: 'object', properties: { color } };
          expect(getDefaultFormState(context, { schema, formData: { color: 'blue' } })).toStrictEqual({
            color: 'blue',
          });
        });
        it.each(cases)('keeps a value %s offers', (_name, field, behavior) => {
          const color: RJSFSchema = { ...field, default: 'red' };
          const context = { validator: testValidator, defaultFormStateBehavior: behavior };
          expect(getDefaultFormState(context, { schema: color, formData: 'green' })).toBe('green');
          const schema: RJSFSchema = { type: 'object', properties: { color } };
          expect(getDefaultFormState(context, { schema, formData: { color: 'green' } })).toStrictEqual({
            color: 'green',
          });
        });
        it.each(
          cases.flatMap(([name, field, behavior]) =>
            [true, false].map((hasDefault) => [name, hasDefault, field, behavior] as const),
          ),
        )(
          'replaces a value outside %s with its ui:initialValue as an enum does, the field having a default: %s',
          (_name, hasDefault, field, behavior) => {
            const context = { validator: testValidator, defaultFormStateBehavior: behavior };
            const color: RJSFSchema = hasDefault ? { ...field, default: 'red' } : field;
            const enumColor: RJSFSchema = hasDefault
              ? { type: 'string', enum: ['red', 'green'], default: 'red' }
              : { type: 'string', enum: ['red', 'green'] };
            const uiSchema: UiSchema = { color: { 'ui:initialValue': 'green' } };
            for (const initialDefaultsGenerated of [false, true]) {
              const read = (property: RJSFSchema) =>
                getDefaultFormState(context, {
                  schema: { type: 'object', properties: { color: property } },
                  formData: { color: 'blue' },
                  uiSchema,
                  initialDefaultsGenerated,
                });
              expect(read(color)).toStrictEqual(read(enumColor));
            }
            expect(
              getDefaultFormState(context, {
                schema: color,
                formData: 'blue',
                uiSchema: { 'ui:initialValue': 'green' },
              }),
            ).toBe('green');
          },
        );
      });

      describe('an object with invalid formData const and constAsDefault set to always', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            stringField: {
              type: 'string',
              const: 'fromConst',
            },
          },
        };
        const rawFormData = {
          stringField: 'fromFormData',
        };
        const defaultFormStateBehavior: DefaultFormStateBehavior = {
          constAsDefaults: 'always',
        };
        const expected = {
          stringField: 'fromConst',
        };

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: rawFormData, rootSchema: schema },
            ),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
              rootSchema: schema,
              rawFormData,
            }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator, defaultFormStateBehavior }, schema, {
              rootSchema: schema,
              rawFormData,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
              rootSchema: schema,
              rawFormData,
            }),
          ).toEqual(expected);
        });
      });

      describe('an nested object with if/then condition', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            wrappingObject: {
              type: 'object',
              properties: {
                checkbox: {
                  type: 'boolean',
                },
              },
              if: {
                properties: {
                  checkbox: {
                    const: true,
                  },
                },
                required: ['checkbox'],
              },
              then: {
                properties: {
                  foo: {
                    type: 'string',
                    default: 'foo value',
                  },
                },
                required: ['foo'],
              },
            },
          },
        };
        const rawFormData = {
          wrappingObject: {
            checkbox: true,
          },
        };
        const expected = {
          wrappingObject: {
            checkbox: true,
            foo: 'foo value',
          },
        };
        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData: rawFormData, rootSchema: schema }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData: true,
            }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData: true,
            }),
          ).toEqual(expected);
        });

        test('getObjectDefaults', () => {
          expect(
            getObjectDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              rawFormData,
              shouldMergeDefaultsIntoFormData: true,
            }),
          ).toEqual(expected);
        });
      });
    });

    describe('selects over object or array constants', () => {
      it('keeps the value getDefaultBasedOnSchemaType() is handed for constants written as $refs', () => {
        const schema: RJSFSchema = {
          type: 'object',
          oneOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/b' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: { a: { const: { x: 1 } }, b: { const: { x: 2 } } },
          type: 'object',
          properties: { pick: schema },
        };
        expect(
          getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema, rawFormData: { x: 2 } }),
        ).toEqual({ x: 2 });
      });
      it('leaves a required enum select with no default unfilled, rather than an empty value no option allows', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['x', 'e'],
          properties: {
            x: { type: 'object', enum: [{ a: 1 }, { b: 2 }] },
            e: { type: 'array', enum: [[1], [2]] },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
      });
      it('defaults a required oneOf select to its first constant as a whole, as a primitive one is', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['s', 'o', 'e'],
          properties: {
            s: { type: 'string', oneOf: [{ const: 'a' }, { const: 'b' }] },
            o: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
            e: { type: 'array', anyOf: [{ const: [1] }, { const: [2] }] },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          s: 'a',
          o: { a: 1 },
          e: [1],
        });
      });
      it('defaults a select over object constants written as $refs as one written in place', () => {
        const pick: RJSFSchema = { type: 'object', oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] };
        const schema: RJSFSchema = {
          definitions: { A: { const: { k: 'a' }, title: 'A' }, B: { const: { k: 'b' }, title: 'B' } },
          type: 'object',
          properties: { pick },
        };
        const withDefault: RJSFSchema = { ...schema, properties: { pick: { ...pick, default: { k: 'b' } } } };
        const required: RJSFSchema = { ...schema, required: ['pick'] };
        expect(getDefaultFormState({ validator: testValidator }, { schema: withDefault })).toEqual({
          pick: { k: 'b' },
        });
        expect(getDefaultFormState({ validator: testValidator }, { schema: required })).toEqual({ pick: { k: 'a' } });
      });
      it('defaults a oneOf select to the constant matching its own default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { o: { type: 'object', default: { b: 2 }, oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          o: { b: 2 },
        });
      });
      it("defaults a oneOf select to the constant matching its own null default over its parent's (#5817)", () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { o: { a: 1 } },
          properties: { o: { default: null, oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }, { const: null }] } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({ o: null });
      });
      it('keeps its own default when constants are never defaults', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['o', 'p'],
          properties: {
            o: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
            p: { type: 'object', default: { b: 2 }, oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'never' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ p: { b: 2 } });
      });
      it.each<[string, RJSFSchema]>([
        ['a oneOf', { type: 'object', default: { a: 1 }, oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] }],
        ['an enum', { type: 'object', default: { a: 1 }, enum: [{ a: 1 }, { b: 2 }] }],
      ])('keeps the constant picked in %s select rather than blending its default into it', (_, choice) => {
        const schema: RJSFSchema = { type: 'object', properties: { choice } };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { choice: { b: 2 } }, rootSchema: schema },
          ),
        ).toEqual({ choice: { b: 2 } });
      });
      it('keeps the array picked in a select rather than padding it with its default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { choice: { type: 'array', default: [1, 2, 3], enum: [[1, 2, 3], [4]] } },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
                arrayMinItems: { mergeExtraDefaults: true },
              },
            },
            { schema, formData: { choice: [4] }, rootSchema: schema },
          ),
        ).toEqual({ choice: [4] });
      });
      it('leaves an object oneOf select unfilled under skipOneOf, as a primitive one is', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['s', 'o'],
          properties: {
            s: { type: 'string', oneOf: [{ const: 'x' }, { const: 'y' }] },
            o: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'skipOneOf' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('keeps a default the parent sets for an object select when constants are never defaults', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { s: 'y', o: { b: 2 } },
          properties: {
            s: { type: 'string', oneOf: [{ const: 'x' }, { const: 'y' }] },
            o: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'never' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ s: 'y', o: { b: 2 } });
      });
      it('fills the minimum items of an array of object selects as it does for primitive selects', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['arr', 'strs'],
          properties: {
            arr: { type: 'array', minItems: 1, items: { type: 'object', enum: [{ a: 1 }, { b: 2 }] } },
            strs: { type: 'array', minItems: 1, items: { type: 'string', enum: ['a', 'b'] } },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          arr: [undefined],
          strs: [undefined],
        });
      });
      it('defaults a typeless oneOf of object constants to its first constant, as a typed one is', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['p'],
          properties: { p: { oneOf: [{ const: { a: 1, b: 1 } }, { const: { a: 2 } }] } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          p: { a: 1, b: 1 },
        });
      });
      it('does not throw for an enum beside a oneOf of options that are not constants', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            choice: {
              type: 'object',
              enum: [{ a: 1 }, { b: 2 }],
              anyOf: [{ required: ['a'] }, { required: ['b'] }],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
      });
      it.each<[string, RJSFSchema]>([
        ['a typed', { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] }],
        ['a typeless', { oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] }],
      ])('applies ui:initialValue to %s object oneOf select', (_, choice) => {
        const schema: RJSFSchema = { type: 'object', required: ['choice'], properties: { choice } };
        const uiSchema: UiSchema = { choice: { 'ui:initialValue': { b: 2 } } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema })).toEqual({
          choice: { b: 2 },
        });
      });
      it('applies ui:emptyValue to an object oneOf select with nothing else to default to', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { choice: { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { b: 2 } }] } },
        };
        const uiSchema: UiSchema = { choice: { 'ui:emptyValue': { b: 2 } } };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { constAsDefaults: 'never' } },
            { schema, rootSchema: schema, uiSchema },
          ),
        ).toEqual({ choice: { b: 2 } });
      });
      it('picks the constant an ancestor default names over its own default when ancestors win', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { plan: { tier: 2 } },
          properties: {
            plan: { type: 'object', default: { tier: 1 }, oneOf: [{ const: { tier: 1 } }, { const: { tier: 2 } }] },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                nestedDefaultsPrecedence: 'ancestorWins',
              },
            },
            { schema, rootSchema: schema },
          ),
        ).toEqual({ plan: { tier: 2 } });
      });
      it('picks the constant an ancestor default names for an object oneOf select', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { plan: { tier: 2 } },
          properties: { plan: { type: 'object', oneOf: [{ const: { tier: 1 } }, { const: { tier: 2 } }] } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          plan: { tier: 2 },
        });
      });
      it.each<[string, DefaultFormStateBehavior | undefined, Record<string, unknown>]>([
        ['its own default', undefined, { tier: 1 }],
        ['the ancestor default when ancestors win', { nestedDefaultsPrecedence: 'ancestorWins' }, { color: 'red' }],
      ])('picks %s for an enum select over object constants rather than blending the two', (_, behavior, expected) => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { plan: { color: 'red' } },
          properties: {
            plan: { type: 'object', default: { tier: 1 }, enum: [{ tier: 1 }, { color: 'red' }] },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: behavior },
            { schema, rootSchema: schema },
          ),
        ).toEqual({
          plan: expected,
        });
      });
    });

    describe('array schemas', () => {
      test.each([false, 0, '', 'ab', {}, 5, true])(
        'fills minItems with the item default when the array default is %j',
        (value) => {
          const schema: RJSFSchema = {
            type: 'array',
            minItems: 2,
            default: value,
            items: { type: 'string', default: 'x' },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(['x', 'x']);
        },
      );

      describe('array with defaults with no formData', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 4,
          default: ['Raphael', 'Michaelangelo'],
          items: {
            type: 'string',
            default: 'Unknown',
          },
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected = ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType(
              { validator: testValidator },
              schema,
              { rootSchema: schema, includeUndefinedValues },
              ['Raphael', 'Michaelangelo'],
            ),
          ).toEqual(expected);
        });

        test('getArrayDefaults', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }, [
              'Raphael',
              'Michaelangelo',
            ]),
          ).toEqual(expected);
        });

        describe('with empty array as formData', () => {
          const rawFormData: unknown = [];
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: {
              mergeExtraDefaults: true,
              populate: 'all',
            },
          };

          test('getDefaultFormState', () => {
            expect(
              // NOTE: `rawFormData` is not used L1003
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema, includeUndefinedValues },
              ),
            ).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                rawFormData,
                includeUndefinedValues,
              }),
            ).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            expect(
              getDefaultBasedOnSchemaType(
                { validator: testValidator, defaultFormStateBehavior },
                schema,
                { rootSchema: schema, rawFormData, includeUndefinedValues },
                ['Raphael', 'Michaelangelo'],
              ),
            ).toEqual(expected);
          });

          test('getArrayDefaults', () => {
            expect(
              getArrayDefaults(
                { validator: testValidator, defaultFormStateBehavior },
                schema,
                { rootSchema: schema, rawFormData, includeUndefinedValues },
                ['Raphael', 'Michaelangelo'],
              ),
            ).toEqual(expected);
          });
        });
      });

      describe('array with no defaults', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 4,
          items: {
            type: 'string',
          },
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected: undefined[] = [undefined, undefined, undefined, undefined];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toEqual(expected);
        });

        test('getArrayDefaults', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });
      });

      describe('array const value populate as defaults', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 4,
          const: ['ConstFromRoot', 'ConstFromRoot'],
          items: {
            type: 'string',
            const: 'Constant',
          },
        };
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected = ['ConstFromRoot', 'ConstFromRoot', 'Constant', 'Constant'];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType(
              { validator: testValidator },
              schema,
              { rootSchema: schema, includeUndefinedValues },
              ['ConstFromRoot', 'ConstFromRoot'],
            ),
          ).toEqual(expected);
        });

        test('getArrayDefaults', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }, [
              'ConstFromRoot',
              'ConstFromRoot',
            ]),
          ).toEqual(expected);
        });
      });

      describe('array with nested dependent fixed-length array schema', () => {
        const schema: RJSFSchema = {
          items: [
            {
              dependencies: {
                checkbox: {
                  if: {
                    properties: {
                      checkbox: {
                        const: true,
                      },
                    },
                  },
                  then: {
                    properties: {
                      inner_array: {
                        items: [
                          {
                            title: 'Fixed Item',
                            type: 'string',
                          },
                        ],
                        title: 'Inner Fixed-Length Array',
                        type: 'array',
                      },
                    },
                  },
                },
              },
              properties: {
                checkbox: {
                  title: 'Dependency Checkbox',
                  type: 'boolean',
                },
              },
              title: 'Outer Item',
              type: 'object',
            },
          ],
          title: 'Outer Fixed Length Array',
          type: 'array',
        };
        const formData = [{ checkbox: true }];
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected = [
          {
            checkbox: true,
            inner_array: [undefined],
          },
        ];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData, includeUndefinedValues }),
          ).toEqual(readsTupleItems ? expected : formData);
        });

        test('computeDefaults', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, {
              rawFormData: formData,
              includeUndefinedValues,
              shouldMergeDefaultsIntoFormData: true,
            }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { includeUndefinedValues }, [
              {
                checkbox: true,
              },
            ]),
          ).toEqual(expected);
        });

        test('getArrayDefaults', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { includeUndefinedValues }, [
              {
                checkbox: true,
              },
            ]),
          ).toEqual(expected);
        });
      });

      describe('an invalid array schema', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: 'not a valid item value',
        } as RJSFSchema;
        const includeUndefinedValues = 'excludeObjectChildren';
        const expected: never[] = [];

        test('getDefaultFormState', () => {
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, includeUndefinedValues }),
          ).toEqual(expected);
        });

        test('computeDefaults, requiredAsRoot = true', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
              requiredAsRoot: true,
            }),
          ).toEqual(expected);
        });

        test('computeDefaults, requiredAsRoot = false', () => {
          expect(
            computeDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toBeUndefined();
        });

        test('getDefaultBasedOnSchemaType, requiredAsRoot = true', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
              requiredAsRoot: true,
            }),
          ).toEqual(expected);
        });

        test('getDefaultBasedOnSchemaType, requiredAsRoot = false', () => {
          expect(
            getDefaultBasedOnSchemaType({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
            }),
          ).toBeUndefined();
        });

        test('getArrayDefaults, requiredAsRoot = true', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, {
              rootSchema: schema,
              includeUndefinedValues,
              requiredAsRoot: true,
            }),
          ).toEqual(expected);
        });

        test('getArrayDefaults, requiredAsRoot = false', () => {
          expect(
            getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema, includeUndefinedValues }),
          ).toBeUndefined();
        });
      });

      describe('simple schema and no optional args', () => {
        const schema: RJSFSchema = { type: 'array' };
        const expected: never[] = [];

        test('getDefaultFormState', () => {
          expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual(expected);
        });

        test('computeDefaults, requiredAsRoot = true', () => {
          expect(computeDefaults({ validator: testValidator }, schema, { requiredAsRoot: true })).toEqual(expected);
        });

        test('computeDefaults, requiredAsRoot = false', () => {
          expect(computeDefaults({ validator: testValidator }, schema)).toBeUndefined();
        });

        test('getDefaultBasedOnSchemaType, requiredAsRoot = true', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { requiredAsRoot: true })).toEqual(
            expected,
          );
        });

        test('getDefaultBasedOnSchemaType, requiredAsRoot = false', () => {
          expect(getDefaultBasedOnSchemaType({ validator: testValidator }, schema)).toBeUndefined();
        });

        test('getArrayDefaults, requiredAsRoot = true', () => {
          expect(getArrayDefaults({ validator: testValidator }, schema, { requiredAsRoot: true })).toEqual(expected);
        });

        test('getArrayDefaults, requiredAsRoot = false', () => {
          expect(getArrayDefaults({ validator: testValidator }, schema)).toBeUndefined();
        });
      });

      describe('an array with const', () => {
        const schema: RJSFSchema = { type: 'array', const: ['foo', 'bar'] };

        describe('constAsDefaults is not never (default)', () => {
          const expected = ['foo', 'bar'];

          test('getDefaultFormState', () => {
            expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(expected);
          });

          test('computeDefaults', () => {
            expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(expected);
          });

          test('getDefaultBasedOnSchemaType', () => {
            // computeDefaults resolves the const value into `defaults` before calling getDefaultBasedOnSchemaType
            expect(
              getDefaultBasedOnSchemaType({ validator: testValidator }, schema, { rootSchema: schema }, expected),
            ).toEqual(expected);
          });

          test('getArrayDefaults', () => {
            // computeDefaults resolves the const value into `defaults` before calling getArrayDefaults
            expect(getArrayDefaults({ validator: testValidator }, schema, { rootSchema: schema }, expected)).toEqual(
              expected,
            );
          });
        });

        describe('constAsDefaults is never', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            constAsDefaults: 'never',
          };

          test('getDefaultFormState', () => {
            expect(
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior },
                { schema, rootSchema: schema },
              ),
            ).toEqual([]);
          });

          test('computeDefaults, requiredAsRoot = true', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                requiredAsRoot: true,
              }),
            ).toEqual([]);
          });

          test('computeDefaults, requiredAsRoot = false', () => {
            expect(
              computeDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toBeUndefined();
          });

          test('getArrayDefaults, requiredAsRoot = true', () => {
            expect(
              getArrayDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, {
                rootSchema: schema,
                requiredAsRoot: true,
              }),
            ).toEqual([]);
          });

          test('getArrayDefaults, requiredAsRoot = false', () => {
            expect(
              getArrayDefaults({ validator: testValidator, defaultFormStateBehavior }, schema, { rootSchema: schema }),
            ).toBeUndefined();
          });
        });
      });

      describe('optional array with arrayMinItems.populate = never', () => {
        test('optional array with arrayMinItems.populate = never, no form data', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              minItemsArray: {
                type: 'array',
                minItems: 1,
                items: {
                  type: 'string',
                },
              },
            },
          };
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: { populate: 'never' },
          };

          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({});
        });

        test('optional array with arrayMinItems.populate = never preserves short formData as-is', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              minItemsArray: {
                type: 'array',
                minItems: 2,
                items: { type: 'string' },
              },
            },
          };
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: { populate: 'never' },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { minItemsArray: ['foo'] } },
            ),
          ).toEqual({ minItemsArray: ['foo'] });
        });

        test('optional array with arrayMinItems.populate = never preserves formData that already meets minItems', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              minItemsArray: {
                type: 'array',
                minItems: 2,
                items: { type: 'string' },
              },
            },
          };
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: { populate: 'never' },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { minItemsArray: ['foo', 'bar'] } },
            ),
          ).toEqual({ minItemsArray: ['foo', 'bar'] });
        });

        test('required array with arrayMinItems.populate = never does not pad minItems with null (issue #5163)', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                minItems: 1,
                items: { type: 'string' },
              },
            },
            required: ['tags'],
          };
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            arrayMinItems: { populate: 'never' },
          };

          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
            tags: [],
          });
        });
      });
    });

    it('getInnerSchemaForArrayItem() item of type boolean returns empty schema', () => {
      expect(getInnerSchemaForArrayItem({ items: [true] }, AdditionalItemsHandling.Ignore, 0)).toEqual({});
    });
    describe('getInnerSchemaForArrayItem() of a prefixItems tuple', () => {
      const first: RJSFSchema = { type: 'string' };
      const rest: RJSFSchema = { type: 'number' };
      const schema: RJSFSchema = { type: 'array', prefixItems: [first], items: rest };
      it.each<[string, AdditionalItemsHandling, number, RJSFSchema]>([
        ['a position', AdditionalItemsHandling.Ignore, 0, first],
        ['an item past it, falling back to its items', AdditionalItemsHandling.Fallback, 1, rest],
        ['an item past it, ignoring its items', AdditionalItemsHandling.Ignore, 1, {}],
        ['the list items, which its items are not', AdditionalItemsHandling.Ignore, -1, {}],
        ['the items past it, inverted', AdditionalItemsHandling.Invert, -1, rest],
      ])('returns %s as a tuple items beside additionalItems does', (_, handling, idx, expected) => {
        expect(getInnerSchemaForArrayItem(schema, handling, idx)).toStrictEqual(expected);
      });
      it('returns its items for an item past an empty prefixItems', () => {
        const empty: RJSFSchema = { type: 'array', prefixItems: [], items: rest };
        expect(getInnerSchemaForArrayItem(empty, AdditionalItemsHandling.Fallback, 0)).toStrictEqual(rest);
      });
      it('returns the empty schema for a boolean position, rather than the items past the tuple', () => {
        const open: RJSFSchema = { type: 'array', prefixItems: [first, true], items: rest };
        expect(getInnerSchemaForArrayItem(open, AdditionalItemsHandling.Fallback, 1)).toStrictEqual({});
      });
    });
    describe('computeDefaultBasedOnSchemaTypeAndDefaults()', () => {
      let schema: RJSFSchema;
      describe('Object', () => {
        beforeAll(() => {
          schema = {
            type: 'object',
            default: null,
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeUndefined();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, {})).toEqual({});
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = { foo: 'bar' };
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Nullable Object', () => {
        beforeAll(() => {
          schema = {
            type: ['null', 'object'],
            default: null,
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeNull();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, {})).toBeNull();
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = { foo: 'bar' };
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Array', () => {
        beforeAll(() => {
          schema = {
            type: 'array',
            default: null,
            items: { type: 'string' },
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeUndefined();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, [])).toEqual([]);
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = ['bar'];
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Nullable Array', () => {
        beforeAll(() => {
          schema = {
            type: ['null', 'array'],
            default: null,
            items: { type: 'string' },
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeNull();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, [])).toBeNull();
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = ['bar'];
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Nullable String', () => {
        beforeAll(() => {
          schema = {
            type: 'string',
            default: null,
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeUndefined();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, '')).toEqual('');
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = 'bar';
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
      describe('Nullable String', () => {
        beforeAll(() => {
          schema = {
            type: ['null', 'string'],
            default: null,
          };
        });
        it('computedDefaults is undefined', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, undefined)).toBeNull();
        });
        it('computedDefaults is empty object', () => {
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, '')).toBeNull();
        });
        it('computedDefaults is non-empty object', () => {
          const computedDefault = 'bar';
          expect(computeDefaultBasedOnSchemaTypeAndDefaults(schema, computedDefault)).toEqual(computedDefault);
        });
      });
    });
    describe('getValidFormData', () => {
      let schema: RJSFSchema;
      it('Test schema with non valid formData for enum property', () => {
        schema = {
          type: 'string',
          enum: ['a', 'b', 'c'],
        };

        expect(ensureFormDataMatchingSchema({ validator: testValidator }, schema, schema, 'd')).toBeUndefined();
      });
      it('Test schema with valid formData for enum property', () => {
        expect(ensureFormDataMatchingSchema({ validator: testValidator }, schema, schema, 'b')).toEqual('b');
      });
      it('drops object data a schema of no object type holds, at the top and inside an object (#5522)', () => {
        const string: RJSFSchema = { type: 'string' };
        const holder: RJSFSchema = { type: 'object', properties: { s: string, t: { type: 'number' } } };
        expect(ensureFormDataMatchingSchema({ validator: testValidator }, string, string, { b: 2 })).toBeUndefined();
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, holder, holder, { s: { b: 2 }, t: 1 }),
        ).toEqual({ t: 1 });
      });
      it('drops object data an allOf below a property types as a string, with no defaults to fall back to', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { o: { allOf: [{ properties: { s: { type: 'string' } } }] } },
        };
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, schema, schema, { o: { s: { b: 2 }, t: 1 } }),
        ).toEqual({ o: { t: 1 } });
      });
      it('drops object data a property written as a $ref to a schema of no object type holds', () => {
        const rootSchema: RJSFSchema = {
          definitions: { S: { type: 'string' } },
          type: 'object',
          properties: { s: { $ref: '#/definitions/S' }, t: { type: 'number' } },
        };
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, rootSchema, rootSchema, { s: { b: 2 }, t: 1 }),
        ).toEqual({ t: 1 });
      });
      it('drops object data a property merged from several declarations of no object type holds, its allOf populated', () => {
        const rootSchema: RJSFSchema = {
          definitions: { S: { type: 'string' } },
          type: 'object',
          properties: { s: { minLength: 1 }, t: { type: 'number' } },
          allOf: [{ properties: { s: { $ref: '#/definitions/S' } } }],
        };
        const defaultFormStateBehavior: DefaultFormStateBehavior = { allOf: 'populateDefaults' };
        const context = { validator: testValidator, defaultFormStateBehavior };
        expect(ensureFormDataMatchingSchema(context, rootSchema, rootSchema, { s: { b: 2 }, t: 1 })).toEqual({ t: 1 });
        expect(ensureFormDataMatchingSchema(context, rootSchema, rootSchema, { s: 'x', t: 1 })).toEqual({
          s: 'x',
          t: 1,
        });
      });
      it('drops object data none of the constants a nested select reads through $refs is', () => {
        const rootSchema: RJSFSchema = {
          definitions: { A: { const: { a: 1 } }, B: { const: { a: 2 } } },
          type: 'object',
          properties: {
            o: {
              type: 'object',
              properties: { p: { type: 'object', oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] } },
            },
          },
        };
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, rootSchema, rootSchema, { o: { p: { a: 3 } } }),
        ).toEqual({ o: {} });
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, rootSchema, rootSchema, { o: { p: { a: 2 } } }),
        ).toEqual({ o: { p: { a: 2 } } });
      });
      it('keeps an option of constants written as $refs and drops a value none of them holds', () => {
        const color: RJSFSchema = {
          type: 'string',
          oneOf: [{ $ref: '#/definitions/red' }, { $ref: '#/definitions/blue' }],
        };
        const rootSchema: RJSFSchema = {
          definitions: { red: { const: 'red' }, blue: { const: 'blue' } },
          type: 'object',
          properties: { color },
        };
        expect(ensureFormDataMatchingSchema({ validator: testValidator }, color, rootSchema, 'blue')).toEqual('blue');
        expect(ensureFormDataMatchingSchema({ validator: testValidator }, color, rootSchema, 'green')).toBeUndefined();
      });
      it('drops a value none of the options of a property written as a $ref to an allOf holds', () => {
        const rootSchema: RJSFSchema = {
          definitions: { E: { allOf: [{ type: 'string', enum: ['a', 'b'] }] } },
          type: 'object',
          properties: {
            inPlace: { allOf: [{ type: 'string', enum: ['a', 'b'] }] },
            viaRef: { $ref: '#/definitions/E' },
            free: true,
          },
        };
        expect(
          ensureFormDataMatchingSchema({ validator: testValidator }, rootSchema, rootSchema, {
            inPlace: 'zzz',
            viaRef: 'zzz',
            free: 'zzz',
          }),
        ).toEqual({ inPlace: undefined, viaRef: undefined, free: 'zzz' });
      });
      it('Test schema with const property', () => {
        schema = {
          type: 'string',
          enum: ['a', 'b', 'c'],
          const: 'a',
        };

        expect(ensureFormDataMatchingSchema({ validator: testValidator }, schema, schema, 'a')).toEqual('a');
      });

      it('Test schema with valid formData with an enum and its default value', () => {
        schema = {
          type: 'string',
          enum: [
            { label: 'a', value: 'a' },
            { label: 'b', value: 'b' },
          ],
          default: { label: 'a', value: 'a' },
        };

        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { label: 'b', value: 'b' } }),
        ).toEqual({
          label: 'b',
          value: 'b',
        });
      });
    });
    describe('AJV $data reference in const property in schema should not be treated as default/const value', () => {
      let schema: RJSFSchema;
      it('test nested object with $data in the schema, optional array', () => {
        schema = {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              title: 'E-mail',
              format: 'email',
            },
            emailConfirm: {
              type: 'string',
              const: {
                $data: '/email',
              },
              title: 'Confirm e-mail',
              format: 'email',
            },
            nestedObject: {
              type: 'object',
              properties: {
                nestedEmail: {
                  type: 'string',
                  title: 'E-mail',
                  format: 'email',
                },
                nestedEmailConfirm: {
                  type: 'string',
                  title: 'Confirm e-mail',
                  const: {
                    $data: '/nestedObject/nestedEmail',
                  },
                  format: 'email',
                },
              },
            },
            nestedObjectConfirm: {
              type: 'object',
              properties: {
                nestedEmailConfirm: {
                  type: 'string',
                  title: 'Confirm e-mail',
                  const: {
                    $data: '/nestedObject/nestedEmail',
                  },
                  format: 'email',
                },
              },
            },
            arrayConfirm: {
              type: 'array',
              items: {
                type: 'string',
                title: 'Confirm e-mail',
                const: {
                  $data: '/nestedObject/nestedEmail',
                },
                format: 'email',
              },
            },
          },
        };
        expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({});
      });
      it('test nested object with $data in the schema, required array', () => {
        schema = {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              title: 'E-mail',
              format: 'email',
            },
            emailConfirm: {
              type: 'string',
              const: {
                $data: '/email',
              },
              title: 'Confirm e-mail',
              format: 'email',
            },
            nestedObject: {
              type: 'object',
              properties: {
                nestedEmail: {
                  type: 'string',
                  title: 'E-mail',
                  format: 'email',
                },
                nestedEmailConfirm: {
                  type: 'string',
                  title: 'Confirm e-mail',
                  const: {
                    $data: '/nestedObject/nestedEmail',
                  },
                  format: 'email',
                },
              },
            },
            nestedObjectConfirm: {
              type: 'object',
              properties: {
                nestedEmailConfirm: {
                  type: 'string',
                  title: 'Confirm e-mail',
                  const: {
                    $data: '/nestedObject/nestedEmail',
                  },
                  format: 'email',
                },
              },
            },
            arrayConfirm: {
              type: 'array',
              items: {
                type: 'string',
                title: 'Confirm e-mail',
                const: {
                  $data: '/nestedObject/nestedEmail',
                },
                format: 'email',
              },
            },
          },
          required: ['arrayConfirm'],
        };
        expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual({
          arrayConfirm: [],
        });
      });
      it('test nested object with $data in the schema and emptyObjectFields set to populateRequiredDefaults', () => {
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ arrayConfirm: [] });
      });
      it('test nested object with $data in the schema and emptyObjectFields set to skipEmptyDefaults', () => {
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('test nested object with $data in the schema and emptyObjectFields set to skipDefaults', () => {
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
    });
    describe('default form state behavior: ignore min items unless required', () => {
      it('should return empty data for an optional array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalArray: {
              type: 'array',
              minItems: 2,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('should return empty array when given an empty array as form data for an optional array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalArray: {
              type: 'array',
              minItems: 2,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema, rawFormData: { optionalArray: [] } },
          ),
        ).toEqual({ optionalArray: [] });
      });
      it('should return undefined filled array for a required array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
            },
          },
          required: ['requiredArray'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredArray: [undefined, undefined] });
      });
      it('should return defaults array for a required array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              default: ['default0', 'default1'],
            },
          },
          required: ['requiredArray'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredArray: ['default0', 'default1'] });
      });
      it('should not combine defaults with raw form data for a required array property with minItems', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string', default: 'default0' },
              minItems: 2,
            },
          },
          required: ['requiredArray'],
        };
        // merging defaults with formData does not happen in computeDefaults, regardless of parameters
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'requiredOnly' } } },
            schema,
            { rootSchema: schema, rawFormData: { requiredArray: ['raw0'] } },
          ),
        ).toEqual({ requiredArray: ['default0', 'default0'] });
      });
    });
    describe('default form state behaviour: allOf = "populateDefaults"', () => {
      it('should populate default values correctly', () => {
        const schema: RJSFSchema = {
          title: 'Example',
          type: 'object',
          properties: {
            animalInfo: {
              properties: {
                animal: {
                  type: 'string',
                  default: 'Cat',
                  enum: ['Cat', 'Fish'],
                },
              },
              allOf: [
                {
                  if: {
                    properties: {
                      animal: {
                        const: 'Cat',
                      },
                    },
                  },
                  then: {
                    properties: {
                      food: {
                        type: 'string',
                        default: 'meat',
                        enum: ['meat', 'grass', 'fish'],
                      },
                    },
                    required: ['food'],
                  },
                },
              ],
            },
          },
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ animalInfo: { animal: 'Cat', food: 'meat' } });
      });
      it('should populate the default of a `$ref` wrapped in a single-element `allOf`', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            animal: { title: 'Animal', allOf: [{ $ref: '#/definitions/Animal' }] },
          },
          required: ['animal'],
          definitions: {
            Animal: { type: 'string', enum: ['Cat', 'Dog', 'Bird'], default: 'Dog' },
          },
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ animal: 'Dog' });
      });
      it('should populate the defaults of a `$ref` to an object wrapped in a single-element `allOf`', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            pet: { allOf: [{ $ref: '#/definitions/Pet' }] },
          },
          definitions: {
            Pet: {
              type: 'object',
              properties: {
                name: { type: 'string', default: 'Rex' },
                legs: { type: 'integer', default: 4 },
              },
            },
          },
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ pet: { name: 'Rex', legs: 4 } });
      });
      it('should populate no default for a non-object `allOf` schema that merges to one with no default', () => {
        // A `contains` subschema inside `allOf` merges into the array schema rather than producing a
        // default, so the array property is correctly left out of the result.
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              items: { type: 'string' },
              allOf: [{ contains: { const: 'a' } }],
            },
          },
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
    });

    describe('default form state behaviour: allOf = "skipDefaults"', () => {
      it('should populate default values correctly', () => {
        const schema: RJSFSchema = {
          title: 'Example',
          type: 'object',
          properties: {
            animalInfo: {
              properties: {
                animal: {
                  type: 'string',
                  default: 'Cat',
                  enum: ['Cat', 'Fish'],
                },
              },
              allOf: [
                {
                  if: {
                    properties: {
                      animal: {
                        const: 'Cat',
                      },
                    },
                  },
                  then: {
                    properties: {
                      food: {
                        type: 'string',
                        default: 'meat',
                        enum: ['meat', 'grass', 'fish'],
                      },
                    },
                    required: ['food'],
                  },
                },
              ],
            },
          },
        };

        expect(
          computeDefaults({ validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } }, schema, {
            rootSchema: schema,
          }),
        ).toEqual({ animalInfo: { animal: 'Cat' } });
      });
      it('should not populate the default of a `$ref` wrapped in a single-element `allOf`', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            animal: { title: 'Animal', allOf: [{ $ref: '#/definitions/Animal' }] },
          },
          required: ['animal'],
          definitions: {
            Animal: { type: 'string', enum: ['Cat', 'Dog', 'Bird'], default: 'Dog' },
          },
        };

        expect(
          computeDefaults({ validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } }, schema, {
            rootSchema: schema,
          }),
        ).toEqual({});
      });
      it("skips the default of a nested field's own allOf but takes its const, where the root's own allOf keeps its default", () => {
        const defaultFormStateBehavior: DefaultFormStateBehavior = { allOf: 'skipDefaults' };
        const context = { validator: testValidator, defaultFormStateBehavior };
        const nestedDefault: RJSFSchema = {
          type: 'object',
          properties: { x: { type: 'number', allOf: [{ default: 3 }] } },
        };
        const nestedConst: RJSFSchema = {
          type: 'object',
          properties: { x: { type: 'number', allOf: [{ const: 3 }] } },
        };
        const rootDefault: RJSFSchema = {
          type: 'object',
          allOf: [{ properties: { x: { type: 'number', default: 3 } } }],
        };
        expect(getDefaultFormState(context, { schema: nestedDefault })).toStrictEqual({});
        expect(getDefaultFormState(context, { schema: nestedConst })).toStrictEqual({ x: 3 });
        expect(getDefaultFormState(context, { schema: rootDefault })).toStrictEqual({ x: 3 });
      });
      describe("takes a const in the option a nested field's allOf member offers (#5895)", () => {
        const C = { a: 1, b: 2 };
        const rootOf = (field: RJSFSchema): RJSFSchema => ({
          type: 'object',
          required: ['x'],
          properties: { x: { type: 'object', ...field } },
        });
        const skipping = { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' as const } };
        it.each<[string, RJSFSchema]>([
          ['a oneOf', { allOf: [{ oneOf: [{ const: C }] }] }],
          ['an anyOf', { allOf: [{ anyOf: [{ const: C }] }] }],
        ])('in %s', (_, field) => {
          expect(getDefaultFormState(skipping, { schema: rootOf(field) })).toStrictEqual({ x: C });
        });
        it('the option a primitive field shows being the one closest to its data', () => {
          const schema: RJSFSchema = {
            type: 'object',
            required: ['n'],
            properties: { n: { type: 'number', allOf: [{ oneOf: [{ const: 3 }, { const: 4 }] }] } },
          };
          expect(getDefaultFormState(skipping, { schema })).toStrictEqual({ n: 3 });
          expect(getDefaultFormState(skipping, { schema, formData: { n: 4 } })).toStrictEqual({ n: 4 });
        });
        it('but skips a default beside the const in the same option', () => {
          const schema = rootOf({
            allOf: [{ oneOf: [{ const: C, properties: { c: { type: 'number', default: 5 } } }] }],
          });
          expect(getDefaultFormState(skipping, { schema })).toStrictEqual({ x: C });
        });
        describe("the option a field's own default names, where it holds no data", () => {
          beforeEach(() => {
            // The mock validator cannot tell which option a value matches, so it answers each check as the real ones do
            testValidator.setReturnValues({ isValid: asRealValidator });
          });
          afterAll(() => {
            testValidator.reset?.();
          });
          it('of a primitive field', () => {
            const schema: RJSFSchema = {
              type: 'object',
              required: ['n'],
              properties: { n: { type: 'number', allOf: [{ oneOf: [{ const: 3 }, { const: 4 }] }], default: 4 } },
            };
            expect(getDefaultFormState(skipping, { schema })).toStrictEqual({ n: 4 });
          });
          it('of an object field', () => {
            const schema = rootOf({
              allOf: [{ oneOf: [{ const: { a: 1 } }, { const: { a: 2 } }] }],
              default: { a: 2 },
            });
            expect(getDefaultFormState(skipping, { schema })).toStrictEqual({ x: { a: 2 } });
          });
        });
        it('but keeps the data the field holds, which picks the option, as for a list the field offers itself', () => {
          const objects = rootOf({ allOf: [{ oneOf: [{ const: { k: 'a', v: 1 } }, { const: { k: 'b', v: 2 } }] }] });
          expect(getDefaultFormState(skipping, { schema: objects, formData: { x: { k: 'b', v: 2 } } })).toStrictEqual({
            x: { k: 'b', v: 2 },
          });
          const numbers: RJSFSchema = {
            type: 'object',
            required: ['n'],
            properties: { n: { type: 'number', allOf: [{ oneOf: [{ const: 1 }, { const: 2 }] }] } },
          };
          expect(getDefaultFormState(skipping, { schema: numbers, formData: { n: 7 } })).toStrictEqual({ n: 7 });
        });
        it("but takes the value an ancestor's const gives the field, which picks the option", () => {
          const schema: RJSFSchema = {
            type: 'object',
            const: { x: { k: 'b', v: 2 } },
            properties: {
              x: { type: 'object', allOf: [{ oneOf: [{ const: { k: 'a', v: 1 } }, { const: { k: 'b', v: 2 } }] }] },
            },
          };
          expect(getDefaultFormState(skipping, { schema })).toStrictEqual({ x: { k: 'b', v: 2 } });
        });
        it("but takes none of a oneOf option's under constAsDefaults: 'skipOneOf', as of the field's own oneOf", () => {
          const skipOneOf = {
            validator: testValidator,
            defaultFormStateBehavior: { constAsDefaults: 'skipOneOf' as const },
          };
          const nested = rootOf({ allOf: [{ oneOf: [{ const: C }] }] });
          const own = rootOf({ oneOf: [{ const: C }] });
          expect(getDefaultFormState(skipOneOf, { schema: nested })).toStrictEqual(
            getDefaultFormState(skipOneOf, { schema: own }),
          );
          expect(getDefaultFormState(skipOneOf, { schema: nested })).toStrictEqual({});
          expect(
            getDefaultFormState(skipOneOf, { schema: rootOf({ allOf: [{ anyOf: [{ const: C }] }] }) }),
          ).toStrictEqual({ x: C });
        });
        it('but takes none where the option the field shows holds none', () => {
          const schema = rootOf({
            allOf: [{ oneOf: [{ properties: { p: { type: 'string' } } }, { const: C }] }],
          });
          expect(getDefaultFormState(skipping, { schema })).toStrictEqual({ x: {} });
          expect(getDefaultFormState(skipping, { schema, formData: { x: { p: 'q' } } })).toStrictEqual({
            x: { p: 'q' },
          });
        });
        it("reads the const of an option written as an allOf, as allOf: 'populateDefaults' reads it", () => {
          const schema: RJSFSchema = {
            type: 'object',
            required: ['n'],
            properties: { n: { type: 'number', allOf: [{ oneOf: [{ allOf: [{ const: 3 }] }] }] } },
          };
          expect(getDefaultFormState(skipping, { schema })).toStrictEqual({ n: 3 });
        });
        it("takes none where a customMergeAllOf leaves the list out of the field's merge", () => {
          const schema = rootOf({ allOf: [{ oneOf: [{ const: C }] }] });
          const dropping = { ...skipping, customMergeAllOf: (): RJSFSchema => ({ type: 'object' }) };
          expect(getDefaultFormState(dropping, { schema })).toStrictEqual({ x: {} });
        });
        it("in an option's allOf, not the anyOf of the field's own that the option was chosen from", () => {
          const objects = rootOf({ anyOf: [{ title: 'A', allOf: [{ oneOf: [{ const: C }] }] }, { const: { a: 9 } }] });
          expect(getDefaultFormState(skipping, { schema: objects })).toStrictEqual({ x: C });
          const numbers: RJSFSchema = {
            type: 'object',
            required: ['n'],
            properties: {
              n: { type: 'number', anyOf: [{ title: 'A', allOf: [{ oneOf: [{ const: 3 }] }] }, { const: 9 }] },
            },
          };
          expect(getDefaultFormState(skipping, { schema: numbers })).toStrictEqual({ n: 3 });
          const only = (n: RJSFSchema): RJSFSchema => ({ type: 'object', required: ['n'], properties: { n } });
          expect(
            getDefaultFormState(skipping, {
              schema: only({ type: 'number', anyOf: [{ allOf: [{ oneOf: [{ const: 3 }] }] }] }),
            }),
          ).toStrictEqual({ n: 3 });
          expect(
            getDefaultFormState(skipping, { schema: rootOf({ anyOf: [{ allOf: [{ oneOf: [{ const: C }] }] }] }) }),
          ).toStrictEqual({ x: C });
        });
        it("in an option's allOf at the root, as in the same field as a property and under allOf: 'populateDefaults'", () => {
          const field: RJSFSchema = { type: 'number', anyOf: [{ allOf: [{ oneOf: [{ const: 3 }] }] }] };
          const populating = {
            validator: testValidator,
            defaultFormStateBehavior: { allOf: 'populateDefaults' as const },
          };
          const property: RJSFSchema = { type: 'object', properties: { n: field } };
          expect(getDefaultFormState(skipping, { schema: field })).toBe(3);
          expect(getDefaultFormState(skipping, { schema: property })).toStrictEqual({ n: 3 });
          expect(getDefaultFormState(populating, { schema: field })).toBe(3);
          expect(getDefaultFormState(populating, { schema: property })).toStrictEqual({ n: 3 });
        });
        describe('as the option of a list the field offers itself is picked', () => {
          beforeEach(() => {
            testValidator.setReturnValues({ isValid: asRealValidator });
          });
          afterAll(() => {
            testValidator.reset?.();
          });
          const ownAndNested = (list: RJSFSchema, field: (list: RJSFSchema) => RJSFSchema) => ({
            own: field(list),
            nested: field({ allOf: [list] }),
          });
          it('an ancestor null naming none of the object constants, as an enum takes it', () => {
            const { own, nested } = ownAndNested({ oneOf: [{ const: C }] }, (list) => ({
              ...rootOf(list),
              default: { x: null },
            }));
            const enumField: RJSFSchema = { ...rootOf({ enum: [C] }), default: { x: null } };
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual(
              getDefaultFormState(skipping, { schema: own }),
            );
            expect(getDefaultFormState(skipping, { schema: own })).toStrictEqual(
              getDefaultFormState(skipping, { schema: enumField }),
            );
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual({ x: null });
          });
          it.each<[string, Partial<DefaultFormStateBehavior>]>([
            ['descendantWins', {}],
            ['ancestorWins', { nestedDefaultsPrecedence: 'ancestorWins' }],
          ])('an ancestor default naming none of the object constants under %s, as an enum takes it', (_, behavior) => {
            const { own, nested } = ownAndNested({ oneOf: [{ const: C }] }, (list) => ({
              ...rootOf(list),
              default: { x: {} },
            }));
            const enumField: RJSFSchema = { ...rootOf({ enum: [C] }), default: { x: {} } };
            const context = {
              validator: testValidator,
              defaultFormStateBehavior: { allOf: 'skipDefaults' as const, ...behavior },
            };
            expect(getDefaultFormState(context, { schema: nested })).toStrictEqual(
              getDefaultFormState(context, { schema: own }),
            );
            expect(getDefaultFormState(context, { schema: own })).toStrictEqual(
              getDefaultFormState(context, { schema: enumField }),
            );
            expect(getDefaultFormState(context, { schema: nested })).toStrictEqual({ x: {} });
          });
          it('a parent default naming none of the constants, as an enum takes it', () => {
            const { own, nested } = ownAndNested({ oneOf: [{ const: 3 }, { const: 4 }] }, (list) => ({
              type: 'object',
              required: ['n'],
              default: { n: 7 },
              properties: { n: { type: 'number', ...list } },
            }));
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual(
              getDefaultFormState(skipping, { schema: own }),
            );
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual({ n: 7 });
          });
          describe.each<[string, DefaultFormStateBehavior['allOf']]>([
            ['skipDefaults', 'skipDefaults'],
            ['populateDefaults', 'populateDefaults'],
          ])('under allOf: %s', (_, allOf) => {
            const context = { validator: testValidator, defaultFormStateBehavior: { allOf } };
            it.each<[string, RJSFSchema]>([
              ['oneOf', { oneOf: [{ const: 3 }, { const: 4 }] }],
              ['anyOf', { anyOf: [{ const: 3 }, { const: 4 }] }],
            ])(
              'the const of a %s an ancestor default names, where the field has no default of its own, as an enum keeps it',
              (_keyword, list) => {
                const { own, nested } = ownAndNested(list, (field) => ({
                  type: 'object',
                  default: { n: 4 },
                  properties: { n: { type: 'number', ...field } },
                }));
                const enumField: RJSFSchema = {
                  type: 'object',
                  default: { n: 4 },
                  properties: { n: { type: 'number', allOf: [{ enum: [3, 4] }] } },
                };
                for (const [formData, initialDefaultsGenerated] of [
                  [undefined, false],
                  [{}, true],
                ] as const) {
                  const props = { formData, initialDefaultsGenerated };
                  expect(getDefaultFormState(context, { schema: nested, ...props })).toStrictEqual(
                    getDefaultFormState(context, { schema: own, ...props }),
                  );
                  expect(getDefaultFormState(context, { schema: own, ...props })).toStrictEqual(
                    getDefaultFormState(context, { schema: enumField, ...props }),
                  );
                  expect(getDefaultFormState(context, { schema: nested, ...props })).toStrictEqual({ n: 4 });
                }
              },
            );
            it.each<
              [string, (field: RJSFSchema, value: string | null) => RJSFSchema, (value: string | null) => unknown]
            >([
              ['its own at the root', (field, value) => ({ ...field, default: value }), (value) => value],
              [
                'its own as a property',
                (field, value) => ({ type: 'object', properties: { c: { ...field, default: value } } }),
                (value) => ({ c: value }),
              ],
              [
                'an ancestor at the root',
                (field, value) => ({ type: 'object', default: { c: value }, properties: { c: field } }),
                (value) => ({ c: value }),
              ],
              [
                'an ancestor as a property',
                (field, value) => ({
                  type: 'object',
                  properties: { o: { type: 'object', default: { c: value }, properties: { c: field } } },
                }),
                (value) => ({ o: { c: value } }),
              ],
            ])('a default of %s naming none of the constants, taken as an enum takes it', (_where, withDefault, at) => {
              const list = { oneOf: [{ const: 'red' }, { const: 'green' }] };
              const enumField: RJSFSchema = { type: 'string', enum: ['red', 'green'] };
              const own: RJSFSchema = { type: 'string', ...list };
              const nested: RJSFSchema = { type: 'string', allOf: [list] };
              for (const [value, data, expected] of [
                ['blue', undefined, 'blue'],
                ['blue', 'purple', 'blue'],
                ['green', undefined, 'green'],
                [null, undefined, null],
                [null, 'purple', null],
              ] as const) {
                const formData = data === undefined ? undefined : at(data);
                // The first pass, the second on the same data, and the second on what the first pass gave
                const defaultsOf = (field: RJSFSchema) => {
                  const schema = withDefault(field, value);
                  const first = getDefaultFormState(context, { schema, formData });
                  return [
                    first,
                    getDefaultFormState(context, { schema, formData, initialDefaultsGenerated: true }),
                    getDefaultFormState(context, { schema, formData: first, initialDefaultsGenerated: true }),
                  ];
                };
                expect(defaultsOf(own)).toStrictEqual(defaultsOf(enumField));
                expect(defaultsOf(nested)).toStrictEqual(defaultsOf(enumField));
                expect(defaultsOf(own)).toStrictEqual([at(expected), at(expected), at(expected)]);
              }
            });
            it.each<[string, RJSFSchema, unknown, unknown, DefaultFormStateBehavior]>([
              ['a NaN', { type: 'number', default: 5 }, NaN, 5, {}],
              [
                "a null under mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'",
                { type: 'string', default: 'blue' },
                null,
                'blue',
                { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
              ],
            ])(
              'a default naming none of the constants over data the defaults replace, %s, as an enum takes it',
              (_data, field, data, expected, behavior) => {
                const replacing = { validator: testValidator, defaultFormStateBehavior: { allOf, ...behavior } };
                const constants = field.type === 'number' ? [3, 4] : ['red', 'green'];
                const list = { oneOf: constants.map((value) => ({ const: value })) };
                const defaultsOf = (values: RJSFSchema) => {
                  const schema: RJSFSchema = { type: 'object', properties: { c: { ...field, ...values } } };
                  return [false, true].map((initialDefaultsGenerated) =>
                    getDefaultFormState(replacing, { schema, formData: { c: data }, initialDefaultsGenerated }),
                  );
                };
                const enumDefaults = defaultsOf({ enum: constants });
                expect(defaultsOf(list)).toStrictEqual(enumDefaults);
                expect(defaultsOf({ allOf: [list] })).toStrictEqual(enumDefaults);
                expect(enumDefaults).toStrictEqual([{ c: expected }, { c: expected }]);
              },
            );
            it.each<[string, Record<string, unknown> | undefined]>([
              ['no data', undefined],
              ['data naming none of the constants', { c: { k: 5 } }],
            ])(
              'an own default naming none of the object constants, beside an ancestor default, on both passes as an enum takes it, with %s',
              (_d, formData) => {
                const list = { oneOf: [{ const: { k: 1 } }, { const: { k: 2 } }] };
                const withDefaults = (field: RJSFSchema): RJSFSchema => ({
                  type: 'object',
                  default: { c: { k: 9 } },
                  properties: { c: { type: 'object', ...field, default: { k: 3 } } },
                });
                const defaultsOf = (field: RJSFSchema) => {
                  const schema = withDefaults(field);
                  const first = getDefaultFormState(context, { schema, formData });
                  const second = getDefaultFormState(context, {
                    schema,
                    formData: first,
                    initialDefaultsGenerated: true,
                  });
                  return [first, second];
                };
                const enumDefaults = defaultsOf({ enum: [{ k: 1 }, { k: 2 }] });
                expect(defaultsOf(list)).toStrictEqual(enumDefaults);
                expect(defaultsOf({ allOf: [list] })).toStrictEqual(enumDefaults);
                expect(enumDefaults).toStrictEqual([{ c: { k: 3 } }, { c: { k: 3 } }]);
              },
            );
            it.each<[string, UiSchema]>([
              ['no entries of their own', { n: { 'ui:initialValue': 4 } }],
              ['entries of their own', { n: { 'ui:initialValue': 4, oneOf: [{}, {}] } }],
            ])("the field's ui:initialValue, its options having %s, which a select renders none of", (_e, uiSchema) => {
              const { own, nested } = ownAndNested({ oneOf: [{ const: 3 }, { const: 4 }] }, (field) => ({
                type: 'object',
                properties: { n: { type: 'number', ...field } },
              }));
              expect(getDefaultFormState(context, { schema: nested, uiSchema })).toStrictEqual(
                getDefaultFormState(context, { schema: own, uiSchema }),
              );
              expect(getDefaultFormState(context, { schema: nested, uiSchema })).toStrictEqual({ n: 4 });
            });
          });
          it.each(['populateRequiredDefaults', 'skipDefaults'] as const)(
            "an optional key left out under emptyObjectFields: '%s'",
            (emptyObjectFields) => {
              const { own, nested } = ownAndNested({ oneOf: [{ const: 3 }] }, (list) => ({
                type: 'object',
                properties: { n: { type: 'number', ...list } },
              }));
              const context = {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults' as const, emptyObjectFields },
              };
              expect(getDefaultFormState(context, { schema: nested })).toStrictEqual(
                getDefaultFormState(context, { schema: own }),
              );
              expect(getDefaultFormState(context, { schema: nested })).toStrictEqual({});
            },
          );
          it('the option scored closest to no data, where the field has no default', () => {
            const { own, nested } = ownAndNested(
              {
                oneOf: [
                  { type: 'string', const: 'a' },
                  { type: 'null', const: null },
                ],
              },
              (list) => ({ type: 'object', required: ['n'], properties: { n: list } }),
            );
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual(
              getDefaultFormState(skipping, { schema: own }),
            );
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual({ n: null });
          });
          it("a key only an allOf declares picking by no default, since the fold skips the allOf's", () => {
            const { own, nested } = ownAndNested({ oneOf: [{ type: 'string' }, { const: 4 }] }, (list) => ({
              type: 'object',
              allOf: [{ properties: { n: { default: 4, ...list } } }],
            }));
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual(
              getDefaultFormState(skipping, { schema: own }),
            );
          });
          it("the object constant taken whole in an option's allOf, not the anyOf of the field's own it was chosen from", () => {
            const field = (option: RJSFSchema) =>
              rootOf({
                properties: { d: { type: 'number', default: 7 } },
                anyOf: [{ title: 'A', ...option }, { const: { a: 9 } }],
              });
            const own = field({ oneOf: [{ const: C }] });
            const nested = field({ allOf: [{ oneOf: [{ const: C }] }] });
            for (const formData of [undefined, { x: C }]) {
              expect(getDefaultFormState(skipping, { schema: nested, formData })).toStrictEqual(
                getDefaultFormState(skipping, { schema: own, formData }),
              );
              expect(getDefaultFormState(skipping, { schema: nested, formData })).toStrictEqual({ x: C });
            }
          });
          it('no const where the option shown is a boolean schema', () => {
            const { own, nested } = ownAndNested({ oneOf: [true, { const: 3 }] }, (list) => ({
              type: 'object',
              required: ['n'],
              properties: { n: { type: 'number', ...list } },
            }));
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual(
              getDefaultFormState(skipping, { schema: own }),
            );
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual({});
          });
          it("the const replacing the field's data under constAsDefaults: 'always'", () => {
            const always = {
              validator: testValidator,
              defaultFormStateBehavior: { allOf: 'skipDefaults' as const, constAsDefaults: 'always' as const },
            };
            const numbers = ownAndNested({ oneOf: [{ const: 3 }, { const: 4 }] }, (list) => ({
              type: 'object',
              required: ['n'],
              properties: { n: { type: 'number', ...list } },
            }));
            for (const [formData, expected] of [
              [{ n: 7 }, { n: 3 }],
              [{ n: 4 }, { n: 4 }],
              [{ n: null }, { n: 3 }],
            ]) {
              expect(getDefaultFormState(always, { schema: numbers.nested, formData })).toStrictEqual(
                getDefaultFormState(always, { schema: numbers.own, formData }),
              );
              expect(getDefaultFormState(always, { schema: numbers.nested, formData })).toStrictEqual(expected);
            }
            const objects = ownAndNested({ oneOf: [{ const: C }] }, rootOf);
            expect(getDefaultFormState(always, { schema: objects.nested, formData: { x: null } })).toStrictEqual(
              getDefaultFormState(always, { schema: objects.own, formData: { x: null } }),
            );
          });
          describe("a select over whole values under constAsDefaults: 'always'", () => {
            const always = {
              validator: testValidator,
              defaultFormStateBehavior: { allOf: 'skipDefaults' as const, constAsDefaults: 'always' as const },
            };
            const objects = ownAndNested({ oneOf: [{ const: { a: 1 } }, { const: { a: 2 } }] }, rootOf);
            it('keeping no constant for object data none of them is', () => {
              for (const formData of [{ x: { a: 5 } }, { x: {} }]) {
                // `toEqual`, since the nested field keeps its key as `undefined` where the field's own select drops
                // it, as it does under every setting
                expect(getDefaultFormState(always, { schema: objects.nested, formData })).toEqual(
                  getDefaultFormState(always, { schema: objects.own, formData }),
                );
              }
            });
            it('starting as its ui:initialValue', () => {
              const uiSchema = { x: { 'ui:initialValue': { a: 2 } } };
              expect(getDefaultFormState(always, { schema: objects.nested, uiSchema })).toStrictEqual(
                getDefaultFormState(always, { schema: objects.own, uiSchema }),
              );
              expect(getDefaultFormState(always, { schema: objects.nested, uiSchema })).toStrictEqual({ x: { a: 2 } });
            });
          });
          it.each<[string, unknown, Partial<DefaultFormStateBehavior>]>([
            ['a NaN', Number.NaN, {}],
            [
              "a null under mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'",
              null,
              { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
            ],
          ])('the const replacing %s the field holds, as the defaults do', (_, n, behavior) => {
            const { own, nested } = ownAndNested({ oneOf: [{ const: 3 }, { const: 4 }] }, (list) => ({
              type: 'object',
              required: ['n'],
              properties: { n: { type: 'number', ...list } },
            }));
            const context = {
              validator: testValidator,
              defaultFormStateBehavior: { allOf: 'skipDefaults' as const, ...behavior },
            };
            expect(getDefaultFormState(context, { schema: nested, formData: { n } })).toStrictEqual(
              getDefaultFormState(context, { schema: own, formData: { n } }),
            );
            expect(getDefaultFormState(context, { schema: nested, formData: { n } })).toStrictEqual({ n: 3 });
            // A select over whole values keeps the value as it holds it
            const objects = ownAndNested({ oneOf: [{ const: C }] }, rootOf);
            expect(getDefaultFormState(context, { schema: objects.nested, formData: { x: n } })).toStrictEqual(
              getDefaultFormState(context, { schema: objects.own, formData: { x: n } }),
            );
          });
          it('the const of a key the option declares, as of one the allOf declares itself, its default and required skipped', () => {
            const option: RJSFSchema = {
              properties: { a: { const: 1 }, b: { type: 'number', default: 2 } },
              required: ['b'],
            };
            const nested = rootOf({ allOf: [{ oneOf: [option] }] });
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual(
              getDefaultFormState(skipping, { schema: rootOf({ allOf: [option] }) }),
            );
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual({ x: { a: 1 } });
          });
          it.each<[string, RJSFSchema['type'], RJSFSchema, unknown]>([
            ['a oneOf of the option', 'number', { oneOf: [{ oneOf: [{ const: 3 }, { const: 4 }] }] }, 3],
            ["a oneOf in the option's allOf", 'number', { oneOf: [{ allOf: [{ oneOf: [{ const: 3 }] }] }] }, 3],
            [
              'a oneOf of the option over objects',
              'object',
              { oneOf: [{ oneOf: [{ properties: { q: { const: 'q' } } }] }] },
              { q: 'q' },
            ],
          ])('the const of the option shown from %s', (_, type, list, expected) => {
            const { own, nested } = ownAndNested(list, (field) => ({
              type: 'object',
              required: ['n'],
              properties: { n: { type, ...field } },
            }));
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual(
              getDefaultFormState(skipping, { schema: own }),
            );
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual({ n: expected });
          });
          it("the const of an anyOf an allOf offers beside the field's own oneOf", () => {
            const oneOf = [{ properties: { p: { const: 'p' } } }];
            const anyOf = [{ properties: { q: { const: 'q' } } }];
            const nested = rootOf({ oneOf, allOf: [{ anyOf }] });
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual(
              getDefaultFormState(skipping, { schema: rootOf({ oneOf, anyOf }) }),
            );
            expect(getDefaultFormState(skipping, { schema: nested })).toStrictEqual({ x: { p: 'p', q: 'q' } });
          });
          it("the const of each of two oneOfs the field's allOf merges, as allOf: 'populateDefaults' takes them", () => {
            const schema = rootOf({
              allOf: [
                { oneOf: [{ properties: { p: { const: 'p' } } }] },
                { oneOf: [{ properties: { q: { const: 'q' } } }] },
              ],
            });
            const populating = {
              validator: testValidator,
              defaultFormStateBehavior: { allOf: 'populateDefaults' as const },
            };
            expect(getDefaultFormState(skipping, { schema })).toStrictEqual(
              getDefaultFormState(populating, { schema }),
            );
            expect(getDefaultFormState(skipping, { schema })).toStrictEqual({ x: { p: 'p', q: 'q' } });
          });
          it.each<[string, UiSchema]>([
            ['no entry of its own', { x: { k: { 'ui:initialValue': 5 }, a: { 'ui:initialValue': 7 } } }],
            ['an entry of its own', { x: { k: { 'ui:initialValue': 5 }, a: { 'ui:initialValue': 7 }, oneOf: [{}] } }],
            [
              // `null`, which only untyped code can write, gives the option no uiSchema of its own
              'a null entry',
              {
                x: { k: { 'ui:initialValue': 5 }, a: { 'ui:initialValue': 7 }, oneOf: [null] as unknown as UiSchema[] },
              },
            ],
          ])(
            'the ui:initialValue of a key the field declares itself, beside the const of the option shown, with %s',
            (name, uiSchema) => {
              const { own, nested } = ownAndNested({ oneOf: [{ properties: { a: { const: 3 } } }] }, (list) =>
                rootOf({ properties: { k: { type: 'number' } }, ...list }),
              );
              // An option with an entry of its own renders the keys it declares with that entry, not the field's
              const a = name === 'no entry of its own' ? 7 : 3;
              expect(getDefaultFormState(skipping, { schema: nested, uiSchema })).toStrictEqual({ x: { k: 5, a } });
              expect(getDefaultFormState(skipping, { schema: own, uiSchema })).toStrictEqual({ x: { k: 5, a } });
            },
          );
          it('the ui:initialValue of a key named __proto__ the field declares itself, beside an option with an entry of its own', () => {
            const { own, nested } = ownAndNested({ oneOf: [{ properties: { a: { const: 3 } } }] }, (list) =>
              rootOf({ properties: JSON.parse('{ "__proto__": { "type": "number" } }'), ...list }),
            );
            const uiSchema: UiSchema = {
              x: { ...JSON.parse('{ "__proto__": { "ui:initialValue": 5 } }'), oneOf: [{}] },
            };
            const expected = { x: { ...JSON.parse('{ "__proto__": 5 }'), a: 3 } };
            expect(getDefaultFormState(skipping, { schema: nested, uiSchema })).toStrictEqual(expected);
            expect(getDefaultFormState(skipping, { schema: own, uiSchema })).toStrictEqual(expected);
          });
          describe.each<[string, DefaultFormStateBehavior | undefined]>([
            ['no defaultFormStateBehavior', undefined],
            ['allOf: skipDefaults', { allOf: 'skipDefaults' }],
            ['allOf: populateDefaults', { allOf: 'populateDefaults' }],
          ])('under %s', (_, defaultFormStateBehavior) => {
            it.each<[string, Record<string, unknown> | undefined]>([
              ['no data', undefined],
              ['an empty object', { x: {} }],
            ])('the null of a type: null key beside the option const, with %s', (__, formData) => {
              const { own, nested } = ownAndNested(
                { oneOf: [{ properties: { a: { const: 1 }, n: { type: 'null' } } }] },
                rootOf,
              );
              const context = { validator: testValidator, defaultFormStateBehavior };
              expect(getDefaultFormState(context, { schema: own, formData })).toStrictEqual({ x: { a: 1, n: null } });
              expect(getDefaultFormState(context, { schema: nested, formData })).toStrictEqual({
                x: { a: 1, n: null },
              });
            });
          });
          it("the null of a type: null key beside the option const under constAsDefaults: 'never', as without it", () => {
            const option: RJSFSchema = { properties: { a: { const: 1 }, n: { type: 'null' } } };
            const { own, nested } = ownAndNested({ oneOf: [option] }, rootOf);
            const context = {
              validator: testValidator,
              defaultFormStateBehavior: { allOf: 'skipDefaults' as const, constAsDefaults: 'never' as const },
            };
            expect(getDefaultFormState(context, { schema: rootOf({ allOf: [option] }) })).toStrictEqual({
              x: { n: null },
            });
            expect(getDefaultFormState(context, { schema: own })).toStrictEqual({ x: { n: null } });
            expect(getDefaultFormState(context, { schema: nested })).toStrictEqual({ x: { n: null } });
          });
          it.each<[string, RJSFSchema['properties']]>([
            ['a const', { z: { const: 9 } }],
            ['a const and a type: null', { z: { const: 9 }, n: { type: 'null' } }],
          ])(
            'no key of %s the option declares where the field forbids it, as an allOf declaring it gives none',
            (_k, properties) => {
              const closed = (field: RJSFSchema) =>
                rootOf({ additionalProperties: false, properties: { a: {} }, ...field });
              const option: RJSFSchema = { properties };
              const populating = {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'populateDefaults' as const },
              };
              expect(getDefaultFormState(skipping, { schema: closed({ allOf: [option] }) })).toStrictEqual({ x: {} });
              expect(
                getDefaultFormState(populating, { schema: closed({ allOf: [{ oneOf: [option] }] }) }),
              ).toStrictEqual({ x: {} });
              expect(getDefaultFormState(skipping, { schema: closed({ allOf: [{ oneOf: [option] }] }) })).toStrictEqual(
                {
                  x: {},
                },
              );
            },
          );
          describe.each<[string, DefaultFormStateBehavior]>([
            ['allOf: skipDefaults', { allOf: 'skipDefaults' }],
            ['allOf: populateDefaults', { allOf: 'populateDefaults' }],
          ])('under %s', (_b, behavior) => {
            const context = { validator: testValidator, defaultFormStateBehavior: behavior };
            const bothPasses = (schema: RJSFSchema, formData?: unknown) => {
              const first = getDefaultFormState(context, { schema, formData });
              return [first, getDefaultFormState(context, { schema, formData: first, initialDefaultsGenerated: true })];
            };
            it.each<[string, { a: number }]>([
              ['naming another constant', { a: 1 }],
              ['naming none of the constants', { a: 3 }],
            ])("the field's own object const over its default %s, as an enum takes it", (_d, fieldDefault) => {
              const field = (values: RJSFSchema): RJSFSchema =>
                rootOf({ const: { a: 2 }, default: fieldDefault, ...values });
              const list = { oneOf: [{ const: { a: 1 } }, { const: { a: 2 } }] };
              const enumDefaults = bothPasses(field({ enum: [{ a: 1 }, { a: 2 }] }));
              expect(bothPasses(field(list))).toStrictEqual(enumDefaults);
              expect(bothPasses(field({ allOf: [list] }))).toStrictEqual(enumDefaults);
              expect(enumDefaults).toStrictEqual([{ x: { a: 2 } }, { x: { a: 2 } }]);
            });
            it.each<[string, (field: RJSFSchema) => RJSFSchema, unknown, unknown]>([
              ['its own at the root', (field) => ({ ...field, default: 4 }), NaN, 4],
              [
                'its own as a property',
                (field) => ({ type: 'object', properties: { n: { ...field, default: 4 } } }),
                { n: NaN },
                { n: 4 },
              ],
              [
                'an ancestor as a property',
                (field) => ({ type: 'object', default: { n: 4 }, properties: { n: field } }),
                { n: NaN },
                { n: 4 },
              ],
            ])(
              'the constant a default of %s names over a NaN the defaults replace, as an enum takes it',
              (_where, withDefault, data, expected) => {
                const list = { oneOf: [{ const: 3 }, { const: 4 }] };
                const defaultsOf = (values: RJSFSchema) => bothPasses(withDefault({ type: 'number', ...values }), data);
                const enumDefaults = defaultsOf({ enum: [3, 4] });
                expect(defaultsOf(list)).toStrictEqual(enumDefaults);
                expect(defaultsOf({ allOf: [list] })).toStrictEqual(enumDefaults);
                expect(enumDefaults).toStrictEqual([expected, expected]);
              },
            );
          });
          it("the keys of an option before those of the option its allOf offers, as the field's own list and allOf: 'populateDefaults' order them", () => {
            const inner: RJSFSchema = {
              properties: { p: { const: 1 } },
              allOf: [{ oneOf: [{ properties: { q: { const: 2 } } }] }],
            };
            const { own, nested } = ownAndNested({ oneOf: [inner] }, rootOf);
            const populating = {
              validator: testValidator,
              defaultFormStateBehavior: { allOf: 'populateDefaults' as const },
            };
            const keysOf = (defaults: unknown) =>
              isObject(defaults) && isObject(defaults.x) ? Object.keys(defaults.x) : [];
            expect(keysOf(getDefaultFormState(skipping, { schema: nested }))).toStrictEqual(['p', 'q']);
            expect(keysOf(getDefaultFormState(skipping, { schema: own }))).toStrictEqual(['p', 'q']);
            expect(keysOf(getDefaultFormState(populating, { schema: nested }))).toStrictEqual(['p', 'q']);
          });
          describe.each<[string, DefaultFormStateBehavior]>([
            ['allOf: skipDefaults', { allOf: 'skipDefaults' }],
            ["constAsDefaults: 'never'", { allOf: 'skipDefaults', constAsDefaults: 'never' }],
          ])('under %s, the keys the field merged with the option as an allOf member keeps', (_b, behavior) => {
            const context = { validator: testValidator, defaultFormStateBehavior: behavior };
            const list: RJSFSchema = { oneOf: [{ properties: { z: { const: 9 } } }] };
            it('the null of a type: null key the field declares itself beside additionalProperties: false, as without the option', () => {
              const field = (allOf: RJSFSchema[]) =>
                rootOf({
                  additionalProperties: false,
                  properties: { a: {} },
                  allOf: [{ properties: { a: { type: 'null' } } }, ...allOf],
                });
              expect(getDefaultFormState(context, { schema: field([list]) })).toStrictEqual(
                getDefaultFormState(context, { schema: field([]) }),
              );
              expect(getDefaultFormState(context, { schema: field([list]) })).toStrictEqual({ x: { a: null } });
            });
            it('the keys beside unevaluatedProperties: false, which the option evaluates, as a direct allOf', () => {
              const declared: RJSFSchema = { properties: { q: { const: 4 }, m: { type: 'null' } } };
              const field = (allOf: RJSFSchema[]) =>
                rootOf({ unevaluatedProperties: false, allOf: [declared, ...allOf] });
              const expected =
                behavior.constAsDefaults === 'never' ? { x: { m: null } } : { x: { q: 4, z: 9, m: null } };
              expect(getDefaultFormState(context, { schema: field([list]) })).toStrictEqual(
                getDefaultFormState(context, { schema: field([{ properties: { z: { const: 9 } } }]) }),
              );
              expect(getDefaultFormState(context, { schema: field([list]) })).toStrictEqual(expected);
            });
            it('no key a merge with the additionalProperties schema drops, as a direct allOf', () => {
              const properties = { z: { const: 9 }, n: { type: 'null' as const } };
              const field = (member: RJSFSchema) =>
                rootOf({ additionalProperties: { type: 'string' }, allOf: [member] });
              expect(getDefaultFormState(context, { schema: field({ oneOf: [{ properties }] }) })).toStrictEqual(
                getDefaultFormState(context, { schema: field({ properties }) }),
              );
              expect(getDefaultFormState(context, { schema: field({ oneOf: [{ properties }] }) })).toStrictEqual({
                x: {},
              });
            });
          });
        });
      });
    });
    describe('default form state behavior: arrayMinItems.populate = "never"', () => {
      it('should not be filled if minItems defined and required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
          },
          required: ['requiredArray'],
        };

        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ requiredArray: [] });
      });
      it('should not be filled if minItems defined and non required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ nonRequiredArray: [] });
      });

      it('should be filled with default values if required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              default: ['raw0'],
              items: { type: 'string' },
              minItems: 1,
            },
          },
          required: ['requiredArray'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ requiredArray: ['raw0'] });
      });

      it('should be filled with default values if non required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              default: ['raw0'],
              items: { type: 'string' },
              minItems: 1,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ nonRequiredArray: ['raw0'] });
      });

      it('should be filled with default values partly and not fill others', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              default: ['raw0'],
              items: { type: 'string' },
              minItems: 2,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema, rawFormData: { nonRequiredArray: ['raw1'] } },
          ),
        ).toStrictEqual({ nonRequiredArray: ['raw1'] });
      });

      it('should not add items to formData', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema, rawFormData: { nonRequiredArray: ['not add'] } },
          ),
        ).toStrictEqual({ nonRequiredArray: ['not add'] });
      });

      it('should be empty array if minItems not defined and required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            requiredArray: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['requiredArray'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ requiredArray: [] });
      });
      it('should be empty array if minItems not defined and non required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ nonRequiredArray: [] });
      });

      it('injecting data should be stopped at the top level of tree', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              minItems: 2,
              items: {
                type: 'object',
                properties: {
                  nestedValue: { type: 'string' },
                  nestedArray: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            { rootSchema: schema },
          ),
        ).toStrictEqual({ nonRequiredArray: [] });
      });
      it('no injecting for childs', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            nonRequiredArray: {
              type: 'array',
              minItems: 2,
              items: {
                type: 'object',
                properties: {
                  nestedValue: { type: 'string' },
                  nestedArray: { type: 'array', minItems: 3, items: { type: 'string' } },
                },
              },
            },
          },
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            schema,
            {
              rootSchema: schema,
              rawFormData: {
                nonRequiredArray: [
                  {
                    nestedArray: ['raw0'],
                  },
                ],
              },
            },
          ),
        ).toStrictEqual({
          nonRequiredArray: [
            {
              nestedArray: ['raw0'],
            },
          ],
        });
      });
    });
    /**
     * emptyObjectFields options tests
     */
    describe('default form state behavior: emptyObjectFields = "populateRequiredDefaults"', () => {
      it('test an object with an optional property that has a nested required property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo' });
      });
      it('test an object with a nested required property in a ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            nestedRequired: {
              properties: {
                nested: {
                  type: 'string',
                  default: 'foo',
                },
              },
              required: ['nested'],
            },
          },
          properties: {
            nestedRequiredProperty: {
              $ref: '#/definitions/nestedRequired',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty', 'nestedRequiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo', nestedRequiredProperty: { nested: 'foo' } });
      });
      it('test an object with a nested optional property in a ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            nestedOptional: {
              properties: {
                nested: {
                  type: 'string',
                  default: 'foo',
                },
              },
            },
          },
          properties: {
            nestedOptionalProperty: {
              $ref: '#/definitions/nestedOptional',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty', 'nestedOptionalProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo', nestedOptionalProperty: {} });
      });
      it('test an object with an optional property that has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                  default: '',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo' });
      });
      it('test an object with a required property that has a nested optional property which has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            baseRequiredProperty: {
              type: 'object',
              properties: {
                optionalProperty: {
                  type: 'object',
                  properties: {
                    nestedRequiredProperty: {
                      type: 'string',
                      default: '',
                    },
                  },
                  required: ['nestedRequiredProperty'],
                },
                requiredProperty: {
                  type: 'string',
                  default: 'foo',
                },
              },
              required: ['requiredProperty'],
            },
            baseOptionalProperty: {
              type: 'string',
              default: 'baseOptionalProperty',
            },
          },
          required: ['baseRequiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({
          baseRequiredProperty: {
            requiredProperty: 'foo',
          },
        });
      });
      it('test an object with an optional property that has a nested required property and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: true },
          ),
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: 'foo',
        });
      });
      it("test an object with an optional property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNumberProperty: {
              type: 'number',
            },
            optionalObjectProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'populateRequiredDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: 'excludeObjectChildren' },
          ),
        ).toEqual({
          optionalNumberProperty: undefined,
          requiredProperty: 'foo',
        });
      });
    });
    describe('default form state behavior: emptyObjectFields = "skipDefaults"', () => {
      it('test an object with an optional property that has a nested required property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('test an object with an optional property that has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                  default: '',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({});
      });
      it('test an object with an optional property that has a nested required property and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: true },
          ),
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: 'foo',
        });
      });
      it("test an object with an optional property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNumberProperty: {
              type: 'number',
            },
            optionalObjectProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: 'excludeObjectChildren' },
          ),
        ).toEqual({
          optionalNumberProperty: undefined,
          requiredProperty: 'foo',
        });
      });
    });
    describe('default form state behavior: emptyObjectFields = "skipEmptyDefaults"', () => {
      it('test an object with an optional property that has a nested required property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo' });
      });
      it('test an object with a nested required property in a ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            nestedRequired: {
              properties: {
                nested: {
                  type: 'string',
                  default: 'foo',
                },
              },
              required: ['nested'],
            },
          },
          properties: {
            nestedRequiredProperty: {
              $ref: '#/definitions/nestedRequired',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty', 'nestedRequiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({ requiredProperty: 'foo', nestedRequiredProperty: { nested: 'foo' } });
      });
      it('test an object with a nested optional property in a ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            nestedOptional: {
              properties: {
                nested: {
                  type: 'string',
                  default: 'foo',
                },
              },
            },
          },
          properties: {
            nestedOptionalProperty: {
              $ref: '#/definitions/nestedOptional',
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty', 'nestedOptionalProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({
          nestedOptionalProperty: {
            nested: 'foo',
          },
          requiredProperty: 'foo',
        });
      });
      it('test an object with an optional property that has a nested required property with default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'string',
                  default: '',
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema },
          ),
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: '',
          },
          requiredProperty: 'foo',
        });
      });
      it('test an object with an optional property that has a nested required property and includeUndefinedValues', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: true },
          ),
        ).toEqual({
          optionalProperty: {
            nestedRequiredProperty: {
              undefinedProperty: undefined,
            },
          },
          requiredProperty: 'foo',
        });
      });
      it("test an object with an optional property that has a nested required property and includeUndefinedValues is 'excludeObjectChildren'", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            optionalNumberProperty: {
              type: 'number',
            },
            optionalObjectProperty: {
              type: 'object',
              properties: {
                nestedRequiredProperty: {
                  type: 'object',
                  properties: {
                    undefinedProperty: {
                      type: 'string',
                    },
                  },
                },
              },
              required: ['nestedRequiredProperty'],
            },
            requiredProperty: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['requiredProperty'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: 'excludeObjectChildren' },
          ),
        ).toEqual({
          optionalNumberProperty: undefined,
          requiredProperty: 'foo',
        });
      });
      it('test an optional array without default value, an optional array with a default value, and a required array', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              title: 'Multiple Select Input',
              items: {
                type: 'string',
                enum: ['option1', 'option2'],
              },
              uniqueItems: true,
            },
            arrayWithDefault: {
              type: 'array',
              title: 'Required multiple Select Input',
              items: {
                type: 'string',
                enum: ['option1', 'option2'],
              },
              uniqueItems: true,
              default: ['option1'],
            },
            arrayRequired: {
              type: 'array',
              title: 'Required multiple Select Input',
              items: {
                type: 'string',
                enum: ['option1', 'option2'],
              },
              uniqueItems: true,
            },
          },
          required: ['arrayRequired'],
        };
        expect(
          computeDefaults(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields: 'skipEmptyDefaults' } },
            schema,
            { rootSchema: schema, includeUndefinedValues: 'excludeObjectChildren' },
          ),
        ).toEqual({ arrayWithDefault: ['option1'] });
      });
    });

    describe('root default', () => {
      it('should map root schema default to form state, if any', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'string',
                default: 'foo',
              },
            },
          ),
        ).toEqual('foo');
      });
      it('should keep existing form data that is equal to 0', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'number',
                default: 1,
              },
              formData: 0,
            },
          ),
        ).toEqual(0);
      });
      it('should keep existing form data that is equal to false', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'boolean',
              },
              formData: false,
            },
          ),
        ).toEqual(false);
      });

      it.each([null, undefined, NaN])('should overwrite existing form data that is equal to a %s', (noneValue) => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'number',
                default: 1,
              },
              formData: noneValue,
            },
          ),
        ).toEqual(1);
      });
      it('should prefer a non-object const over an object default on a non-object schema', () => {
        const schema: RJSFSchema = { type: 'string', const: 'x', default: { a: 1 } };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual('x');
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: 'y' })).toEqual('y');
      });
      it.each<[string, RJSFSchema, GenericObjectType, (string | number)[]]>([
        ['a string const schema', { type: 'string', const: 'x', default: { a: 1 } }, { b: 2 }, ['0']],
        ['an array default', { type: 'array', default: [1, 2] }, { b: 2 }, ['0']],
        ['the tail of an array default', { type: 'array', default: [1, 2] }, { b: 2 }, ['1']],
        ['a string default inside allOf', { allOf: [{ type: 'string', default: 'x' }] }, { b: 2 }, ['0']],
        [
          'a nested string property default',
          { type: 'object', properties: { a: { type: 'string', default: 'x' } } },
          { a: { b: 2 } },
          ['a', '0'],
        ],
      ])('should not add index keys to object form data for %s', (_, schema, formData, indexKeyPath) => {
        const result = getDefaultFormState({ validator: testValidator }, { schema, formData });
        // Only an object holding the key is the bug; a string or array that satisfies the schema has index keys too.
        // An object holder must equal the form data it was given, so dropping that form data fails as well
        const holderPath = indexKeyPath.slice(0, -1);
        const holder = holderPath.reduce<unknown>((value, key) => (value as GenericObjectType)?.[key], result);
        const formDataHolder = holderPath.reduce<GenericObjectType>(
          (value, key) => value[key] as GenericObjectType,
          formData,
        );
        expect(isObject(holder) ? holder : formDataHolder).toEqual(formDataHolder);
      });
      it.each<[string, RJSFSchema, unknown]>([
        ['a string const', { type: 'string', const: 'x' }, 'x'],
        ['a string', { type: 'string' }, undefined],
        ['a string default', { type: 'string', default: 'ok' }, 'ok'],
        ['an array default', { type: 'array', default: [1, 2] }, [1, 2]],
        ['a number', { type: 'number' }, undefined],
        ['an integer', { type: 'integer' }, undefined],
        ['a boolean', { type: 'boolean' }, undefined],
        ['a null', { type: 'null' }, null],
        ['an untyped const', { const: 'x' }, 'x'],
        ['a type list of no object', { type: ['string', 'number'], default: 7 }, 7],
      ])('replaces object form data of %s schema, whose type takes no object (#5522)', (_, schema, expected) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { b: 2 } })).toEqual(expected);
      });
      it.each<[string, RJSFSchema]>([
        ['an object or null', { type: ['object', 'null'] }],
        ['a string or object', { type: ['string', 'object'] }],
        ['an untyped default', { default: 'foo' }],
        ['an untyped schema', {}],
        ['an anyOf naming no type of its own', { anyOf: [{ type: 'string' }, { type: 'number' }] }],
      ])('keeps object form data of a schema that allows %s (#5522)', (_, schema) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { b: 2 } })).toEqual({ b: 2 });
      });
      it.each<[string, object]>([
        ['a Date', new Date(0)],
        ['an object whose valueOf() gives an epoch, as a moment object does', { valueOf: () => 0 }],
      ])('keeps %s held by a string schema, which is no object form data (#5522)', (_, formData) => {
        const schema: RJSFSchema = { type: 'string', format: 'date-time' };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it.each<[string, RJSFSchema, GenericObjectType, GenericObjectType]>([
        [
          'a string property with a default',
          { type: 'object', properties: { s: { type: 'string', default: 'd' } } },
          { s: { z: 1 }, t: 1 },
          { s: 'd', t: 1 },
        ],
        [
          'a string property',
          { type: 'object', properties: { s: { type: 'string' } } },
          { s: { z: 1 }, t: 1 },
          { t: 1 },
        ],
        [
          'an array property',
          { type: 'object', properties: { s: { type: 'array', items: { type: 'number' }, default: [1, 2] } } },
          { s: { z: 1 } },
          { s: [1, 2] },
        ],
        [
          'a property two levels down',
          {
            type: 'object',
            properties: { a: { type: 'object', properties: { s: { type: 'string', default: 'd' } } } },
          },
          { a: { s: { z: 1 }, t: 1 } },
          { a: { s: 'd', t: 1 } },
        ],
        [
          'a $ref property',
          {
            type: 'object',
            definitions: { S: { type: 'string', default: 'r' } },
            properties: { s: { $ref: '#/definitions/S' } },
          },
          { s: { z: 1 } },
          { s: 'r' },
        ],
      ])('replaces object form data of %s, whose type takes no object (#5522)', (_, schema, formData, expected) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
      });
      it('replaces null-prototype object form data of a string property with its default, as plain object data (#5522)', () => {
        const schema: RJSFSchema = { type: 'object', properties: { s: { type: 'string', default: 'd' } } };
        const formData = { s: Object.assign(Object.create(null), { a: 1 }) };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual({ s: 'd' });
      });
      describe.each([false, true])('with initialDefaultsGenerated %s', (initialDefaultsGenerated) => {
        it.each<[string, RJSFSchema, GenericObjectType]>([
          ['additionalProperties', { type: 'object', additionalProperties: { type: 'string' } }, { extra: { a: 1 } }],
          [
            'additionalProperties with a default',
            { type: 'object', additionalProperties: { type: 'string', default: 'a' } },
            { k: { q: 1 } },
          ],
          ['patternProperties', { type: 'object', patternProperties: { '^x': { type: 'string' } } }, { xa: { a: 1 } }],
          [
            'patternProperties with a default',
            { type: 'object', patternProperties: { '^x': { type: 'string', default: 'a' } } },
            { xa: { q: 1 } },
          ],
        ])('keeps object data under a root %s of no object type, as it does one level down', (_, schema, formData) => {
          const holder: RJSFSchema = { type: 'object', properties: { o: schema } };
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, formData, initialDefaultsGenerated }),
          ).toEqual(formData);
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema: holder, formData: { o: formData }, initialDefaultsGenerated },
            ),
          ).toEqual({
            o: formData,
          });
        });
      });
      it('keeps the nested objects the user cleared under an untyped field with an object default, once defaults are generated', () => {
        const field: RJSFSchema = { default: { a: 1, b: { c: 2 } } };
        const schema: RJSFSchema = { type: 'object', properties: { p: field } };
        const formData = { a: 1, b: {} };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema: field, formData, initialDefaultsGenerated: true },
          ),
        ).toEqual(formData);
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { p: formData }, initialDefaultsGenerated: true },
          ),
        ).toEqual({ p: formData });
      });
      it.each<[string, GenericObjectType | null]>([
        ['an empty object', {}],
        ['an object with a key', { a: 'x' }],
      ])('keeps %s the data holds for a nullable object field defaulting to null', (_, value) => {
        const field: RJSFSchema = { type: ['null', 'object'], default: null, properties: { a: { type: 'string' } } };
        const schema: RJSFSchema = { type: 'object', properties: { o: field } };
        for (const initialDefaultsGenerated of [false, true]) {
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { o: value }, initialDefaultsGenerated },
            ),
          ).toEqual({ o: value });
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema: field, formData: value, initialDefaultsGenerated },
            ),
          ).toEqual(value);
        }
      });
      it.each<[string, RJSFSchema, DefaultFormStateBehavior]>([
        [
          'with no default, under useDefaultIfFormDataUndefined',
          { type: 'string' },
          { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
        ],
        [
          'with a default, under useDefaultIfFormDataUndefined and skipDefaults',
          { type: 'string', default: 'd' },
          { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined', emptyObjectFields: 'skipDefaults' },
        ],
      ])('keeps a declared key the data holds as undefined, %s', (_, property, defaultFormStateBehavior) => {
        const schema: RJSFSchema = { type: 'object', properties: { s: property } };
        const result = getDefaultFormState(
          { validator: testValidator, defaultFormStateBehavior },
          { schema, formData: { s: undefined } },
        );
        expect(isObject(result) && Object.hasOwn(result, 's')).toBe(true);
        expect(result).toEqual({ s: undefined });
      });
      it.each<[string, RJSFSchema, GenericObjectType, string]>([
        ['an extra key', { type: 'object', properties: { o: { type: 'object' } } }, { extra: { a: 1 } }, 'extra'],
        [
          'a select over object constants',
          { type: 'object', properties: { p: { oneOf: [{ const: { a: 1 } }, { const: { a: 2 } }] } } },
          { p: { a: 2 } },
          'p',
        ],
      ])('returns no object of the form data it keeps, for %s', (_, schema, formData, key) => {
        const result = getDefaultFormState({ validator: testValidator }, { schema, formData });
        expect(result).toEqual(formData);
        expect(isObject(result) && Reflect.get(result, key)).not.toBe(formData[key]);
      });
      it.each<[string, RJSFSchema, GenericObjectType, GenericObjectType]>([
        [
          'inside an object',
          {
            type: 'object',
            properties: { x: { type: 'object', enum: [{ a: 1 }, { a: 2 }], default: { a: 1 } } },
          },
          { x: { a: 3, c: 1 } },
          { x: { a: 1 } },
        ],
        ['at the root', { type: 'object', enum: [{ a: 1 }, { a: 2 }], default: { a: 1 } }, { a: 3 }, { a: 1 }],
        [
          'typed as a string, at the root',
          { type: 'string', enum: [{ l: 'a' }, { l: 'b' }], default: { l: 'a' } },
          { l: 'z' },
          { l: 'a' },
        ],
      ])(
        'replaces object form data that none of the constants of a select over objects is, %s (#5522)',
        (_, schema, formData, expected) => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
        },
      );
      it.each<[string, RJSFSchema]>([
        ['an object enum', { type: 'object', enum: [{ a: 1 }, { a: 2 }] }],
        ['object constants', { type: 'object', oneOf: [{ const: { a: 1 } }, { const: { a: 2 } }] }],
        ['a string enum of objects', { type: 'string', enum: [{ a: 1 }, { a: 2 }] }],
      ])(
        'leaves out object form data that none of the constants of a nested select with no default is, over %s (#5522)',
        (_, select) => {
          const schema: RJSFSchema = { type: 'object', properties: { p: select } };
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { p: { a: 3 } } })).toEqual({});
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { p: { a: 3 } }, initialDefaultsGenerated: true },
            ),
          ).toEqual({});
        },
      );
      it('should not spread a primitive form data value into an object default', () => {
        const schema: RJSFSchema = { type: 'string', enum: ['a', 'b'], default: { a: 1 } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: 'zz' })).toEqual({ a: 1 });
      });
      it.each([
        ['number', 5],
        ['boolean', true],
      ] as const)('should keep %s form data on a schema with an object default', (type, value) => {
        expect(
          getDefaultFormState({ validator: testValidator }, { schema: { type, default: { a: 1 } }, formData: value }),
        ).toEqual(value);
      });
      it('should keep array form data on a root array schema with an object default', () => {
        const schema: RJSFSchema = { type: 'array', default: {}, items: { type: 'string' } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: ['q'] })).toEqual(['q']);
      });
      it('should prefer an array const over an object default', () => {
        expect(
          getDefaultFormState({ validator: testValidator }, { schema: { const: [1, 2], default: { a: 1 } } }),
        ).toEqual([1, 2]);
      });
      it('should compute array defaults for an array schema with dependencies', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: { type: 'string', default: 'x' },
          minItems: 2,
          dependencies: { a: ['b'] },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual(['x', 'x']);
      });
      it('should compute the item defaults of an array schema with dependencies only once', () => {
        // Each computation of the item's defaults validates its `oneOf` dependency once
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: { a: { type: 'string', default: 'x' } },
            dependencies: { a: { oneOf: [{ properties: { a: { const: 'x' } } }] } },
          },
          minItems: 1,
          dependencies: { b: ['c'] },
        };
        const { validator, isValid } = withIsValidSpy();
        computeDefaults({ validator }, schema, { rootSchema: schema });
        expect(isValid).toHaveBeenCalledTimes(1);
      });
      it('should resolve dependencies against the inherited default of a whole-value select with an array type', () => {
        const schema: RJSFSchema = {
          type: ['array', 'object'],
          enum: [{ a: 1 }, { a: 2 }],
          dependencies: { a: { oneOf: [{ properties: { a: { const: 1 } } }] } },
        };
        const { validator, isValid } = withIsValidSpy();
        computeDefaults({ validator }, schema, { rootSchema: schema, parentDefaults: { a: 1 } });
        expect(isValid).toHaveBeenCalled();
      });
    });
    describe('nested default', () => {
      it('should map schema object prop default to form state', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
                properties: {
                  string: {
                    type: 'string',
                    default: 'foo',
                  },
                },
              },
            },
          ),
        ).toEqual({ string: 'foo' });
      });
      it('should default to empty object if no properties are defined', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
              },
            },
          ),
        ).toEqual({});
      });
      it('should recursively map schema object default to form state', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
                properties: {
                  object: {
                    type: 'object',
                    properties: {
                      string: {
                        type: 'string',
                        default: 'foo',
                      },
                    },
                  },
                },
              },
            },
          ),
        ).toEqual({ object: { string: 'foo' } });
      });
      it('should map schema array default to form state', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
                properties: {
                  array: {
                    type: 'array',
                    default: ['foo', 'bar'],
                    items: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          ),
        ).toEqual({ array: ['foo', 'bar'] });
      });
      it('should recursively map schema array default to form state', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema: {
                type: 'object',
                properties: {
                  object: {
                    type: 'object',
                    properties: {
                      array: {
                        type: 'array',
                        default: ['foo', 'bar'],
                        items: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          ),
        ).toEqual({ object: { array: ['foo', 'bar'] } });
      });
      it('should propagate nested defaults to resulting formData by default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            object: {
              type: 'object',
              properties: {
                array: {
                  type: 'array',
                  default: ['foo', 'bar'],
                  items: {
                    type: 'string',
                  },
                },
                bool: {
                  type: 'boolean',
                  default: true,
                },
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          object: { array: ['foo', 'bar'], bool: true },
        });
      });
      it('should keep parent defaults if they don`t have a node level default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'object',
              default: {
                level2: {
                  leaf1: 1,
                  leaf2: 1,
                  leaf3: 1,
                  leaf4: 1,
                },
              },
              properties: {
                level2: {
                  type: 'object',
                  default: {
                    // No level2 default for leaf1
                    leaf2: 2,
                    leaf3: 2,
                  },
                  properties: {
                    leaf1: { type: 'number' }, // No level2 default for leaf1
                    leaf2: { type: 'number' }, // No level3 default for leaf2
                    leaf3: { type: 'number', default: 3 },
                    leaf4: { type: 'number' }, // Defined in formData.
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema,
              formData: {
                level1: { level2: { leaf4: 4 } },
              },
            },
          ),
        ).toEqual({
          level1: {
            level2: { leaf1: 1, leaf2: 2, leaf3: 3, leaf4: 4 },
          },
        });
      });
      it('should support nested values in formData', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'object',
              properties: {
                level2: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        leaf1: {
                          type: 'string',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        const formData = {
          level1: {
            level2: {
              leaf1: 'a',
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual({
          level1: { level2: { leaf1: 'a' } },
        });
      });
      it('should use parent defaults for ArrayFields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'array',
              default: [1, 2, 3],
              items: { type: 'number' },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: [1, 2, 3],
        });
      });
      it('should use parent defaults for ArrayFields if declared in parent', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { level1: [1, 2, 3] },
          properties: {
            level1: {
              type: 'array',
              items: { type: 'number' },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: [1, 2, 3],
        });
      });
      it('should map item defaults to fixed array default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              items: [
                {
                  type: 'string',
                  default: 'foo',
                },
                {
                  type: 'number',
                },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          array: ['foo', undefined],
        });
      });
      it('should merge schema array item defaults from grandparent for overlapping default definitions', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: {
            level1: { level2: ['root-default-1', 'root-default-2'] },
          },
          properties: {
            level1: {
              type: 'object',
              properties: {
                level2: {
                  type: 'array',
                  items: [
                    {
                      type: 'string',
                      default: 'child-default-1',
                    },
                    {
                      type: 'string',
                    },
                  ],
                },
              },
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: { level2: ['child-default-1', 'root-default-2'] },
        });
      });
      it('should overwrite schema array item defaults from parent for nested default definitions', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: {
            level1: {
              level2: [{ item: 'root-default-1' }, { item: 'root-default-2' }],
            },
          },
          properties: {
            level1: {
              type: 'object',
              default: { level2: [{ item: 'parent-default-1' }, {}] },
              properties: {
                level2: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      item: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: { level2: [{ item: 'parent-default-1' }, {}] },
        });
      });
      it('should merge schema array item defaults from the same item for overlapping default definitions', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'array',
              default: ['property-default-1', 'property-default-2'],
              items: [
                {
                  type: 'string',
                  default: 'child-default-1',
                },
                // this falls back to an empty item when it is missing
              ],
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: ['child-default-1', 'property-default-2'],
        });
      });
      it('should merge schema from additionalItems defaults into property default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            level1: {
              type: 'array',
              default: [
                {
                  item: 'property-default-1',
                },
                {},
              ],
              additionalItems: {
                type: 'object',
                properties: {
                  item: {
                    type: 'string',
                    default: 'additional-default',
                  },
                },
              },
              items: [
                {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                    },
                  },
                },
              ],
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: [{ item: 'property-default-1' }, { item: 'additional-default' }],
        });
      });
      it('should overwrite defaults over multiple levels with arrays', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: {
            level1: [
              {
                item: 'root-default-1',
              },
              {
                item: 'root-default-2',
              },
              {
                item: 'root-default-3',
              },
              {
                item: 'root-default-4',
              },
            ],
          },
          properties: {
            level1: {
              type: 'array',
              default: [
                {
                  item: 'property-default-1',
                },
                {},
                {},
              ],
              additionalItems: {
                type: 'object',
                properties: {
                  item: {
                    type: 'string',
                    default: 'additional-default',
                  },
                },
              },
              items: [
                {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                    },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                      default: 'child-default-2',
                    },
                  },
                },
              ],
            },
          },
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          level1: [{ item: 'property-default-1' }, { item: 'child-default-2' }, { item: 'additional-default' }],
        });
      });
      it('should use schema default for referenced definitions', () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: 'number',
            },
            testdef: {
              type: 'object',
              properties: {
                foo: {
                  $ref: '#/definitions/foo',
                },
              },
            },
          },
          $ref: '#/definitions/testdef',
          default: { foo: 42 },
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);

        expect(schemaUtils.getDefaultFormState(schema)).toEqual({
          foo: 42,
        });
      });
      it("should prefer descendant's default with a $ref", () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: 'number',
              default: 1,
            },
            testdef: {
              type: 'object',
              properties: {
                foo: {
                  $ref: '#/definitions/foo',
                },
              },
            },
          },
          $ref: '#/definitions/testdef',
          default: { foo: 42 },
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);

        expect(schemaUtils.getDefaultFormState(schema)).toEqual({
          foo: 1,
        });
      });
      it('should populate defaults for oneOf + ref', () => {
        const schema: RJSFSchema = {
          definitions: {
            foo: {
              type: 'object',
              properties: {
                fooProp: {
                  type: 'string',
                },
                fooProp2: {
                  type: 'string',
                  default: 'fooProp2',
                },
              },
            },
            bar: {
              type: 'object',
              properties: {
                barProp: {
                  type: 'string',
                },
                barProp2: {
                  type: 'string',
                  default: 'barProp2',
                },
              },
            },
          },
          oneOf: [
            {
              $ref: '#/definitions/foo',
            },
            {
              $ref: '#/definitions/bar',
            },
          ],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { fooProp: 'fooProp' }, rootSchema: schema },
          ),
        ).toEqual({
          fooProp: 'fooProp',
          fooProp2: 'fooProp2',
        });
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { barProp: 'barProp' }, rootSchema: schema },
          ),
        ).toEqual({
          barProp: 'barProp',
          barProp2: 'barProp2',
        });
      });
      it('should fill array with additional items schema when items is empty', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 1,
              additionalItems: {
                type: 'string',
                default: 'foo',
              },
              items: [],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          array: ['foo'],
        });
      });
      it('should not fill array with additional items from schema when items is empty and form data contains partial array', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 2,
              additionalItems: {
                type: 'string',
                default: 'foo',
              },
              items: [],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { array: ['bar'] } })).toEqual({
          array: ['bar'],
        });
      });
      it('should fill defaults in existing array items', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              item: {
                type: 'string',
                default: 'foo',
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: [{}] })).toEqual([
          { item: 'foo' },
        ]);
      });
      it('defaults passed along for multiselect arrays when minItems is present', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 1,
              uniqueItems: true,
              default: ['foo', 'qux'],
              items: {
                type: 'string',
                enum: ['foo', 'bar', 'fuzz', 'qux'],
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          array: ['foo', 'qux'],
        });
      });
      it('returns empty defaults when no item defaults are defined for required array', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 1,
              uniqueItems: true,
              items: {
                type: 'string',
                enum: ['foo', 'bar', 'fuzz', 'qux'],
              },
            },
          },
          required: ['array'],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          array: [],
        });
      });
      it('returns undefined defaults when no item defaults are defined for optional array', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            array: {
              type: 'array',
              minItems: 1,
              uniqueItems: true,
              items: {
                type: 'string',
                enum: ['foo', 'bar', 'fuzz', 'qux'],
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({});
      });
      it('returns explicit defaults along with auto-fill when provided', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            turtles: {
              type: 'array',
              minItems: 4,
              default: ['Raphael', 'Michaelangelo'],
              items: {
                type: 'string',
                default: 'Unknown',
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          turtles: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
        });
      });
      describe('nestedDefaultsPrecedence is ancestorWins', () => {
        const defaultFormStateBehavior: DefaultFormStateBehavior = {
          nestedDefaultsPrecedence: 'ancestorWins',
        };
        it('should default to empty object if no properties are defined', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: {
                  type: 'object',
                },
              },
            ),
          ).toEqual({});
        });
        it('should recursively map schema object default to form state', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: {
                  type: 'object',
                  properties: {
                    object: {
                      type: 'object',
                      properties: {
                        string: {
                          type: 'string',
                          default: 'foo',
                        },
                      },
                    },
                  },
                },
              },
            ),
          ).toEqual({ object: { string: 'foo' } });
        });
        it('should map schema array default to form state', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: {
                  type: 'object',
                  properties: {
                    array: {
                      type: 'array',
                      default: ['foo', 'bar'],
                      items: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            ),
          ).toEqual({ array: ['foo', 'bar'] });
        });
        it('should recursively map schema array default to form state', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema: {
                  type: 'object',
                  properties: {
                    object: {
                      type: 'object',
                      properties: {
                        array: {
                          type: 'array',
                          default: ['foo', 'bar'],
                          items: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
            ),
          ).toEqual({ object: { array: ['foo', 'bar'] } });
        });
        it('should propagate nested defaults to resulting formData by default', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              object: {
                type: 'object',
                properties: {
                  array: {
                    type: 'array',
                    default: ['foo', 'bar'],
                    items: {
                      type: 'string',
                    },
                  },
                  bool: {
                    type: 'boolean',
                    default: true,
                  },
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            object: { array: ['foo', 'bar'], bool: true },
          });
        });
        it('should keep parent defaults regardless of node level defaults', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'object',
                default: {
                  level2: {
                    leaf1: 1,
                    leaf2: 1,
                    leaf3: 1,
                    leaf4: 1,
                  },
                },
                properties: {
                  level2: {
                    type: 'object',
                    default: {
                      // No level2 default for leaf1
                      leaf2: 2,
                      leaf3: 2,
                    },
                    properties: {
                      leaf1: { type: 'number' }, // No level2 default for leaf1
                      leaf2: { type: 'number' }, // No level3 default for leaf2
                      leaf3: { type: 'number', default: 3 },
                      leaf4: { type: 'number' }, // Defined in formData.
                    },
                  },
                },
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              {
                schema,
                formData: {
                  level1: { level2: { leaf4: 4 } },
                },
              },
            ),
          ).toEqual({
            level1: {
              level2: { leaf1: 1, leaf2: 1, leaf3: 1, leaf4: 4 },
            },
          });
        });
        it('should support nested values in formData', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'object',
                properties: {
                  level2: {
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          leaf1: {
                            type: 'string',
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          };
          const formData = {
            level1: {
              level2: {
                leaf1: 'a',
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData }),
          ).toEqual({
            level1: { level2: { leaf1: 'a' } },
          });
        });
        it('should use parent defaults for ArrayFields', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'array',
                default: [1, 2, 3],
                items: { type: 'number' },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: [1, 2, 3],
          });
        });
        it('should use parent defaults for ArrayFields if declared in parent', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: { level1: [1, 2, 3] },
            properties: {
              level1: {
                type: 'array',
                items: { type: 'number' },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: [1, 2, 3],
          });
        });
        it('should map item defaults to fixed array default', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                items: [
                  {
                    type: 'string',
                    default: 'foo',
                  },
                  {
                    type: 'number',
                  },
                ],
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            array: ['foo', undefined],
          });
        });
        it('should prefer schema array item defaults from grandparent for overlapping default definitions', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: {
              level1: { level2: ['root-default-1', 'root-default-2'] },
            },
            properties: {
              level1: {
                type: 'object',
                properties: {
                  level2: {
                    type: 'array',
                    items: [
                      {
                        type: 'string',
                        default: 'child-default-1',
                      },
                      {
                        type: 'string',
                      },
                    ],
                  },
                },
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: { level2: ['root-default-1', 'root-default-2'] },
          });
        });
        it('should prefer schema array item defaults from parent for nested default definitions', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: {
              level1: {
                level2: [{ item: 'root-default-1' }, { item: 'root-default-2' }],
              },
            },
            properties: {
              level1: {
                type: 'object',
                default: { level2: [{ item: 'parent-default-1' }, {}] },
                properties: {
                  level2: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        item: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: { level2: [{ item: 'root-default-1' }, { item: 'root-default-2' }] },
          });
        });
        it('should prefer schema array defaults for overlapping item default definitions', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'array',
                default: ['property-default-1', 'property-default-2'],
                items: [
                  {
                    type: 'string',
                    default: 'child-default-1',
                  },
                  // this falls back to an empty item when it is missing
                ],
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: ['property-default-1', 'property-default-2'],
          });
        });
        it('should merge schema from additionalItems defaults into property default', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              level1: {
                type: 'array',
                default: [
                  {
                    item: 'property-default-1',
                  },
                  {},
                ],
                additionalItems: {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                      default: 'additional-default',
                    },
                  },
                },
                items: [
                  {
                    type: 'object',
                    properties: {
                      item: {
                        type: 'string',
                      },
                    },
                  },
                ],
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: [{ item: 'property-default-1' }, { item: 'additional-default' }],
          });
        });
        it("should prefer ancestor's defaults over multiple levels with arrays", () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: {
              level1: [
                {
                  item: 'root-default-1',
                },
                {
                  item: 'root-default-2',
                },
                {
                  item: 'root-default-3',
                },
                {
                  item: 'root-default-4',
                },
              ],
            },
            properties: {
              level1: {
                type: 'array',
                default: [
                  {
                    item: 'property-default-1',
                  },
                  {},
                  {},
                ],
                additionalItems: {
                  type: 'object',
                  properties: {
                    item: {
                      type: 'string',
                      default: 'additional-default',
                    },
                  },
                },
                items: [
                  {
                    type: 'object',
                    properties: {
                      item: {
                        type: 'string',
                      },
                    },
                  },
                  {
                    type: 'object',
                    properties: {
                      item: {
                        type: 'string',
                        default: 'child-default-2',
                      },
                    },
                  },
                ],
              },
            },
          };

          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            level1: [
              {
                item: 'root-default-1',
              },
              {
                item: 'root-default-2',
              },
              {
                item: 'root-default-3',
              },
              {
                item: 'root-default-4',
              },
            ],
          });
        });
        it('should use schema default for referenced definitions', () => {
          const schema: RJSFSchema = {
            definitions: {
              foo: {
                type: 'number',
              },
              testdef: {
                type: 'object',
                properties: {
                  foo: {
                    $ref: '#/definitions/foo',
                  },
                },
              },
            },
            $ref: '#/definitions/testdef',
            default: { foo: 42 },
          };
          const schemaUtils = createSchemaUtils({ validator: testValidator, defaultFormStateBehavior }, schema);

          expect(schemaUtils.getDefaultFormState(schema)).toEqual({
            foo: 42,
          });
        });
        it("should prefer ancestor's default with a $ref", () => {
          const schema: RJSFSchema = {
            definitions: {
              foo: {
                type: 'number',
                default: 1,
              },
              testdef: {
                type: 'object',
                properties: {
                  foo: {
                    $ref: '#/definitions/foo',
                  },
                },
              },
            },
            $ref: '#/definitions/testdef',
            default: { foo: 42 },
          };
          const schemaUtils = createSchemaUtils({ validator: testValidator, defaultFormStateBehavior }, schema);

          expect(schemaUtils.getDefaultFormState(schema)).toEqual({
            foo: 42,
          });
        });
        it('should populate defaults for oneOf + ref', () => {
          const schema: RJSFSchema = {
            definitions: {
              foo: {
                type: 'object',
                properties: {
                  fooProp: {
                    type: 'string',
                  },
                  fooProp2: {
                    type: 'string',
                    default: 'fooProp2',
                  },
                },
              },
              bar: {
                type: 'object',
                properties: {
                  barProp: {
                    type: 'string',
                  },
                  barProp2: {
                    type: 'string',
                    default: 'barProp2',
                  },
                },
              },
            },
            oneOf: [
              {
                $ref: '#/definitions/foo',
              },
              {
                $ref: '#/definitions/bar',
              },
            ],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { fooProp: 'fooProp' }, rootSchema: schema },
            ),
          ).toEqual({
            fooProp: 'fooProp',
            fooProp2: 'fooProp2',
          });
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { barProp: 'barProp' }, rootSchema: schema },
            ),
          ).toEqual({
            barProp: 'barProp',
            barProp2: 'barProp2',
          });
        });
        it('should fill array with additional items schema when items is empty', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 1,
                additionalItems: {
                  type: 'string',
                  default: 'foo',
                },
                items: [],
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            array: ['foo'],
          });
        });
        it('should not fill array with additional items from schema when items is empty and form data contains partial array', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 2,
                additionalItems: {
                  type: 'string',
                  default: 'foo',
                },
                items: [],
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema, formData: { array: ['bar'] } },
            ),
          ).toEqual({
            array: ['bar'],
          });
        });
        it('should fill defaults in existing array items', () => {
          const schema: RJSFSchema = {
            type: 'array',
            minItems: 2,
            items: {
              type: 'object',
              properties: {
                item: {
                  type: 'string',
                  default: 'foo',
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: [{}] }),
          ).toEqual([{ item: 'foo' }]);
        });
        it('defaults passed along for multiselect arrays when minItems is present', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                default: ['foo', 'qux'],
                items: {
                  type: 'string',
                  enum: ['foo', 'bar', 'fuzz', 'qux'],
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            array: ['foo', 'qux'],
          });
        });
        it('returns empty defaults when no item defaults are defined for required array', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                items: {
                  type: 'string',
                  enum: ['foo', 'bar', 'fuzz', 'qux'],
                },
              },
            },
            required: ['array'],
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            array: [],
          });
        });
        it('returns undefined defaults when no item defaults are defined for optional array', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              array: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                items: {
                  type: 'string',
                  enum: ['foo', 'bar', 'fuzz', 'qux'],
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({});
        });
        it('returns explicit defaults along with auto-fill when provided', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              turtles: {
                type: 'array',
                minItems: 4,
                default: ['Raphael', 'Michaelangelo'],
                items: {
                  type: 'string',
                  default: 'Unknown',
                },
              },
            },
          };
          expect(
            getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema, formData: {} }),
          ).toEqual({
            turtles: ['Raphael', 'Michaelangelo', 'Unknown', 'Unknown'],
          });
        });
        it.each<[string, RJSFSchema, Exclude<RJSFSchema['default'], undefined>]>([
          ['0', { type: 'integer', default: 1 }, 0],
          ['false', { type: 'boolean', default: true }, false],
          ["''", { type: 'string', default: 'deeper' }, ''],
          ['null', { type: ['integer', 'null'], default: 1 }, null],
          [
            'null on a nullable object',
            {
              type: ['object', 'null'],
              default: { a: 'own' },
              properties: { a: { type: 'string', default: 'x' } },
            },
            null,
          ],
          [
            'null on a nullable object with no default',
            { type: ['object', 'null'], properties: { a: { type: 'string', default: 'x' } } },
            null,
          ],
        ])('keeps an ancestor default of %s over the property default (#5624)', (_name, property, ancestorDefault) => {
          const schema: RJSFSchema = {
            type: 'object',
            default: { value: ancestorDefault },
            properties: { value: property },
          };
          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
            value: ancestorDefault,
          });
        });
        it.each<[string, RJSFSchema, Exclude<RJSFSchema['default'], undefined>, unknown]>([
          ['an object on a string', { type: 'string', default: 'x' }, { v: 5 }, 'x'],
          ['a string on a number', { type: 'number', default: 1 }, '5', 1],
          ['a fraction on an integer', { type: 'integer', default: 1 }, 1.5, 1],
        ])(
          'gives the property default over an ancestor default its type cannot hold, %s',
          (_name, property, ancestorDefault, expected) => {
            const schema: RJSFSchema = { type: 'object', default: { v: ancestorDefault }, properties: { v: property } };
            expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
              v: expected,
            });
          },
        );
        it.each<[string, RJSFSchema, Exclude<RJSFSchema['default'], undefined>, unknown]>([
          ['an anyOf option', { anyOf: [{ type: 'number' }, { type: 'string' }], default: 'x' }, 5, 5],
          ['a oneOf option', { oneOf: [{ type: 'number' }, { type: 'string' }], default: 'x' }, 5, 5],
          ['no option', { anyOf: [{ type: 'number' }, { type: 'string' }], default: 'x' }, true, 'x'],
        ])(
          'gives an ancestor default over the property default where %s holds it',
          (_name, property, ancestor, expected) => {
            const schema: RJSFSchema = { type: 'object', default: { v: ancestor }, properties: { v: property } };
            expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
              v: expected,
            });
          },
        );
        it.each<[string, Exclude<RJSFSchema['default'], undefined>]>([
          ['true', true],
          ['null', null],
          ['{}', {}],
        ])(
          'gives the option the own default picks, with its default, over an ancestor default of %s no option holds',
          (_name, ancestor) => {
            const schema: RJSFSchema = {
              type: 'object',
              default: { v: ancestor },
              properties: {
                v: {
                  anyOf: [
                    { type: 'number', default: 1 },
                    { type: 'string', default: 's' },
                  ],
                  default: 'x',
                },
              },
            };
            expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
              v: 's',
            });
          },
        );
        it('gives an ancestor default over the property default where a true option holds it', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: { v: 5 },
            properties: { v: { anyOf: [true, { type: 'string', default: 's' }], default: 'x' } },
          };
          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
            v: 5,
          });
        });
        it('gives the option the own default picks over an ancestor default no option read through $refs holds', () => {
          const schema: RJSFSchema = {
            definitions: { N: { type: 'number', default: 1 }, S: { type: 'string', default: 's' } },
            type: 'object',
            default: { v: true },
            properties: { v: { anyOf: [{ $ref: '#/definitions/N' }, { $ref: '#/definitions/S' }], default: 'x' } },
          };
          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
            v: 's',
          });
        });
        it('keeps a falsy default two levels up over the property default (#5624)', () => {
          const schema: RJSFSchema = {
            type: 'object',
            default: { inner: { value: 0 } },
            properties: {
              inner: {
                type: 'object',
                default: { value: 2 },
                properties: { value: { type: 'integer', default: 1 } },
              },
            },
          };
          expect(getDefaultFormState({ validator: testValidator, defaultFormStateBehavior }, { schema })).toEqual({
            inner: { value: 0 },
          });
        });
      });
    });
    describe('defaults with allOf', () => {
      let schema: RJSFSchema;
      const animalInfoSchema: RJSFSchema = {
        properties: {
          animal: {
            type: 'string',
            default: 'Cat',
            enum: ['Cat', 'Fish'],
          },
        },
        allOf: [
          {
            if: {
              properties: {
                animal: {
                  const: 'Cat',
                },
              },
            },
            then: {
              properties: {
                food: {
                  type: 'string',
                  default: 'meat',
                  enum: ['meat', 'grass', 'fish'],
                },
              },
              required: ['food'],
            },
          },
        ],
      };
      const animalInfoObjectSchema: RJSFSchema = {
        title: 'Example',
        type: 'object',
        properties: {
          animalInfo: animalInfoSchema,
        },
      };
      const animalInfoArraySchema: RJSFSchema = { type: 'array', items: animalInfoSchema };
      const rootAllOfSchema: RJSFSchema = {
        ...animalInfoObjectSchema,
        allOf: [{ properties: { name: { type: 'string' } } }],
      };
      const [animalCondition] = animalInfoSchema.allOf as RJSFSchema[];
      const fishFirstAnimalInfoSchema: RJSFSchema = {
        properties: { animal: { type: 'string', default: 'Cat', enum: ['Cat', 'Fish', 'Dog'] } },
        allOf: [
          {
            if: { properties: { animal: { const: 'Fish' } } },
            then: { properties: { food: { type: 'string', default: 'grass' } } },
          },
          {
            if: { properties: { animal: { const: 'Dog' } } },
            then: { properties: { food: { type: 'string', default: 'fish' } } },
          },
          animalCondition,
        ],
      };

      afterEach(() => {
        testValidator.reset?.();
      });

      it('should populate root defaults for allOf', () => {
        schema = {
          allOf: [
            {
              properties: {
                first: {
                  title: 'First',
                  type: 'string',
                },
              },
            },
            {
              properties: {
                second: {
                  title: 'Second',
                  type: 'string',
                },
              },
            },
          ],
          default: {
            second: 'Second 2!',
          },
          type: 'object',
        };

        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          second: 'Second 2!',
        });
      });

      describe('default form state behaviour: allOf = "populateDefaults"', () => {
        it('should populate default values correctly', () => {
          expect(
            computeDefaults(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
              animalInfoObjectSchema,
              { rootSchema: animalInfoObjectSchema },
            ),
          ).toEqual({ animalInfo: { animal: 'Cat', food: 'meat' } });
        });

        it('should apply conditional const defaults consistently for root and nested allOf schemas', () => {
          const defaultFormStateBehavior: DefaultFormStateBehavior = {
            allOf: 'populateDefaults',
            constAsDefaults: 'always',
          };
          const conditionalSchema = {
            type: 'object',
            properties: {
              animal: {
                enum: ['Cat', 'Fish'],
              },
              food: {
                type: 'string',
                enum: ['meat', 'grass', 'fish'],
              },
            },
            allOf: [
              {
                if: {
                  properties: {
                    animal: {
                      const: 'Cat',
                    },
                  },
                },
                then: {
                  properties: {
                    food: {
                      const: 'fish',
                    },
                  },
                  required: ['food'],
                },
              },
              {
                required: ['animal'],
              },
            ],
          } satisfies RJSFSchema;
          const formData = {
            animal: 'Cat',
            food: 'meat',
          };

          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema: conditionalSchema, formData, rootSchema: conditionalSchema },
            ),
          ).toEqual({
            animal: 'Cat',
            food: 'fish',
          });

          const nestedSchema: RJSFSchema = {
            type: 'object',
            properties: {
              nested: conditionalSchema,
            },
            required: ['nested'],
          };

          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior },
              { schema: nestedSchema, formData: { nested: formData }, rootSchema: nestedSchema },
            ),
          ).toEqual({
            nested: {
              animal: 'Cat',
              food: 'fish',
            },
          });
        });

        it('keeps the data of a nested object over its own default where its allOf is left unmerged', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              field: {
                allOf: [{ properties: { first: { type: 'string' } } }, { properties: { second: { type: 'string' } } }],
                default: { second: 'second!' },
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, formData: { field: { second: 'changed!' } }, rootSchema: schema },
            ),
          ).toEqual({ field: { second: 'changed!' } });
        });

        it('should populate the conditional defaults of an allOf in array items', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
              { schema: animalInfoArraySchema, formData: [{ animal: 'Cat' }], rootSchema: animalInfoArraySchema },
            ),
          ).toEqual([{ animal: 'Cat', food: 'meat' }]);
        });

        it('should fill in the then default of the if the defaulted value matches in array items with no data (#5830)', () => {
          testValidator.setReturnValues({ isValid: asRealValidator });
          const fishFirstArraySchema: RJSFSchema = { type: 'array', items: fishFirstAnimalInfoSchema };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
              { schema: fishFirstArraySchema, formData: [{}], rootSchema: fishFirstArraySchema },
            ),
          ).toEqual([{ animal: 'Cat', food: 'meat' }]);
        });
      });

      describe('default form state behaviour: allOf = "skipDefaults"', () => {
        const directConditionArraySchema: RJSFSchema = {
          type: 'array',
          items: { properties: animalInfoSchema.properties, ...animalCondition },
        };
        const directIfArraySchema: RJSFSchema = {
          type: 'array',
          items: {
            ...animalInfoSchema,
            properties: { ...animalInfoSchema.properties, x: {} },
            if: { properties: { x: { const: 1 } } },
          },
        };
        const nestedPlacements = [
          {
            where: 'array items',
            wrap: (schema: RJSFSchema): RJSFSchema => ({ type: 'array', items: schema }),
            wrapData: (data: object) => [data],
          },
          {
            where: 'an object property',
            wrap: (schema: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { nested: schema } }),
            wrapData: (data: object) => ({ nested: data }),
          },
        ];

        it('should populate default values correctly', () => {
          expect(
            computeDefaults(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              animalInfoObjectSchema,
              { rootSchema: animalInfoObjectSchema },
            ),
          ).toEqual({ animalInfo: { animal: 'Cat' } });
        });

        it('should not populate the conditional defaults of an allOf in array items', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: animalInfoArraySchema, formData: [{ animal: 'Cat' }], rootSchema: animalInfoArraySchema },
            ),
          ).toEqual([{ animal: 'Cat' }]);
        });

        it('should skip the plain property defaults of a nested allOf too', () => {
          const plainAllOfSchema: RJSFSchema = {
            type: 'object',
            properties: {
              animalInfo: {
                type: 'object',
                properties: { name: { type: 'string', default: 'Tom' } },
                allOf: [{ properties: { animal: { type: 'string', default: 'Cat' } } }],
              },
            },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: plainAllOfSchema, rootSchema: plainAllOfSchema },
            ),
          ).toEqual({ animalInfo: { name: 'Tom' } });
        });

        it("should populate the conditional defaults of the root schema's own allOf, which skipDefaults does not skip", () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: animalInfoSchema, formData: { animal: 'Cat' }, rootSchema: animalInfoSchema },
            ),
          ).toEqual({ animal: 'Cat', food: 'meat' });
        });

        it('should skip the allOf of the oneOf option picked on the initial render, even in the root schema', () => {
          const rootOneOfSchema: RJSFSchema = { oneOf: [{ type: 'object', ...animalInfoSchema }] };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: rootOneOfSchema, rootSchema: rootOneOfSchema },
            ),
          ).toEqual({ animal: 'Cat' });
        });

        it('should pick the if-then-else branch from the defaults under the form data, so a then default whose if requires a defaulted value is filled in (#5830)', () => {
          testValidator.setReturnValues({ isValid: asRealValidator });
          const requiredAnimalSchema: RJSFSchema = {
            ...animalInfoSchema,
            allOf: [{ ...animalCondition, if: { ...(animalCondition.if as RJSFSchema), required: ['animal'] } }],
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: requiredAnimalSchema, rootSchema: requiredAnimalSchema },
            ),
          ).toEqual({ animal: 'Cat', food: 'meat' });
        });

        it('should fill in the then default of the if the defaulted value matches on empty data (#5830)', () => {
          testValidator.setReturnValues({ isValid: asRealValidator });
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: fishFirstAnimalInfoSchema, rootSchema: fishFirstAnimalInfoSchema },
            ),
          ).toEqual({ animal: 'Cat', food: 'meat' });
        });

        it('should drop the whole allOf when a custom merger throws on the conflicting then defaults, then fill in the branch the defaulted value selects', () => {
          consoleWarnSpy.mockClear();
          const conflict = new Error('conflicting food defaults');
          const mergeAllOfUnlessFoodDefaultsConflict: CustomMergeAllOf = (schema) => {
            const foodDefaults = new Set(
              (schema.allOf as RJSFSchema[]).map(
                (entry) => (entry.properties?.food as RJSFSchema | undefined)?.default,
              ),
            );
            foodDefaults.delete(undefined);
            if (foodDefaults.size > 1) {
              throw conflict;
            }
            return shallowAllOfMerge(schema) as RJSFSchema;
          };
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults' },
                customMergeAllOf: mergeAllOfUnlessFoodDefaultsConflict,
              },
              { schema: animalInfoSchema, formData: { animal: 'Cat' }, rootSchema: animalInfoSchema },
            ),
          ).toEqual({ animal: 'Cat', food: 'meat' });
          expect(consoleWarnSpy).not.toHaveBeenCalledWith('could not merge subschemas in allOf:\n', conflict);
          testValidator.setReturnValues({ isValid: asRealValidator });
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults' },
                customMergeAllOf: mergeAllOfUnlessFoodDefaultsConflict,
              },
              { schema: fishFirstAnimalInfoSchema, rootSchema: fishFirstAnimalInfoSchema },
            ),
          ).toEqual({ animal: 'Cat', food: 'meat' });
          expect(consoleWarnSpy).toHaveBeenCalledWith('could not merge subschemas in allOf:\n', conflict);
        });

        it('should populate the conditional defaults of an if-then-else placed directly in array items', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              {
                schema: directConditionArraySchema,
                formData: [{ animal: 'Cat' }],
                rootSchema: directConditionArraySchema,
              },
            ),
          ).toEqual([{ animal: 'Cat', food: 'meat' }]);
        });

        it('should not populate the conditional defaults of an if-then-else placed directly in array items when emptyObjectFields is skipEmptyDefaults', () => {
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults', emptyObjectFields: 'skipEmptyDefaults' },
              },
              {
                schema: directConditionArraySchema,
                formData: [{ animal: 'Cat' }],
                rootSchema: directConditionArraySchema,
              },
            ),
          ).toEqual([{ animal: 'Cat' }]);
        });

        it("should skip a property's allOf conditional defaults even where a deep custom merger merges the root's allOf", () => {
          const deepAllOfMerge: CustomMergeAllOf = (schema) => {
            const merged = shallowAllOfMerge(schema) as RJSFSchema;
            const properties = Object.fromEntries(
              Object.entries(merged.properties ?? {}).map(([key, property]) => [
                key,
                typeof property === 'object' && 'allOf' in property ? shallowAllOfMerge(property) : property,
              ]),
            );
            return { ...merged, properties };
          };
          const formData = { animalInfo: { animal: 'Cat' } };
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults' },
                customMergeAllOf: deepAllOfMerge,
              },
              { schema: rootAllOfSchema, formData, rootSchema: rootAllOfSchema },
            ),
          ).toEqual(formData);
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults' },
                customMergeAllOf: deepAllOfMerge,
              },
              { schema: animalInfoObjectSchema, formData, rootSchema: animalInfoObjectSchema },
            ),
          ).toEqual(formData);
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'populateDefaults' },
                customMergeAllOf: deepAllOfMerge,
              },
              { schema: rootAllOfSchema, formData, rootSchema: rootAllOfSchema },
            ),
          ).toEqual({ animalInfo: { animal: 'Cat', food: 'meat' } });
        });

        it("should skip a property's allOf conditional defaults with @x0k/json-schema-merge's createDeepAllOfMerge", () => {
          const getDefaults = (allOf: DefaultFormStateBehavior['allOf']) =>
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf },
                customMergeAllOf: createDeepAllOfMerge(shallowAllOfMerge) as CustomMergeAllOf,
              },
              { schema: rootAllOfSchema, formData: { animalInfo: { animal: 'Cat' } }, rootSchema: rootAllOfSchema },
            );
          expect(getDefaults('skipDefaults')).toEqual({ animalInfo: { animal: 'Cat' } });
          expect(getDefaults('populateDefaults')).toEqual({ animalInfo: { animal: 'Cat', food: 'meat' } });
        });

        it.each(nestedPlacements)(
          "should skip a property's allOf conditional defaults with createDeepAllOfMerge in $where whose schema also has a direct if",
          ({ wrap, wrapData }) => {
            const deepMerge = createDeepAllOfMerge(shallowAllOfMerge) as CustomMergeAllOf;
            const directIfSchema = wrap({ ...rootAllOfSchema, if: { properties: { x: { const: 1 } } }, then: {} });
            const allOfSchema = wrap(rootAllOfSchema);
            const formData = wrapData({ animalInfo: { animal: 'Cat' } });
            const getDefaults = (schema: RJSFSchema, behavior: DefaultFormStateBehavior) =>
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: behavior, customMergeAllOf: deepMerge },
                { schema, formData, rootSchema: schema },
              );
            expect(getDefaults(directIfSchema, { allOf: 'skipDefaults' })).toEqual(formData);
            expect(getDefaults(directIfSchema, { allOf: 'populateDefaults' })).toEqual(
              wrapData({ animalInfo: { animal: 'Cat', food: 'meat' } }),
            );
            expect(getDefaults(allOfSchema, { allOf: 'skipDefaults' })).toEqual(formData);
            expect(
              getDefaults(directIfSchema, { allOf: 'skipDefaults', emptyObjectFields: 'skipEmptyDefaults' }),
            ).toEqual(formData);
          },
        );

        it('should populate the conditional defaults of an allOf in array items whose schema also has a direct if', () => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'skipDefaults' } },
              { schema: directIfArraySchema, formData: [{ animal: 'Cat' }], rootSchema: directIfArraySchema },
            ),
          ).toEqual([{ animal: 'Cat', food: 'meat' }]);
        });

        it('should not populate the conditional defaults of an allOf next to a direct if in array items when emptyObjectFields is skipEmptyDefaults', () => {
          expect(
            getDefaultFormState(
              {
                validator: testValidator,
                defaultFormStateBehavior: { allOf: 'skipDefaults', emptyObjectFields: 'skipEmptyDefaults' },
              },
              { schema: directIfArraySchema, formData: [{ animal: 'Cat' }], rootSchema: directIfArraySchema },
            ),
          ).toEqual([{ animal: 'Cat' }]);
        });

        const dependencyCases: { entry: string; dependency: RJSFSchema }[] = [
          { entry: 'an allOf with an if-then-else', dependency: { allOf: [animalCondition] } },
          {
            entry: 'an allOf with a plain property default',
            dependency: { allOf: [{ properties: { food: { type: 'string', default: 'meat' } } }] },
          },
          { entry: 'a direct if-then-else', dependency: animalCondition },
          {
            entry: 'an if-then-else whose if requires the property',
            dependency: { ...animalCondition, if: { properties: { animal: { const: 'Cat' } }, required: ['animal'] } },
          },
        ];
        it.each(
          nestedPlacements.flatMap((placement) =>
            dependencyCases.map((dependencyCase) => ({ ...placement, ...dependencyCase })),
          ),
        )(
          'should populate the defaults of $entry in a dependencies entry in $where once its property has a value, even when emptyObjectFields is skipEmptyDefaults',
          ({ wrap, wrapData, dependency }) => {
            const dependentSchema = (animal: RJSFSchema): RJSFSchema =>
              wrap({ type: 'object', properties: { animal }, dependencies: { animal: dependency } });
            const defaultedSchema = dependentSchema({ type: 'string', default: 'Cat' });
            const noDefaultSchema = dependentSchema({ type: 'string' });
            const formData = wrapData({});
            const getDefaults = (schema: RJSFSchema, behavior: DefaultFormStateBehavior) =>
              getDefaultFormState(
                { validator: testValidator, defaultFormStateBehavior: behavior },
                { schema, formData, rootSchema: schema },
              );
            expect(getDefaults(defaultedSchema, { allOf: 'skipDefaults' })).toEqual(
              wrapData({ animal: 'Cat', food: 'meat' }),
            );
            expect(
              getDefaults(defaultedSchema, { allOf: 'skipDefaults', emptyObjectFields: 'skipEmptyDefaults' }),
            ).toEqual(wrapData({ animal: 'Cat', food: 'meat' }));
            expect(getDefaults(defaultedSchema, { allOf: 'skipDefaults', emptyObjectFields: 'skipDefaults' })).toEqual(
              formData,
            );
            expect(getDefaults(noDefaultSchema, { allOf: 'skipDefaults' })).toEqual(formData);
          },
        );
      });
    });
    describe('defaults with oneOf', () => {
      afterEach(() => {
        // Reset the testValidator
        if (typeof testValidator.reset === 'function') {
          testValidator?.reset();
        }
      });
      it('should not populate defaults for empty oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              oneOf: [],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({});
      });
      it('should populate defaults from the schema itself beside an empty oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'a', oneOf: [] },
            nested: { type: 'object', properties: { b: { type: 'string', default: 'b' } }, oneOf: [] },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
          nested: { b: 'b' },
        });
      });
      it.each<[string, RJSFSchema, unknown]>([
        ['a string', { type: 'string', default: 'a', oneOf: [] }, 'hello'],
        ['a number', { type: 'number', default: 1, anyOf: [] }, 5],
        ['an enum', { type: 'string', default: 'a', enum: [] }, 'hello'],
      ])(
        'should keep the form data of %s beside an empty option list rather than replace it with the default',
        (_, field, value) => {
          const schema: RJSFSchema = { type: 'object', properties: { field } };
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { field: value } })).toEqual({
            field: value,
          });
          expect(getDefaultFormState({ validator: testValidator }, { schema: field, formData: value })).toEqual(value);
        },
      );
      it('should keep the form data of an array beside an empty anyOf at the root', () => {
        const schema: RJSFSchema = { type: 'array', items: { type: 'string' }, anyOf: [] };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: ['x', 'y'] })).toEqual(['x', 'y']);
      });
      it('should populate defaults for oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              oneOf: [
                { type: 'string', default: 'a' },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
        });
      });
      it('should populate root defaults for oneOf', () => {
        const schema: RJSFSchema = {
          oneOf: [
            {
              properties: {
                first: {
                  title: 'First',
                  type: 'string',
                },
              },
            },
            {
              properties: {
                second: {
                  title: 'Second',
                  type: 'string',
                },
              },
            },
          ],
          default: {
            second: 'Second 2!',
          },
          type: 'object',
        };

        // Mock isValid so that withExactlyOneSubschema works as expected
        testValidator.setReturnValues({
          isValid: [
            false, // First oneOf... first === first
            false, // Second oneOf... second !== first
            false, // Third oneOf... second === second
            true, // Fourth oneOf... second === second
          ],
        });

        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          second: 'Second 2!',
        });
      });
      it('should populate defaults for oneOf when `type`: `object` is missing', () => {
        const schema: RJSFSchema = {
          type: 'object',
          oneOf: [
            {
              properties: { name: { type: 'string', default: 'a' } },
            },
            {
              properties: { id: { type: 'number', default: 13 } },
            },
          ],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
        });
      });
      it('should populate nested default values for oneOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'object',
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: {
            first: 'First Name',
          },
        });
      });
      it('should not populate nested default values for oneOf, when not required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'object',
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({ name: {} });
      });
      it('should populate nested default values for oneOf, when required is merged in', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'object',
              required: ['first'],
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: '1st Name' },
                  },
                },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({
          name: {
            first: 'First Name',
          },
        });
      });
      it('should populate nested default values merging required fields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['foo', 'bar'],
          properties: {
            foo: {
              type: 'string',
              default: 'fooVal',
            },
          },
          oneOf: [
            {
              properties: {
                bar: {
                  type: 'number',
                },
                baz: {
                  default: 'bazIsRequired',
                },
              },
              required: ['baz'],
            },
          ],
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({ foo: 'fooVal', baz: 'bazIsRequired' });
      });
      it('should populate defaults for oneOf + dependencies', () => {
        const schema: RJSFSchema = {
          oneOf: [
            {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          ],
          dependencies: {
            name: {
              oneOf: [
                {
                  properties: {
                    name: {
                      type: 'string',
                    },
                    grade: {
                      default: 'A',
                    },
                  },
                },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { name: 'Name' } })).toEqual({
          name: 'Name',
          grade: 'A',
        });
      });
      it('should populate defaults for oneOf second option', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: {
              oneOf: [
                { properties: { a: { type: 'string', default: 'a' } } },
                { properties: { b: { type: 'string', default: 'b' } } },
              ],
            },
          },
        };
        // Mock errors so that getMatchingOption works as expected
        testValidator.setReturnValues({ isValid: [false, false, false, true] });
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { test: { b: 'b' } } })).toEqual({
          test: { b: 'b' },
        });
      });
    });
    describe('defaults with anyOf', () => {
      afterEach(() => {
        // Reset the testValidator
        if (typeof testValidator.reset === 'function') {
          testValidator?.reset();
        }
      });
      it("computes an array's defaults from its selected option as it is rendered, meeting the parent's bounds and items", () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: { type: 'object', properties: { a: { type: 'string', default: 'dflt' } } },
          anyOf: [{ items: true, minItems: 1 }, { maxItems: 3 }],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual([{ a: 'dflt' }, { a: 'dflt' }]);
      });
      it("computes an array's defaults from a selected option written as a $ref as from the option it names", () => {
        const schema: RJSFSchema = {
          definitions: { loose: { items: true, minItems: 1 } },
          type: 'array',
          minItems: 2,
          items: { type: 'object', properties: { a: { type: 'string', default: 'dflt' } } },
          anyOf: [{ $ref: '#/definitions/loose' }, { maxItems: 3 }],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual([
          { a: 'dflt' },
          { a: 'dflt' },
        ]);
      });
      describe('a selected option written as a $ref naming an allOf', () => {
        const pet = (field: RJSFSchema): RJSFSchema => ({
          $defs: {
            Base: { type: 'object', properties: { id: { type: 'string', default: 'ID' } } },
            Cat: {
              allOf: [
                { $ref: '#/$defs/Base' },
                { type: 'object', properties: { meow: { type: 'boolean', default: true } } },
              ],
            },
          },
          type: 'object',
          properties: { pet: { ...field, anyOf: [{ $ref: '#/$defs/Cat' }] } },
        });
        it.each<[string, RJSFSchema]>([
          ['that inherits nothing', {}],
          ['that inherits from its field', { minProperties: 1 }],
        ])('leaves the allOf defaults to the allOf behavior for an option %s', (_, field) => {
          const schema = pet(field);
          expect(
            getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: { pet: {} } }),
          ).toEqual({ pet: {} });
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
              { schema, rootSchema: schema, formData: { pet: {} } },
            ),
          ).toEqual({ pet: { id: 'ID', meow: true } });
        });
      });
      it("merges a selected option written as a $ref with its field's default, as it merges one written in place", () => {
        const schema: RJSFSchema = {
          $defs: {
            O: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } } },
            S: { type: 'string', default: 'child' },
          },
          type: 'object',
          properties: {
            o: { default: { a: 1 }, anyOf: [{ $ref: '#/$defs/O' }] },
            s: { default: 'parent', anyOf: [{ $ref: '#/$defs/S' }] },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: { o: { b: 2 } } }),
        ).toEqual({ o: { a: 1, b: 2 }, s: 'child' });
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' } },
            { schema, rootSchema: schema, formData: { o: { b: 2 } } },
          ),
        ).toEqual({ o: { a: 1, b: 2 }, s: 'child' });
      });
      it('keeps object data of a schema whose options, read through $refs, take none of it (#5522)', () => {
        const schema: RJSFSchema = {
          definitions: { A: { const: 'a' }, N: { type: 'number' } },
          anyOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/N' }],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { b: 2 } })).toEqual({ b: 2 });
      });
      it.each<[string, RJSFSchema, unknown, unknown]>([
        [
          'at the root',
          { oneOf: [{ type: 'string' }, { type: 'object', properties: { a: { type: 'number' } } }], default: { a: 1 } },
          { b: 2 },
          { a: 1, b: 2 },
        ],
        [
          'nested in an object',
          {
            type: 'object',
            properties: {
              p: {
                oneOf: [{ type: 'string' }, { type: 'object', properties: { a: { type: 'number' } } }],
                default: { a: 1 },
              },
            },
          },
          { p: { b: 2 } },
          { p: { a: 1, b: 2 } },
        ],
      ])(
        'keeps object data under its object default where it opens on an option taking no object, %s',
        (_, schema, formData, expected) => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
        },
      );
      it.each<[string, RJSFSchema, GenericObjectType]>([
        ['at the root', { type: 'object', additionalProperties: { type: 'string', enum: ['a'] } }, { extra: 'zz' }],
        [
          'nested in an object',
          {
            type: 'object',
            properties: { o: { type: 'object', additionalProperties: { type: 'string', enum: ['a'] } } },
          },
          { o: { extra: 'zz' } },
        ],
      ])('keeps an additional property its field takes none of as the user left it, %s', (_, schema, formData) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it.each<[string, RJSFSchema, GenericObjectType, GenericObjectType]>([
        [
          'at the root',
          { type: 'object', additionalProperties: { type: 'object', properties: { n: { type: 'string' } } } },
          { k: { n: { bad: 1 }, m: { kept: 1 } } },
          { k: { m: { kept: 1 } } },
        ],
        [
          'under a pattern',
          { type: 'object', patternProperties: { '^k': { type: 'object', properties: { n: { type: 'string' } } } } },
          { k: { n: { bad: 1 }, m: { kept: 1 } } },
          { k: { m: { kept: 1 } } },
        ],
        [
          'nested in an object',
          {
            type: 'object',
            properties: {
              o: { type: 'object', additionalProperties: { type: 'object', properties: { n: { type: 'string' } } } },
            },
          },
          { o: { k: { n: { bad: 1 }, m: { kept: 1 } } } },
          { o: { k: { m: { kept: 1 } } } },
        ],
      ])(
        "drops object data a property an extra key's schema declares can't take, keeping the extra key's own, %s",
        (_, schema, formData, expected) => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
        },
      );
      it('gives the defaults of a field none of whose options, nor the field itself, takes its object data', () => {
        const schema: RJSFSchema = { type: 'string', default: 'd', anyOf: [{ minLength: 1 }, { maxLength: 5 }] };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { b: 2 } })).toEqual('d');
      });
      it.each<[string, unknown, GenericObjectType]>([
        ['the constant one option holds', { answer: '2' }, { p: { answer: '2' } }],
        ['a constant no option holds', { answer: '3' }, {}],
        ['an object naming no selector value', { other: 1 }, {}],
        ['a value of another type', 'x', { p: 'x' }],
      ])('matches data of a discriminated select over object constants by its selector, for %s', (_, p, expected) => {
        const option = (answer: string): RJSFSchema => ({
          type: 'object',
          properties: { answer: { type: 'string', default: answer } },
          const: { answer },
        });
        const select: RJSFSchema = {
          type: 'object',
          discriminator: { propertyName: 'answer' },
          oneOf: [option('1'), option('2')],
        };
        const schema: RJSFSchema = { type: 'object', properties: { p: select } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { p } })).toEqual(expected);
      });
      it('keeps a value its select no longer offers where no default replaces it', () => {
        const schema: RJSFSchema = { type: 'object', properties: { country: { type: 'string', enum: ['US', 'CA'] } } };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { country: 'FR' } })).toEqual({
          country: 'FR',
        });
      });
      it.each<[string, RJSFSchema, GenericObjectType]>([
        ['true', { type: 'object', properties: { x: true } }, { x: { a: 1 } }],
        ['false', { type: 'object', properties: { x: false } }, { x: { a: 1 } }],
        [
          'true, nested',
          { type: 'object', properties: { x: { type: 'object', properties: { y: true } } } },
          { x: { y: { a: 1 } } },
        ],
      ])('keeps object data under a property whose schema is %s as it is', (_, schema, formData) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it.each<[string, RJSFSchema, GenericObjectType]>([
        [
          'an untyped property with an object default',
          { type: 'object', properties: { x: { default: { a: 1 } } } },
          { x: { a: 5 } },
        ],
        [
          'an untyped property under an object parent default',
          { type: 'object', default: { x: { a: 1 } }, properties: { x: {} } },
          { x: { a: 5 } },
        ],
        [
          'a type list property with an object default',
          { type: 'object', properties: { x: { type: ['array', 'object'], default: { a: 1 } } } },
          { x: { a: 5 } },
        ],
        [
          'an untyped property nested in an object',
          { type: 'object', properties: { x: { type: 'object', properties: { y: { default: { a: 1 } } } } } },
          { x: { y: { a: 5 } } },
        ],
      ])('keeps object data over the defaults of %s', (_, schema, formData) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it.each<[string, RJSFSchema, GenericObjectType]>([
        [
          'an integer',
          { type: 'object', default: { v: null }, properties: { v: { type: 'integer', default: 1 } } },
          { v: 1 },
        ],
        [
          'a boolean',
          { type: 'object', default: { b: null }, properties: { b: { type: 'boolean', default: true } } },
          { b: true },
        ],
        [
          'a tuple',
          {
            type: 'object',
            default: { t: null },
            properties: { t: { type: 'array', items: [{ type: 'integer', default: 1 }] } },
          },
          { t: [1] },
        ],
        [
          'an object, under a false ancestor default',
          {
            type: 'object',
            default: { o: false },
            properties: { o: { type: 'object', properties: { a: { type: 'number' } }, default: { a: 2 } } },
          },
          { o: { a: 2 } },
        ],
      ])(
        "gives a property's own default over an empty ancestor default its type can't hold, for %s, when ancestorWins",
        (_, schema, expected) => {
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { nestedDefaultsPrecedence: 'ancestorWins' } },
              { schema },
            ),
          ).toEqual(expected);
        },
      );
      it('stops following a selected option written as a $ref once it leads back to a $ref already followed', () => {
        const schema: RJSFSchema = {
          definitions: {
            a: { type: 'string', anyOf: [{ $ref: '#/definitions/b' }, { minLength: 1 }] },
            b: { type: 'string', default: 'b', anyOf: [{ $ref: '#/definitions/a' }, { maxLength: 3 }] },
          },
          $ref: '#/definitions/a',
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual('b');
      });
      it("computes a tuple's defaults from its selected option as it is rendered", () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'string', default: 'a' }],
          additionalItems: { type: 'string', default: 'z' },
          anyOf: [{ minItems: 3 }, { maxItems: 5 }],
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual(['a', 'z', 'z']);
      });
      it("seeds a field's selected option with the field's default, whether the option is a schema or true", () => {
        const schema: RJSFSchema = { type: 'string', default: 'x', anyOf: [true, { minLength: 1 }] };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual('x');
        expect(getDefaultFormState({ validator: testValidator }, { schema: { ...schema, anyOf: [{}] } })).toEqual('x');
      });
      it("adds both options' defaults to an object whose type comes through its allOf, as to one declaring it", () => {
        const field: RJSFSchema = {
          allOf: [{ $ref: '#/definitions/Base' }],
          anyOf: [{ properties: { a: { type: 'string', default: 'A' } } }],
          oneOf: [{ properties: { b: { type: 'string', default: 'B' } } }],
        };
        const withField = (v: RJSFSchema): RJSFSchema => ({
          definitions: { Base: { type: 'object', properties: { id: { type: 'string' } } } },
          type: 'object',
          properties: { v },
        });
        const expected = { v: { a: 'A', b: 'B' } };
        expect(getDefaultFormState({ validator: testValidator }, { schema: withField(field) })).toEqual(expected);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema: withField({ ...field, type: 'object' }) }),
        ).toEqual(expected);
      });
      it('should not populate defaults for empty anyOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              anyOf: [],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({});
      });
      it('should populate defaults from the schema itself beside an empty anyOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'a', anyOf: [] },
            nested: { type: 'object', properties: { b: { type: 'string', default: 'b' } }, anyOf: [] },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
          nested: { b: 'b' },
        });
      });
      it('should merge a default beside an empty anyOf with its parent default, as it would without the anyOf', () => {
        const child: RJSFSchema = {
          type: 'object',
          default: { b: 2 },
          properties: { a: { type: 'number' }, b: { type: 'number' } },
        };
        const withParent = (c: RJSFSchema): RJSFSchema => ({
          type: 'object',
          properties: { p: { type: 'object', default: { c: { a: 1 } }, properties: { c } } },
        });
        const expected = getDefaultFormState({ validator: testValidator }, { schema: withParent(child), formData: {} });
        expect(expected).toEqual({ p: { c: { a: 1, b: 2 } } });
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema: withParent({ ...child, anyOf: [] }), formData: {} },
          ),
        ).toEqual(expected);
      });
      it('should populate defaults for anyOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              anyOf: [
                { type: 'string', default: 'a' },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: 'a',
        });
      });
      it('should populate root defaults for anyOf', () => {
        const schema: RJSFSchema = {
          anyOf: [
            {
              properties: {
                first: {
                  title: 'First',
                  type: 'string',
                },
              },
            },
            {
              properties: {
                second: {
                  title: 'Second',
                  type: 'string',
                },
              },
            },
          ],
          default: {
            second: 'Second 2!',
          },
          type: 'object',
        };

        // Mock isValid so that withExactlyOneSubschema works as expected
        testValidator.setReturnValues({
          isValid: [
            false, // First anyOf... first === first
            false, // Second anyOf... second !== first
            false, // Third anyOf... second === second
            true, // Fourth anyOf... second === second
          ],
        });

        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          second: 'Second 2!',
        });
      });
      it('should populate nested default values for anyOf', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'object',
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {} })).toEqual({
          name: {
            first: 'First Name',
          },
        });
      });
      it('should not populate nested default values for anyOf, when not required', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'object',
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                { type: 'string', default: 'b' },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({ name: {} });
      });
      it('should populate nested default values for anyOf, when required is merged in', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'object',
              required: ['first'],
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: 'First Name' },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    first: { type: 'string', default: '1st Name' },
                  },
                },
              ],
            },
          },
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({
          name: {
            first: 'First Name',
          },
        });
      });
      it('should populate nested default values merging required fields', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['foo', 'bar'],
          properties: {
            foo: {
              type: 'string',
              default: 'fooVal',
            },
          },
          anyOf: [
            {
              properties: {
                bar: {
                  type: 'number',
                },
                baz: {
                  default: 'bazIsRequired',
                },
              },
              required: ['baz'],
            },
          ],
        };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                emptyObjectFields: 'populateRequiredDefaults',
              },
            },
            { schema, formData: {} },
          ),
        ).toEqual({ foo: 'fooVal', baz: 'bazIsRequired' });
      });
      it('should populate defaults for anyOf + dependencies', () => {
        const schema: RJSFSchema = {
          anyOf: [
            {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
            },
          ],
          dependencies: {
            name: {
              oneOf: [
                {
                  properties: {
                    name: {
                      type: 'string',
                    },
                    grade: {
                      type: 'string',
                      default: 'A',
                    },
                  },
                },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { name: 'Name' } })).toEqual({
          name: 'Name',
          grade: 'A',
        });
      });
      it('should populate defaults for anyOf second option', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            test: {
              anyOf: [
                { properties: { a: { type: 'string', default: 'a' } } },
                { properties: { b: { type: 'string', default: 'b' } } },
              ],
            },
          },
        };
        // Mock errors so that getMatchingOption works as expected
        testValidator.setReturnValues({ isValid: [false, false, false, true] });
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { test: { b: 'b' } } })).toEqual({
          test: { b: 'b' },
        });
      });
    });
    describe('with dependencies', () => {
      describe('a select over object constants (#5407)', () => {
        type Dependencies = NonNullable<RJSFSchema['dependencies']>;
        const defaultOfSelect = (
          field: RJSFSchema,
          {
            defaultOn = 'parent',
            behavior,
            formData,
          }: { defaultOn?: 'parent' | 'field' | 'none'; behavior?: DefaultFormStateBehavior; formData?: unknown } = {},
        ) =>
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: behavior },
            {
              schema: {
                type: 'object',
                ...(defaultOn === 'parent' && { default: { x: { a: 1 } } }),
                properties: {
                  x: {
                    type: 'object',
                    enum: [{ a: 1 }, { a: 2 }],
                    ...(defaultOn === 'field' && { default: { a: 1 } }),
                    ...field,
                  },
                },
              },
              formData,
            },
          );
        const pinningA2: Dependencies = { a: { const: { a: 2 } } };
        // No option declares `properties.a`, so this is applied as a `oneOf` beside `dependencies` is rather than as a
        // dynamic dependency's branches
        const branchWithoutKey: Dependencies = { a: { oneOf: [{ const: { a: 2 } }] } };
        const formDataInputs: [string, unknown][] = [
          ['no form data', undefined],
          ['empty form data', {}],
        ];
        it.each<[string, Dependencies, DefaultFormStateBehavior, unknown, unknown]>([
          ["gives a dependency's const over the inherited default", pinningA2, {}, undefined, { a: 2 }],
          ["gives a dependency's const over the inherited default for empty form data", pinningA2, {}, {}, { a: 2 }],
          [
            "gives a dependency's const over the inherited default when constAsDefaults is skipOneOf",
            pinningA2,
            { constAsDefaults: 'skipOneOf' },
            undefined,
            { a: 2 },
          ],
          [
            "gives a dependency's const over the inherited default when constAsDefaults is skipOneOf, for empty form data",
            pinningA2,
            { constAsDefaults: 'skipOneOf' },
            {},
            { a: 2 },
          ],
          [
            "keeps the inherited default over a dependency's const when constAsDefaults is never",
            pinningA2,
            { constAsDefaults: 'never' },
            undefined,
            { a: 1 },
          ],
          [
            "gives a dependency oneOf option's const over the inherited default when constAsDefaults is skipOneOf",
            branchWithoutKey,
            { constAsDefaults: 'skipOneOf' },
            {},
            { a: 2 },
          ],
          [
            "keeps the inherited default over a dependency oneOf option's const when constAsDefaults is never",
            branchWithoutKey,
            { constAsDefaults: 'never' },
            {},
            { a: 1 },
          ],
          [
            'keeps the inherited default under dependencies naming a schema it satisfies',
            { a: { properties: { c: { type: 'number' } } } },
            {},
            {},
            { a: 1 },
          ],
          [
            'keeps the inherited default under dependencies keyed by a property it lacks',
            { b: { const: { a: 2 } } },
            {},
            {},
            { a: 1 },
          ],
        ])('%s', (_, dependencies, behavior, formData, expected) => {
          expect(defaultOfSelect({ dependencies }, { behavior, formData })).toStrictEqual({ x: expected });
        });
        // Neither result was decided: the kept default lacks `b`, so the form starts invalid, and the const matches no
        // option, so the select starts with nothing chosen
        it.each<[string, Dependencies, unknown]>([
          ['keeps the inherited default under a property list it fails', { a: ['b'] }, { a: 1 }],
          ["gives a dependency's const that none of the select's options holds", { a: { const: { a: 3 } } }, { a: 3 }],
        ])('%s (current behaviour)', (_, dependencies, expected) => {
          expect(defaultOfSelect({ dependencies })).toStrictEqual({ x: expected });
        });
        it.each(formDataInputs)(
          "gives a dependency oneOf option's const over the inherited default for %s",
          (_, formData) => {
            expect(defaultOfSelect({ dependencies: branchWithoutKey }, { formData })).toStrictEqual({ x: { a: 2 } });
          },
        );
        it.each(formDataInputs)(
          "gives a dependency oneOf none of whose options declares the key its option's const without warning that it ignores it for %s",
          (_, formData) => {
            consoleWarnSpy.mockClear();
            expect(defaultOfSelect({ dependencies: branchWithoutKey }, { formData })).toStrictEqual({ x: { a: 2 } });
            expect(consoleWarnSpy).not.toHaveBeenCalledWith(
              `ignoring oneOf in dependencies of "a" because there isn't exactly one subschema that is valid`,
            );
          },
        );
        it.each<DefaultFormStateBehavior['constAsDefaults']>(['always', 'skipOneOf', 'never'])(
          'gives a dependency oneOf none of whose options declares the key the default a oneOf beside dependencies gets, under constAsDefaults %s',
          (constAsDefaults) => {
            const behavior = { constAsDefaults };
            expect(defaultOfSelect({ dependencies: branchWithoutKey }, { behavior })).toStrictEqual(
              defaultOfSelect({ oneOf: [{ const: { a: 2 } }], dependencies: { a: ['a'] } }, { behavior }),
            );
          },
        );
        it("gives a dependency's const over the select's own default", () => {
          expect(defaultOfSelect({ dependencies: pinningA2 }, { defaultOn: 'field' })).toStrictEqual({ x: { a: 2 } });
        });
        it("keeps the select's own default over a dependency's const when constAsDefaults is never", () => {
          expect(
            defaultOfSelect(
              { dependencies: pinningA2 },
              { defaultOn: 'field', behavior: { constAsDefaults: 'never' } },
            ),
          ).toStrictEqual({ x: { a: 1 } });
        });
        // getDefaultFormState fills in only what form data leaves out, so a dependency's const can't replace a value
        // that is there
        it("keeps form data over a dependency's const", () => {
          expect(defaultOfSelect({ dependencies: pinningA2 }, { formData: { x: { a: 1 } } })).toStrictEqual({
            x: { a: 1 },
          });
        });
        it("fills in no default when only a dependency's const names one", () => {
          expect(defaultOfSelect({ dependencies: pinningA2 }, { defaultOn: 'none' })).toStrictEqual({});
        });
      });
      it.each([
        'inline',
        'allOf',
        '$ref',
        'inside allOf',
        '$ref inside allOf',
        'nested allOf',
        'properties outside allOf',
      ])('should populate dependency defaults when formData is undefined with %s', (variant) => {
        testValidator.setReturnValues({ isValid: asRealValidator });
        const dependencySchema: RJSFSchema = {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'integer', default: 0 },
          },
          dependencies: {
            type: {
              oneOf: [
                {
                  properties: {
                    type: { enum: [0] },
                    value: { type: 'integer', default: 5 },
                  },
                  required: ['value'],
                },
                {
                  properties: {
                    type: { enum: [1] },
                  },
                },
              ],
            },
          },
        };
        let schema = dependencySchema;
        if (variant === '$ref') {
          schema = { $ref: '#/definitions/dep', definitions: { dep: dependencySchema } };
        } else if (variant === 'allOf') {
          schema = {
            ...dependencySchema,
            allOf: [{ properties: { fromAllOf: { type: 'string', default: 'A' } } }],
          };
        } else if (variant === 'inside allOf') {
          schema = { type: 'object', allOf: [dependencySchema] };
        } else if (variant === '$ref inside allOf') {
          schema = {
            type: 'object',
            allOf: [{ $ref: '#/definitions/dep' }],
            definitions: { dep: dependencySchema },
          };
        } else if (variant === 'nested allOf') {
          schema = { type: 'object', allOf: [{ allOf: [dependencySchema] }] };
        } else if (variant === 'properties outside allOf') {
          schema = {
            type: 'object',
            properties: dependencySchema.properties,
            allOf: [{ dependencies: dependencySchema.dependencies }],
          };
        }
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({
          type: 0,
          value: 5,
          ...(variant === 'allOf' ? { fromAllOf: 'A' } : {}),
        });
      });
      it('should count a default as the value of a root dependencies entry whatever else the form data holds, as a nested entry does', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { animal: { type: 'string', default: 'Cat' }, other: { type: 'string' } },
          dependencies: { animal: { properties: { food: { type: 'string', default: 'meat' } } } },
        };
        const nested: RJSFSchema = { type: 'object', properties: { n: schema } };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { other: 'x' }, rootSchema: schema }),
        ).toEqual({ animal: 'Cat', other: 'x', food: 'meat' });
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema: nested, formData: { n: { other: 'x' } }, rootSchema: nested },
          ),
        ).toEqual({ n: { animal: 'Cat', other: 'x', food: 'meat' } });
      });
      it('should populate dependency defaults when formData is an empty object', () => {
        testValidator.setReturnValues({ isValid: [true] });
        const schema: RJSFSchema = {
          type: 'object',
          properties: { type: { type: 'integer', default: 0 } },
          dependencies: {
            type: {
              oneOf: [{ properties: { type: { enum: [0] }, value: { type: 'integer', default: 5 } } }],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {}, rootSchema: schema })).toEqual(
          { type: 0, value: 5 },
        );
      });
      it.each([undefined, {}])(
        'should resolve dependency references without rootSchema and with formData=%j',
        (formData) => {
          testValidator.setReturnValues({ isValid: [true] });
          const schema: RJSFSchema = {
            type: 'object',
            definitions: { extra: { type: 'string', default: 'RefDefault' } },
            properties: { type: { type: 'integer', default: 0 } },
            dependencies: {
              type: {
                oneOf: [{ properties: { type: { enum: [0] }, extraField: { $ref: '#/definitions/extra' } } }],
              },
            },
          };
          expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual({
            type: 0,
            extraField: 'RefDefault',
          });
        },
      );
      describe.each(['oneOf', 'anyOf'])('inside %s', (keyword) => {
        it.each([undefined, {}])(
          'should resolve dependency references without rootSchema and with formData=%j',
          (formData) => {
            const schema: RJSFSchema = {
              type: 'object',
              definitions: { extra: { type: 'string', default: 'RefDefault' } },
              [keyword]: [
                {
                  properties: { type: { type: 'integer', default: 0 } },
                  dependencies: {
                    type: {
                      properties: { extraField: { $ref: '#/definitions/extra' } },
                    },
                  },
                },
              ],
            };
            expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual({
              type: 0,
              extraField: 'RefDefault',
            });
          },
        );
      });
      it('should preserve dependency defaults when resolving a conditional branch', () => {
        const schema: RJSFSchema = {
          type: 'object',
          if: {},
          then: {
            properties: { name: { type: 'string', default: 'Name' } },
            dependencies: { name: { properties: { grade: { type: 'string', default: 'A' } } } },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({ name: 'Name', grade: 'A' });
      });
      it('should preserve dependency defaults when merging matching pattern properties', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            child: {
              type: 'object',
              properties: { name: { type: 'string', default: 'Name' } },
              dependencies: { name: { properties: { grade: { type: 'string', default: 'A' } } } },
            },
          },
          patternProperties: { '^child$': { type: 'object' } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          child: { name: 'Name', grade: 'A' },
        });
      });
      it('should populate defaults for dependencies', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          dependencies: {
            name: {
              oneOf: [
                {
                  properties: {
                    name: {
                      type: 'string',
                    },
                    grade: {
                      type: 'string',
                      default: 'A',
                    },
                  },
                },
              ],
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { name: 'Name' } })).toEqual({
          name: 'Name',
          grade: 'A',
        });
      });
      it('should populate defaults for nested dependencies', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
              },
              dependencies: {
                name: {
                  oneOf: [
                    {
                      properties: {
                        name: {
                          type: 'string',
                        },
                        grade: {
                          type: 'string',
                          default: 'A',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { foo: { name: 'Name' } } }),
        ).toEqual({
          foo: {
            name: 'Name',
            grade: 'A',
          },
        });
      });
      it('should populate defaults for nested dependencies in arrays', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            properties: {
              foo: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                },
                dependencies: {
                  name: {
                    oneOf: [
                      {
                        properties: {
                          name: {
                            type: 'string',
                          },
                          grade: {
                            type: 'string',
                            default: 'A',
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: [{ foo: { name: 'Name' } }] }),
        ).toEqual([
          {
            foo: {
              name: 'Name',
              grade: 'A',
            },
          },
        ]);
      });
      it('should populate defaults for nested dependencies in arrays that sit below another object', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            outer: {
              type: 'object',
              properties: {
                rows: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                    },
                    dependencies: {
                      name: {
                        oneOf: [
                          {
                            properties: {
                              name: {
                                type: 'string',
                              },
                              grade: {
                                type: 'string',
                                default: 'A',
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { outer: { rows: [{ name: 'Name' }] } } },
          ),
        ).toEqual({
          outer: {
            rows: [
              {
                name: 'Name',
                grade: 'A',
              },
            ],
          },
        });
      });
      it("applies a dependency's oneOf option that declares the property in an allOf entry", () => {
        testValidator.setReturnValues({ isValid: asRealValidator });
        const schema: RJSFSchema = {
          type: 'object',
          properties: { k: { type: 'string', enum: ['a', 'b'] } },
          dependencies: {
            k: {
              oneOf: [
                {
                  allOf: [{ properties: { k: { enum: ['a'] } } }],
                  properties: { ka: { type: 'string', default: 'A' } },
                },
                {
                  allOf: [{ properties: { k: { enum: ['b'] } } }],
                  properties: { kb: { type: 'string', default: 'B' } },
                },
              ],
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: { k: 'b' } }),
        ).toEqual({ k: 'b', kb: 'B' });
      });
      it('should populate defaults for nested dependencies in arrays when matching enum values in oneOf', () => {
        // The mock validator cannot evaluate a dependency's `oneOf`, so it answers each check as the real ones do
        testValidator.setReturnValues({ isValid: asRealValidator });
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            properties: {
              foo: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                },
                dependencies: {
                  name: {
                    oneOf: [
                      {
                        properties: {
                          name: {
                            enum: ['first'],
                          },
                          grade: {
                            type: 'string',
                            default: 'A',
                          },
                        },
                      },
                      {
                        properties: {
                          name: {
                            enum: ['second'],
                          },
                          grade: {
                            type: 'string',
                            default: 'B',
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: [{ foo: { name: 'first' } }, { foo: { name: 'second' } }, { foo: { name: 'third' } }] },
          ),
        ).toEqual([
          {
            foo: {
              name: 'first',
              grade: 'A',
            },
          },
          {
            foo: {
              name: 'second',
              grade: 'B',
            },
          },
          {
            foo: {
              name: 'third',
            },
          },
        ]);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          `ignoring oneOf in dependencies of "name" because there isn't exactly one subschema that is valid`,
        );
      });
      it('should populate defaults for nested oneOf + dependencies', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: {
              oneOf: [
                {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                  },
                },
              ],
              dependencies: {
                name: {
                  oneOf: [
                    {
                      properties: {
                        name: {
                          type: 'string',
                        },
                        grade: {
                          type: 'string',
                          default: 'A',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { foo: { name: 'Name' } } }),
        ).toEqual({
          foo: {
            name: 'Name',
            grade: 'A',
          },
        });
      });
      it('should populate defaults for properties to ensure the dependencies conditions are resolved based on it', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['authentication'],
          properties: {
            authentication: {
              title: 'Authentication',
              type: 'object',
              properties: {
                credentialType: {
                  title: 'Credential type',
                  type: 'string',
                  default: 'username',
                  oneOf: [
                    {
                      const: 'username',
                      title: 'Username and password',
                    },
                    {
                      const: 'secret',
                      title: 'SSO',
                    },
                  ],
                },
              },
              dependencies: {
                credentialType: {
                  allOf: [
                    {
                      if: {
                        properties: {
                          credentialType: {
                            const: 'username',
                          },
                        },
                      },
                      then: {
                        properties: {
                          usernameAndPassword: {
                            type: 'object',
                            properties: {
                              username: {
                                type: 'string',
                                title: 'Username',
                              },
                              password: {
                                type: 'string',
                                title: 'Password',
                              },
                            },
                            required: ['username', 'password'],
                          },
                        },
                        required: ['usernameAndPassword'],
                      },
                    },
                    {
                      if: {
                        properties: {
                          credentialType: {
                            const: 'secret',
                          },
                        },
                      },
                      then: {
                        properties: {
                          sso: {
                            type: 'string',
                            title: 'SSO',
                          },
                        },
                        required: ['sso'],
                      },
                    },
                  ],
                },
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          authentication: {
            credentialType: 'username',
            usernameAndPassword: {},
          },
        });
      });
      it('should populate defaults for nested dependencies when formData passed to computeDefaults is undefined', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            can_1: {
              type: 'object',
              properties: {
                phy: {
                  title: 'Physical',
                  description: 'XYZ',
                  type: 'object',
                  properties: {
                    bit_rate_cfg_mode: {
                      title: 'Sub title',
                      description: 'XYZ',
                      type: 'integer',
                      default: 0,
                    },
                  },
                  dependencies: {
                    bit_rate_cfg_mode: {
                      oneOf: [
                        {
                          properties: {
                            bit_rate_cfg_mode: {
                              enum: [0],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema })).toEqual({
          can_1: {
            phy: {
              bit_rate_cfg_mode: 0,
            },
          },
        });
      });
      it('should not crash for defaults for nested dependencies when formData passed to computeDefaults is null', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            can_1: {
              type: 'object',
              properties: {
                phy: {
                  title: 'Physical',
                  description: 'XYZ',
                  type: 'object',
                  properties: {
                    bit_rate_cfg_mode: {
                      title: 'Sub title',
                      description: 'XYZ',
                      type: 'integer',
                      default: 0,
                    },
                  },
                  dependencies: {
                    bit_rate_cfg_mode: {
                      oneOf: [
                        {
                          properties: {
                            bit_rate_cfg_mode: {
                              enum: [0],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { can_1: { phy: null } } }),
        ).toEqual({
          can_1: {
            phy: null,
          },
        });
      });
    });
    describe('with schema keys not defined in the formData', () => {
      it('shouldn`t add in undefined keys to formData', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
        };
        const formData = {
          foo: 'foo',
          baz: 'baz',
        };
        const result = {
          foo: 'foo',
          baz: 'baz',
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(result);
      });
    });
    describe('object with defaults and undefined in formData, testing mergeDefaultsIntoFormData', () => {
      let schema: RJSFSchema;
      let defaultedFormData: unknown;
      beforeAll(() => {
        schema = {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              default: 'foo',
            },
          },
          required: ['field'],
        };
        defaultedFormData = { field: 'foo' };
      });
      it('returns field value of default when formData is empty', () => {
        const formData = {};
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(defaultedFormData);
      });
      it('returns field value of undefined when formData has undefined for field', () => {
        const formData = { field: undefined };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(formData);
      });
      it('returns field value of default when formData has undefined for field and `useDefaultIfFormDataUndefined`', () => {
        const formData = { field: undefined };
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: {
                mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined',
              },
            },
            { schema, formData },
          ),
        ).toEqual(defaultedFormData);
      });
    });
    it('should return undefined defaults for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
          },
        },
      };
      expect(
        getDefaultFormState(
          { validator: testValidator },
          { schema, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({
        requiredArray: [undefined, undefined],
      });
    });
    it('should not combine defaults with raw form data for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
          },
        },
      };
      expect(
        getDefaultFormState(
          { validator: testValidator },
          { schema, formData: { requiredArray: ['raw0'] }, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({
        requiredArray: ['raw0'],
      });
    });
    it('should combine ALL defaults with raw form data for a array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
          },
        },
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: { mergeExtraDefaults: true },
            },
          },
          { schema, formData: { requiredArray: ['raw0'] }, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({
        requiredArray: ['raw0', undefined],
      });
    });
    it('should return given defaults for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string', default: 'default0' },
            minItems: 2,
          },
        },
        required: ['requiredArray'],
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: { populate: 'requiredOnly' },
            },
          },
          { schema, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({ requiredArray: ['default0', 'default0'] });
    });
    it('should not combine defaults with raw form data for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string', default: 'default0' },
            minItems: 2,
          },
        },
        required: ['requiredArray'],
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: { populate: 'requiredOnly' },
            },
          },
          { schema, formData: { requiredArray: ['raw0'] }, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({ requiredArray: ['raw0'] });
    });
    it('should combine ALL defaults with raw form data for a required array property with minItems', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          requiredArray: {
            type: 'array',
            items: { type: 'string', default: 'default0' },
            minItems: 2,
          },
        },
        required: ['requiredArray'],
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: { populate: 'requiredOnly', mergeExtraDefaults: true },
            },
          },
          { schema, formData: { requiredArray: ['raw0'] }, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({ requiredArray: ['raw0', 'default0'] });
    });
    it('should not populate defaults for array items when computeSkipPopulate returns true', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          stringArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          numberArray: {
            type: 'array',
            items: { type: 'number' },
            minItems: 1,
          },
        },
        required: ['stringArray', 'numberArray'],
      };
      expect(
        getDefaultFormState(
          {
            validator: testValidator,
            defaultFormStateBehavior: {
              arrayMinItems: {
                computeSkipPopulate: (_, schema) =>
                  !Array.isArray(schema?.items) &&
                  typeof schema?.items !== 'boolean' &&
                  schema?.items?.type === 'number',
              },
            },
          },
          { schema, formData: {}, rootSchema: schema, includeUndefinedValues: false },
        ),
      ).toEqual({ stringArray: [undefined], numberArray: [] });
    });
    it('handles a `null` default value', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          empty: {
            type: 'null',
            default: null,
          },
        },
      };
      expect(getDefaultFormState({ validator: testValidator }, { schema, formData: {}, rootSchema: schema })).toEqual({
        empty: null,
      });
    });

    describe.each(['skipDefaults', 'populateRequiredDefaults'] as const)(
      'the null of a missing null value under emptyObjectFields: %s',
      (emptyObjectFields) => {
        const defaultsOf = (schema: RJSFSchema, formData?: unknown) =>
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
            { schema, formData, rootSchema: schema },
          );

        it('is filled in for an optional property, through a `$ref` and inside an optional object', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              n: { type: 'null' },
              viaRef: { $ref: '#/$defs/alias' },
              o: { type: 'object', properties: { n: { $ref: '#/$defs/none' }, s: { type: 'string', default: 'x' } } },
            },
            $defs: { alias: { $ref: '#/$defs/none' }, none: { type: 'null' } },
          };
          expect(defaultsOf(schema)).toEqual({ n: null, viaRef: null, o: { n: null } });
        });

        it('is filled in again when the same schema is read a second time in the same context', () => {
          const context = { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } };
          const schema: RJSFSchema = { type: 'object', properties: { n: { type: 'null' } } };
          expect(getDefaultFormState(context, { schema, rootSchema: schema })).toEqual({ n: null });
          expect(getDefaultFormState(context, { schema, rootSchema: schema })).toEqual({ n: null });
        });

        it.each<[string, RJSFSchema, unknown?]>([
          ['allOf', { type: 'object', allOf: [{ properties: { n: { type: 'null' } }, required: ['n'] }] }],
          [
            'if/then',
            {
              type: 'object',
              properties: { k: { type: 'string' } },
              if: { properties: { k: { const: 'x' } } },
              then: { properties: { n: { type: 'null' } } },
            },
          ],
          [
            'dependencies',
            {
              type: 'object',
              properties: { k: { type: 'string' } },
              dependencies: { k: { properties: { n: { type: 'null' } } } },
            },
            { a: { k: 'x' } },
          ],
        ])('is filled in inside an optional object for a property its %s brings in', (_, objectSchema, formData) => {
          const schema: RJSFSchema = { type: 'object', properties: { a: objectSchema } };
          expect(defaultsOf(schema, formData)).toEqual({ a: expect.objectContaining({ n: null }) });
        });

        it('is filled in for a property that is null only through its own allOf or if/then/else', () => {
          const schema: RJSFSchema = {
            type: 'object',
            required: ['wrapped', 'plain', 'conditional'],
            properties: {
              wrapped: { description: 'x', allOf: [{ $ref: '#/$defs/none' }] },
              plain: { allOf: [{ type: 'null' }] },
              conditional: { if: { minLength: 1 }, then: { type: 'null' }, else: { type: 'null' } },
            },
            $defs: { none: { type: 'null' } },
          };
          expect(defaultsOf(schema)).toEqual({ wrapped: null, plain: null, conditional: null });
        });

        it("is filled in for an own property the object's allOf makes null", () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              a: {
                type: 'object',
                properties: { n: { title: 'N' } },
                allOf: [{ properties: { n: { type: 'null' } }, required: ['n'] }],
              },
            },
          };
          expect(defaultsOf(schema)).toEqual({ a: { n: null } });
        });

        it("is filled in as an own key for a property named __proto__ the object's allOf makes null", () => {
          const schema: RJSFSchema = JSON.parse(
            '{"type":"object","properties":{"a":{"type":"object","properties":{"__proto__":{"title":"P"}},"allOf":[{"properties":{"__proto__":{"type":"null"}},"required":["__proto__"]}]}}}',
          );
          const result = defaultsOf(schema);
          const a = isObject(result) ? result.a : undefined;
          expect(Object.getPrototypeOf(a)).toBe(Object.prototype);
          expect(Object.getOwnPropertyDescriptor(a, '__proto__')).toMatchObject({ value: null, enumerable: true });
        });

        it('is filled in for an array item and an additional property the data holds', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              arr: {
                type: 'array',
                items: { type: 'object', properties: { n: { type: 'null' }, s: { type: 'string' } }, required: ['n'] },
              },
              extra: { type: 'object', additionalProperties: { type: 'object', properties: { n: { type: 'null' } } } },
            },
          };
          expect(defaultsOf(schema, { arr: [{ s: 'x' }], extra: { k: {} } })).toEqual({
            arr: [{ s: 'x', n: null }],
            extra: { k: { n: null } },
          });
        });

        it('is filled in for a null schema with a `default: null`, directly and through a `$ref`', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              d: { type: 'null', default: null },
              o: { type: 'object', properties: { d: { type: 'null', default: null } } },
              r: { $ref: '#/$defs/nullDefault' },
            },
            $defs: { nullDefault: { type: 'null', default: null } },
          };
          expect(defaultsOf(schema)).toEqual({ d: null, o: { d: null }, r: null });
        });

        it('is not added for an optional object the optional data controls render without its fields', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { o: { type: 'object', properties: { n: { type: 'null' }, s: { type: 'string' } } } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
              {
                schema,
                rootSchema: schema,
                uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
              },
            ),
          ).toEqual({});
        });

        it('is not looked for in an allOf that brings in no property', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'object', allOf: [{ minProperties: 0 }] } },
          };
          expect(defaultsOf(schema)).toEqual({});
        });

        it('is filled in for a property an allOf of the root brings in', () => {
          const schema: RJSFSchema = { type: 'object', allOf: [{ properties: { n: { type: 'null' } } }] };
          expect(defaultsOf(schema)).toEqual({ n: null });
        });

        it('is filled in alone among the properties an allOf brings in', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              a: {
                type: 'object',
                allOf: [{ properties: { s: { type: 'string', default: 'x' }, n: { type: 'null' } } }],
              },
            },
          };
          expect(defaultsOf(schema)).toEqual({ a: { n: null } });
        });

        it('is filled in for a property an allOf brings into an item of a tuple', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              pair: {
                type: 'array',
                items: [{ type: 'object', allOf: [{ properties: { n: { type: 'null' } } }] }],
              },
            },
          };
          expect(defaultsOf(schema, { pair: [{}] })).toEqual({ pair: [{ n: null }] });
        });

        it('is looked for, and not found, in an allOf that brings in no property of a schema that allows null', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              a: { type: 'object', allOf: [{ minProperties: 0 }] },
              s: { type: ['string', 'null'] },
              t: { type: ['string', 'number'] },
            },
          };
          expect(defaultsOf(schema)).toEqual({});
        });

        it('is not added for a `default: null` of another type', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              s: { type: 'string', default: null },
              viaRef: { $ref: '#/$defs/text', default: null },
              o: { type: 'object', properties: { s: { type: 'string', default: 'x' } } },
            },
            $defs: { text: { $ref: '#/$defs/string' }, string: { type: 'string' } },
          };
          expect(defaultsOf(schema)).toEqual({});
        });
      },
    );

    describe.each(['populateAllDefaults', 'populateRequiredDefaults', 'skipEmptyDefaults', 'skipDefaults'] as const)(
      'an optional object the optional data controls render collapsed, under emptyObjectFields: %s',
      (emptyObjectFields) => {
        const collapsedDefaultsOf = (schema: RJSFSchema) =>
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
            {
              schema,
              rootSchema: schema,
              uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
            },
          );

        it('is left out with the null schema it holds when its oneOf options name no type', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              opt: {
                type: 'object',
                properties: { s: { type: 'string' }, n: { type: 'null' } },
                oneOf: [{ required: ['s'] }, { required: ['n'] }],
              },
            },
          };
          expect(collapsedDefaultsOf(schema)).toEqual({});
        });

        it('is left out with the null schema it holds, as it would be without one', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              opt: { type: 'object', required: ['s'], properties: { s: { type: 'string' }, n: { type: 'null' } } },
            },
          };
          expect(collapsedDefaultsOf(schema)).toEqual({});
        });

        it('fills in no null in an optional object inside it', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              opt: {
                type: 'object',
                properties: { inner: { type: 'object', properties: { n: { type: 'null' } } } },
              },
            },
          };
          expect(collapsedDefaultsOf(schema)).toEqual({});
        });

        it.each<[string, (opt: RJSFSchema) => RJSFSchema]>([
          ['an allOf', (opt) => ({ type: 'object', allOf: [{ properties: { opt } }] })],
          [
            'an if/then',
            (opt) => ({ type: 'object', if: { properties: { s: { const: 'x' } } }, then: { properties: { opt } } }),
          ],
        ])('is left out where %s of an object below the root brings it in, as where the object names it', (_, of) => {
          const opt: RJSFSchema = { type: 'object', properties: { n: { type: 'null' } } };
          const withOpt = (o: RJSFSchema): RJSFSchema => ({
            type: 'object',
            required: ['o'],
            properties: { o: { ...o, properties: { s: { type: 'string' }, ...o.properties } } },
          });
          const defaultsOf = (schema: RJSFSchema) =>
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
              {
                schema,
                rootSchema: schema,
                formData: { o: { s: 'x' } },
                uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
              },
            );
          const broughtIn = defaultsOf(withOpt(of(opt)));
          expect(broughtIn).toEqual({ o: { s: 'x' } });
          expect(broughtIn).toEqual(defaultsOf(withOpt({ type: 'object', properties: { opt } })));
        });

        it('fills in the null of one the data holds as an empty object, which the controls show as added', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { opt: { type: 'object', properties: { n: { type: 'null' } } } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
              {
                schema,
                rootSchema: schema,
                formData: { opt: {} },
                uiSchema: { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } },
              },
            ),
          ).toEqual({ opt: { n: null } });
        });

        it('fills in the null of one its own defaults add, which renders its fields', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              opt: { type: 'object', properties: { s: { type: 'string', default: 'x' }, n: { type: 'null' } } },
            },
          };
          // The settings that add an optional object holding a default
          const isAdded = emptyObjectFields === 'populateAllDefaults' || emptyObjectFields === 'skipEmptyDefaults';
          expect(collapsedDefaultsOf(schema)).toEqual(isAdded ? { opt: { s: 'x', n: null } } : {});
        });

        it('still fills in the null of a required one, which renders its fields', () => {
          const schema: RJSFSchema = {
            type: 'object',
            required: ['req'],
            properties: { req: { type: 'object', properties: { n: { type: 'null' } } } },
          };
          expect(collapsedDefaultsOf(schema)).toEqual({ req: { n: null } });
        });

        it('fills in the null of a ui:required one, which renders its fields, as without the controls', () => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: { opt: { type: 'object', properties: { n: { type: 'null' } } } },
          };
          const defaultsWith = (uiSchema: UiSchema) =>
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
              { schema, rootSchema: schema, uiSchema },
            );
          const uiRequired: UiSchema = { opt: { 'ui:required': true } };
          expect(
            defaultsWith({ ...uiRequired, 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } }),
          ).toEqual(defaultsWith(uiRequired));
        });

        it('is left out when the `ui:definitions` entry of the definition it references asks for the controls', () => {
          const schema: RJSFSchema = {
            type: 'object',
            definitions: { Opt: { type: 'object', properties: { n: { type: 'null' } } } },
            properties: { opt: { $ref: '#/definitions/Opt' } },
          };
          expect(
            getDefaultFormState(
              { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
              {
                schema,
                rootSchema: schema,
                uiSchema: {
                  'ui:definitions': {
                    '#/definitions/Opt': { 'ui:options': { enableOptionalDataFieldForType: ['object'] } },
                  },
                },
              },
            ),
          ).toEqual({});
        });
      },
    );

    describe('an optional object an allOf of an object below the root brings in', () => {
      const opt: RJSFSchema = { type: 'object', properties: { n: { type: 'null' } } };

      it('is left out when its own uiSchema entry asks for the optional data controls', () => {
        // A property schema of `true` beside it, which names no field of its own
        const schema: RJSFSchema = {
          type: 'object',
          required: ['o'],
          properties: { o: { type: 'object', allOf: [{ properties: { opt, any: true } }] } },
        };
        const formData: GenericObjectType = { o: {} };
        const uiSchema: UiSchema<GenericObjectType> = {
          o: { opt: { 'ui:options': { enableOptionalDataFieldForType: ['object'] } } },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData, uiSchema }),
        ).toEqual({ o: {} });
      });

      it('is left out as an additional property when the entry its additional properties share asks for the controls', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['o'],
          properties: { o: { type: 'object', allOf: [{ additionalProperties: opt }] } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema,
              rootSchema: schema,
              formData: { o: { k: undefined } },
              uiSchema: {
                o: { additionalProperties: { 'ui:options': { enableOptionalDataFieldForType: ['object'] } } },
              },
            },
          ),
        ).toEqual({ o: { k: undefined } });
      });
    });

    describe('a null the user left in the data', () => {
      const nullableItems: RJSFSchema = { type: 'array', items: { type: ['string', 'null'], default: 'd' } };
      it.each<[string, RJSFSchema, unknown, unknown]>([
        ['an item of a type list', nullableItems, [null], [null]],
        [
          'an item offering anyOf options',
          { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'null' }], default: 'd' } },
          [null],
          [null],
        ],
        [
          'an array inside an object',
          { type: 'object', properties: { a: nullableItems } },
          { a: [null, 'x'] },
          { a: [null, 'x'] },
        ],
        ['a tuple entry', { type: 'array', items: [{ type: ['string', 'null'], default: 'd' }] }, [null], [null]],
      ])('is kept for %s', (_name, schema, formData, expected) => {
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData })).toEqual(expected);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData, initialDefaultsGenerated: true }),
        ).toEqual(expected);
      });
      it.each<NonNullable<DefaultFormStateBehavior['emptyObjectFields']>>([
        'populateAllDefaults',
        'populateRequiredDefaults',
        'skipEmptyDefaults',
        'skipDefaults',
      ])('is kept for the keys of an object under emptyObjectFields %s', (emptyObjectFields) => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            a: { type: ['string', 'null'], default: 'd' },
            o: { type: ['object', 'null'], properties: { x: { type: 'string', default: 'd' } } },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { emptyObjectFields } },
            { schema, formData: { a: null, o: null } },
          ),
        ).toEqual({ a: null, o: null });
      });
      it('takes the default under useDefaultIfFormDataUndefined', () => {
        expect(
          getDefaultFormState(
            {
              validator: testValidator,
              defaultFormStateBehavior: { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' },
            },
            { schema: nullableItems, formData: [null] },
          ),
        ).toEqual(['d']);
      });
      it('takes the default as the whole form data', () => {
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema: { type: ['string', 'null'], default: 'd' }, formData: null },
          ),
        ).toBe('d');
      });
    });

    describe('where a null fill can come from', () => {
      it('is filled in from a definition a typeless allOf reaches through a $ref', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { n: { allOf: [{ $ref: '#/definitions/Nothing' }] } },
          definitions: { Nothing: { type: 'null' } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({ n: null });
      });

      it("fills in nothing from an object's allOf that declares no properties, whatever else the root holds", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { n: { type: 'null' }, o: { type: 'object', allOf: [{ $ref: '#/definitions/Described' }] } },
          definitions: { Described: { description: 'An object' } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({ n: null });
      });
    });

    describe('the null of a null value the data holds as `undefined`', () => {
      it('is filled in, as for a missing one', () => {
        const schema: RJSFSchema = {
          type: 'object',
          required: ['n'],
          properties: {
            n: { type: 'null' },
            s: { type: 'string' },
            a: { type: 'object', properties: { n: { type: 'null' } } },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, formData: { n: undefined, s: 'a', a: { n: undefined } } },
          ),
        ).toEqual({ n: null, s: 'a', a: { n: null } });
      });

      it('is filled in for an object schema with an object `default` and no `type`, leaving the data as it was', () => {
        const schema: RJSFSchema = {
          properties: {
            n: { type: 'null' },
            s: { type: 'string' },
            a: { type: 'object', properties: { n: { type: 'null' } } },
            arr: { type: 'array', items: { type: 'object', properties: { n: { type: 'null' } } } },
          },
          default: {},
        };
        const formData = { n: undefined, s: 'a', a: { n: undefined }, arr: [{ n: undefined }] };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData })).toEqual({
          n: null,
          s: 'a',
          a: { n: null },
          arr: [{ n: null }],
        });
        expect(formData).toEqual({ n: undefined, s: 'a', a: { n: undefined }, arr: [{ n: undefined }] });
      });

      it.each<[string, RJSFSchema]>([
        ['an additional property', { type: 'object', additionalProperties: { type: 'null' } }],
        ['a property an allOf brings in', { type: 'object', allOf: [{ properties: { n: { type: 'null' } } }] }],
      ])('is filled in for %s of an object below the root, as for one of the root', (_, nested) => {
        const schema: RJSFSchema = { type: 'object', properties: { o: nested } };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, formData: { o: { n: undefined } } },
          ),
        ).toEqual({ o: { n: null } });
      });

      it('is not filled in for a value of another type', () => {
        const schema: RJSFSchema = { type: 'object', properties: { s: { type: 'string', default: null } } };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: { s: undefined } }),
        ).toEqual({ s: undefined });
      });

      // The data's `undefined` wins over every default of the object, as it does for an object that holds no null schema
      const holder: RJSFSchema = {
        type: 'object',
        properties: { n: { type: 'null' }, s: { type: 'string', default: 'x' } },
      };
      it.each<[string, RJSFSchema, GenericObjectType, boolean]>([
        ['a property', { type: 'object', properties: { p: holder } }, { p: undefined }, false],
        [
          'a property an allOf brings in',
          { type: 'object', properties: { o: { type: 'object', allOf: [{ properties: { p: holder } }] } } },
          { o: { p: undefined } },
          false,
        ],
        [
          'an additional property',
          { type: 'object', properties: { o: { type: 'object', additionalProperties: holder } } },
          { o: { p: undefined } },
          false,
        ],
        [
          'an additional property, once the defaults are generated',
          { type: 'object', properties: { o: { type: 'object', additionalProperties: holder } } },
          { o: { p: undefined } },
          true,
        ],
        [
          'an anyOf/oneOf property',
          { type: 'object', properties: { p: { oneOf: [holder, { type: 'string' }] } } },
          { p: undefined },
          false,
        ],
      ])(
        'is not filled in for an object holding a null field that is %s the data holds as undefined',
        (_, schema, formData, initialDefaultsGenerated) => {
          expect(
            getDefaultFormState(
              { validator: testValidator },
              { schema, rootSchema: schema, formData, initialDefaultsGenerated },
            ),
          ).toEqual(formData);
        },
      );
    });

    describe('the null of an additional property of an object below the root, once the defaults are generated', () => {
      const defaultsOf = (additionalProperties: RJSFSchema, formData: GenericObjectType) => {
        const schema: RJSFSchema = { type: 'object', properties: { o: { type: 'object', additionalProperties } } };
        return getDefaultFormState(
          { validator: testValidator },
          { schema, rootSchema: schema, formData, initialDefaultsGenerated: true },
        );
      };

      it('is filled in for a value the data holds as undefined', () => {
        expect(defaultsOf({ type: 'null' }, { o: { k: undefined } })).toEqual({ o: { k: null } });
      });

      it('is filled in beside the properties the object names, which are left to their own defaults', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            o: { type: 'object', properties: { s: { type: 'string' } }, additionalProperties: { type: 'null' } },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, formData: { o: { s: 'a', k: undefined } }, initialDefaultsGenerated: true },
          ),
        ).toEqual({ o: { s: 'a', k: null } });
      });

      it('is filled in by getObjectDefaults() for an object it is handed alone', () => {
        const schema: RJSFSchema = { type: 'object', additionalProperties: { type: 'null' } };
        expect(
          getObjectDefaults({ validator: testValidator }, schema, {
            rootSchema: schema,
            rawFormData: { k: undefined },
            initialDefaultsGenerated: true,
          }),
        ).toEqual({ k: null });
      });

      it('is filled in alone in an object the data holds, which takes no other default', () => {
        const additionalProperties: RJSFSchema = {
          type: 'object',
          properties: { n: { type: 'null' }, s: { type: 'string', default: 'x' } },
        };
        expect(defaultsOf(additionalProperties, { o: { k: {} } })).toEqual({ o: { k: { n: null } } });
      });

      it('leaves an additional property that holds no null fill as the data holds it', () => {
        expect(defaultsOf({ type: 'object', properties: { s: { default: 'x' } } }, { o: { k: {} } })).toEqual({
          o: { k: {} },
        });
      });

      it('leaves a value of a nullable type, whose field renders the type beside null, as it is held', () => {
        expect(defaultsOf({ type: ['string', 'null'] }, { o: { k: undefined } })).toEqual({ o: { k: undefined } });
      });
    });

    describe('the null of an anyOf/oneOf option', () => {
      const defaultsOf = (option: RJSFSchema) => {
        const schema: RJSFSchema = { type: 'object', properties: { p: { oneOf: [option, { type: 'string' }] } } };
        return getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema });
      };

      it('is left out for an option of `type: "null"`, which renders no field', () => {
        expect(defaultsOf({ type: 'null' })).toEqual({});
      });

      it.each<[string, RJSFSchema]>([
        ["`type: ['null']`", { type: ['null'] }],
        ['`const: null`', { const: null }],
      ])('is filled in for an option of %s, which renders a field', (_, option) => {
        expect(defaultsOf(option)).toEqual({ p: null });
      });

      it('is left out for an option that is `type: "null"` once its allOf is merged', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { p: { oneOf: [{ allOf: [{ type: 'null' }] }, { type: 'string' }] } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
            { schema, rootSchema: schema },
          ),
        ).toEqual({});
      });
    });

    describe('array object reference sharing fix (issue #4756)', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          config: {
            oneOf: [
              {
                title: 'List Configuration',
                properties: {
                  items: {
                    type: 'array',
                    minItems: 2,
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
                required: ['items'],
              },
            ],
          },
        },
      };

      it('should create independent object instances for array items via getDefaultFormState', () => {
        const result = getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema }) as {
          config: { items: { field?: string }[] };
        };

        expect(result).toStrictEqual({ config: { items: [{}, {}] } });

        // Verify that modifying properties of one array item doesn't affect others
        expect(result.config.items).toBeDefined();
        expect(Array.isArray(result.config.items)).toBe(true);

        // Verify objects are independent instances - modifying one shouldn't affect the other
        result.config.items[0].field = 'test-value-1';
        expect(result.config.items[1].field).toBeUndefined();
        expect(result.config.items[0]).not.toBe(result.config.items[1]);
      });

      it('should create independent object instances for array items via computeDefaults', () => {
        const result = computeDefaults({ validator: testValidator }, schema, {
          rootSchema: schema,
        }) as { config: { items: { field?: string }[] } };

        expect(result).toStrictEqual({ config: { items: [{}, {}] } });

        // Verify that modifying properties of one array item doesn't affect others
        expect(result.config.items).toBeDefined();
        expect(Array.isArray(result.config.items)).toBe(true);

        // Verify objects are independent instances - modifying one shouldn't affect the other
        result.config.items[0].field = 'test-value-1';
        expect(result.config.items[1].field).toBeUndefined();
        expect(result.config.items[0]).not.toBe(result.config.items[1]);
      });

      it('should create independent object instances for array items via getArrayDefaults', () => {
        const arraySchema: RJSFSchema = {
          type: 'array',
          minItems: 3,
          items: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
              },
            },
          },
        };

        const result = getArrayDefaults({ validator: testValidator }, arraySchema, {
          rootSchema: arraySchema,
        }) as GenericObjectType[];

        expect(result).toStrictEqual([{}, {}, {}]);

        // Verify that array exists and objects are independent
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        // Verify objects are independent instances
        result[0].field = 'test-value-1';
        result[1].field = 'test-value-2';
        expect(result[2].field).toBeUndefined();
        expect(result[0]).not.toBe(result[1]);
        expect(result[1]).not.toBe(result[2]);
        expect(result[0]).not.toBe(result[2]);
      });

      it('should ensure array items with default values are independent instances', () => {
        const arraySchemaWithDefaults: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
                default: 'default-value',
              },
            },
          },
        };

        const result = getArrayDefaults({ validator: testValidator }, arraySchemaWithDefaults, {
          rootSchema: arraySchemaWithDefaults,
        }) as GenericObjectType[];

        expect(result).toStrictEqual([{ field: 'default-value' }, { field: 'default-value' }]);

        // Verify that array exists and objects are independent
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        // Verify objects are independent instances - modifying one shouldn't affect the other
        result[0].field = 'modified-value';
        expect(result[1].field).toBe('default-value');
        expect(result[0]).not.toBe(result[1]);
      });

      it('should ensure nested objects in arrays are independent instances', () => {
        const nestedObjectSchema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              nested: {
                type: 'object',
                properties: {
                  value: {
                    type: 'string',
                    default: 'nested-default',
                  },
                },
              },
            },
          },
        };

        const result = getArrayDefaults({ validator: testValidator }, nestedObjectSchema, {
          rootSchema: nestedObjectSchema,
        }) as { nested: { value: string } }[];

        expect(result).toStrictEqual([
          { nested: { value: 'nested-default' } },
          { nested: { value: 'nested-default' } },
        ]);

        // Verify that array exists and nested objects are independent
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);

        // Verify nested objects are independent instances
        result[0].nested.value = 'modified-nested-value';
        expect(result[1].nested.value).toBe('nested-default');
        expect(result[0]).not.toBe(result[1]);
        expect(result[0].nested).not.toBe(result[1].nested);
      });
    });

    describe('ui:emptyValue in getDefaultFormState', () => {
      it('uses emptyValue as the default when there is no schema default and no formData', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        const uiSchema = {
          name: { 'ui:emptyValue': '' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ name: '' });
      });

      it('does not use emptyValue when a schema default exists', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'hello' },
          },
        };
        const uiSchema = {
          name: { 'ui:emptyValue': '' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ name: 'hello' });
      });

      it('does not use emptyValue when formData is provided', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        const uiSchema = {
          name: { 'ui:emptyValue': '' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { name: 'world' }, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ name: 'world' });
      });

      it('applies emptyValue in nested objects', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            address: {
              type: 'object',
              properties: {
                city: { type: 'string' },
              },
            },
          },
        };
        const uiSchema = {
          address: {
            city: { 'ui:emptyValue': '' },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ address: { city: '' } });
      });

      it('behaves unchanged when no uiSchema is passed', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({});
      });
    });

    describe('ui:initialValue in getDefaultFormState', () => {
      it('uses initialValue as the default when there is no formData and no schema default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            country: { type: 'string' },
          },
        };
        const uiSchema = {
          country: { 'ui:initialValue': 'US' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ country: 'US' });
      });

      it('overrides a schema default with initialValue', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            country: { type: 'string', default: 'UK' },
          },
        };
        const uiSchema = {
          country: { 'ui:initialValue': 'US' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ country: 'US' });
      });

      it('does not override formData that was already provided', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            country: { type: 'string' },
          },
        };
        const uiSchema = {
          country: { 'ui:initialValue': 'US' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: { country: 'FR' }, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ country: 'FR' });
      });

      it('takes priority over emptyValue', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            country: { type: 'string' },
          },
        };
        const uiSchema = {
          country: { 'ui:initialValue': 'US', 'ui:emptyValue': '' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ country: 'US' });
      });

      it('applies initialValue in nested objects', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            address: {
              type: 'object',
              properties: {
                country: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        };
        const uiSchema = {
          address: {
            country: { 'ui:initialValue': 'US' },
          },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ address: { country: 'US' } });
      });

      it('applies initialValue on reset (undefined formData)', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        };
        const uiSchema = {
          name: { 'ui:initialValue': 'default name' },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ name: 'default name' });
      });
    });

    describe('ui:initialValue/ui:emptyValue in array items', () => {
      it('applies ui:initialValue to array items created to satisfy minItems', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        };
        const uiSchema = {
          items: { name: { 'ui:initialValue': 'Anonymous' } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'Anonymous' }, { name: 'Anonymous' }]);
      });

      it('applies ui:initialValue to existing array item formData missing the field', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        };
        const uiSchema = {
          items: { name: { 'ui:initialValue': 'Anonymous' } },
        };
        const formData = [{}, { name: 'Chuck' }];
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'Anonymous' }, { name: 'Chuck' }]);
      });

      it('applies ui:emptyValue to tuple (fixed) items', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
        };
        const uiSchema = {
          items: { name: { 'ui:emptyValue': 'unnamed' } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'unnamed' }, { name: 'unnamed' }]);
      });

      it('ignores a dynamic (function) uiSchema.items rather than applying it blindly', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        };
        const uiSchema = {
          items: () => ({ name: { 'ui:initialValue': 'Anonymous' } }),
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{}]);
      });

      it('ignores a dynamic (function) uiSchema.items for tuple (fixed) items too', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'object', properties: { name: { type: 'string' } } }],
        };
        const uiSchema = {
          items: () => ({ name: { 'ui:emptyValue': 'unnamed' } }),
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{}]);
      });

      it('applies a per-position ui:initialValue to minItems filler entries when uiSchema.items is a tuple (array)', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: { type: 'string' },
        };
        const uiSchema = {
          items: [{ 'ui:initialValue': 'first' }, { 'ui:initialValue': 'second' }],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual(['first', 'second']);
      });

      it('applies a per-position ui:initialValue when uiSchema.items is itself a tuple (array)', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
        };
        const uiSchema = {
          items: [{ name: { 'ui:initialValue': 'first' } }, { name: { 'ui:initialValue': 'second' } }],
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'first' }, { name: 'second' }]);
      });

      it('applies additionalItems uiSchema, not the tuple uiSchema.items, to items beyond the tuple', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: [{ type: 'object', properties: { name: { type: 'string' } } }],
          additionalItems: { type: 'object', properties: { name: { type: 'string' } } },
        };
        const uiSchema = {
          items: { name: { 'ui:initialValue': 'tuple position' } },
          additionalItems: { name: { 'ui:initialValue': 'beyond the tuple' } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'tuple position' }, { name: 'beyond the tuple' }]);
      });

      it('applies additionalItems uiSchema to existing formData beyond a tuple length', () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'string' }],
          additionalItems: { type: 'string' },
        };
        const uiSchema = {
          items: { 'ui:emptyValue': 'tuple' },
          additionalItems: { 'ui:emptyValue': 'extra' },
        };
        const formData = [undefined, undefined];
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual(['tuple', 'extra']);
      });

      it('applies uiSchema.prefixItems to a prefixItems position and uiSchema.items to the items past it', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          prefixItems: [{ type: 'object', properties: { name: { type: 'string' } } }],
          items: { type: 'object', properties: { name: { type: 'string' } } },
        };
        const uiSchema = {
          prefixItems: [{ name: { 'ui:initialValue': 'tuple position' } }],
          items: { name: { 'ui:initialValue': 'beyond the tuple' } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual([{ name: 'tuple position' }, { name: 'beyond the tuple' }]);
      });

      it('fills a boolean prefixItems position with no default, rather than that of the items past the tuple', () => {
        const schema: RJSFSchema = {
          type: 'array',
          prefixItems: [{ type: 'string', default: 'a' }, true],
          items: { type: 'string', default: 'z' },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual([
          'a',
          undefined,
        ]);
      });

      it('fills the rows past a prefixItems tuple from its items, as a list fills its rows', () => {
        const schema: RJSFSchema = {
          type: 'array',
          prefixItems: [{ type: 'string' }],
          items: { type: 'object', properties: { x: { type: 'number', default: 1 } } },
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: ['a', {}] }),
        ).toEqual(['a', { x: 1 }]);
      });

      it("fills an option's prefixItems positions and the rows past them from the list items it is met with", () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: { type: 'object', properties: { x: { type: 'number', default: 1 } } },
          oneOf: [{ prefixItems: [{}] }],
        };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: [{}, {}] }),
        ).toEqual([{ x: 1 }, { x: 1 }]);
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual([{ x: 1 }]);
      });

      it("fills the rows at a prefixItems tuple's positions where the array declares its own default", () => {
        const obj: RJSFSchema = { type: 'object', properties: { a: { type: 'number', default: 1 } } };
        const schema: RJSFSchema = { type: 'array', prefixItems: [obj], items: obj, default: [] };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: [{}, {}] }),
        ).toEqual([{ a: 1 }, { a: 1 }]);
      });

      it("keeps a draft-07 tuple's positions off the defaults of a single items its allOf declares", () => {
        const schema: RJSFSchema = {
          type: 'array',
          items: [{ type: 'string' }],
          additionalItems: { type: 'string', default: 'q' },
          allOf: [{ items: { type: 'string', default: 'z' } }],
          minItems: 2,
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual([
          undefined,
          'q',
        ]);
      });

      it('fills no prefixItems position at or past a false one, which allows no item', () => {
        const schema: RJSFSchema = {
          type: 'array',
          prefixItems: [{ type: 'string', default: 'a' }, false, { type: 'string', default: 'b' }],
          items: { type: 'string' },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(['a']);
      });

      it('pads minItems with no filler at or past a false prefixItems position', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 3,
          prefixItems: [{ type: 'string', default: 'a' }, false],
          items: { type: 'string', default: 'z' },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(['a']);
      });

      it('pads minItems with the items default beside an empty prefixItems', () => {
        const schema: RJSFSchema = {
          type: 'array',
          prefixItems: [],
          items: { type: 'string', default: 'a' },
          minItems: 2,
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual(['a', 'a']);
      });

      it('pads minItems below a prefixItems tuple with each position default, then the items past it', () => {
        const schema: RJSFSchema = {
          type: 'array',
          default: [],
          minItems: 3,
          prefixItems: [
            { type: 'string', default: 'a' },
            { type: 'string', default: 'b' },
          ],
          items: { type: 'string', default: 'z' },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual([
          'a',
          'b',
          'z',
        ]);
      });

      it('merges the defaults of the items past a prefixItems tuple into the default, as additionalItems ones', () => {
        const schema: RJSFSchema = {
          type: 'array',
          default: [{ item: 'property-default-1' }, {}],
          prefixItems: [{ type: 'object', properties: { item: { type: 'string' } } }],
          items: { type: 'object', properties: { item: { type: 'string', default: 'additional-default' } } },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual([
          { item: 'property-default-1' },
          { item: 'additional-default' },
        ]);
      });

      it('does not resurrect ui:initialValue on a cleared tuple position after the initial pass', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { pair: { type: 'array', items: [{ type: 'string' }, { type: 'string' }] } },
        };
        const uiSchema = { pair: { items: [{ 'ui:initialValue': 'a' }, {}] } };
        // initialDefaultsGenerated: true (the 8th positional arg) means this is a subsequent recompute, not the
        // initial/reset pass, so `ui:initialValue` must not spring back onto the cleared first position.
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema,
              formData: { pair: [undefined, 'z'] },
              rootSchema: schema,
              includeUndefinedValues: false,
              initialDefaultsGenerated: true,
              uiSchema,
            },
          ),
        ).toEqual({ pair: [undefined, 'z'] });
      });

      it('does not apply ui:initialValue to a minItems filler entry after the initial pass', () => {
        const schema: RJSFSchema = {
          type: 'array',
          minItems: 2,
          items: { type: 'string' },
        };
        const uiSchema = { items: { 'ui:initialValue': 'a' } };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, initialDefaultsGenerated: true, uiSchema },
          ),
        ).toEqual([undefined, undefined]);
      });
    });

    describe('ui:initialValue for additionalProperties', () => {
      it('applies uiSchema.additionalProperties, not a dynamically-named uiSchema entry, to an additional property', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            foo: { type: 'string' },
          },
          additionalProperties: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        };
        const uiSchema = {
          extraKey: { name: { 'ui:initialValue': 'wrong entry' } },
          additionalProperties: { name: { 'ui:initialValue': 'from additionalProperties' } },
        };
        const rawFormData = { foo: 'x', extraKey: {} };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, formData: rawFormData, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({
          foo: 'x',
          extraKey: { name: 'from additionalProperties' },
        });
      });
    });

    describe('ui:initialValue/ui:emptyValue in oneOf/anyOf options', () => {
      it('applies ui:initialValue declared under uiSchema.oneOf[i] on first render, matching what applies on option change', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            thing: {
              oneOf: [
                { type: 'object', title: 'A', properties: { a: { type: 'string' } } },
                { type: 'object', title: 'B', properties: { b: { type: 'string' } } },
              ],
            },
          },
        };
        const uiSchema = {
          thing: { oneOf: [{ a: { 'ui:initialValue': 'x' } }, {}] },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ thing: { a: 'x' } });
      });

      it('applies ui:initialValue declared under uiSchema.anyOf[i] on first render', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            thing: {
              anyOf: [
                { type: 'object', title: 'A', properties: { a: { type: 'string' } } },
                { type: 'object', title: 'B', properties: { b: { type: 'string' } } },
              ],
            },
          },
        };
        const uiSchema = {
          thing: { anyOf: [{ a: { 'ui:initialValue': 'x' } }, {}] },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ thing: { a: 'x' } });
      });

      it("doesn't hand the field's anyOf entries to the options of an option with no entry of its own", () => {
        const schema: RJSFSchema = {
          anyOf: [
            {
              anyOf: [
                { type: 'object', properties: { y: { type: 'string' } } },
                { type: 'object', properties: { x: { type: 'string' }, z: { type: 'string' } } },
              ],
            },
            { type: 'number' },
          ],
        };
        const anyOf: UiSchema[] = [];
        anyOf[1] = { z: { 'ui:initialValue': 'leak' } };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, formData: { x: 'a' }, uiSchema: { anyOf } },
          ),
        ).toEqual({ x: 'a' });
      });
    });

    describe('ui:definitions in getDefaultFormState', () => {
      it('applies ui:initialValue declared inside a ui:definitions fragment', () => {
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            Address: { type: 'object', properties: { country: { type: 'string' } } },
          },
          properties: { home: { $ref: '#/definitions/Address' } },
        };
        const uiSchema = {
          'ui:definitions': { '#/definitions/Address': { country: { 'ui:initialValue': 'US' } } },
        };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            { schema, rootSchema: schema, includeUndefinedValues: false, uiSchema },
          ),
        ).toEqual({ home: { country: 'US' } });
      });

      it('applies ui:initialValue from an explicitly-passed uiSchemaDefinitions even when uiSchema itself has none', () => {
        // Mirrors how a sub-uiSchema (an array's uiSchema.items, a oneOf/anyOf option, additionalProperties, ...)
        // is handed to getDefaultFormState() without carrying the root's own ui:definitions alongside it.
        const schema: RJSFSchema = {
          type: 'object',
          definitions: {
            Address: { type: 'object', properties: { country: { type: 'string' } } },
          },
          properties: { home: { $ref: '#/definitions/Address' } },
        };
        const subUiSchema = {};
        const rootUiSchemaDefinitions = { '#/definitions/Address': { country: { 'ui:initialValue': 'US' } } };
        expect(
          getDefaultFormState(
            { validator: testValidator },
            {
              schema,
              rootSchema: schema,
              includeUndefinedValues: false,
              uiSchema: subUiSchema,
              uiSchemaDefinitions: rootUiSchemaDefinitions,
            },
          ),
        ).toEqual({ home: { country: 'US' } });
      });
    });
    describe('under a draft 2020-12 root with $id resources', () => {
      it("fills the defaults of the same #/ $ref text in two resources from each one's own definition (#5529)", () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.com/root.json',
          $defs: {
            node: { type: 'object', properties: { l: { $ref: 'lib.json' } } },
            lib: { $id: 'lib.json', $defs: { node: { type: 'number', default: 7 } }, $ref: '#/$defs/node' },
          },
          $ref: '#/$defs/node',
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema })).toEqual({ l: 7 });
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
        expect(schemaUtils.getDefaultFormState(schemaUtils.getRootSchema())).toEqual({ l: 7 });
      });
      it('fills the defaults of a $ref under a relative root $id through createSchemaUtils()', () => {
        const schema: RJSFSchema = {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'nested/root.json',
          $defs: { c: { $id: 'child.json', type: 'object', properties: { v: { type: 'string', default: 'ok' } } } },
          type: 'object',
          properties: { c: { $ref: 'child.json' } },
        };
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
        expect(schemaUtils.getDefaultFormState(schemaUtils.getRootSchema())).toEqual({ c: { v: 'ok' } });
      });
      it.each<[number, RJSFSchema, unknown]>([
        [1, PET_RESOURCE_SCHEMA, { p: { kind: 5 } }],
        [2, PET_RESOURCE_DEEP_SCHEMA, { p: { info: { kind: 5 } } }],
      ])(
        'picks the option for data by the $ref a merged property holds in a resource of its own, %i level(s) down',
        (_, schema, formData) => {
          expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData })).toEqual(
            formData,
          );
        },
      );
    });
    describe('of a subschema retrieveSchema() handed out', () => {
      // The root and the nested resource each define `x`, so a `$ref` resolved against the wrong one fills 1
      it.each<[string, RJSFSchema]>([
        [
          'draft-07',
          {
            definitions: {
              x: { type: 'number', default: 1 },
              child: {
                $id: 'child.json',
                definitions: { x: { type: 'string', default: 'nested' } },
                type: 'array',
                items: { $ref: '#/definitions/x' },
              },
            },
            type: 'object',
            properties: { list: { $ref: '#/definitions/child' } },
          },
        ],
        [
          'draft 2020-12',
          {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $id: 'https://example.com/root.json',
            $defs: {
              x: { type: 'number', default: 1 },
              child: {
                $id: 'nested/child.json',
                $defs: { x: { type: 'string', default: 'nested' } },
                type: 'array',
                items: { $ref: '#/$defs/x' },
              },
            },
            type: 'object',
            properties: { list: { $ref: 'nested/child.json' } },
          },
        ],
      ])('fills an item of a nested resource from that resource, as a new row does (%s)', (_, schema) => {
        const schemaUtils = createSchemaUtils({ validator: testValidator }, schema);
        const list = schemaUtils.retrieveSchema(schema).properties?.list;
        const items = isObject(list) ? schemaUtils.retrieveSchema(list).items : undefined;
        if (!isObject(items) || Array.isArray(items)) {
          throw new Error('The list has no items schema');
        }
        expect(schemaUtils.getDefaultFormState(items)).toBe('nested');
      });
    });

    describe('own prototype-named properties', () => {
      it('keeps an additionalProperties key named like an Object.prototype member', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' } },
          additionalProperties: { type: 'string' },
        };
        const result = getDefaultFormState(
          { validator: testValidator },
          { schema: { ...schema, default: JSON.parse('{"constructor":"c","valueOf":"v"}') }, formData: { a: 'x' } },
        );
        expect(Object.getOwnPropertyDescriptor(result, 'constructor')?.value).toBe('c');
        expect(Object.getOwnPropertyDescriptor(result, 'valueOf')?.value).toBe('v');
      });

      it('keeps extra form data through the public entry point', () => {
        const schema: RJSFSchema = { type: 'object', properties: { a: { type: 'string' } } };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, formData: { toString: 'abc', b: 1 } }),
        ).toEqual({
          toString: 'abc',
          b: 1,
        });
      });

      it('does not turn an inherited toString into own data during allOf matching', () => {
        const schema: RJSFSchema = JSON.parse(
          '{"type":"object","properties":{"toString":{"allOf":[{"type":"string"}]},"a":{"type":"string","default":"x"}}}',
        );
        const result = getDefaultFormState(
          { validator: testValidator, defaultFormStateBehavior: { allOf: 'populateDefaults' } },
          { schema, formData: { a: 'y' } },
        );
        expect(result).toEqual({ a: 'y' });
        expect(Object.hasOwn(result!, 'toString')).toBe(false);
      });

      it.each([{}, JSON.parse('{"__proto__":{"y":"u"}}')])(
        'retains __proto__ schema defaults with data %s',
        (formData) => {
          const schema: RJSFSchema = JSON.parse(
            '{"type":"object","properties":{"__proto__":{"type":"object","properties":{"x":{"default":"dx"}}}}}',
          );
          const result = getDefaultFormState({ validator: testValidator }, { schema, formData });
          expect(Object.hasOwn(result, '__proto__')).toBe(true);
          expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
          expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toEqual({
            x: 'dx',
            ...(Object.getOwnPropertyDescriptor(formData, '__proto__')?.value ?? {}),
          });
        },
      );

      it('seeds object defaults beside a property declared as false', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { x: false },
          additionalProperties: { type: 'string' },
          default: { y: 'd' },
        };
        expect(getDefaultFormState({ validator: testValidator }, { schema, formData: { x: 1 } })).toEqual({
          x: 1,
          y: 'd',
        });
      });

      it('does not read an inherited member of a parent const for a property named like one', () => {
        const schema: RJSFSchema = JSON.parse(
          '{"type":"object","const":{"a":"q"},"properties":{"a":{"type":"string"},"toString":{"type":"string"}}}',
        );
        const result = getDefaultFormState({ validator: testValidator }, { schema, formData: {} });
        expect(Object.hasOwn(result!, 'toString')).toBe(false);
      });

      it('copies a __proto__ key of a default as an own key', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { p: { default: JSON.parse('{"__proto__":{"x":1}}') } },
        };
        const result = getDefaultFormState({ validator: testValidator }, { schema });
        expect(result).toEqual(JSON.parse('{"p":{"__proto__":{"x":1}}}'));
        expect(Object.getPrototypeOf(Object.getOwnPropertyDescriptor(result, 'p')?.value)).toBe(Object.prototype);
      });

      it('matches no property named __proto__ that the data holds no own value for', () => {
        const schema: RJSFSchema = JSON.parse(
          '{"type":"object","properties":{"__proto__":{"type":"object","allOf":[{}],"properties":{"x":{"type":"string"}}}}}',
        );
        const result = ensureFormDataMatchingSchema({ validator: testValidator }, schema, schema, { a: 'y' });
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
        expect(result).toEqual({ a: 'y' });
      });
    });

    it("seeds the extra keys of an option taking an object's in its place with the object's uiSchema entry for them", () => {
      const schema: RJSFSchema = {
        type: 'object',
        additionalProperties: { type: 'string' },
        default: { p: 'd' },
        oneOf: [{ title: 'A', oneOf: [{ properties: { x: { type: 'string' } } }] }],
      };
      // The option's own uiSchema entry says nothing of the extra keys, which its field renders with the object's
      const uiSchema = { additionalProperties: { 'ui:initialValue': 'I' }, oneOf: [{}] };
      expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, uiSchema })).toEqual({
        p: 'I',
      });
    });

    describe('the option a field shows, from a fieldState', () => {
      const a: RJSFSchema = { title: 'A', properties: { a: { type: 'string', default: 'x' } } };
      const b: RJSFSchema = { title: 'B', properties: { b: { type: 'string', default: 'y' } } };
      /** A `fieldState` showing the option at `index` of every field it is asked about, recording each field's path */
      const showing = (index: number) => {
        const paths: string[] = [];
        const fieldState: FormFieldState = {
          selectedOption: (fieldPath) => {
            paths.push(fieldPath);
            return index;
          },
          isExpanded: () => false,
        };
        return { fieldState, paths };
      };

      it("computes a field's defaults from the option it shows rather than the one its data matches", () => {
        const schema: RJSFSchema = { type: 'object', oneOf: [a, b] };
        const { fieldState, paths } = showing(1);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {}, fieldState }),
        ).toEqual({ b: 'y' });
        expect(paths).toEqual([fieldPathFromList([])]);
        expect(getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {} })).toEqual(
          { a: 'x' },
        );
        expect(
          createSchemaUtils({ validator: testValidator }, schema).getDefaultFormState(
            schema,
            {},
            false,
            undefined,
            undefined,
            undefined,
            fieldState,
          ),
        ).toEqual({ b: 'y' });
      });

      it('asks for each field by its path: a property, an array item, a tuple item and an additional property', () => {
        const optionField: RJSFSchema = { type: 'object', oneOf: [a, b] };
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            o: optionField,
            list: { type: 'array', items: optionField },
            tuple: { type: 'array', items: [optionField] },
          },
          additionalProperties: optionField,
        };
        const { fieldState, paths } = showing(1);
        const formData = { o: {}, list: [{}], tuple: [{}], k: {} };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData, fieldState }),
        ).toEqual({ o: { b: 'y' }, list: [{ b: 'y' }], tuple: [{ b: 'y' }], k: { b: 'y' } });
        expect(paths).toEqual(
          expect.arrayContaining([['o'], ['list', 0], ['tuple', 0], ['k']].map((path) => fieldPathFromList(path))),
        );
      });

      it('reads an option written as a boolean as an option allowing anything', () => {
        const schema: RJSFSchema = { type: 'object', oneOf: [true, b] };
        const { fieldState } = showing(1);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {}, fieldState }),
        ).toEqual({ b: 'y' });
      });

      describe("the options a typed object renders beside its own field, which leave the data's extra keys to it (#5886)", () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' } },
          oneOf: [
            { const: { b: 1 }, properties: { b: { type: 'number' } }, additionalProperties: { type: 'null' } },
            { properties: { c: { type: 'string' } } },
          ],
        };
        const context = { validator: testValidator, additionalPropertiesWhenAbsent: 'allow' as const };
        /** A `fieldState` showing the first option, recording the names each option it is handed declares */
        const recording = () => {
          const declared: string[][] = [];
          const fieldState: FormFieldState = {
            selectedOption: (_fieldPath, options) => {
              declared.push(...options.map((option) => Object.keys(isObject(option) ? (option.properties ?? {}) : {})));
              return 0;
            },
            isExpanded: () => false,
          };
          return { fieldState, declared };
        };

        it('are what the fill hands the fieldState', () => {
          const { fieldState, declared } = recording();
          getDefaultFormState(context, { schema, rootSchema: schema, formData: { e: 5 }, fieldState });
          expect(declared).toEqual([['b'], ['c']]);
        });

        it.each<[string, RJSFSchema, unknown]>([
          ['an option of a field rendering none of its own', {}, { t: 2 }],
          ["an option beside an object's own field", { type: 'object' }, { b: 5, t: 2 }],
        ])(
          'stub the extra keys an absent keyword takes for %s alone, first rendering what the field shows',
          (_, field, expected) => {
            const options: RJSFSchema[] = [
              { type: 'object', properties: { a: { type: 'number' } } },
              { type: 'object', properties: { b: { type: 'number', default: 5 } }, additionalProperties: true },
            ];
            const offering: RJSFSchema = { ...field, oneOf: options };
            expect(
              getDefaultFormState(context, { schema: offering, rootSchema: offering, formData: { t: 2 } }),
            ).toEqual(expected);
          },
        );

        it('are retrieved as written where the list is not the one the schema holds', () => {
          const { fieldState, declared } = recording();
          fieldShownOption(context, fieldState, [], schema, [...(schema.oneOf ?? [])], schema, { e: 5 });
          expect(declared).toEqual([
            ['b', 'e'],
            ['c', 'e'],
          ]);
        });

        describe("where the retrieval rebuilds the list, merging each option with each of an allOf entry's", () => {
          const rebuilt: RJSFSchema = {
            type: 'object',
            oneOf: [{ properties: { a: { type: 'number' } } }, { properties: { b: { type: 'number' } } }],
            allOf: [{ oneOf: [{ properties: { c: { type: 'string' } } }, { properties: { d: { type: 'string' } } }] }],
          };
          /** A `fieldState` showing the option at `shown` of the list it is handed, recording what each declares */
          const showing = (shown: number) => {
            const declared: string[][] = [];
            const fieldState: FormFieldState = {
              selectedOption: (_fieldPath, options) => {
                declared.push(
                  ...options.map((option) => Object.keys(isObject(option) ? (option.properties ?? {}) : {})),
                );
                return shown;
              },
              isExpanded: () => false,
            };
            return { fieldState, declared };
          };

          it.each([
            [0, 0],
            [1, 0],
            [2, 1],
            [3, 1],
          ])(
            'hands the fieldState the rebuilt options, and reads the one at %i as the option it was built from, %i',
            (shown, expected) => {
              const { fieldState, declared } = showing(shown);
              expect(
                fieldShownOption(
                  { validator: testValidator },
                  fieldState,
                  [],
                  rebuilt,
                  rebuilt.oneOf ?? [],
                  rebuilt,
                  {},
                ),
              ).toBe(expected);
              expect(declared).toEqual([
                ['a', 'c'],
                ['a', 'd'],
                ['b', 'c'],
                ['b', 'd'],
              ]);
            },
          );

          it('reads an index past the rebuilt options as none shown', () => {
            const { fieldState } = showing(4);
            expect(
              fieldShownOption({ validator: testValidator }, fieldState, [], rebuilt, rebuilt.oneOf ?? [], rebuilt, {}),
            ).toBe(-1);
          });

          it("hands it the options as written under a customMergeAllOf, whose rebuilt options keep no record of what they're built from", () => {
            const { fieldState, declared } = showing(0);
            const context = {
              validator: testValidator,
              customMergeAllOf: createDeepAllOfMerge(shallowAllOfMerge) as CustomMergeAllOf,
            };
            fieldShownOption(context, fieldState, [], rebuilt, rebuilt.oneOf ?? [], rebuilt, {});
            expect(declared).toEqual([['a'], ['b']]);
          });

          // Merged with an empty option, an option merges to itself, which must not then read as built from that pair
          it("reads each rebuilt option as the option it was built from where the allOf entry's list holds an empty option", () => {
            const withEmpty: RJSFSchema = {
              ...rebuilt,
              allOf: [{ oneOf: [{}, { properties: { d: { type: 'string' } } }] }],
            };
            const { fieldState, declared } = showing(1);
            expect(
              fieldShownOption(
                { validator: testValidator },
                fieldState,
                [],
                withEmpty,
                withEmpty.oneOf ?? [],
                withEmpty,
                {},
              ),
            ).toBe(0);
            expect(declared).toEqual([['a'], ['a', 'd'], ['b'], ['b', 'd']]);
          });

          it("keeps each $ref of an option's own allOf where it merges the option with an allOf entry's", () => {
            const refs: RJSFSchema = {
              definitions: {
                x: { properties: { x: { type: 'string' } } },
                y: { properties: { y: { type: 'string' } } },
              },
              type: 'object',
              oneOf: [{ allOf: [{ $ref: '#/definitions/x' }, { $ref: '#/definitions/y' }] }],
              allOf: [{ oneOf: [{ properties: { c: { type: 'string' } } }] }],
            };
            const { fieldState, declared } = showing(0);
            fieldShownOption({ validator: testValidator }, fieldState, [], refs, refs.oneOf ?? [], refs, {});
            expect(declared).toEqual([['c', 'x', 'y']]);
          });
        });

        it("stub no extra key an absent keyword takes for an option beside an object's own field typed through an allOf", () => {
          const typedThroughAllOf: RJSFSchema = {
            type: 'object',
            properties: {
              p: {
                allOf: [{ type: 'object', properties: { k: { type: 'string' } } }],
                oneOf: [
                  { type: 'object', properties: { a: { type: 'number' } } },
                  { type: 'object', properties: { b: { type: 'number', default: 5 } }, additionalProperties: true },
                ],
              },
            },
          };
          expect(
            getDefaultFormState(context, {
              schema: typedThroughAllOf,
              rootSchema: typedThroughAllOf,
              formData: { p: { t: 2 } },
            }),
          ).toEqual({ p: { b: 5, t: 2 } });
        });

        // The first option's `additionalProperties` rejects the string `d`, so that pair is left out
        it('are the rebuilt options, traced to the ones written, where the retrieval rebuilds the list into another number of options', () => {
          const { fieldState, declared } = recording();
          const rebuilt: RJSFSchema = {
            ...schema,
            allOf: [{ oneOf: [{ properties: { d: { type: 'string' } } }, {}] }],
          };
          expect(fieldShownOption(context, fieldState, [], rebuilt, rebuilt.oneOf ?? [], rebuilt, { e: 5 })).toBe(0);
          expect(declared).toEqual([['b'], ['c', 'd'], ['c']]);
        });
      });

      it('falls back to the option the data matches where the fieldState shows none', () => {
        const schema: RJSFSchema = { type: 'object', oneOf: [a, b] };
        const { fieldState } = showing(-1);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {}, fieldState }),
        ).toEqual({ a: 'x' });
      });

      it('falls back to the option the data matches where the fieldState names an index past the options', () => {
        const schema: RJSFSchema = { type: 'object', oneOf: [a, b] };
        const { fieldState } = showing(2);
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData: {}, fieldState }),
        ).toEqual({ a: 'x' });
      });

      it('asks nothing of a select, over constants or an enum, nor of a field holding no data, which its default matches', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            kind: { oneOf: [{ const: 'p' }, { const: 'q' }] },
            size: { type: 'string', enum: ['s', 'm'], oneOf: [{ minLength: 1 }, { maxLength: 1 }] },
            o: { type: 'object', oneOf: [a, b] },
          },
        };
        const { fieldState, paths } = showing(0);
        const formData = { kind: 'q', size: 'm' };
        expect(
          getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData, fieldState }),
        ).toEqual({ kind: 'q', size: 'm', o: { a: 'x' } });
        expect(paths).toEqual([]);
      });
    });

    describe('a default that decides an `if` (#5830)', () => {
      const fill = (schema: RJSFSchema, formData?: unknown, defaultFormStateBehavior?: DefaultFormStateBehavior) =>
        getDefaultFormState(
          { validator: testValidator, defaultFormStateBehavior },
          { schema, rootSchema: schema, formData },
        );
      // The mock validator cannot evaluate an `if`, so it answers each check as the real validators do
      beforeEach(() => {
        testValidator.setReturnValues({ isValid: asRealValidator });
      });
      afterEach(() => {
        testValidator.reset?.();
      });
      const thenSchema: RJSFSchema = {
        type: 'object',
        properties: { k: { type: 'string', default: 'x' } },
        if: { properties: { k: { const: 'x' } }, required: ['k'] },
        then: { properties: { t: { type: 'number', default: 2 } } },
      };
      const elseSchema: RJSFSchema = {
        type: 'object',
        properties: { k: { type: 'string', default: 'y' } },
        if: { properties: { k: { const: 'x' } } },
        then: { properties: { t: { type: 'number', default: 2 } } },
        else: { properties: { e: { type: 'number', default: 3 } } },
      };
      const chainedSchema: RJSFSchema = {
        type: 'object',
        properties: { k: { type: 'string', default: 'x' } },
        allOf: [
          {
            if: { properties: { k: { const: 'x' } }, required: ['k'] },
            then: { properties: { t: { type: 'string', default: 'u' } } },
          },
          {
            if: { properties: { t: { const: 'u' } }, required: ['t'] },
            then: { properties: { v: { type: 'number', default: 4 } } },
          },
        ],
      };

      it('fills the `then` its default satisfies', () => {
        expect(fill(thenSchema)).toEqual({ k: 'x', t: 2 });
      });

      it('fills the `else` its default selects, and nothing of the `then`', () => {
        expect(fill(elseSchema)).toEqual({ k: 'y', e: 3 });
      });

      it('fills a condition that reads what another condition defaulted', () => {
        expect(fill(chainedSchema)).toEqual({ k: 'x', t: 'u', v: 4 });
      });

      it('fills the same for a property as for the root', () => {
        const schema: RJSFSchema = { type: 'object', properties: { q: thenSchema } };
        expect(fill(schema)).toEqual({ q: { k: 'x', t: 2 } });
      });

      it('fills the `null` of a field the `else` of an unmerged `allOf` entry brings in for a default', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            r: {
              type: 'object',
              properties: { k: { type: 'string', default: 'y' } },
              allOf: [{ if: { properties: { k: { const: 'x' } } }, else: { properties: { e: { type: 'null' } } } }],
            },
          },
        };
        const filled = fill(schema);
        expect(filled).toEqual({ r: { k: 'y', e: null } });
        expect(fill(schema, filled)).toEqual(filled);
      });

      it('keeps the branch the data selects over the one the default would', () => {
        expect(fill(elseSchema, { k: 'x' })).toEqual({ k: 'x', t: 2 });
      });

      it.each([
        { name: 'then', schema: thenSchema },
        { name: 'else', schema: elseSchema },
        { name: 'chained', schema: chainedSchema },
      ])('changes nothing when the filled data of the $name schema is filled again', ({ schema }) => {
        const filled = fill(schema);
        expect(fill(schema, filled)).toEqual(filled);
      });

      it.each([
        {
          name: 'beside the data of the object holding it',
          formData: { r: { k: 'a' } },
          expected: { r: { k: 'a', j: 'x' }, t: 2 },
        },
        {
          name: 'over data held as `undefined`',
          formData: { r: { j: undefined } },
          expected: { r: { j: 'x' }, t: 2 },
          behavior: { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' } as const,
        },
        {
          name: 'over data its field does not take',
          formData: { r: { j: 'z' } },
          expected: { r: { j: 'x' }, t: 2 },
        },
      ])('fills the `then` a nested default satisfies $name', ({ formData, expected, behavior }) => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            r: {
              type: 'object',
              properties: { k: { type: 'string' }, j: { type: 'string', enum: ['x', 'y'], default: 'x' } },
            },
          },
          if: { properties: { r: { properties: { j: { const: 'x' } }, required: ['j'] } }, required: ['r'] },
          then: { properties: { t: { type: 'number', default: 2 } } },
        };
        const filled = fill(schema, formData, behavior);
        expect(filled).toEqual(expected);
        expect(fill(schema, filled, behavior)).toEqual(filled);
      });

      it.each([
        { name: 'beside the data of the object holding it', formData: { r: { s: { k: 'a' } } } },
        {
          name: 'over data held as `undefined`',
          formData: { r: { s: { j: undefined } } },
          behavior: { mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined' } as const,
        },
        { name: 'over data its field does not take', formData: { r: { s: { j: 'z' } } } },
      ])(
        'fills the `null` of a field the `then` of an unmerged `allOf` entry brings in for a nested default $name',
        ({ formData, behavior }) => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              r: {
                type: 'object',
                properties: {
                  s: {
                    type: 'object',
                    properties: { k: { type: 'string' }, j: { type: 'string', enum: ['x', 'y'], default: 'x' } },
                  },
                },
                allOf: [
                  {
                    if: { properties: { s: { properties: { j: { const: 'x' } }, required: ['j'] } }, required: ['s'] },
                    then: { properties: { n: { type: 'null' } } },
                  },
                ],
              },
            },
          };
          const filled = fill(schema, formData, behavior);
          expect(filled).toEqual({ r: { s: { ...formData.r.s, j: 'x' }, n: null } });
          expect(fill(schema, filled, behavior)).toEqual(filled);
        },
      );

      it('fills the `null` of the `then` a `null` decides, in a field the fill brings in for its `null`s alone', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            r: {
              type: 'object',
              allOf: [
                {
                  properties: {
                    q: {
                      type: 'object',
                      properties: { z: { type: 'null' } },
                      allOf: [
                        {
                          if: { properties: { z: { const: null } }, required: ['z'] },
                          then: { properties: { n: { type: 'null' } } },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        };
        const filled = fill(schema, { r: {} });
        expect(filled).toEqual({ r: { q: { z: null, n: null } } });
        expect(fill(schema, filled)).toEqual(filled);
      });

      it('fills the `then` the `null` decides that the fill puts over a value the data holds as `undefined`', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { r: { type: 'object', properties: { z: { type: 'null' } } } },
          if: { properties: { r: { properties: { z: { const: null } }, required: ['z'] } }, required: ['r'] },
          then: { properties: { n: { type: 'string', default: 'w' } } },
        };
        const filled = fill(schema, { r: { z: undefined } });
        expect(filled).toEqual({ r: { z: null }, n: 'w' });
        expect(fill(schema, filled)).toEqual(filled);
      });

      it('puts no `null` over a value the data holds as `undefined` for a branch its default does not select', () => {
        // The `if` holds for the data alone and fails once `k` is `'x'`
        const schema: RJSFSchema = {
          type: 'object',
          properties: { k: { type: 'string', default: 'x' }, z: {} },
          if: { properties: { k: { const: 'y' } } },
          then: { properties: { z: { type: 'null' } } },
          else: { properties: { z: { type: 'string' } } },
        };
        expect(fill(schema, { z: undefined })).toStrictEqual({ k: 'x', z: undefined });
      });

      it('decides a condition for the data it is checked against, whatever data it was checked against before', () => {
        // `'Aa'` and `'BB'` hash alike as strings, so no check made for the one may answer for the other
        const schema: RJSFSchema = {
          type: 'object',
          properties: { k: { type: 'string', default: 'BB' } },
          if: { properties: { k: { const: 'BB' } }, required: ['k'] },
          then: { properties: { t: { type: 'number', default: 2 } } },
        };
        fill(schema, { k: 'Aa' });
        expect(fill(schema)).toEqual({ k: 'BB', t: 2 });
      });

      it('fills the `null` of the branch an `allOf` entry selects for the defaults that are kept', () => {
        // The first pass fills the `t` of the `then`, which the `k` it also fills takes back for the `else`
        const schema: RJSFSchema = {
          type: 'object',
          properties: {
            r: { ...elseSchema, allOf: [{ if: { required: ['t'] }, else: { properties: { n: { type: 'null' } } } }] },
          },
        };
        const filled = fill(schema);
        expect(filled).toEqual({ r: { k: 'y', e: 3, n: null } });
        expect(fill(schema, filled)).toEqual(filled);
      });

      it.each([
        { branch: 'then', expected: { r: { k: 'x', m: { q: 1, n: null } } } },
        { branch: 'else', expected: { r: { k: 'x', m: { q: 1 } } } },
      ])(
        'reads a key of an object `const` as the property the `$branch` of an unmerged `allOf` entry declares for a default',
        ({ branch, expected }) => {
          const schema: RJSFSchema = {
            type: 'object',
            properties: {
              r: {
                type: 'object',
                const: { m: { q: 1 } },
                properties: { k: { type: 'string', default: 'x' } },
                allOf: [
                  {
                    if: { properties: { k: { const: 'x' } }, required: ['k'] },
                    [branch]: {
                      properties: { m: { type: 'object', properties: { q: { type: 'number' }, n: { type: 'null' } } } },
                    },
                  },
                ],
              },
            },
          };
          const filled = fill(schema);
          expect(filled).toEqual(expected);
          expect(fill(schema, filled)).toEqual(filled);
        },
      );

      it.each([
        { name: 'an unmerged `allOf` entry', behavior: undefined },
        { name: 'an `if` under `skipEmptyDefaults`', behavior: { emptyObjectFields: 'skipEmptyDefaults' } as const },
      ])('fills the object `const` the `then` of $name brings in for a default', ({ name, behavior }) => {
        const condition: RJSFSchema = {
          if: { properties: { k: { const: 'x' } }, required: ['k'] },
          then: { const: { k: 'x', c: 1 } },
        };
        const r: RJSFSchema = {
          type: 'object',
          properties: { k: { type: 'string', default: 'x' } },
          ...(name.startsWith('an unmerged') ? { allOf: [condition] } : condition),
        };
        const schema: RJSFSchema = { type: 'object', properties: { r } };
        const filled = fill(schema, undefined, behavior);
        expect(filled).toEqual({ r: { k: 'x', c: 1 } });
        expect(fill(schema, filled, behavior)).toEqual(filled);
      });

      // `k` holds an object in the data, so its dependency is qualified for the data alone, and only the nested default
      // of `j` decides which option the dependency's `oneOf` matches
      const nestedKey: RJSFSchema = { type: 'object', properties: { j: { type: 'string', default: 'x' } } };
      const optionOf = (value: string, key: string, fill: number): RJSFSchema => ({
        properties: {
          k: { properties: { j: { enum: [value] } }, required: ['j'] },
          [key]: { type: 'number', default: fill },
        },
      });

      it('fills the option of a `dependencies` `oneOf` a nested default matches', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { k: nestedKey },
          dependencies: { k: { oneOf: [optionOf('y', 'b', 2), optionOf('x', 'a', 1)] } },
        };
        const filled = fill(schema, { k: {} });
        expect(filled).toEqual({ k: { j: 'x' }, a: 1 });
        expect(fill(schema, filled)).toEqual(filled);
      });

      it('fills the option of a `oneOf` beside `dependencies` a nested default matches', () => {
        const schema: RJSFSchema = {
          type: 'object',
          properties: { k: nestedKey },
          dependencies: { z: ['k'] },
          oneOf: [optionOf('y', 'b', 2), optionOf('x', 'a', 1)],
        };
        const filled = fill(schema, { k: {} });
        expect(filled).toEqual({ k: { j: 'x' }, a: 1 });
        expect(fill(schema, filled)).toEqual(filled);
      });

      describe('a branch that takes back the default that selects it', () => {
        // The `else` fills the `'e'` that selects the `then`, whose `'d'` selects the `else` again: no fill is the one
        // its own defaults select, so the defaults decide nothing here and the data alone does
        const schema: RJSFSchema = {
          type: 'object',
          properties: { a: { type: 'string' } },
          if: { properties: { a: { const: 'e' } }, required: ['a'] },
          then: { properties: { a: { default: 'd' }, t: { type: 'number', default: 1 } } },
          else: { properties: { a: { default: 'e' } } },
        };

        it('fills the branch the data alone selects', () => {
          expect(fill(schema)).toEqual({ a: 'e' });
        });

        it('fills the branch the data alone selects where the branch taken back brings a condition of its own', () => {
          const nested: RJSFSchema = {
            ...schema,
            then: {
              ...(schema.then as RJSFSchema),
              if: { required: ['t'] },
              then: { properties: { u: { type: 'number', default: 2 } } },
            },
          };
          expect(fill(nested)).toEqual({ a: 'e' });
        });

        it('fills the branch the filled data selects once the data holds it, and nothing more after that', () => {
          const filled = fill(schema, fill(schema));
          expect(filled).toEqual({ a: 'e', t: 1 });
          expect(fill(schema, filled)).toEqual(filled);
        });

        it('fills the branch a default selects for every other condition of the field', () => {
          // The first entry takes back the default of `k` that selects it, which leaves the default of `m` to decide
          // the second entry
          const twoConditions: RJSFSchema = {
            type: 'object',
            properties: { k: { type: 'string' }, m: { type: 'string', default: 'x' } },
            allOf: [
              {
                if: { properties: { k: { const: 'x' } }, required: ['k'] },
                then: { properties: { k: { default: 'y' } } },
                else: { properties: { k: { default: 'x' } } },
              },
              {
                if: { properties: { m: { const: 'x' } }, required: ['m'] },
                then: { properties: { t: { type: 'number', default: 2 } } },
              },
            ],
          };
          const filled = fill(twoConditions, {});
          expect(filled).toEqual({ k: 'x', m: 'x', t: 2 });
          expect(fill(twoConditions, filled)).toEqual(filled);
        });

        it.each([
          { order: 'after', reversed: false },
          { order: 'before', reversed: true },
        ])(
          'fills the branch the settled default selects for a condition $order the one taking it back',
          ({ reversed }) => {
            // Both entries share one `if`, which flips with `k`, but only `takingBack`'s branches take back the `k`
            // that selects them; `following` reads the `k` the fill settles on
            const kIsX: RJSFSchema = { properties: { k: { const: 'x' } }, required: ['k'] };
            const takingBack: RJSFSchema = {
              if: kIsX,
              then: { properties: { k: { default: 'y' } } },
              else: { properties: { k: { default: 'x' } } },
            };
            const following: RJSFSchema = {
              if: kIsX,
              then: { properties: { t: { type: 'number', default: 1 } } },
              else: { properties: { e: { type: 'number', default: 2 } } },
            };
            const schema: RJSFSchema = {
              type: 'object',
              properties: { k: { type: 'string' } },
              allOf: reversed ? [following, takingBack] : [takingBack, following],
            };
            const filled = fill(schema, {});
            expect(filled).toEqual({ k: 'x', t: 1 });
            expect(fill(schema, filled)).toEqual(filled);
          },
        );

        it('fills the branch the data alone selects for a condition of a string field', () => {
          const stringField: RJSFSchema = {
            type: 'object',
            properties: { s: { type: 'string', if: { const: 'x' }, then: { default: 'y' }, else: { default: 'x' } } },
          };
          expect(fill(stringField, {})).toEqual({ s: 'x' });
        });

        it('fills the option the data alone matches where an option takes back the default that matches it', () => {
          const options: RJSFSchema = {
            type: 'object',
            properties: { k: { type: 'string', default: 'x' } },
            dependencies: { z: ['k'] },
            oneOf: [
              { properties: { k: { enum: ['x'], default: 'y' } }, required: ['k'] },
              { properties: { k: { enum: ['y'], default: 'x' } }, required: ['k'] },
            ],
          };
          expect(fill(options, {})).toEqual({ k: 'y' });
        });

        it('fills the branch the data alone selects once the passes outnumber the decisions, each deciding otherwise', () => {
          // The passes select the branches of `a` and `b` failing both, then `a`'s alone, then `b`'s alone, and stop
          // there, before the branch of both, which its own defaults select
          const branch = (a: string, b: string): RJSFSchema => ({
            properties: { a: { default: a }, b: { default: b } },
          });
          const bIsOne: RJSFSchema = { properties: { b: { const: '1' } }, required: ['b'] };
          const twoBits: RJSFSchema = {
            type: 'object',
            properties: { a: { type: 'string' }, b: { type: 'string' } },
            if: { properties: { a: { const: '1' } }, required: ['a'] },
            then: { if: bIsOne, then: branch('1', '1'), else: branch('2', '1') },
            else: { if: bIsOne, then: branch('1', '1'), else: branch('1', '2') },
          };
          expect(fill(twoBits, {})).toEqual({ a: '1', b: '2' });
        });
      });
    });

    describe('the items of an array `default` (#5831)', () => {
      const fill = (schema: RJSFSchema, formData?: unknown) =>
        getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema, formData });
      const item: RJSFSchema = {
        type: 'object',
        properties: { q: { type: 'number', default: 1 }, c: { const: 'c' } },
      };

      it('fills an item of the default with the defaults of its own properties', () => {
        const schema: RJSFSchema = { type: 'array', default: [{}], items: item };
        expect(fill(schema)).toEqual([{ q: 1, c: 'c' }]);
      });

      it('fills it the same for a default the array takes from its parent', () => {
        const schema: RJSFSchema = {
          type: 'object',
          default: { list: [{}] },
          properties: { list: { type: 'array', items: item } },
        };
        expect(fill(schema)).toEqual({ list: [{ q: 1, c: 'c' }] });
      });

      it('keeps what an item of the default states over the default of the items', () => {
        const schema: RJSFSchema = { type: 'array', default: ['a', 'b'], items: { type: 'string', default: 'z' } };
        expect(fill(schema)).toEqual(['a', 'b']);
        const objects: RJSFSchema = { type: 'array', default: [{ q: 5 }], items: item };
        expect(fill(objects)).toEqual([{ q: 5, c: 'c' }]);
      });

      it('keeps a `null` item of the default, as it keeps one the data holds', () => {
        const schema: RJSFSchema = { type: 'array', default: [null], items: { type: 'string', default: 'z' } };
        expect(fill(schema)).toEqual([null]);
      });

      it('keeps an item of the default the items reject, as it keeps one the data holds', () => {
        const schema: RJSFSchema = { type: 'array', default: ['x'], items: { type: 'string', enum: ['a', 'b'] } };
        expect(fill(schema)).toEqual(['x']);
        expect(fill(schema, ['x'])).toEqual(['x']);
      });

      it('keeps an item of the default the items reject over their own default, as it keeps one the data holds', () => {
        const schema: RJSFSchema = {
          type: 'array',
          default: ['x', 'a'],
          items: { type: 'string', enum: ['a', 'b'], default: 'b' },
        };
        expect(fill(schema)).toEqual(['x', 'a']);
        expect(fill(schema, ['x', 'a'])).toEqual(['x', 'a']);
        const multiSelect: RJSFSchema = {
          type: 'array',
          uniqueItems: true,
          default: ['x'],
          items: { enum: ['a', 'b'], default: 'a' },
        };
        expect(fill(multiSelect)).toEqual(['x']);
        expect(fill(multiSelect, ['x'])).toEqual(['x']);
      });

      it('reads an item of the default by `items`, not by an `additionalItems` beside it', () => {
        const schema: RJSFSchema = {
          type: 'array',
          default: [{}],
          items: item,
          additionalItems: { type: 'object', properties: { z: { type: 'number', default: 9 } } },
        };
        expect(fill(schema)).toEqual([{ q: 1, c: 'c' }]);
        expect(fill(schema, [{}])).toEqual([{ q: 1, c: 'c' }]);
      });

      it('fills an item of the default as the form does without `shouldMergeDefaultsIntoFormData`', () => {
        const schema: RJSFSchema = {
          type: 'array',
          default: [{ e: null }],
          items: {
            type: 'object',
            properties: { e: { type: ['string', 'null'], default: 'a' }, q: { type: 'number', default: 1 } },
          },
        };
        expect(fill(schema)).toEqual([{ e: null, q: 1 }]);
        expect(computeDefaults({ validator: testValidator }, schema, { rootSchema: schema })).toEqual(fill(schema));
      });

      it('leaves an item of the default as it states it under `populate: never`, as it leaves a row', () => {
        const schema: RJSFSchema = { type: 'array', default: [{}], items: item };
        const fillNever = (formData?: unknown) =>
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { populate: 'never' } } },
            { schema, rootSchema: schema, formData },
          );
        expect(fillNever([{}])).toEqual([{}]);
        expect(fillNever()).toEqual([{}]);
      });

      it('fills an item past the rows of the data when extra defaults are merged', () => {
        const schema: RJSFSchema = { type: 'array', default: [{}, {}], items: item };
        expect(
          getDefaultFormState(
            { validator: testValidator, defaultFormStateBehavior: { arrayMinItems: { mergeExtraDefaults: true } } },
            { schema, rootSchema: schema, formData: [{ q: 3 }] },
          ),
        ).toEqual([
          { q: 3, c: 'c' },
          { q: 1, c: 'c' },
        ]);
      });

      it('changes nothing when the filled data is filled again', () => {
        const schema: RJSFSchema = { type: 'array', default: [{}], items: item };
        const filled = fill(schema);
        expect(fill(schema, filled)).toEqual(filled);
      });
    });
  });
}
