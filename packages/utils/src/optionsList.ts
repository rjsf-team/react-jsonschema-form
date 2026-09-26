import { CONST_KEY, DEFAULT_KEY } from './constants.ts';
import getDiscriminatorFieldFromSchema from './getDiscriminatorFieldFromSchema.ts';
import getPropertySchema from './getPropertySchema.ts';
import getUiOptions from './getUiOptions.ts';
import isConstant from './isConstant.ts';
import isObject from './isObject.ts';
import { getByPath } from './pathUtils.ts';
import toConstant from './toConstant.ts';
import type { RJSFSchema, EnumOptionsType, EnumValue, StrictRJSFSchema, FormContextType, UiSchema } from './types.ts';

/** The label for an option with no title of its own: its value, with an object or array spelled out, since `String()`
 * would label every one of them `[object Object]`
 */
function valueLabel(value: unknown): string {
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
}

/** Reorders `options` according to `order`, which may contain a `'*'` wildcard representing all
 * remaining options in their original order. Options not listed in `order` (and not covered by
 * a wildcard) are dropped.
 */
function applyEnumOrder<S extends StrictRJSFSchema = RJSFSchema>(
  options: EnumOptionsType<S>[],
  order: EnumValue[],
): EnumOptionsType<S>[] {
  const optionsByValue = new Map(options.map((opt) => [String(opt.value), opt]));
  const orderedKeys = new Set(order.filter((v) => v !== '*').map(String));
  const rest = options.filter((opt) => !orderedKeys.has(String(opt.value)));

  return order.flatMap((entry) => {
    if (entry === '*') {
      return rest;
    }
    const opt = optionsByValue.get(String(entry));
    return opt ? [opt] : [];
  });
}

/** Gets the list of options from the `schema`. If the schema has an enum list, then those enum values are returned. The
 * label will be the same as the `value`.
 *
 * If the schema has a `oneOf` or `anyOf` (`anyOf` wins when it has both, as it does in `isSelect()`), then the value is
 * the list of either:
 * - The `const` values from the schema if present
 * - If the schema has a discriminator and the label using either the `schema.title` or the value. If a `uiSchema` is
 * provided, and it has the `ui:enumNames` matched with `enum` or it has an associated `oneOf` or `anyOf` with a list of
 * objects containing `ui:title` then the UI schema values will replace the values from the schema.
 *
 * @param schema - The schema from which to extract the options list
 * @param [uiSchema] - The optional uiSchema from which to get alternate labels for the options
 * @returns - The list of options from the schema, or `undefined` when it has none, including when its `anyOf`/`oneOf`
 *        options are not all constants and no selector field names where their values are
 */
export default function optionsList<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schema: S, uiSchema?: UiSchema<T, S, F>): EnumOptionsType<S>[] | undefined {
  if (schema.enum) {
    let enumNames: string[] | Record<string | number, string> | undefined;
    let enumOrder: EnumValue[] | undefined;
    if (uiSchema) {
      const { enumNames: uiEnumNames, enumOrder: uiEnumOrder } = getUiOptions<T, S, F>(uiSchema);
      enumNames = uiEnumNames;
      enumOrder = uiEnumOrder;
    }
    let options = schema.enum.map((value, i) => {
      const label = Array.isArray(enumNames)
        ? enumNames[i] || valueLabel(value)
        : enumNames?.[String(value)] || valueLabel(value);
      return { label, value };
    });
    if (enumOrder) {
      options = applyEnumOrder(options, enumOrder);
    }
    return options;
  }
  let altSchemas: S['anyOf'] | S['oneOf'] = undefined;
  let altUiSchemas: UiSchema<T, S, F>[] | undefined = undefined;
  if (schema.anyOf) {
    altSchemas = schema.anyOf;
    altUiSchemas = uiSchema?.anyOf;
  } else if (schema.oneOf) {
    altSchemas = schema.oneOf;
    altUiSchemas = uiSchema?.oneOf;
  }
  // See if there is a discriminator path specified in the schema, and if so, use it as the selectorField, otherwise
  // pull one from the uiSchema
  let selectorField = getDiscriminatorFieldFromSchema<S>(schema);
  if (uiSchema) {
    const { optionsSchemaSelector = selectorField } = getUiOptions<T, S, F>(uiSchema);
    selectorField = optionsSchemaSelector;
  }
  // Without a selector, each option's value is its constant, which `toConstant()` throws for when there isn't one, so a
  // list that isn't made of constants has no options to offer rather than taking down the render
  if (!selectorField && altSchemas?.some((aSchema) => !isObject(aSchema) || !isConstant(aSchema as S))) {
    return undefined;
  }
  return altSchemas?.map((aSchemaDef, index) => {
    const { title } = getUiOptions<T, S, F>(altUiSchemas?.[index]);
    const aSchema = aSchemaDef as S;
    let value: EnumOptionsType<S>['value'];
    let label = title;
    if (selectorField) {
      const innerSchema = getPropertySchema<S>(aSchema, selectorField);
      value = getByPath(innerSchema, DEFAULT_KEY, getByPath(innerSchema, CONST_KEY));
      // Use nullish coalescing so that an explicitly empty string title is preserved
      label = label ?? innerSchema?.title ?? aSchema.title ?? valueLabel(value);
    } else {
      value = toConstant(aSchema);
      label = label ?? aSchema.title ?? valueLabel(value);
    }
    return {
      schema: aSchema,
      label,
      value,
    };
  });
}
