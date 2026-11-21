// @vitest-environment jsdom
// jsdom provides the `navigator` global these tests spy on; Node 20 has none.
import { getDecimalSeparator as cachedAcrossTests } from '../src/index.ts';

describe('getDecimalSeparator()', () => {
  // The separators it caches are module-wide, so each test gets a fresh module and reuses no locale an earlier one used
  let getDecimalSeparator = cachedAcrossTests;
  beforeEach(async () => {
    vi.resetModules();
    ({ default: getDecimalSeparator } = await import('../src/getDecimalSeparator.ts'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should return "." for default/English locale string', () => {
    expect(getDecimalSeparator('en')).toEqual('.');
  });

  it('should return "," for French locale string', () => {
    expect(getDecimalSeparator('fr')).toEqual(',');
  });

  it('should return "," for French locale array', () => {
    expect(getDecimalSeparator(['fr'])).toEqual(',');
  });

  it('should return "," when languages is undefined but navigator.languages is mocked to Polish', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['pl']);
    expect(getDecimalSeparator()).toEqual(',');
  });

  it('should return "." when languages is undefined and navigator.languages is undefined', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(
      // @ts-expect-error: TS2345, a browser that reports no languages is what this case checks
      undefined,
    );
    expect(getDecimalSeparator()).toEqual('.');
  });

  it('should return "." when navigator is undefined', () => {
    vi.stubGlobal('navigator', undefined);
    expect(getDecimalSeparator()).toEqual('.');
  });

  it('should catch error and return "." when an invalid locale is provided', () => {
    expect(getDecimalSeparator('invalid-locale!!!')).toEqual('.');
  });

  it('should return "." when formatToParts does not contain a decimal part', () => {
    vi.spyOn(Intl.NumberFormat.prototype, 'formatToParts').mockReturnValue([{ type: 'integer', value: '1' }]);
    expect(getDecimalSeparator('fr')).toEqual('.');
  });

  it('builds the number format once per locale', () => {
    const NumberFormat = vi.spyOn(Intl, 'NumberFormat');
    expect(getDecimalSeparator('fr')).toEqual(',');
    expect(getDecimalSeparator('fr')).toEqual(',');
    expect(NumberFormat).toHaveBeenCalledTimes(1);
  });

  it('keeps a list of locales apart from the string that joins them, which names no locale', () => {
    expect(getDecimalSeparator('nl,en')).toEqual('.');
    expect(getDecimalSeparator(['nl', 'en'])).toEqual(',');
  });
});
