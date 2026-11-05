import type { Theme } from '@mui/material';
import type { RJSFSchema } from '@rjsf/utils';

import { computeSxProps, getMuiProps, omitFormOwnedProps, withoutDisabled } from '../src/util.ts';

describe('getMuiProps', () => {
  it('returns no props for a `mui` option that is not an object', () => {
    expect(getMuiProps({ mui: 'outlined' })).toEqual({});
  });
  it('should extract mui props from uiOptions', () => {
    const options = {
      mui: {
        rjsfSlotProps: { fieldErrorList: { dense: true } },
        variant: 'filled',
      },
    };
    const result = getMuiProps<unknown, RJSFSchema, object, typeof options.mui>(options);
    expect(result.rjsfSlotProps.fieldErrorList.dense).toBe(true);
    expect(result.variant).toBe('filled');
  });

  it('should handle missing mui props gracefully', () => {
    const result = getMuiProps({});
    expect(result).toEqual({});
  });

  it('should handle missing options gracefully', () => {
    const result = getMuiProps(
      // @ts-expect-error: TS2345, missing options are what this case checks
      undefined,
    );
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

  it('should find no rjsfSlotProps in a mui option that is not an object', () => {
    expect(getMuiProps({ mui: true }, undefined, true)).toEqual({ rjsfSlotProps: undefined });
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

  it('composes a theme callback or array default sx with the mui sx', () => {
    const defaults = (theme: Theme) => ({ color: theme.palette.primary.main });
    expect(computeSxProps(defaults, { sx: { mt: 2 } })).toEqual([defaults, { mt: 2 }]);
    expect(computeSxProps([{ mt: 1 }, defaults], { sx: [{ mb: 2 }] })).toEqual([{ mt: 1 }, defaults, { mb: 2 }]);
  });
});

describe('omitFormOwnedProps', () => {
  it('drops the props the form sets, and keeps the rest', () => {
    const formOwned = { disabled: false, onChange: () => {}, onBlur: () => {}, onFocus: () => {} };
    expect(omitFormOwnedProps({ ...formOwned, title: 'T' })).toEqual({ title: 'T' });
  });
});

describe('withoutDisabled', () => {
  const onChange = () => {};

  it('drops disabled from a slot given as an object, and keeps its handlers', () => {
    expect(withoutDisabled({ disabled: false, onChange })).toEqual({ onChange });
  });
  it('drops disabled from what a slot given as a function returns, for the owner state', () => {
    const slot = withoutDisabled((ownerState: { size: string }) => ({ disabled: false, title: ownerState.size }));
    expect(typeof slot === 'function' && slot({ size: 'small' })).toEqual({ title: 'small' });
  });
  it('gives no slot for none', () => {
    expect(withoutDisabled(undefined)).toBeUndefined();
  });
});
