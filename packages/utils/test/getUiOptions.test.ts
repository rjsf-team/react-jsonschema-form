import { createElement, forwardRef, lazy, memo } from 'react';
import type { MockInstance } from 'vitest';

import type { GlobalUISchemaOptions, UIOptionsType, UiSchema, Widget, WidgetProps } from '../src/index.ts';
import { getUiOptions, noop } from '../src/index.ts';

const uiSchema: UiSchema = {
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
    expect(getUiOptions(null as any, globalOptions)).toEqual(globalOptions);
  });
  it('returns array object as options', () => {
    expect(getUiOptions(uiSchema.arrayObject, globalOptions)).toEqual(results.arrayObject);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  it('returns widget text as options', () => {
    expect(getUiOptions(uiSchema.widgetText)).toEqual(results.widgetText);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  it('returns widget object as empty, with error', () => {
    expect(getUiOptions(uiSchema.widgetObject)).toEqual(results.widgetObject);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Setting options via ui:widget object is no longer supported, use ui:options instead',
    );
  });
  it('returns options object as options', () => {
    expect(getUiOptions(uiSchema.optionsObject)).toEqual(results.optionsObject);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
  it('returns multiple options as options', () => {
    expect(getUiOptions(uiSchema.multiOptions)).toEqual(results.multiOptions);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
  test.each<[string, Widget]>([
    ['memo()', memo(MyWidget)],
    ['forwardRef()', ForwardedWidget],
    ['memo(forwardRef())', memo(ForwardedWidget)],
    ['lazy()', lazy(async () => ({ default: MyWidget }))],
  ])('returns a widget given as a %s component as the widget', (_name, widget) => {
    expect(getUiOptions({ 'ui:widget': widget })).toEqual({ widget });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
  it('drops a widget given as a React element, as it does any object that is not a component', () => {
    expect(getUiOptions({ 'ui:widget': createElement(MyWidget) as unknown as string })).toEqual({});
  });
});
