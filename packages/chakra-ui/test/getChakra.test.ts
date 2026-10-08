import type { ChakraUiSchema } from '../src/utils.ts';
import { getChakra } from '../src/utils.ts';

describe('getChakra()', () => {
  test('returns the chakra style props to forward', () => {
    const uiSchema: ChakraUiSchema = { 'ui:options': { chakra: { mb: 4 } } };

    expect(getChakra(uiSchema)).toEqual({ mb: 4 });
  });

  test('drops props that are not chakra style props', () => {
    const chakra = { mb: 4, notAStyleProp: 'nope' };
    const uiSchema: ChakraUiSchema = { 'ui:options': { chakra } };

    expect(getChakra(uiSchema)).toEqual({ mb: 4 });
  });

  test('does not mutate the `ui:options.chakra` object it was given', () => {
    const chakra = { mb: 4, notAStyleProp: 'nope' };
    const uiSchema: ChakraUiSchema = { 'ui:options': { chakra } };

    getChakra(uiSchema);

    expect(chakra).toEqual({ mb: 4, notAStyleProp: 'nope' });
  });
});
