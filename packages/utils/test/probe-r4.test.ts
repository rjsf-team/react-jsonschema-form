import { RJSFSchema } from '../src';
import getDefaultFormState from '../src/schema/getDefaultFormState.ts';
import getTestValidator from './testUtils/getTestValidator.ts';
const testValidator = getTestValidator({});
const gdfs = (schema: RJSFSchema) => getDefaultFormState({ validator: testValidator }, { schema, rootSchema: schema });

describe('round-4 acceptance probes (v7 parity)', () => {
  it('nd: unrelated dependencies keyword costs no level', () => {
    const nd = {
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string', default: 'y' }, child: { $ref: '#/definitions/nd' } },
      dependencies: { a: { properties: { extra: { type: 'string', default: 'e' } } } },
    };
    expect(gdfs({ definitions: { nd }, $ref: '#/definitions/nd' } as RJSFSchema)).toEqual({ b: 'y', child: { b: 'y' } });
  });
  it('p: oneOf beside a $ref keeps a second use of the definition', () => {
    const Base = { type: 'object', properties: { name: { type: 'string', default: 'n' } } };
    const p = {
      $ref: '#/definitions/Base',
      properties: { flag: { type: 'string', default: 'on' } },
      oneOf: [{ properties: { q: { $ref: '#/definitions/Base' } } }],
    };
    expect(gdfs({ definitions: { Base }, properties: { p } } as RJSFSchema)).toEqual({
      p: { flag: 'on', q: { name: 'n' } },
    });
  });
  it('oo: recursive oneOf keeps both levels', () => {
    const oo = {
      type: 'object',
      properties: { a: { type: 'string', default: 'x' } },
      oneOf: [{ properties: { child: { $ref: '#/definitions/oo' } } }],
    };
    expect(gdfs({ definitions: { oo }, $ref: '#/definitions/oo' } as RJSFSchema)).toEqual({ a: 'x', child: { a: 'x' } });
  });
  it('pl: plain recursion through a property keeps both levels', () => {
    const pl = {
      type: 'object',
      properties: { a: { type: 'string', default: 'x' }, child: { $ref: '#/definitions/pl' } },
    };
    expect(
      gdfs({ definitions: { pl }, properties: { p: { $ref: '#/definitions/pl' } } } as RJSFSchema),
    ).toEqual({ p: { a: 'x', child: { a: 'x' } } });
  });
  it('A<->B: mutual recursion through dependencies terminates', () => {
    const A = {
      type: 'object',
      properties: { a: { type: 'string', default: 'x' } },
      dependencies: { a: { properties: { b: { $ref: '#/definitions/B' } } } },
    };
    const B = {
      type: 'object',
      properties: { c: { type: 'string', default: 'y' } },
      dependencies: { c: { properties: { a2: { $ref: '#/definitions/A' } } } },
    };
    expect(gdfs({ definitions: { A, B }, $ref: '#/definitions/A' } as RJSFSchema)).toEqual({ a: 'x', b: { c: 'y' } });
  });
});
