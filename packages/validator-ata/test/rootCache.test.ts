import type { RJSFSchema } from '@rjsf/utils';

import createAtaInstance from '../src/createAtaInstance.ts';
import type * as Instance from '../src/createAtaInstance.ts';
import customizeValidator from '../src/customizeValidator.ts';

vi.mock('../src/createAtaInstance.ts', async (importOriginal) => {
  const original = await importOriginal<typeof Instance>();
  return { ...original, default: vi.fn(original.default) };
});

const built = vi.mocked(createAtaInstance);
const sample = { string: 'a', number: 1, boolean: true };
type Sampled = keyof typeof sample;
const rootOf = (type: Sampled): RJSFSchema => ({ definitions: { v: { type } } });
const check = (validator: ReturnType<typeof customizeValidator>, type: Sampled, root: RJSFSchema) => {
  expect(validator.isValid({ $ref: '#/definitions/v' }, sample[type], root)).toBe(true);
  expect(validator.isValid({ $ref: '#/definitions/v' }, [], root)).toBe(false);
};

describe('the validators built beside the last two roots', () => {
  beforeEach(() => built.mockClear());

  it('are built once per root while two roots alternate', () => {
    const validator = customizeValidator();
    const [a, b] = [rootOf('string'), rootOf('number')];
    for (let i = 0; i < 3; i++) {
      check(validator, 'string', a);
      check(validator, 'number', b);
    }
    // Each root's own and the `{ $ref }`'s beside it
    expect(built).toHaveBeenCalledTimes(4);
  });
  it('are dropped with the least recently used root once a third arrives', () => {
    const validator = customizeValidator();
    const [a, b, c] = [rootOf('string'), rootOf('number'), rootOf('boolean')];
    check(validator, 'string', a);
    check(validator, 'number', b);
    check(validator, 'string', a);
    built.mockClear();
    check(validator, 'boolean', c);
    check(validator, 'string', a);
    expect(built).toHaveBeenCalledTimes(2);
    check(validator, 'number', b);
    expect(built).toHaveBeenCalledTimes(4);
  });
  it('are kept for a root equal to one held', () => {
    const validator = customizeValidator();
    const [a, b] = [rootOf('string'), rootOf('number')];
    check(validator, 'string', a);
    check(validator, 'number', b);
    built.mockClear();
    check(validator, 'string', structuredClone(a));
    check(validator, 'number', b);
    expect(built).not.toHaveBeenCalled();
  });
});
