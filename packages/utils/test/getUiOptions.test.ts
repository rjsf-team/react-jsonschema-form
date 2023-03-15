import { GlobalUISchemaOptions, UIOptionsType, UiSchema, getUiOptions } from '../src';

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

const globalOptions: GlobalUISchemaOptions = {
  addable: false,
  copyable: true,
};

const results: { [key: string]: UIOptionsType } = {
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
  let consoleErrorSpy: jest.SpyInstance;
  beforeAll(() => {
    // spy on console.error() and make it do nothing to avoid making noise in the test
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
  it('returns empty options with no uiSchema', () => {
    expect(getUiOptions()).toEqual({});
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
      'Setting options via ui:widget object is no longer supported, use ui:options instead'
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
});
