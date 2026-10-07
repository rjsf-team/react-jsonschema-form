import { isValidElement } from 'react';

import describeElementGivenAsComponent from './describeElementGivenAsComponent.ts';
import getSchemaType from './getSchemaType.ts';
import { getKnownTypes } from './getUnionTypes.ts';
import isComponentType from './isComponentType.ts';
import isConstantSelect from './isConstantSelect.ts';
import isWholeValueSelect from './isWholeValueSelect.ts';
import type {
  FormContextType,
  RJSFSchema,
  Widget,
  WidgetProps,
  RegistryWidgetsType,
  StrictRJSFSchema,
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

/** Returns the widget aliases of `type` for `schema`, which for a select over whole array constants are those of a
 * whole-value select rather than of a list
 */
function getWidgetsForType(schema: RJSFSchema, type: string): Record<string, string> {
  return type === 'array' && isWholeValueSelect(schema)
    ? wholeValueSelectWidgetMap
    : widgetMap[type as keyof typeof widgetMap];
}

/** Finds the type whose field renders `widget` for `schema`, along with that type's widget aliases, so `getWidget()`
 * reads the aliases it matched rather than rebuilding them, which for an `array` scans its options again
 *
 * @param schema - The schema for the field
 * @param widget - The alias or registered name of the widget
 * @param type - The type `getSchemaType()` resolves `schema` to
 * @returns - The type and its aliases, or `undefined` when no type the schema allows has the widget
 */
function findWidgetType<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  widget: string,
  type: string | undefined,
): { type: string; widgets: Record<string, string> } | undefined {
  if (type === undefined || !Object.hasOwn(widgetMap, type)) {
    return undefined;
  }
  const hasWidget = (widgets: Record<string, string>) =>
    Object.hasOwn(widgets, widget) || Object.values(widgets).includes(widget);
  const widgets = getWidgetsForType(schema, type);
  if (hasWidget(widgets)) {
    return { type, widgets };
  }
  // The other types are all scalars, whose aliases don't depend on the schema
  const otherType = WIDGET_FIELD_TYPES.includes(type)
    ? getKnownTypes<S>(schema).find(
        (aType) => aType !== type && WIDGET_FIELD_TYPES.includes(aType) && hasWidget(widgetMap[aType]),
      )
    : undefined;
  return otherType && { type: otherType, widgets: widgetMap[otherType] };
}

/** Gets the type whose field renders `widget` for `schema`, matching the widget's alias or the registered name an alias
 * maps to. That is the type the schema resolves to when it has the widget, otherwise, when that type is a string,
 * number, integer or boolean, the first other one of those its `type` list names that does: a `textarea` or
 * `TextareaWidget` on a `['null', 'number', 'string']` is the `string` one. No `null`, `object` or `array` type is
 * looked to, since `SchemaField` only switches to a scalar type's field, so the field of the type the list resolves to
 * would be left rendering the widget: a radio of the `null` type would replace the list an `ArrayField` multi-select
 * edits with one value. A list resolving to `object` or `array` takes only its own widgets, since the form data
 * `getDefaultFormState()` fills in for it is of that type, which a scalar widget would be handed.
 *
 * @param schema - The schema for the field
 * @param widget - The alias or registered name of the widget
 * @returns - The type whose field renders the widget, or `undefined` when no type the schema allows has it
 */
export function getWidgetType<S extends StrictRJSFSchema = RJSFSchema>(schema: S, widget: string): string | undefined {
  return findWidgetType<S>(schema, widget, getSchemaType<S>(schema))?.type;
}

/** Gets the type whose field `SchemaField` renders a `schema` with `widget` by, which for a `type` list naming several
 * non-null types is the one `getWidgetType()` picks for a named widget, and otherwise the type `getSchemaType()`
 * resolves. Readers of a field's type that are handed its `ui:widget` follow it, so the label and the defaults of a
 * `textarea` on a `['null', 'boolean', 'string']` are a string's rather than a boolean's. A select over such a list is
 * the type of its one non-null type, or a `string` when it names several, as `SchemaField` renders it through
 * `StringField` whatever the widget, so an `enum` of `[null, true, 'a']` on a `['null', 'boolean', 'string']` keeps its
 * label and isn't seeded with a `false` it doesn't offer.
 *
 * @param schema - The schema for the field
 * @param widget - The `ui:widget` for the field, if any
 * @returns - The type of the field that renders the widget
 */
export function getFieldTypeForWidget<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  widget: unknown,
): string | undefined {
  if (Array.isArray(schema.type) && isConstantSelect<S>(schema, true)) {
    const nonNullTypes = schema.type.filter((aType) => aType !== 'null');
    return nonNullTypes.length === 1 ? nonNullTypes[0] : 'string';
  }
  const type = getSchemaType<S>(schema);
  return (typeof widget === 'string' ? findWidgetType<S>(schema, widget, type)?.type : undefined) ?? type;
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

  if (type !== undefined) {
    if (!Object.hasOwn(widgetMap, type)) {
      throw new Error(`No widget for type '${type}' in schema: ${JSON.stringify(schema)}`);
    }

    const widgetsForType = findWidgetType(schema, widget, type)?.widgets;
    if (widgetsForType && Object.hasOwn(widgetsForType, widget)) {
      const registeredWidget = registeredWidgets[widgetsForType[widget]];
      return getWidget<T, S, F>(schema, registeredWidget, registeredWidgets);
    }
  }

  throw new Error(`No widget '${widget}' for type '${String(type)}' in schema: ${JSON.stringify(schema)}`);
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
