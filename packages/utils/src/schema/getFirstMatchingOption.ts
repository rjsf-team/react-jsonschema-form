import { CONST_KEY, ENUM_KEY } from '../constants.ts';
import guessType from '../guessType.ts';
import { isSchemaObject } from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import type { AdoptedSchema, SchemaNode } from './graph/parseSchemaGraph.ts';
import {
  declaredProperties,
  declaredPropertyTarget,
  holdsDeclaredKey,
  scoringTarget,
} from './graph/validationTargets.ts';
import { CONSTRAINING_KEYWORDS, nodeOfSchema } from './retrieveSchema.ts';

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

/** Returns whether `type`, a schema's `type` keyword, allows `value`, as a schema without one does
 *
 * @param type - The `type` keyword, if any
 * @param value - The value
 * @returns - Whether the keyword allows the value
 */
function typeAllows(type: unknown, value: unknown): boolean {
  if (type === undefined) {
    return true;
  }
  const valueType = guessType(value);
  return (Array.isArray(type) ? type : [type]).some(
    (entry) => entry === valueType || (entry === 'integer' && Number.isInteger(value)),
  );
}

/** Returns the values a discriminator declaration says the property holds by its `const` or `enum`. A declaration
 * stating neither gives an empty list when it cannot reject `value`, holding no keyword that constrains a value but a
 * `type` allowing it, and undefined otherwise, since only the validator can check what it says
 *
 * @param node - The declaration's node
 * @param value - The data's value for the property
 * @returns - The lists of values the declaration states
 */
function statedValues<S extends StrictRJSFSchema = RJSFSchema>(
  node: SchemaNode<S>,
  value: unknown,
): (readonly unknown[])[] | undefined {
  if (node.kind !== 'schema' || node.raw.type === 'object' || node.raw.type === 'array') {
    return undefined;
  }
  const { raw } = node;
  if (CONST_KEY in raw) {
    return [[raw[CONST_KEY]]];
  }
  const enumValues = raw[ENUM_KEY];
  if (Array.isArray(enumValues)) {
    return [enumValues];
  }
  const constrains = Object.keys(raw).some((key) => CONSTRAINING_KEYWORDS.has(key));
  return constrains || !typeAllows(raw.type, value) ? undefined : [];
}

/** Returns whether the declarations of `discriminatorField` that `declaredProperties()` finds in the option say by their
 * `const` or `enum` alone that it holds `value`, see `simpleDiscriminatorMatch()`, or undefined when one of them leaves
 * that to the validator
 *
 * @param option - The option's node
 * @param discriminatorField - The name of the property the options are told apart by
 * @param value - The data's value for the property
 * @returns - Whether the option holds the value, or undefined when only the validator can tell
 */
function statesValue<S extends StrictRJSFSchema = RJSFSchema>(
  { graph, node }: AdoptedSchema<S>,
  discriminatorField: string,
  value: unknown,
): boolean | undefined {
  const stated: (readonly unknown[])[] = [];
  for (const id of declaredProperties(graph, node, discriminatorField)) {
    const values = statedValues<S>(graph.node(id), value);
    if (values === undefined) {
      return undefined;
    }
    stated.push(...values);
  }
  return stated.length > 0 && stated.every((values) => values.includes(value));
}

/** Returns the index of the first option whose discriminator property says by its `const` or `enum` alone that it holds
 * the data's value for `discriminatorField`, which needs no validator: at least one declaration `declaredProperties()`
 * finds states a `const` or `enum`, each one that does holds the value, and every other one holds no keyword
 * constraining a value but a `type` allowing it. An option with a declaration that is a boolean, is of type `object` or
 * `array`, or constrains the value otherwise, such as by a `pattern`, a `$ref` or an `allOf`, is left for the validator,
 * and so are the options after it, since the first option that matches is the one wanted.
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
  if (!formData || !discriminatorField) {
    return undefined;
  }
  const value = getByPath(formData, discriminatorField);
  if (value === undefined) {
    return undefined;
  }
  for (const [index, option] of options.entries()) {
    const states = typeof option === 'boolean' ? false : statesValue(option, discriminatorField, value);
    // An option only the validator can tell holds the value or not comes before any later option matching by its
    // `const` or `enum` alone, and the first option that matches is the one wanted
    if (states !== false) {
      return states ? index : undefined;
    }
  }
  return undefined;
}

/** Returns whether some declaration of `discriminatorField` that `declaredProperties()` finds in the option can reject
 * `value`: one that is `false`, or one `statedValues()` does not find to accept every value of its `type`. Declarations
 * that all accept the value, such as a base's `{ type: 'string' }` and an option's `true`, cannot tell options apart, and
 * neither can a value the data does not hold yet
 *
 * @param option - The option's node
 * @param discriminatorField - The name of the property the options are told apart by
 * @param value - The data's value for the property
 * @returns - Whether the discriminator can tell the option from the others
 */
function discriminates<S extends StrictRJSFSchema = RJSFSchema>(
  { graph, node }: AdoptedSchema<S>,
  discriminatorField: string,
  value: unknown,
): boolean {
  if (value === undefined) {
    return false;
  }
  return declaredProperties(graph, node, discriminatorField).some((id) => {
    const declaration = graph.node(id);
    return declaration.kind === 'boolean' ? !declaration.value : statedValues<S>(declaration, value)?.length !== 0;
  });
}

/** Returns whether `option` matches `formData`. With a `discriminatorField` the option names a property for, and whose
 * declarations of it can tell it from the others, see `discriminates()`, only that property is checked, against the
 * data's value for it. Otherwise the data has to hold a key the option declares, see `holdsDeclaredKey()`, and
 * validate against the option as scored, see `scoringTarget()`. A boolean option matches whatever it says.
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
  if (discriminatorField) {
    const value = getByPath(formData, discriminatorField);
    const discriminator = declaredPropertyTarget(graph, node, discriminatorField);
    if (discriminator !== undefined && discriminates<S>(option, discriminatorField, value)) {
      return context.validator.isValid(discriminator, value, graph.rawRoot);
    }
  }
  return (
    holdsDeclaredKey(context, graph, node, formData) &&
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
