import type { ErrorSchema, FormValidation } from '../src/index.ts';

interface Data {
  name: string;
  age: number;
  address: { city: string };
  optionalAddress?: { city: string };
  tags: string[];
  items: { label: string }[];
  when: Date;
  either: string | { city: string };
  eitherShape: { city: string } | { zip: number };
  eitherList: string | string[];
  pair: [string, { city: string }];
}

describe('ErrorSchema type', () => {
  it('describes the node shapes that toErrorSchema() builds', () => {
    const rootErrors: ErrorSchema<Data> = { __errors: ['bad'] };
    const stringLeaf: ErrorSchema<Data> = { name: { __errors: ['bad name'] } };
    const numberLeaf: ErrorSchema<Data> = { age: { __errors: ['too young'] } };
    const nested: ErrorSchema<Data> = { address: { city: { __errors: ['bad city'] } } };
    const throughOptional: ErrorSchema<Data> = { optionalAddress: { city: { __errors: ['bad city'] } } };
    const arrayOfLeaves: ErrorSchema<Data> = { tags: { 0: { __errors: ['bad tag'] } } };
    const arrayOfObjects: ErrorSchema<Data> = { items: { 1: { label: { __errors: ['bad label'] } } } };
    // A Date holds no form fields, so its node has errors but no children
    const atomic: ErrorSchema<Data> = { when: { __errors: ['bad date'] } };

    expect(rootErrors.__errors).toEqual(['bad']);
    expect(stringLeaf.name?.__errors).toEqual(['bad name']);
    expect(numberLeaf.age?.__errors).toEqual(['too young']);
    expect(nested.address?.city?.__errors).toEqual(['bad city']);
    expect(throughOptional.optionalAddress?.city?.__errors).toEqual(['bad city']);
    expect(arrayOfLeaves.tags?.[0]?.__errors).toEqual(['bad tag']);
    expect(arrayOfObjects.items?.[1]?.label?.__errors).toEqual(['bad label']);
    expect(atomic.when?.__errors).toEqual(['bad date']);
  });

  it('describes the children of a union-typed field, as oneOf/anyOf produces', () => {
    const objectMember: ErrorSchema<Data> = { either: { city: { __errors: ['bad city'] } } };
    const scalarMember: ErrorSchema<Data> = { either: { __errors: ['bad value'] } };
    const eachShape: ErrorSchema<Data> = {
      eitherShape: { city: { __errors: ['bad city'] }, zip: { __errors: ['bad zip'] } },
    };
    const listMember: ErrorSchema<Data> = { eitherList: { 0: { __errors: ['bad item'] } } };

    expect(objectMember.either?.city?.__errors).toEqual(['bad city']);
    expect(scalarMember.either?.__errors).toEqual(['bad value']);
    expect(eachShape.eitherShape?.city?.__errors).toEqual(['bad city']);
    expect(eachShape.eitherShape?.zip?.__errors).toEqual(['bad zip']);
    expect(listMember.eitherList?.[0]?.__errors).toEqual(['bad item']);
  });

  it('describes each position of a tuple by its own type', () => {
    const leafPosition: ErrorSchema<Data> = { pair: { 0: { __errors: ['bad label'] } } };
    const objectPosition: ErrorSchema<Data> = { pair: { 1: { city: { __errors: ['bad city'] } } } };
    // @ts-expect-error position 0 holds a string, so its node has no children
    const wrongLeaf: ErrorSchema<Data> = { pair: { 0: { city: { __errors: ['bad city'] } } } };
    // @ts-expect-error a tuple has no index 2
    const pastTheEnd: ErrorSchema<Data> = { pair: { 2: { __errors: ['bad'] } } };

    expect(leafPosition.pair?.[0]?.__errors).toEqual(['bad label']);
    expect(objectPosition.pair?.[1]?.city?.__errors).toEqual(['bad city']);
    expect(wrongLeaf.pair?.[0]).toBeDefined();
    expect(pastTheEnd.pair).toBeDefined();
  });

  it('describes a form whose root is not an object', () => {
    const scalarRoot: ErrorSchema<string> = { __errors: ['bad'] };
    const arrayRoot: ErrorSchema<string[]> = { 0: { __errors: ['bad item'] } };

    expect(scalarRoot.__errors).toEqual(['bad']);
    expect(arrayRoot[0]?.__errors).toEqual(['bad item']);
  });

  it('leaves an untyped error schema unconstrained', () => {
    const untyped: ErrorSchema = { foo: { bar: { __errors: ['deep'] } } };

    expect(untyped.foo.bar.__errors).toEqual(['deep']);
  });
});

describe('FormValidation type', () => {
  it('carries addError() at every node of the same tree', () => {
    const added: string[] = [];
    const node = () => ({ __errors: [], addError: (message: string) => added.push(message) });
    const errors = {
      ...node(),
      name: node(),
      address: { ...node(), city: node() },
      tags: { ...node(), 0: node() },
    } satisfies FormValidation<Data>;

    errors.addError('root');
    errors.name.addError('leaf');
    errors.address.city.addError('nested');
    errors.tags[0].addError('array item');

    expect(added).toEqual(['root', 'leaf', 'nested', 'array item']);
  });
});
