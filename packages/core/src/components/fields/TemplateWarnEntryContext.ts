import { createContext } from 'react';

/** The label a `SchemaField` rendered as a shown `anyOf`/`oneOf` option names in a template-override warning. The
 * option renders at the `MultiSchemaField`'s own path, so a label built from that path would name the field's entry
 * rather than the option's own `uiSchema.anyOf`/`uiSchema.oneOf` entry, and the two entries' mistakes would read as
 * one under `logOnce()`. The `MultiSchemaField` hands the option entry's label down through here; a `SchemaField`
 * that renders one names its own entry instead, providing `undefined` so nothing below it inherits the option's
 */
export default createContext<(() => string) | undefined>(undefined);
