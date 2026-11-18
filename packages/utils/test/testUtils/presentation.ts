import { resolveFieldPresentation } from '../../src/index.ts';
import type { FieldPresentation, FieldPresentationInputs, ResolvedPresentationDeclaration } from '../../src/index.ts';

export const ID = 'root_foo';

/** A declaration giving every part of a field to its template, whose label names the control with a `for` */
export const TEMPLATE: ResolvedPresentationDeclaration = Object.freeze({
  label: 'template',
  description: 'template',
  errors: 'template',
  help: 'template',
  labelledBy: 'for',
});

/** Resolves the plan of the field `root_foo` labelled `Foo` under `TEMPLATE`, or under what `inputs` gives instead */
export function planField(inputs: Partial<FieldPresentationInputs> = {}): FieldPresentation {
  return resolveFieldPresentation({ id: ID, declaration: TEMPLATE, label: 'Foo', ...inputs });
}
