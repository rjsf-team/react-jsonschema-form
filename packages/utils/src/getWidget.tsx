import { isValidElement } from 'react';

import describeElementGivenAsComponent from './describeElementGivenAsComponent.ts';
import getSchemaType from './getSchemaType.ts';
import getSelectFieldType from './getSelectFieldType.ts';
import getUiOptions from './getUiOptions.ts';
import { getKnownTypes } from './getUnionTypes.ts';
import isComponentType from './isComponentType.ts';
import isConstantSelect from './isConstantSelect.ts';
import isContainerValue from './isContainerValue.ts';
import { isSchemaObject } from './isObject.ts';
import isWholeValueSelect from './isWholeValueSelect.ts';
import type {
  FormContextType,
  RJSFSchema,
  Widget,
  WidgetProps,
  RegistryWidgetsType,
  StrictRJSFSchema,
  UiSchema,
} from './types.ts';

/** The aliases of a select that picks one value as a whole: every select an `object` or `null` schema can be, and the
 * aliases an `array` schema accepts in place of `widgetMap.array` when it is a select over whole array constants. A
 * radio group suits one of those, where on a multi-select it would write a single item in place of the list, and the
 * checkboxes and file widgets edit a list of values, which would read the picked array as several selections. Only the
 * aliases are checked: a widget named by its registered name, such as `CheckboxesWidget`, is rendered as named.
 */
const wholeValueSelectWidgetMap = {
  select: 'SelectWidget',
  radio: 'RadioWidget',
  hidden: 'HiddenWidget',
} as const;

/** The map of schema types to widget type to widget name. `as const` so its keys and values stay literal types,
 * letting `WidgetAliasFor` derive a per-type alias union from it directly instead of a hand-copied one that can
 * drift out of sync.
 */
const widgetMap = {
  boolean: {
    checkbox: 'CheckboxWidget',
    radio: 'RadioWidget',
    select: 'SelectWidget',
    hidden: 'HiddenWidget',
  },
  string: {
    text: 'TextWidget',
    password: 'PasswordWidget',
    email: 'EmailWidget',
    hostname: 'TextWidget',
    ipv4: 'TextWidget',
    ipv6: 'TextWidget',
    uri: 'URLWidget',
    'data-url': 'FileWidget',
    radio: 'RadioWidget',
    select: 'SelectWidget',
    textarea: 'TextareaWidget',
    hidden: 'HiddenWidget',
    date: 'DateWidget',
    datetime: 'DateTimeWidget',
    'date-time': 'DateTimeWidget',
    'iso-date-time': 'DateTimeWidget',
    'alt-date': 'AltDateWidget',
    'alt-datetime': 'AltDateTimeWidget',
    time: 'TimeWidget',
    'iso-time': 'TimeWidget',
    color: 'ColorWidget',
    file: 'FileWidget',
  },
  number: {
    text: 'TextWidget',
    select: 'SelectWidget',
    updown: 'UpDownWidget',
    range: 'RangeWidget',
    radio: 'RadioWidget',
    hidden: 'HiddenWidget',
  },
  integer: {
    text: 'TextWidget',
    select: 'SelectWidget',
    updown: 'UpDownWidget',
    range: 'RangeWidget',
    radio: 'RadioWidget',
    hidden: 'HiddenWidget',
  },
  object: wholeValueSelectWidgetMap,
  null: wholeValueSelectWidgetMap,
  array: {
    select: 'SelectWidget',
    checkboxes: 'CheckboxesWidget',
    files: 'FileWidget',
    hidden: 'HiddenWidget',
  },
} as const;

/** The types whose field renders its value with a widget, and so the ones a `type` list can hand a widget to when the
 * type it resolves to has none by that name */
const WIDGET_FIELD_TYPES = ['string', 'number', 'integer', 'boolean'];

/** Whether `type` is a type `widgetMap` has aliases for */
function isWidgetMapType(type: string): type is keyof typeof widgetMap {
  return Object.hasOwn(widgetMap, type);
}

/** Finds the type whose field renders `widget` for `schema`, along with that type's widget aliases, so `getWidget()`
 * reads the aliases it matched rather than rebuilding them, which for an `array` scans its options again
 *
 * @param schema - The schema for the field
 * @param widget - The alias or registered name of the widget
 * @param type - The type `getSchemaType()` resolves `schema` to
 * @param selectType - The type `getTypeListSelectType()` gives `schema`, which the caller has already worked out
 * @returns - The type and its aliases, or `undefined` when no type the schema allows has the widget
 */
function findWidgetType<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  widget: string,
  type: string | undefined,
  selectType: string | undefined,
): { type: string; widgets: Record<string, string> } | undefined {
  const fieldType = selectType ?? type;
  if (fieldType === undefined || !isWidgetMapType(fieldType)) {
    return undefined;
  }
  const hasWidget = (widgets: Record<string, string>) =>
    Object.hasOwn(widgets, widget) || Object.values(widgets).includes(widget);
  // A select over several types naming an `object` or an `array` can hold a container, which only a widget picking an
  // option keeps whole: a `textarea` would show an object as `[object Object]` and write a string over it. A select
  // over whole array constants likewise takes a whole-value select's aliases rather than a list's
  const holdsContainer =
    selectType === 'string' && getKnownTypes<S>(schema).some((aType) => aType === 'object' || aType === 'array');
  const widgets =
    holdsContainer || (fieldType === 'array' && isWholeValueSelect<S>(schema))
      ? wholeValueSelectWidgetMap
      : widgetMap[fieldType];
  if (hasWidget(widgets)) {
    return { type: fieldType, widgets };
  }
  if (selectType !== undefined) {
    return undefined;
  }
  // The other types are all scalars, whose aliases don't depend on the schema
  const otherType = getKnownTypes<S>(schema).find(
    (aType) => aType !== fieldType && WIDGET_FIELD_TYPES.includes(aType) && hasWidget(widgetMap[aType]),
  );
  return otherType && { type: otherType, widgets: widgetMap[otherType] };
}

/** Gets the type whose field renders `widget` for `schema`, matching the widget's alias or the registered name an alias
 * maps to. That is the type the schema resolves to when it has the widget, otherwise the first string, number, integer
 * or boolean its `type` list names that does: a `textarea` or `TextareaWidget` on a `['null', 'number', 'string']` or a
 * `['array', 'string']` is the `string` one. No `null`, `object` or `array` type is looked to, since `SchemaField` only
 * switches to a scalar type's field, so the field of the type the list resolves to would be left rendering the widget:
 * a radio of the `null` type would replace the list an `ArrayField` multi-select edits with one value. For the same
 * reason a multi-select takes only its own widgets, as another type's field has none of its options to show. A select over a
 * `type` list takes only the widgets of the field `getSelectFieldType()` renders it through, so a `checkbox` on an
 * `enum` of `['a', true]` has no type.
 *
 * @param schema - The schema for the field
 * @param widget - The alias or registered name of the widget
 * @returns - The type whose field renders the widget, or `undefined` when no type the schema allows has it
 */
export function getWidgetType<S extends StrictRJSFSchema = RJSFSchema>(schema: S, widget: string): string | undefined {
  const type = getSchemaType<S>(schema);
  return findWidgetType<S>(schema, widget, type, getTypeListSelectType<S>(schema, type))?.type;
}

/** Gets the registry key the alias `widget` stands for on `schema`. A registered name is not an alias, so it has none
 *
 * @param schema - The schema for the field
 * @param widget - The alias or registered name of the widget
 * @param type - The type `getSchemaType()` resolves `schema` to
 * @param selectType - The type `getTypeListSelectType()` gives `schema`
 * @returns - The registry key of the widget the alias names, or `undefined` when `widget` is no alias for `schema`
 */
function getAliasKey<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  widget: string,
  type: string | undefined,
  selectType: string | undefined,
): string | undefined {
  const widgets = findWidgetType<S>(schema, widget, type, selectType)?.widgets;
  return widgets && Object.hasOwn(widgets, widget) ? widgets[widget] : undefined;
}

/** Gets the registry key `getWidget()` looks `widget` up by for `schema`, without throwing where it would: a name
 * registered in `registeredWidgets` is its own key, and an alias is the key it stands for on the schema's type
 *
 * @param schema - The schema for the field
 * @param widget - The alias or registered name of the widget
 * @param [registeredWidgets={}] - A registry of widget name to `Widget` implementation
 * @returns - The registry key, or `undefined` when `widget` is neither registered nor an alias for `schema`
 */
export function getWidgetKey<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  widget: string,
  registeredWidgets: Readonly<Record<string, unknown>> = {},
): string | undefined {
  if (Object.hasOwn(registeredWidgets, widget)) {
    return widget;
  }
  const type = getSchemaType<S>(schema);
  return getAliasKey<S>(schema, widget, type, getTypeListSelectType<S>(schema, type));
}

/** Determines whether a `type` list can render through another field than the one for the type it resolves to. Only a
 * list naming a non-null type besides that one has another field that could render the value, so a nullable
 * `['string', 'null']` can't. A list resolving to `null` names nothing else, but can, as the select rule renders it
 * through `StringField`
 *
 * @param types - The `type` list of the schema for the field
 * @param type - The type `getSchemaType()` resolves the schema to
 * @returns - True if the field's `ui:widget` or options can pick its type, false otherwise
 */
function canPickFieldType(types: readonly string[], type: string | undefined): boolean {
  return type === 'null' || types.some((aType) => aType !== type && aType !== 'null');
}

/** Gets the type of the field that renders a select over a `type` list that can pick its field, which is the one
 * `getSelectFieldType()` gives the list whatever the select's widget: a list naming several non-null types renders
 * through `StringField` in whatever order it names them, so a `checkbox` on an `enum` of `['a', true]` would write a
 * `false` that no option holds. A multi-select's options pin its `ArrayField` the same way, as another type's field has
 * none of them to show
 *
 * @param schema - The schema for the field
 * @param type - The type `getSchemaType()` resolves the schema to
 * @returns - The type of the field rendering the select, or `undefined` when `schema` is not a select over a `type`
 *        list that can pick its field
 */
function getTypeListSelectType<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  type: string | undefined,
): string | undefined {
  if (!Array.isArray(schema.type) || !canPickFieldType(schema.type, type)) {
    return undefined;
  }
  if (isConstantSelect<S>(schema, true)) {
    return getSelectFieldType(schema.type);
  }
  // shortcut: a `$ref` in `items` can't be resolved without a validator, so such a multi-select still looks to the other
  // types; pass in the root schema if one is reported
  const isMultiSelect =
    type === 'array' &&
    schema.uniqueItems === true &&
    isSchemaObject<S>(schema.items) &&
    isConstantSelect<S>(schema.items, true);
  return isMultiSelect ? type : undefined;
}

/** Gets the type whose field `SchemaField` renders a `schema` by, calling `readWidget` for its `ui:widget` only when a
 * widget can pick that type, so a caller holding a `uiSchema` doesn't reduce it for a widget that won't be read
 *
 * @param schema - The schema for the field
 * @param readWidget - Returns the `ui:widget` for the field, if any
 * @param registeredWidgets - The form's registered widgets, if known
 * @param formData - The field's value, if known
 * @returns - The type of the field that renders the widget
 */
function resolveFieldType<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  readWidget: () => unknown,
  registeredWidgets: Readonly<Record<string, unknown>> = {},
  formData?: unknown,
): string | undefined {
  const type = getSchemaType<S>(schema);
  const selectType = getTypeListSelectType<S>(schema, type);
  if (selectType !== undefined) {
    return selectType;
  }
  if (!Array.isArray(schema.type) || !canPickFieldType(schema.type, type)) {
    return type;
  }
  // A scalar widget would show a container the list resolves to as `[object Object]`, and an edit would replace it
  if ((type === 'object' || type === 'array') && isContainerValue(formData)) {
    return type;
  }
  const widget = readWidget();
  if (typeof widget !== 'string') {
    return type;
  }
  const found = findWidgetType<S>(schema, widget, type, undefined);
  // Only an alias can be taken: `TextareaWidget` names the built-in's slot, so replacing that widget keeps its type
  const isFormsOwn = found && Object.hasOwn(found.widgets, widget) && Object.hasOwn(registeredWidgets, widget);
  return found && !isFormsOwn ? found.type : type;
}

/** Gets the type whose field `SchemaField` renders a `schema` with `widget` by, which for a `type` list naming several
 * non-null types is the one `getWidgetType()` picks for a named widget, and otherwise the type `getSchemaType()`
 * resolves. Readers of a field's type that are handed its `ui:widget` follow it, so the label and the defaults of a
 * `textarea` on a `['null', 'boolean', 'string']` are a string's rather than a boolean's. A `format` picks no other
 * type's field, as it constrains only the list's string member: an `email` on a `['number', 'string']` stays a number.
 * A select over such a list is the type `getSelectFieldType()` gives its `type` list, as `SchemaField` renders it
 * through that field whatever the widget, so an `enum` of `[null, true, 'a']` on a `['null', 'boolean', 'string']`
 * keeps its label. A widget the form registers under a built-in alias is the form's own, so it picks no other type, and
 * a list resolving to `object` or `array` keeps that type's field while its value is an object or array.
 *
 * @param schema - The schema for the field
 * @param widget - The `ui:widget` for the field, if any
 * @param [registeredWidgets] - The form's registered widgets
 * @param [formData] - The field's value
 * @returns - The type of the field that renders the widget
 */
export function getFieldTypeForWidget<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  widget: unknown,
  registeredWidgets?: Readonly<Record<string, unknown>>,
  formData?: unknown,
): string | undefined {
  return resolveFieldType<S>(schema, () => widget, registeredWidgets, formData);
}

/** Gets the type of the field `SchemaField` renders a `schema` by, as `getFieldTypeForWidget()` does for the field's
 * own `ui:widget` in `uiSchema`
 *
 * @param schema - The schema for the field
 * @param [uiSchema] - The uiSchema for the field
 * @param [registeredWidgets] - The form's registered widgets
 * @param [formData] - The field's value
 * @returns - The type of the field that renders the field's own widget
 */
export function getFieldTypeForUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiSchema?: UiSchema<T, S, F>,
  registeredWidgets?: Readonly<Record<string, unknown>>,
  formData?: unknown,
): string | undefined {
  return resolveFieldType<S>(
    schema,
    () => uiSchema && getUiOptions<T, S, F>(uiSchema).widget,
    registeredWidgets,
    formData,
  );
}

/** The registry key a `boolean` resolves to when nothing names a widget for it, which is the widget that renders the
 * field's label itself. Taken from the map rather than written out again, so re-registering that key cannot leave a
 * caller naming the same widget explicitly treated as naming another one
 */
export const DEFAULT_BOOLEAN_WIDGET = widgetMap.boolean.checkbox;

/** The lowercase `ui:widget` alias names `getWidget` accepts for a given JSON Schema primitive `type`, e.g.
 * `WidgetAliasFor<'string'>` is `'text' | 'textarea' | 'password' | ...`. Used to keep a type-safe widget vocabulary
 * (like `@rjsf/core`'s `CoreUiOptionsChecks`) in sync with the aliases `getWidget` actually resolves.
 */
export type WidgetAliasFor<Type extends keyof typeof widgetMap> = keyof (typeof widgetMap)[Type];

/** Given a schema representing a field to render and either the name or actual `Widget` implementation, returns the
 * React component that is used to render the widget. If the `widget` is already a React component, it is returned
 * as-is. Otherwise an attempt is made to look up the widget inside of the `registeredWidgets` map based on the
 * schema type and `widget` name. If no widget component can be found an `Error` is thrown.
 *
 * @param schema - The schema for the field
 * @param [widget] - Either the name of the widget OR a `Widget` implementation to use
 * @param [registeredWidgets={}] - A registry of widget name to `Widget` implementation
 * @returns - The `Widget` component to use
 * @throws - An error if there is no `Widget` component that can be returned
 */
export default function getWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: RJSFSchema,
  widget?: Widget<T, S, F> | string,
  registeredWidgets: RegistryWidgetsType<T, S, F> = {},
): Widget<T, S, F> {
  const type = getSchemaType(schema);

  if (isComponentType<WidgetProps<T, S, F>>(widget)) {
    return widget;
  }

  if (typeof widget !== 'string') {
    const description = isValidElement(widget)
      ? `the widget ${describeElementGivenAsComponent('MyWidget')}`
      : typeof widget;
    throw new Error(`Unsupported widget definition: ${description} in schema: ${JSON.stringify(schema)}`);
  }

  // Own keys only, so a name such as `constructor` or `toString` resolves to no widget rather than to a function off
  // `Object.prototype`, which `isComponentType()` would accept and React would render as one
  if (Object.hasOwn(registeredWidgets, widget)) {
    const registeredWidget = registeredWidgets[widget];
    return getWidget<T, S, F>(schema, registeredWidget, registeredWidgets);
  }

  // A select over a `type` list is looked up and named by the type of the field rendering it, not the type the list
  // resolves to, which can be one that has the widget, such as the `boolean` of a `['null', 'boolean', 'string']`
  // select, or one that has no field, such as the `foo` of a `['foo', 'bar']` one
  const selectType = getTypeListSelectType(schema, type);
  const fieldType = selectType ?? type;
  if (fieldType !== undefined) {
    if (!isWidgetMapType(fieldType)) {
      throw new Error(`No widget for type '${fieldType}' in schema: ${JSON.stringify(schema)}`);
    }

    const aliasKey = getAliasKey(schema, widget, type, selectType);
    if (aliasKey !== undefined) {
      return getWidget<T, S, F>(schema, registeredWidgets[aliasKey], registeredWidgets);
    }
  }

  throw new Error(`No widget '${widget}' for type '${String(fieldType)}' in schema: ${JSON.stringify(schema)}`);
}

/** Returns the widget `getWidget()` returns as the `Widget` of an object, throwing the same errors. A component
 * destructures `Widget` from it: React's static-components rule doesn't follow a destructure, so it accepts the widget
 * where it reports the result of a `getWidget()` call. It can't check it either, so this relies on the widget being
 * defined at module scope.
 *
 * @param schema - The schema for the field
 * @param [widget] - Either the name of the widget OR a `Widget` implementation to use
 * @param [registeredWidgets={}] - A registry of widget name to `Widget` implementation
 * @returns - An object whose `Widget` is the `Widget` component to use
 * @throws - An error if there is no `Widget` component that can be returned
 */
export function resolveWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: RJSFSchema,
  widget?: Widget<T, S, F> | string,
  registeredWidgets: RegistryWidgetsType<T, S, F> = {},
): { Widget: Widget<T, S, F> } {
  return { Widget: getWidget<T, S, F>(schema, widget, registeredWidgets) };
}
