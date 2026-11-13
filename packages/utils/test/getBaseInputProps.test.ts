import { englishStringTranslator, getBaseInputProps } from '../src/index.ts';

const registry = { translateString: englishStringTranslator };

describe('getBaseInputProps()', () => {
  it('names the numeric pattern it derives for a number', () => {
    expect(getBaseInputProps({ schema: { type: 'number' }, options: {}, registry })).toMatchObject({
      type: 'text',
      inputMode: 'decimal',
      title: 'Enter a number',
    });
  });

  it('puts the props a widget passes over the derived ones', () => {
    expect(
      getBaseInputProps({
        schema: { type: 'string' },
        options: { accept: '.pdf' },
        registry,
        accept: '.png',
        inputMode: 'tel',
      }),
    ).toEqual({ type: 'text', accept: '.png', inputMode: 'tel', title: undefined });
  });

  it('puts a multiple on a file input', () => {
    expect(
      getBaseInputProps({ schema: { type: 'string' }, type: 'file', options: {}, registry, multiple: true }),
    ).toMatchObject({ type: 'file', multiple: true });
  });

  it('leaves a multiple off an input that is not a file input', () => {
    expect(
      getBaseInputProps({ schema: { type: 'string' }, type: 'email', options: {}, registry, multiple: true }).multiple,
    ).toBeUndefined();
  });

  it('drops the title of a derived pattern that a widget replaces', () => {
    expect(getBaseInputProps({ schema: { type: 'number' }, options: {}, registry, pattern: '[0-9]+' })).toMatchObject({
      pattern: '[0-9]+',
      title: undefined,
    });
  });

  it('derives a native number input for a theme with its own numeric widget', () => {
    expect(getBaseInputProps({ schema: { type: 'integer' }, options: {}, registry }, false)).toEqual({
      type: 'number',
      step: 1,
      title: undefined,
    });
  });
});
