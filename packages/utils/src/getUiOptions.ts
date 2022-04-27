import isObject from 'lodash/isObject';

import { UiSchema, Widget } from './types';

export type UiOptionsType = {
  expandable?: boolean;
  [k: string]: any;
}

export default function getUiOptions<T = any>(uiSchema: UiSchema<T>): UiOptionsType {
  // get all passed options from ui:widget, ui:options, and ui:<optionName>
  return Object.keys(uiSchema)
    .filter(key => key.indexOf('ui:') === 0)
    .reduce((options, key) => {
      const value = uiSchema[key];
      if (key === 'ui:widget' && isObject(value)) {
        console.warn(
          'Setting options via ui:widget object is deprecated, use ui:options instead'
        );
        const widgetValue: { options?: object, component?: Widget<T> } = value;
        return {
          ...options,
          ...(widgetValue.options || {}),
          widget: widgetValue.component,
        };
      }
      if (key === 'ui:options' && isObject(value)) {
        return { ...options, ...value };
      }
      return { ...options, [key.substring(3)]: value };
    }, {});
}
