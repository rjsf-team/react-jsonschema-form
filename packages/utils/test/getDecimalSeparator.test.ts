import { getDecimalSeparator } from '../src';

describe('getDecimalSeparator()', () => {
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
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(undefined as any);
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
});
