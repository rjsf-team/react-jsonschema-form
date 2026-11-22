import type { ANY_OF_KEY, ONE_OF_KEY } from './constants.ts';
import getSchemaType from './getSchemaType.ts';
import getSelectFieldType from './getSelectFieldType.ts';
import guessType from './guessType.ts';
import hasOptionLabels from './hasOptionLabels.ts';
import toConstant from './toConstant.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Whether a boolean field offering the constant `options` of its `anyOf`/`oneOf` renders them as a select where no
 * `ui:widget` says otherwise, rather than as the checkbox a boolean defaults to. A boolean whose `type` is inferred
 * from its constants is a select, since nothing asked for a checkbox. A declared one keeps its checkbox unless a label
 * would be dropped, since a single option is how a checkbox that must be checked is spelled, and unlabelled
 * `true`/`false` options are exactly what a checkbox shows. A `null` option, which a nullable boolean can offer, is one
 * a checkbox has no state for, so it gets the select too. So does a `type` list naming `boolean` first among other
 * non-null types, which renders through the field of the type `getSelectFieldType()` gives it. `SchemaField` picks the
 * widget by it, and `getDefaultFormState()` leaves such a required boolean for the user to answer, since a select shows
 * an unanswered field as a checkbox can't.
 *
 * @param schema - The retrieved schema of the field
 * @param keyword - The keyword the `options` came from
 * @param options - The constant options of that keyword
 * @param [uiSchema] - The `uiSchema` for the field, which may label the options
 * @param [hasInferredType] - Whether the `type` of `schema` was inferred from its constants rather than declared, for a
 *        caller that wrote the inferred `type` into `schema`; worked out from a `schema` declaring none otherwise
 * @returns - True when the field is a boolean that renders its options as a select
 */
export default function booleanOptionsRenderAsSelect<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  keyword: typeof ANY_OF_KEY | typeof ONE_OF_KEY,
  options: readonly S[],
  uiSchema?: UiSchema<T, S, F>,
  hasInferredType?: boolean,
): boolean {
  const declaredType = getSchemaType<S>(schema);
  const type =
    declaredType ?? getSelectFieldType([...new Set(options.map((option) => guessType(toConstant<S>(option))))]);
  if (type !== 'boolean') {
    return false;
  }
  return (
    (hasInferredType ?? declaredType === undefined) ||
    (options.length > 1 &&
      (hasOptionLabels<T, S, F>(options, keyword, uiSchema) ||
        options.some((option) => toConstant<S>(option) === null) ||
        (Array.isArray(schema.type) && getSelectFieldType(schema.type) !== 'boolean')))
  );
}
