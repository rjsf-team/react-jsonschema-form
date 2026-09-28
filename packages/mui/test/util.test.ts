import type { Theme } from '@mui/material';

import { computeSxProps, getMuiProps } from '../src/util.ts';

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

describe('computeSxProps', () => {
  it('returns the default sx when there are no mui props', () => {
    expect(computeSxProps({ mt: 1 })).toEqual({ mt: 1 });
  });

  it('returns the default sx when the mui props have no sx', () => {
    expect(computeSxProps({ mt: 1 }, { component: 'div' })).toEqual({ mt: 1 });
  });

  it('shallow-merges an object sx over the default sx', () => {
    expect(computeSxProps({ mt: 1, mb: 1 }, { sx: { mt: 2 } })).toEqual({ mt: 2, mb: 1 });
  });

  it('prepends the default sx to an array sx', () => {
    const sx = [{ mt: 2 }, { mb: 2 }];
    expect(computeSxProps({ mt: 1 }, { sx })).toEqual([{ mt: 1 }, { mt: 2 }, { mb: 2 }]);
  });

  it('keeps a theme callback sx by composing it after the default sx', () => {
    const sx = (theme: Theme) => ({ color: theme.palette.primary.main });
    expect(computeSxProps({ mt: 1 }, { sx })).toEqual([{ mt: 1 }, sx]);
  });
});
