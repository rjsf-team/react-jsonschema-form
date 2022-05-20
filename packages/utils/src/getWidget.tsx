import React from 'react';
import ReactIs from 'react-is';
import get from 'lodash/get';
import set from 'lodash/set';

import { JSONSchema7 } from 'json-schema';

import { Widget, RegistryWidgetsType } from './types';
import getSchemaType from './getSchemaType';

export const widgetMap: { [k: string]: { [j: string]: string } } = {
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

export function mergeWidgetOptions<T = any, F = any>(AWidget: Widget<T, F>) {
  let MergedWidget: Widget<T, F> = get(AWidget, 'MergedWidget');
  // cache return value as property of widget for proper react reconciliation
  if (!MergedWidget) {
    const defaultOptions = (AWidget.defaultProps && AWidget.defaultProps.options) || {};
    MergedWidget = ({ options, ...props }) => {
      return <AWidget options={{ ...defaultOptions, ...options }} {...props} />;
    };
    set(AWidget, 'MergedWidget', MergedWidget);
  }
  return MergedWidget;
}

export default function getWidget<T = any, F = any>(schema: JSONSchema7, widget: Widget<T, F> | string, registeredWidgets: RegistryWidgetsType<T, F> = {}): Widget<T, F> {
  const type = getSchemaType(schema);

  if (
    typeof widget === 'function' ||
    ReactIs.isForwardRef(React.createElement(widget)) ||
    ReactIs.isMemo(widget)
  ) {
    return mergeWidgetOptions<T, F>(widget as Widget<T, F>);
  }

  if (typeof widget !== 'string') {
    throw new Error(`Unsupported widget definition: ${typeof widget}`);
  }

  if (registeredWidgets.hasOwnProperty(widget)) {
    const registeredWidget = registeredWidgets[widget];
    return getWidget<T, F>(schema, registeredWidget, registeredWidgets);
  }

  if (typeof type === 'string') {
    if (!widgetMap.hasOwnProperty(type)) {
      throw new Error(`No widget for type '${type}'`);
    }

    if (widgetMap[type].hasOwnProperty(widget)) {
      const registeredWidget = registeredWidgets[widgetMap[type][widget]];
      return getWidget<T, F>(schema, registeredWidget, registeredWidgets);
    }
  }

  throw new Error(`No widget '${widget}' for type '${type}'`);
}
