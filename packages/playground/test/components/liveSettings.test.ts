import { normalizeLiveSettings, toLiveSetting } from '../../src/components/Playground.tsx';

describe('normalizeLiveSettings', () => {
  it('defaults a missing liveSettings object to {}, matching a shared URL that predates liveSettings support', () => {
    expect(normalizeLiveSettings(undefined)).toEqual({});
  });

  it('leaves an empty liveSettings object as-is', () => {
    expect(normalizeLiveSettings({})).toEqual({});
  });

  it('converts a legacy v5 `true` liveValidate value to `onChange`', () => {
    expect(normalizeLiveSettings({ liveValidate: true })).toEqual({ liveValidate: 'onChange' });
  });

  it('converts a legacy v5/v6 `false` liveValidate value to `off`', () => {
    expect(normalizeLiveSettings({ liveValidate: false })).toEqual({ liveValidate: 'off' });
  });

  it('converts a legacy v5 `true` liveOmit value to `onChange`', () => {
    expect(normalizeLiveSettings({ liveOmit: true })).toEqual({ liveOmit: 'onChange' });
  });

  it('converts a legacy v5/v6 `false` liveOmit value to `off`', () => {
    expect(normalizeLiveSettings({ liveOmit: false })).toEqual({ liveOmit: 'off' });
  });

  it('leaves current string liveValidate/liveOmit values unchanged', () => {
    expect(normalizeLiveSettings({ liveValidate: 'onBlur', liveOmit: 'onChange' })).toEqual({
      liveValidate: 'onBlur',
      liveOmit: 'onChange',
    });
  });

  it('preserves other settings while normalizing liveValidate/liveOmit', () => {
    expect(
      normalizeLiveSettings({ liveValidate: true, liveOmit: false, showErrorList: 'top', disabled: true }),
    ).toEqual({
      liveValidate: 'onChange',
      liveOmit: 'off',
      showErrorList: 'top',
      disabled: true,
    });
  });
});

describe('toLiveSetting', () => {
  it('passes through `onChange`', () => {
    expect(toLiveSetting('onChange')).toBe('onChange');
  });

  it('passes through `onBlur`', () => {
    expect(toLiveSetting('onBlur')).toBe('onBlur');
  });

  it('maps `off` to undefined', () => {
    expect(toLiveSetting('off')).toBeUndefined();
  });

  it('maps undefined to undefined', () => {
    expect(toLiveSetting(undefined)).toBeUndefined();
  });

  it('maps a stray legacy boolean to undefined, since Form no longer accepts one', () => {
    expect(toLiveSetting(true)).toBeUndefined();
    expect(toLiveSetting(false)).toBeUndefined();
  });
});
