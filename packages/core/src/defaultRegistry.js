import fields from "./components/fields";
import widgets from "./components/widgets";

export function getDefaultRegistry() {
  return {
    fields,
    widgets,
    definitions: {},
    rootSchema: {},
    formContext: {},
  };
}
