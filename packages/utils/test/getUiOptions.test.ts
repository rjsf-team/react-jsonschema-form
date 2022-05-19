import { UIOptionsType, UiSchema, getUiOptions } from '../src';

const uiSchema: UiSchema = {
  widgetText: {
    'ui:widget': 'select',
  },
  widgetObject: {
    'ui:widget': {
      component: 'radio',
    },
  },
  optionsObject: {
    'ui:options': {
      widget: 'hidden',
      disabled: true,
    }
  },
  multiOptions: {
    'ui:submitButtonProps': {
      norender: true,
    },
    'ui:readonly': true,
    'ui:options': 'text',
    junk: 'not-shown'
  }
};

const results: { [key: string]: UIOptionsType } = {
  widgetText: { widget: 'select' },
  widgetObject: { widget: 'radio' },
  optionsObject: { widget: 'hidden', disabled: true },
  multiOptions: {
    submitButtonProps: { norender: true },
    readonly: true,
    options: 'text',
  }
};

describe('getUiOptions()', () => {
  let consoleWarnSpy: jest.SpyInstance;
  beforeAll(() => {
    // spy on console.warn() and make it do nothing to avoid making noise in the test
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });
  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });
  it('returns widget text as options', () => {
    expect(getUiOptions(uiSchema.widgetText)).toEqual(results.widgetText);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
  it('returns widget object as options, with warning', () => {
    expect(getUiOptions(uiSchema.widgetObject)).toEqual(results.widgetObject);
    expect(consoleWarnSpy).toHaveBeenCalledWith('Setting options via ui:widget object is deprecated, use ui:options instead');
  });
  it('returns options object as options', () => {
    expect(getUiOptions(uiSchema.optionsObject)).toEqual(results.optionsObject);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });
  it('returns multiple options as options', () => {
    expect(getUiOptions(uiSchema.multiOptions)).toEqual(results.multiOptions);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });
});
