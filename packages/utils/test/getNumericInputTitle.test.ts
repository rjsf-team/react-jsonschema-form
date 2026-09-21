import { englishStringTranslator, getInputProps, getNumericInputTitle, TranslatableString } from '../src/index.ts';

describe('getNumericInputTitle()', () => {
  it('returns undefined for an input with no pattern to explain', () => {
    expect(getNumericInputTitle(getInputProps({ type: 'string' }), englishStringTranslator)).toBeUndefined();
  });
  it('returns undefined for a number rendered as a native number input', () => {
    expect(getNumericInputTitle(getInputProps({ type: 'number' }, 'number'), englishStringTranslator)).toBeUndefined();
  });
  it('names a number for the numeric text input a number field defaults to', () => {
    expect(getNumericInputTitle(getInputProps({ type: 'number' }), englishStringTranslator)).toBe('Enter a number');
  });
  it('names a whole number for the numeric text input an integer field defaults to', () => {
    expect(getNumericInputTitle(getInputProps({ type: 'integer' }), englishStringTranslator)).toBe(
      'Enter a whole number',
    );
  });
  it('localizes the title through the provided translateString', () => {
    const translateString = vi.fn().mockReturnValue('Saisissez un nombre');
    expect(getNumericInputTitle(getInputProps({ type: 'number' }), translateString)).toBe('Saisissez un nombre');
    expect(translateString).toHaveBeenCalledWith(TranslatableString.NumberInputTitle);
  });
});
