import { getMuiProps } from '../src/util';

describe('getMuiProps', () => {
  it('should merge props in the correct order', () => {
    const defaultSchemaProps = { a: 'defaultSchema' };
    const defaultContextProps = { b: 'defaultContext' };
    const uiSchema = { 'ui:options': { mui: { c: 'uiSchema' } } };
    const options = { mui: { d: 'options' } };
    const formContext = { mui: { e: 'formContext' } };

    const result = getMuiProps({
      defaultSchemaProps,
      defaultContextProps,
      uiSchema,
      options,
      formContext,
    });

    expect(result).toEqual({
      a: 'defaultSchema',
      b: 'defaultContext',
      c: 'uiSchema',
      d: 'options',
      e: 'formContext',
    });
  });

  it('should allow uiSchema props to override formContext props', () => {
    const uiSchema = { 'ui:options': { mui: { a: 'uiSchema' } } };
    const formContext = { mui: { a: 'formContext' } };

    const result = getMuiProps({
      uiSchema,
      formContext,
    });

    expect(result.a).toBe('uiSchema');
  });

  it('should handle missing props gracefully', () => {
    const result = getMuiProps({});
    expect(result).toEqual({});
  });

  it('should extract mui props from uiSchema (via getUiOptions)', () => {
    const uiSchema = {
      'ui:options': {
        mui: {
          slotProps: { input: { endAdornment: 'kg' } },
        },
      },
    };
    const result = getMuiProps({ uiSchema });
    expect(result.slotProps.input.endAdornment).toBe('kg');
  });
});
