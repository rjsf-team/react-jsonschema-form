import { getMuiProps } from '../src/util';

describe('getMuiProps', () => {
  it('should extract mui props from uiOptions', () => {
    const options = {
      mui: {
        slotProps: { input: { endAdornment: 'kg' } },
        variant: 'filled',
      },
    };
    const result = getMuiProps(options);
    expect(result.slotProps.input.endAdornment).toBe('kg');
    expect(result.variant).toBe('filled');
  });

  it('should handle missing mui props gracefully', () => {
    const result = getMuiProps({});
    expect(result).toEqual({});
  });

  it('should handle missing options gracefully', () => {
    const result = getMuiProps(undefined as any);
    expect(result).toEqual({});
  });

  it('should filter properties when propsToFilter is provided', () => {
    const options = {
      mui: {
        variant: 'filled',
        fullWidth: true,
        disabled: false,
      },
    };
    const result = getMuiProps(options, ['variant', 'disabled']);
    expect(result).toEqual({
      variant: 'filled',
      disabled: false,
    });
  });
});
