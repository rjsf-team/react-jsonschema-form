import type { RJSFSchema } from '@rjsf/utils';
import { retrieveSchema } from '@rjsf/utils';

import createCfworkerInstance from '../src/createCfworkerInstance.ts';
import type * as Instance from '../src/createCfworkerInstance.ts';
import customizeValidator from '../src/customizeValidator.ts';

vi.mock('../src/createCfworkerInstance.ts', async (importOriginal) => {
  const original = await importOriginal<typeof Instance>();
  return { ...original, default: vi.fn(original.default) };
});

const built = vi.mocked(createCfworkerInstance);
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

describe("the validators built for a form's live validation, which validates its root resolved for the data", () => {
  beforeEach(() => built.mockClear());

  const option: RJSFSchema = { type: 'object', properties: { x: { type: 'string', title: 'X' } } };
  const rootFor = (withId: boolean): RJSFSchema => ({
    ...(withId ? { $id: 'https://example.com/root' } : {}),
    type: 'object',
    allOf: [{ properties: { a: { type: 'string', title: 'A' } } }],
    properties: {
      // Checked outside the options, so the first matches and the error on `x` is reported and named
      p: {
        oneOf: [option, { type: 'object', properties: { y: { type: 'number' } }, required: ['y'] }],
        patternProperties: { '^x$': { minLength: 3 } },
      },
    },
  });

  it.each([
    ['with an $id', true],
    ['without one', false],
  ])("are built in the first round alone, for a root %s, keeping the form's root", (_, withId) => {
    const validator = customizeValidator();
    const root = rootFor(withId);
    // What a form does on each keystroke: checks an option against its root as it renders, then validates the data
    // against its root resolved for the data
    const round = (x: string) => {
      const formData = { a: 'a', p: { x } };
      validator.isValid(option, formData.p, root);
      const { errors } = validator.validateFormData(formData, retrieveSchema({ validator }, root, root, formData));
      expect(errors).toContainEqual(expect.objectContaining({ property: '.p.x', title: 'X' }));
    };
    round('x');
    built.mockClear();
    ['xx', 'x', 'xx'].forEach(round);
    expect(built).not.toHaveBeenCalled();
  });
});
