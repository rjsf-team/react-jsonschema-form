import type { RJSFSchema } from '../src/index.ts';
import { RJSF_REF_KEY } from '../src/index.ts';
import {
  enclosingRefPath,
  mergeBranch,
  REF_SIBLING_BRANCHES,
  refSiblingBranches,
  resolvedFromRef,
  resolvedSchemaOf,
} from '../src/refOf.ts';

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

  it('does not count a sibling keyword that is present but undefined as a branch beside the $ref', () => {
    const resolved = resolvedSchemaOf('#/definitions/A', definition, { allOf: undefined, then: { title: 'beside' } });

    expect(refSiblingBranches(resolved)).toEqual(['then']);
  });
});

describe('mergeBranch()', () => {
  const branch = resolvedSchemaOf('#/definitions/branch', { title: 'branch' }, { then: {} });

  it('keeps the reference the schema was resolved from, and none of the sibling branches of the branch', () => {
    const schema = resolvedSchemaOf('#/definitions/own', { type: 'object' }, {});

    const merged = mergeBranch(schema, branch);

    expect(merged).toEqual({ type: 'object', title: 'branch', then: {}, [RJSF_REF_KEY]: '#/definitions/own' });
  });

  it('keeps the sibling branches of the schema', () => {
    const schema = resolvedSchemaOf('#/definitions/own', { type: 'object' }, { allOf: [] });

    expect(refSiblingBranches(mergeBranch(schema, branch))).toEqual(['allOf']);
  });

  it('takes the markers of the branch for a schema that was not resolved from a reference', () => {
    const merged = mergeBranch({ type: 'object' }, branch);

    expect(resolvedFromRef(merged)).toBe('#/definitions/branch');
    expect(refSiblingBranches(merged)).toEqual(['then']);
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
