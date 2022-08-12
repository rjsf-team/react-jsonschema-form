import { Registry, RegistryFieldsType } from "@rjsf/utils";

import fields from "./components/fields";
import templates from "./components/templates";
import widgets from "./components/widgets";

/** The default registry consists of all the fields, templates and widgets provided in the core implementation,
 * plus an empty `rootSchema` and `formContext. We omit schemaUtils here because it cannot be defaulted without a
 * rootSchema and validator. It will be added into the computed registry later in the Form.
 */
export default function getDefaultRegistry<T = any, F = any>(): Omit<
  Registry<T, F>,
  "schemaUtils"
> {
  return {
    /** Until the fields have been converted to Typescript, force the cast here */
    fields: fields as unknown as RegistryFieldsType<T, F>,
    templates,
    /** Until the widgets have been converted to Typescript, force the cast here */
    widgets,
    rootSchema: {},
    formContext: {} as F,
  };
}
