import { JSONSchema7 } from 'json-schema';

import getWidget from './getWidget';
import { RegistryWidgetsType, Widget } from './types';

export default function hasWidget<T = any, F = any>(schema: JSONSchema7, widget: Widget<T, F> | string, registeredWidgets: RegistryWidgetsType<T, F> = {}) {
  try {
    getWidget(schema, widget, registeredWidgets);
    return true;
  } catch (e: any) {
    if (
      e.message &&
      (e.message.startsWith('No widget') ||
        e.message.startsWith('Unsupported widget'))
    ) {
      return false;
    }
    throw e;
  }
}
