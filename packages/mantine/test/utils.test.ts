import type { GenericObjectType, WidgetProps } from '@rjsf/utils';

import type { MantineGlobalUISchemaOptions } from '../src/index.ts';
import { cleanupOptions } from '../src/utils.tsx';

// A registry with no global options, so only the names rjsf reads are left out
const noGlobals = { registry: {} };

describe('cleanupOptions()', () => {
  it('removes autocapitalize from Mantine theme props', () => {
    expect(cleanupOptions({ autocapitalize: 'words', radius: 'md' }, noGlobals)).toEqual({ radius: 'md' });
  });

  it('removes the itemLabel array option', () => {
    expect(cleanupOptions({ itemLabel: 'name', radius: 'md' }, noGlobals)).toEqual({ radius: 'md' });
  });

  it.each(['initialValue', 'placeholder', 'required', 'rows', 'enumOptions'])('removes the %s option', (name) => {
    expect(cleanupOptions({ [name]: 'value', radius: 'md' }, noGlobals)).toEqual({ radius: 'md' });
  });

  it.each(['MarkdownTemplate', 'GridTemplate', 'FieldTemplate', 'ButtonTemplates'])(
    'removes a per-field %s override',
    (name) => {
      expect(cleanupOptions({ [name]: () => null, radius: 'md' }, noGlobals)).toEqual({ radius: 'md' });
    },
  );

  it('removes fieldReplacesAnyOrOneOf, which the ui: key of the same name gives a field', () => {
    expect(cleanupOptions({ fieldReplacesAnyOrOneOf: true, radius: 'md' }, noGlobals)).toEqual({ radius: 'md' });
  });

  it.each([
    'accept',
    'expandable',
    'format',
    'gridCols',
    'gridSpacing',
    'gridVerticalSpacing',
    'hideClearButton',
    'hideNowButton',
    'shape',
    'stars',
    'yearsRange',
  ])('removes %s, an option rjsf reads that no type declares', (name) => {
    expect(cleanupOptions({ [name]: 'value', radius: 'md' }, noGlobals)).toEqual({ radius: 'md' });
  });

  it.each([
    ['a set', new Set(['min'])],
    ['an array', ['min']],
  ])('also removes the extra keys it is given as %s', (_, extraKeys) => {
    expect(cleanupOptions({ min: 1, radius: 'md' }, noGlobals, extraKeys)).toEqual({ radius: 'md' });
  });

  it("removes the keys the global options hold, which are meant for the user's own components", () => {
    // An extension key the form declares, which the registry's globals hold untyped
    const globalUiOptions: GenericObjectType = { density: 2 };
    expect(cleanupOptions({ density: 2, radius: 'md' }, { registry: { globalUiOptions } })).toEqual({ radius: 'md' });
  });

  it("keeps a field's own option that a global key shares its name with", () => {
    const globalUiOptions: GenericObjectType = { variant: 'compact' };
    const uiSchema = { 'ui:options': { variant: 'filled' } };
    expect(cleanupOptions({ variant: 'filled', radius: 'md' }, { registry: { globalUiOptions }, uiSchema })).toEqual({
      variant: 'filled',
      radius: 'md',
    });
  });

  it("types the result without the options it strips, even with the index signature of a widget's options", () => {
    const options: WidgetProps['options'] = { rows: 4 };
    expectTypeOf(cleanupOptions(options, noGlobals)).not.toHaveProperty('rows');
    expectTypeOf(cleanupOptions({ rows: 4, radius: 'md' as const }, noGlobals)).toEqualTypeOf<{ radius: 'md' }>();
    const optional: { rows?: number; radius?: 'md' } = {};
    expectTypeOf(cleanupOptions(optional, noGlobals)).toEqualTypeOf<{ radius?: 'md' }>();
  });
});

describe('MantineGlobalUISchemaOptions', () => {
  it('rejects a user extension reusing an option name the widgets read', () => {
    expectTypeOf<MantineGlobalUISchemaOptions<{ myKey?: string }>>().not.toBeNever();
    // @ts-expect-error `useFieldWrapperProps()` reads `wrapperProps`
    expectTypeOf<MantineGlobalUISchemaOptions<{ wrapperProps?: object }>>().not.toBeNever();
    // @ts-expect-error `RangeWidget` reads `thumbLabel`
    expectTypeOf<MantineGlobalUISchemaOptions<{ thumbLabel?: string }>>().not.toBeNever();
    // @ts-expect-error `DateWidget` reads `valueFormat`
    expectTypeOf<MantineGlobalUISchemaOptions<{ valueFormat?: string }>>().not.toBeNever();
    // @ts-expect-error `useFieldWrapperProps()` reads the `InputWrapper`'s `size`
    expectTypeOf<MantineGlobalUISchemaOptions<{ size?: string }>>().not.toBeNever();
  });
});
