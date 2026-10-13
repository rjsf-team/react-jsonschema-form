import type { RJSFSchema } from '../src/index.ts';
import { enclosingRefPath, REF_SIBLING_BRANCHES, refSiblingBranches, resolvedSchemaOf } from '../src/refOf.ts';

describe('resolvedSchemaOf()', () => {
  const definition: RJSFSchema = { type: 'object', allOf: [{ title: 'from the definition' }] };

  it('does not take the sibling branches of an earlier resolution for those of this reference', () => {
    const earlier = resolvedSchemaOf('#/definitions/A', {}, definition);
    expect(refSiblingBranches(earlier)).toEqual(['allOf']);

    const fromDefinition = resolvedSchemaOf('#/definitions/B', earlier, {});
    const fromSiblings = resolvedSchemaOf('#/definitions/B', {}, earlier);

    expect(REF_SIBLING_BRANCHES in fromDefinition).toBe(false);
    expect(refSiblingBranches(fromDefinition)).toBeUndefined();
    expect(enclosingRefPath(fromDefinition, [], 'allOf')).toEqual(['#/definitions/B']);
    expect(refSiblingBranches(fromSiblings)).toEqual(['allOf']);
  });
});

describe('refSiblingBranches()', () => {
  it.each([
    ['a boolean schema', true],
    ['no schema', undefined],
    ['null', null],
    ['a marker that is not a list', { [REF_SIBLING_BRANCHES]: 'allOf' }],
  ])('returns undefined for %s', (_, schema) => {
    expect(refSiblingBranches(schema)).toBeUndefined();
  });
});
