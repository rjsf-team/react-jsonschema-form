import { CONST_KEY, DEFAULT_KEY } from './constants.ts';
import deepEquals from './deepEquals.ts';
import enumOptionValueLabel from './enumOptionValueLabel.ts';
import getDiscriminatorFieldFromSchema from './getDiscriminatorFieldFromSchema.ts';
import getPropertySchema from './getPropertySchema.ts';
import getUiOptions from './getUiOptions.ts';
import getXxxOfKey from './getXxxOfKey.ts';
import isConstantOptionList from './isConstantOptionList.ts';
import isContainerValue from './isContainerValue.ts';
import { getByPath } from './pathUtils.ts';
import toConstant from './toConstant.ts';
import type { RJSFSchema, EnumOptionsType, EnumValue, StrictRJSFSchema, FormContextType, UiSchema } from './types.ts';

/** Reorders `options` according to `order`, which may contain a `'*'` wildcard representing all
 * remaining options in their original order. Options not listed in `order` (and not covered by
 * a wildcard) are dropped.
 */
function applyEnumOrder<S extends StrictRJSFSchema = RJSFSchema>(
  options: EnumOptionsType<S>[],
  order: EnumValue[],
): EnumOptionsType<S>[] {
  // Built from the last option back, so the first of any options sharing a key is the one found
  const primitiveOptions = options.filter((opt) => !isContainerValue(opt.value)).reverse();
  const optionsByValue = new Map(primitiveOptions.map((opt) => [opt.value, opt]));
  const optionsByString = new Map(primitiveOptions.map((opt) => [String(opt.value), opt]));
  const findOption = (entry: unknown) => {
    if (entry === '*') {
      return undefined;
    }
    // `String()` spells every object `[object Object]`, so an object or array entry is found by deep equality instead
    if (isContainerValue(entry)) {
      return options.find((opt) => deepEquals(opt.value, entry));
    }
    // An option equal to the entry wins over one that only shares its string, as `'1'` does `1`'s
    return optionsByValue.get(entry) ?? optionsByString.get(String(entry));
  };
  const listed = new Set<EnumOptionsType<S>>();
  // An option several entries find is listed at the first of them only, so it isn't rendered twice
  const orderedOptions = order.map((entry) => {
    const opt = findOption(entry);
    if (!opt || listed.has(opt)) {
      return undefined;
    }
    listed.add(opt);
    return opt;
  });
  const rest = options.filter((opt) => !listed.has(opt));

  return order.flatMap((entry, index) => {
    if (entry === '*') {
      return rest;
    }
    const opt = orderedOptions[index];
    return opt ? [opt] : [];
  });
}

/** Gets the list of options from the `schema`. If the schema has an enum list, then those enum values are returned. The
 * label will be the same as the `value`.
 *
 * If the schema has a `oneOf` or `anyOf` (`anyOf` wins when it has both, as it does in `isSelect()`), then the value is
 * the list of either:
 * - The `const` values from the schema if present
 * - If the options aren't all constants and the schema has a discriminator (or the uiSchema a
 * `ui:optionsSchemaSelector`), the value of that property, and the label using either the `schema.title` or the value.
 * If a `uiSchema` is provided, and it has the `ui:enumNames` matched with `enum` or it has an associated `oneOf` or
 * `anyOf` with a list of objects containing `ui:title` then the UI schema values will replace the values from the
 * schema.
 *
 * @param schema - The schema from which to extract the options list
 * @param [uiSchema] - The optional uiSchema from which to get alternate labels for the options
 * @param [fallbackLabel] - Labels an option that nothing else names: no non-empty `ui:enumNames` entry, and no
 *        `ui:title` or `title`. An option it returns `undefined` for is labelled with its value
 * @returns - The list of options from the schema, or `undefined` when it has none, including when its `anyOf`/`oneOf`
 *        options are not all constants and no selector field names where their values are
 */
export default function optionsList<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiSchema?: UiSchema<T, S, F>,
  fallbackLabel?: (value: unknown) => string | undefined,
): EnumOptionsType<S>[] | undefined {
  const unnamedLabel = fallbackLabel
    ? (value: unknown) => fallbackLabel(value) ?? enumOptionValueLabel(value)
    : enumOptionValueLabel;
  if (schema.enum) {
    let enumNames: string[] | Record<string | number, string> | undefined;
    let enumOrder: EnumValue[] | undefined;
    if (uiSchema) {
      const { enumNames: uiEnumNames, enumOrder: uiEnumOrder } = getUiOptions<T, S, F>(uiSchema);
      enumNames = uiEnumNames;
      enumOrder = uiEnumOrder;
    }
    let options = schema.enum.map((value, i) => {
      // A map is keyed by strings, which can't name an object or array value
      const name = Array.isArray(enumNames) ? enumNames[i] : !isContainerValue(value) && enumNames?.[String(value)];
      return { label: name || unnamedLabel(value), value };
    });
    if (enumOrder) {
      options = applyEnumOrder(options, enumOrder);
    }
    return options;
  }
  const xxxOfKey = getXxxOfKey<S>(schema);
  const altSchemas: S['anyOf'] | S['oneOf'] = xxxOfKey && schema[xxxOfKey];
  const altUiSchemas: UiSchema<T, S, F>[] | undefined = xxxOfKey && uiSchema?.[xxxOfKey];
  let selectorField: string | undefined;
  // A selector names a property of object options, which constants don't have, so a constant's value is the constant
  // itself even under a `discriminator` or `ui:optionsSchemaSelector`
  if (!isConstantOptionList<S>(altSchemas)) {
    // See if there is a discriminator path specified in the schema, and if so, use it as the selectorField, otherwise
    // pull one from the uiSchema
    selectorField = getDiscriminatorFieldFromSchema<S>(schema);
    if (uiSchema) {
      const { optionsSchemaSelector = selectorField } = getUiOptions<T, S, F>(uiSchema);
      selectorField = optionsSchemaSelector;
    }
    // Without a selector, each option's value is its constant, which `toConstant()` throws for when there isn't one, so
    // a list that isn't made of constants has no options to offer rather than taking down the render
    if (!selectorField && altSchemas) {
      return undefined;
    }
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
      label = label ?? innerSchema?.title ?? aSchema.title ?? unnamedLabel(value);
    } else {
      value = toConstant(aSchema);
      label = label ?? aSchema.title ?? unnamedLabel(value);
    }
    return {
      schema: aSchema,
      label,
      value,
    };
  });
}
