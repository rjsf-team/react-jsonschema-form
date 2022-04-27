import { JSONSchema7 } from 'json-schema';

import { Registry, Widget } from 'types';
import getWidget from './getWidget';

export default function hasWidget<T = any>(schema: JSONSchema7, widget: Widget<T>, registeredWidgets: Registry['widgets'] = {}) {
  try {
    getWidget(schema, widget, registeredWidgets);
    return true;
  } catch (e) {
    if (
      e.message &&
      (e.message.startsWith("No widget") ||
        e.message.startsWith("Unsupported widget"))
    ) {
      return false;
    }
    throw e;
  }
}
