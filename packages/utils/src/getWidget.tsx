import React from 'react';
import ReactIs from 'react-is';
import { JSONSchema7 } from 'json-schema';

import { Widget, Registry } from './types';
import getSchemaType from './getSchemaType';
import mergeWidgetOptions from './mergeWidgetOptions';

export const widgetMap: { [k: string]: { [j: string]: string } } = {
  boolean: {
    checkbox: "CheckboxWidget",
    radio: "RadioWidget",
    select: "SelectWidget",
    hidden: "HiddenWidget",
  },
  string: {
    text: "TextWidget",
    password: "PasswordWidget",
    email: "EmailWidget",
    hostname: "TextWidget",
    ipv4: "TextWidget",
    ipv6: "TextWidget",
    uri: "URLWidget",
    "data-url": "FileWidget",
    radio: "RadioWidget",
    select: "SelectWidget",
    textarea: "TextareaWidget",
    hidden: "HiddenWidget",
    date: "DateWidget",
    datetime: "DateTimeWidget",
    "date-time": "DateTimeWidget",
    "alt-date": "AltDateWidget",
    "alt-datetime": "AltDateTimeWidget",
    color: "ColorWidget",
    file: "FileWidget",
  },
  number: {
    text: "TextWidget",
    select: "SelectWidget",
    updown: "UpDownWidget",
    range: "RangeWidget",
    radio: "RadioWidget",
    hidden: "HiddenWidget",
  },
  integer: {
    text: "TextWidget",
    select: "SelectWidget",
    updown: "UpDownWidget",
    range: "RangeWidget",
    radio: "RadioWidget",
    hidden: "HiddenWidget",
  },
  array: {
    select: "SelectWidget",
    checkboxes: "CheckboxesWidget",
    files: "FileWidget",
    hidden: "HiddenWidget",
  },
};

export default function getWidget<T>(schema: JSONSchema7, widget: any, registeredWidgets: Registry['widgets'] = {}): Widget<T> {
  let type = getSchemaType(schema);

  if (
    typeof widget === "function" ||
    ReactIs.isForwardRef(React.createElement(widget)) ||
    ReactIs.isMemo(widget)
  ) {
    return mergeWidgetOptions<T>(widget);
  }

  if (typeof widget !== "string") {
    throw new Error(`Unsupported widget definition: ${typeof widget}`);
  }

  if (registeredWidgets.hasOwnProperty(widget)) {
    const registeredWidget = registeredWidgets[widget];
    return getWidget(schema, registeredWidget, registeredWidgets);
  }

  if (typeof type === 'string') {
    if (!widgetMap.hasOwnProperty(type)) {
      throw new Error(`No widget for type "${type}"`);
    }

    if (widgetMap[type].hasOwnProperty(widget)) {
      const registeredWidget = registeredWidgets[widgetMap[type][widget]];
      return getWidget(schema, registeredWidget, registeredWidgets);
    }
  }

  throw new Error(`No widget "${widget}" for type "${type}"`);
}
