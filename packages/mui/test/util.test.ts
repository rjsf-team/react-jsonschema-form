import { getMuiProps } from '../src/util';

describe('getMuiProps', () => {
  it('should extract mui props from uiOptions', () => {
    const options = {
      mui: {
        rjsfSlotProps: { fieldErrorList: { dense: true } },
        variant: 'filled',
      },
    };
    const result = getMuiProps(options);
    expect(result.rjsfSlotProps.fieldErrorList.dense).toBe(true);
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

  it('should return only rjsfSlotProps when rjsfSlotPropsOnly is true', () => {
    const options = {
      mui: {
        rjsfSlotProps: { arrayPaper: { elevation: 10 } },
        variant: 'filled',
        sx: { mt: 2 },
      },
    };
    const result = getMuiProps(options, undefined, true);
    expect(result.rjsfSlotProps).toEqual({ arrayPaper: { elevation: 10 } });
    expect(result.variant).toBeUndefined();
    expect(result.sx).toBeUndefined();
  });
});
