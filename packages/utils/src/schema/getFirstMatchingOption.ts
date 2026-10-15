import { isSchemaObject } from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import type { AdoptedSchema } from './graph/parseSchemaGraph.ts';
import { declaredProperty, holdsDeclaredKey, scoringTarget, targetOf } from './graph/validationTargets.ts';
import { nodeOfSchema } from './retrieveSchema.ts';

export { withVariantId } from './graph/validationTargets.ts';

/** An option as matching reads it: the node it stands for, or a boolean option given as one */
export type OptionNode<S extends StrictRJSFSchema = RJSFSchema> = AdoptedSchema<S> | boolean;

/** Returns the node `option` stands for, see `nodeOfSchema()`, or the boolean it is
 *
 * @param option - The option
 * @param rootSchema - The root schema the option belongs to
 * @returns - The option as matching reads it
 */
export function optionNodeOf<S extends StrictRJSFSchema = RJSFSchema>(option: unknown, rootSchema: S): OptionNode<S> {
  return isSchemaObject<S>(option) ? nodeOfSchema<S>(option, rootSchema) : Boolean(option);
}

/** Returns the index of the first option whose discriminator property says by its `const` or `enum` alone that it holds
 * the data's value for `discriminatorField`, which needs no validator; a discriminator of type `object` or `array` says
 * nothing this way
 *
 * @param options - The options
 * @param formData - The data being matched
 * @param [discriminatorField] - The name of the property the options are told apart by
 * @returns - The index of the option, or undefined when no option says so
 */
export function simpleDiscriminatorMatch<S extends StrictRJSFSchema = RJSFSchema>(
  options: readonly OptionNode<S>[],
  formData: unknown,
  discriminatorField?: string,
): number | undefined {
  const value = formData && discriminatorField ? getByPath(formData, discriminatorField) : undefined;
  if (value === undefined || !discriminatorField) {
    return undefined;
  }
  const index = options.findIndex((option) => {
    if (typeof option === 'boolean') {
      return false;
    }
    const property = declaredProperty(option.graph, option.node, discriminatorField);
    const node = property === undefined ? undefined : option.graph.node(property);
    if (node?.kind !== 'schema' || node.raw.type === 'object' || node.raw.type === 'array') {
      return false;
    }
    const enumValues: readonly unknown[] | undefined = node.raw.enum;
    return node.raw.const === value || Boolean(enumValues?.includes(value));
  });
  return index < 0 ? undefined : index;
}

/** Returns whether `option` matches `formData`. With a `discriminatorField` the option names a property for, only that
 * property is checked, against the data's value for it. Otherwise the data has to hold a key the option declares, see
 * `holdsDeclaredKey()`, and validate against the option as scored, see `scoringTarget()`. A boolean option matches
 * whatever it says.
 *
 * @param context - The `SchemaContext` whose `validator` checks the option
 * @param formData - The data being matched
 * @param option - The option
 * @param relax - Whether the option's `additionalProperties: false` is relaxed for scoring
 * @param [discriminatorField] - The name of the property the options are told apart by
 * @returns - Whether the option matches
 */
export function optionMatches<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  formData: unknown,
  option: OptionNode<S>,
  relax: boolean,
  discriminatorField?: string,
): boolean {
  if (typeof option === 'boolean') {
    return option;
  }
  const { graph, node } = option;
  const discriminator = discriminatorField ? declaredProperty(graph, node, discriminatorField) : undefined;
  if (discriminatorField && discriminator !== undefined) {
    return context.validator.isValid(
      targetOf(graph, discriminator),
      getByPath(formData, discriminatorField),
      graph.rawRoot,
    );
  }
  return (
    holdsDeclaredKey(graph, node, formData) &&
    context.validator.isValid(scoringTarget(graph, node, relax), formData, graph.rawRoot)
  );
}

/** Returns the index of the first of `options` that matches `formData`, or 0 when none does or there is no data
 *
 * @param context - The `SchemaContext` whose `validator` checks the options
 * @param formData - The data being matched
 * @param options - The options
 * @param [discriminatorField] - The name of the property the options are told apart by
 * @returns - The index of the first matching option
 */
export function firstMatchingOption<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  formData: unknown,
  options: readonly OptionNode<S>[],
  discriminatorField?: string,
): number {
  if (formData === undefined) {
    return 0;
  }
  const index =
    simpleDiscriminatorMatch(options, formData, discriminatorField) ??
    options.findIndex((option) => optionMatches<S, F>(context, formData, option, false, discriminatorField));
  return Math.max(index, 0);
}

/** Given the `formData` and list of `options`, attempts to find the index of the first option that matches the data.
 * Always returns the first option if there is nothing that matches. Each option is matched as the subschema of the
 * root it stands for, see `optionMatches()`.
 *
 * @param context - The `SchemaContext` whose `validator` is used to match the options
 * @param formData - The current formData, if any, used to figure out a match
 * @param options - The list of options to find a matching options from
 * @param rootSchema - The root schema, used to primarily to look up `$ref`s
 * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
 *          determine which option is selected
 * @returns - The index of the first matched option or 0 if none is available
 */
export default function getFirstMatchingOption<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  formData: T | undefined,
  options: S[],
  rootSchema: S,
  discriminatorField?: string,
): number {
  return firstMatchingOption<S, F>(
    context,
    formData,
    options.map((option) => optionNodeOf<S>(option, rootSchema)),
    discriminatorField,
  );
}
