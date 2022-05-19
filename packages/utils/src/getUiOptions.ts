import isObject from 'lodash/isObject';

import { UI_OPTIONS_NAME, UI_WIDGET_NAME } from './constants';
import { GenericObjectType, UiSchema, Widget } from './types';

export type UiOptionsType = GenericObjectType & {
  expandable?: boolean;
};

export default function getUiOptions<T = any, F = any>(uiSchema: UiSchema<T, F>): UiOptionsType {
  // get all passed options from ui:widget, ui:options, and ui:<optionName>
  return Object.keys(uiSchema)
    .filter(key => key.indexOf('ui:') === 0)
    .reduce((options, key) => {
      const value = uiSchema[key];
      if (key === UI_WIDGET_NAME && isObject(value)) {
        console.warn(
          'Setting options via ui:widget object is deprecated, use ui:options instead'
        );
        const widgetValue: { options?: object, component?: Widget<T, F> } = value;
        return {
          ...options,
          ...(widgetValue.options || {}),
          widget: widgetValue.component,
        };
      }
      if (key === UI_OPTIONS_NAME && isObject(value)) {
        return { ...options, ...value };
      }
      return { ...options, [key.substring(3)]: value };
    }, {});
}
