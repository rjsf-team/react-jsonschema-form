import { createContext } from 'react';

/** The indexes of the path segments that are an additional property's key, so a template-override warning naming
 * the uiSchema entry collapses them the way it collapses an array index: an entry beneath an `additionalProperties`
 * entry, like the entry itself, is rendered once per extra key, and every key it renders shares the one entry. An
 * additional property's `SchemaField` adds its own key's index for the fields below it
 */
export default createContext<readonly number[] | undefined>(undefined);
