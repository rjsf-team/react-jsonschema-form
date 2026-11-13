import { createElement, forwardRef, lazy, memo } from 'react';
import type { MockInstance } from 'vitest';

import { setupConsoleWarnSuppression } from '../../../testing/consoleSuppression.ts';
import type {
  GenericObjectType,
  GlobalUISchemaOptions,
  UIOptionsType,
  UiSchema,
  Widget,
  WidgetProps,
} from '../src/index.ts';
import { getUiOptions, noop } from '../src/index.ts';

const uiSchema = {
  widgetText: {
    'ui:widget': 'select',
  },
  widgetObject: {
    'ui:widget': {
      component: 'radio',
    },
  },
  arrayObject: {
    'ui:addable': true,
  },
  optionsObject: {
    'ui:options': {
      widget: 'hidden',
      disabled: true,
    },
  },
  multiOptions: {
    'ui:submitButtonProps': {
      norender: true,
    },
    'ui:readonly': true,
    'ui:options': 'text',
    junk: 'not-shown',
  },
};

const MyWidget = (_props: WidgetProps) => null;
const ForwardedWidget = forwardRef<unknown, WidgetProps>((_props, _ref) => null);

const globalOptions: GlobalUISchemaOptions = {
  addable: false,
  copyable: true,
};

const results: Record<string, UIOptionsType> = {
  widgetText: { widget: 'select' },
  widgetObject: {},
  arrayObject: { addable: true, copyable: true },
  optionsObject: { widget: 'hidden', disabled: true },
  multiOptions: {
    submitButtonProps: { norender: true },
    readonly: true,
    options: 'text',
  },
};

/** One case of `uiSchema`. The fixture stays unannotated so that `keyof typeof` catches a misspelled case, and so that
 * each case reads back as what it holds rather than as `unknown`
 */
function uiSchemaCase(name: keyof typeof uiSchema) {
  return uiSchema[name] as UiSchema;
}

describe('getUiOptions()', () => {
  let consoleErrorSpy: MockInstance;
  beforeAll(() => {
    // spy on console.error() and make it do nothing to avoid making noise in the test
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(noop);
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
  it('returns empty options with no uiSchema', () => {
    expect(getUiOptions()).toEqual({});
  });
  it('returns globalOptions when uiSchema is undefined', () => {
    expect(getUiOptions(undefined, globalOptions)).toEqual(globalOptions);
  });
  it('returns globalOptions when uiSchema is null', () => {
    const options = getUiOptions(
      // @ts-expect-error: TS2345, a null uiSchema is what this case checks
      null,
      globalOptions,
    );
    expect(options).toEqual(globalOptions);
  });
  it('returns array object as options', () => {
    expect(getUiOptions(uiSchemaCase('arrayObject'), globalOptions)).toEqual(results.arrayObject);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  it('returns widget text as options', () => {
    expect(getUiOptions(uiSchemaCase('widgetText'))).toEqual(results.widgetText);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  it('returns widget object as empty, with error', () => {
    expect(getUiOptions(uiSchemaCase('widgetObject'))).toEqual(results.widgetObject);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Setting options via ui:widget object is no longer supported, use ui:options instead',
    );
  });
  it('returns options object as options', () => {
    expect(getUiOptions(uiSchemaCase('optionsObject'))).toEqual(results.optionsObject);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
  it('returns multiple options as options', () => {
    expect(getUiOptions(uiSchemaCase('multiOptions'))).toEqual(results.multiOptions);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
  it('leaves a global required out, since ui:required is a field option alone (#5527)', () => {
    // Untyped, as a JSON uiSchema is, since `required` is an option RJSF reads only per field
    const requiredGlobally: GenericObjectType = { required: true };
    expect(getUiOptions({}, { ...requiredGlobally, label: false })).toEqual({ label: false });
    expect(getUiOptions(undefined, requiredGlobally)).toEqual({});
    expect(getUiOptions({ 'ui:required': false }, requiredGlobally)).toEqual({ required: false });
  });
  it('does not return the root keys ui:definitions and ui:globalOptions as options (#5527)', () => {
    const rootUiSchema: UiSchema = {
      'ui:definitions': { '#/definitions/a': { 'ui:title': 'A' } },
      'ui:globalOptions': { label: false },
      'ui:title': 'Root',
    };
    expect(getUiOptions(rootUiSchema)).toEqual({ title: 'Root' });
  });
  test.each<[string, Widget]>([
    ['memo()', memo(MyWidget)],
    ['forwardRef()', ForwardedWidget],
    ['memo(forwardRef())', memo(ForwardedWidget)],
    ['lazy()', lazy(async () => ({ default: MyWidget }))],
  ])('returns a widget given as a %s component as the widget', (_name, widget) => {
    // The spy counts every call in the file, so it is cleared to see only what this call logs
    consoleErrorSpy.mockClear();
    expect(getUiOptions({ 'ui:widget': widget })).toEqual({ widget });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  it('drops a widget given as a React element, as it does any object that is not a component', () => {
    expect(getUiOptions({ 'ui:widget': createElement(MyWidget) as unknown as string })).toEqual({});
    expect(consoleErrorSpy).toHaveBeenLastCalledWith(
      'ui:widget is a React element rather than a component (pass MyWidget, not <MyWidget />), so it is ignored.',
    );
  });
  it('reads no global options from a null one, as a JSON uiSchema can give', () => {
    expect(getUiOptions({ 'ui:label': true }, null as unknown as GlobalUISchemaOptions)).toEqual({ label: true });
  });
  describe('the keys ui:options does not take', () => {
    const warnings = setupConsoleWarnSuppression();

    // Untyped, as a JSON uiSchema is, since the type rejects these
    it.each([
      ['field', ''],
      ['fieldReplacesAnyOrOneOf', ''],
      ['definitions', ' on the root uiSchema'],
      ['globalOptions', ' on the root uiSchema'],
    ])('ignores %s and warns', (name, where) => {
      const given: GenericObjectType = { 'ui:options': { [name]: 'given', inline: true } };

      expect(getUiOptions(given)).toEqual({ inline: true });
      expect(warnings.consoleSpy).toHaveBeenCalledExactlyOnceWith(
        `ui:options.${name} is ignored, since ${name} can only be set through ui:${name}${where}. A custom widget's own option needs another name.`,
      );
    });
    it.each<[string, GenericObjectType]>([
      ['before', { 'ui:field': 'Mine', 'ui:options': { field: 'Other' } }],
      ['after', { 'ui:options': { field: 'Other' }, 'ui:field': 'Mine' }],
    ])('keeps the ui:field spelled %s it', (_, given) => {
      expect(getUiOptions(given)).toEqual({ field: 'Mine' });
    });
    it('does not warn about one left undefined', () => {
      const given: GenericObjectType = { 'ui:options': { field: undefined, inline: true } };

      expect(getUiOptions(given)).toEqual({ inline: true });
      expect(warnings.consoleSpy).not.toHaveBeenCalled();
    });
  });
});
