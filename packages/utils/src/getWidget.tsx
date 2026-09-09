import getSchemaType from './getSchemaType.ts';
import type { FormContextType, RJSFSchema, Widget, RegistryWidgetsType, StrictRJSFSchema } from './types.ts';

/** The map of schema types to widget type to widget name
 */
const widgetMap: Record<string, Record<string, string>> = {
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
    'alt-date': 'AltDateWidget',
    'alt-datetime': 'AltDateTimeWidget',
    time: 'TimeWidget',
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
  array: {
    select: 'SelectWidget',
    checkboxes: 'CheckboxesWidget',
    files: 'FileWidget',
    hidden: 'HiddenWidget',
  },
};

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
export default function getWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  schema: RJSFSchema,
  widget?: Widget<T, S, F> | string,
  registeredWidgets: RegistryWidgetsType<T, S, F> = {},
): Widget<T, S, F> {
  const type = getSchemaType(schema);

  if (widget && typeof widget !== 'string') {
    return widget;
  }

  if (typeof widget !== 'string') {
    throw new Error(`Unsupported widget definition: ${typeof widget} in schema: ${JSON.stringify(schema)}`);
  }

  if (widget in registeredWidgets) {
    const registeredWidget = registeredWidgets[widget];
    return getWidget<T, S, F>(schema, registeredWidget, registeredWidgets);
  }

  if (typeof type === 'string') {
    if (!(type in widgetMap)) {
      throw new Error(`No widget for type '${type}' in schema: ${JSON.stringify(schema)}`);
    }

    if (widget in widgetMap[type]) {
      const registeredWidget = registeredWidgets[widgetMap[type][widget]];
      return getWidget<T, S, F>(schema, registeredWidget, registeredWidgets);
    }
  }

  throw new Error(`No widget '${widget}' for type '${type}' in schema: ${JSON.stringify(schema)}`);
}
