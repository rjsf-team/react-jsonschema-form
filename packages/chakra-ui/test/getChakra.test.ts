import { getChakra } from '../src/utils.ts';

describe('getChakra()', () => {
  test('returns the chakra style props to forward', () => {
    expect(getChakra({ chakra: { mb: 4 } })).toEqual({ mb: 4 });
  });

  test('keeps a style prop that is also the name of an HTML attribute', () => {
    const chakra = { p: '1rem', color: 'blue.200', width: '50%', height: 10, display: 'flex' };

    expect(getChakra({ chakra })).toEqual(chakra);
  });

  test('drops props that are not chakra style props', () => {
    const chakra = { mb: 4, notAStyleProp: 'nope', required: true, onClick: () => {}, sx: { margin: '0 auto' } };

    expect(getChakra({ chakra })).toEqual({ mb: 4 });
  });

  test('returns no props for options without a chakra object', () => {
    expect(getChakra()).toEqual({});
    expect(getChakra({ chakra: 'mb' })).toEqual({});
  });

  test('does not mutate the `chakra` object it was given', () => {
    const chakra = { mb: 4, notAStyleProp: 'nope' };

    getChakra({ chakra });

    expect(chakra).toEqual({ mb: 4, notAStyleProp: 'nope' });
  });
});
