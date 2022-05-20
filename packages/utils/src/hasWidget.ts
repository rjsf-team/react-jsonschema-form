import getWidget from './getWidget';
import { RegistryWidgetsType, RJSFSchema, Widget } from './types';

export default function hasWidget<T = any, F = any>(schema: RJSFSchema, widget: Widget<T, F> | string, registeredWidgets: RegistryWidgetsType<T, F> = {}) {
  try {
    getWidget(schema, widget, registeredWidgets);
    return true;
  } catch (e) {
    const err: Error = e as Error;
    if (
      err.message &&
      (err.message.startsWith('No widget') ||
        err.message.startsWith('Unsupported widget'))
    ) {
      return false;
    }
    throw e;
  }
}
