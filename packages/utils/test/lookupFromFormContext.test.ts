import { FORM_CONTEXT_NAME, LOOKUP_MAP_NAME } from '../src/constants';
import lookupFromFormContext from '../src/lookupFromFormContext';
import { Registry } from '../src/types';

const PROP = 'exists';

const FORM_CONTEXT = {
  [LOOKUP_MAP_NAME]: {
    [PROP]: true,
  },
};

const EMPTY_REGISTRY = {
  [FORM_CONTEXT_NAME]: {},
};

/** Cast this as necessary for the tests */
const REGISTRY = {
  [FORM_CONTEXT_NAME]: FORM_CONTEXT,
} as unknown as Registry;

describe('lookupFromFormContext', () => {
  it('returns undefined when regOrFc is empty', () => {
    expect(lookupFromFormContext({}, 'foo')).toBeUndefined();
  });
  it('returns undefined when registry.formContext is empty', () => {
    expect(lookupFromFormContext(EMPTY_REGISTRY, 'foo')).toBeUndefined();
  });
  it('returns fallback when registry.formContext is empty', () => {
    expect(lookupFromFormContext(EMPTY_REGISTRY, 'foo', PROP)).toBe(PROP);
  });
  it('returns value when registry.formContext is contains field', () => {
    expect(lookupFromFormContext(REGISTRY, PROP, 'foo')).toBe(FORM_CONTEXT[LOOKUP_MAP_NAME][PROP]);
  });
});
