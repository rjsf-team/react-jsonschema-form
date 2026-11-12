import { createContext, use, useMemo } from 'react';
import { ADDITIONAL_PROPERTY_FLAG, fieldPathToList, hasSchemaMarker } from '@rjsf/utils';
import type { FieldPath, GlobalFormOptions } from '@rjsf/utils';

import { entryLabelForLog } from '../../fieldLabelForLog.ts';
import type { EntryAnchor } from '../../fieldLabelForLog.ts';

/** The uiSchema entry a field at `fieldPath` renders from, for a warning about that entry. A shown `anyOf`/`oneOf`
 * option renders at the `MultiSchemaField`'s own path, so a label built from that path would name the field's entry
 * rather than the option's own `uiSchema.anyOf`/`uiSchema.oneOf` entry, and the two entries' mistakes would read as one
 * under `logOnce()`. Each `SchemaField` provides its own entry, which the `MultiSchemaField` it renders builds the
 * option entry on, so an option nested in another option's entry names both. A field at the same path takes the entry
 * as it is; a field below builds its own from the `additionalDepths` and `anchor` it carries
 */
export interface TemplateWarnEntry {
  /** The path of the field whose entry `label` names */
  fieldPath: FieldPath;
  /** Builds the label once, when something is actually invalid */
  label: () => string;
  /** Builds the label of the schema the field renders, for a warning about the schema's shape rather than its `uiSchema`.
   * An option with no `uiSchema` entry of its own renders from its field's, so only this one tells such an option apart
   */
  schemaLabel: () => string;
  /** The indexes of the path segments that are an additional property's key, which the labels collapse the way they
   * collapse an array index: every extra key an `additionalProperties` entry renders, and every field beneath one,
   * shares the one entry
   */
  additionalDepths?: readonly number[];
  /** The option entry this one sits beneath, which the labels of the entries below it are written after */
  anchor?: EntryAnchor;
  /** Set on an option's entry whose extra keys render from the `additionalProperties` entry of the field holding the
   * option, which `getRenderedOptionUiSchema()` copies into the option's: that field's entry, whose anchor they take.
   * Only the option's extra keys read it, since every field below builds an entry of its own without it
   */
  extraKeysFrom?: TemplateWarnEntry;
}

const TemplateWarnEntryContext = createContext<TemplateWarnEntry | undefined>(undefined);

/** Wraps `build` so it runs at most once, since an invalid override is warned about on every render while it stays
 *
 * @param build - Builds the label
 * @returns - A function returning the label `build` built the first time it was called
 */
function lazyLabel(build: () => string): () => string {
  let label: string | undefined;
  return () => {
    label ??= build();
    return label;
  };
}

/** Returns the entry of the field at `fieldPath`: the one above where it is for the same path, otherwise one of its
 * own, with its own key's depth added where its schema is an additional property's stub
 *
 * @param entryAbove - The entry the field above provides, if any
 * @param isAdditional - Whether the schema the field renders is an additional property's stub
 * @param fieldPath - The `FieldPath` identifying the field in the form
 * @param globalFormOptions - The `GlobalFormOptions` its labels' ids are built from
 * @returns - The field's entry
 */
export function templateWarnEntry(
  entryAbove: TemplateWarnEntry | undefined,
  isAdditional: boolean,
  fieldPath: FieldPath,
  globalFormOptions: GlobalFormOptions,
): TemplateWarnEntry {
  if (entryAbove?.fieldPath === fieldPath) {
    return entryAbove;
  }
  const depthsAbove = entryAbove?.additionalDepths;
  const additionalDepths = isAdditional ? [...(depthsAbove ?? []), fieldPathToList(fieldPath).length - 1] : depthsAbove;
  const anchor = isAdditional && entryAbove?.extraKeysFrom ? entryAbove.extraKeysFrom.anchor : entryAbove?.anchor;
  const schemaLabel = lazyLabel(() => entryLabelForLog(fieldPath, globalFormOptions, additionalDepths));
  const label = anchor
    ? lazyLabel(() => entryLabelForLog(fieldPath, globalFormOptions, additionalDepths, anchor))
    : schemaLabel;
  return { fieldPath, label, schemaLabel, additionalDepths, anchor };
}

/** The entry of the field at `fieldPath`, as `templateWarnEntry()` builds it from the one above. Memoized on whether
 * the schema is an additional property's stub rather than on the schema, which is retrieved afresh as the data changes,
 * since the entry is provided to everything below
 *
 * @param schema - The schema the field renders
 * @param fieldPath - The `FieldPath` identifying the field in the form
 * @param globalFormOptions - The `GlobalFormOptions` its labels' ids are built from
 * @returns - The field's entry
 */
export function useTemplateWarnEntry(
  schema: unknown,
  fieldPath: FieldPath,
  globalFormOptions: GlobalFormOptions,
): TemplateWarnEntry {
  const entryAbove = use(TemplateWarnEntryContext);
  const isAdditional = hasSchemaMarker(schema, ADDITIONAL_PROPERTY_FLAG);
  return useMemo(
    () => templateWarnEntry(entryAbove, isAdditional, fieldPath, globalFormOptions),
    [entryAbove, isAdditional, fieldPath, globalFormOptions],
  );
}

/** Returns the entry a shown `anyOf`/`oneOf` option renders from: its field's own where it has no `uiSchema` entry of its
 * own, otherwise its `uiSchema.anyOf[i]`/`uiSchema.oneOf[i]` entry, which the fields below it are named after. A
 * module-level function, so the labels capture only what they read rather than the render they are built in
 *
 * @param entry - The entry of the field holding the option
 * @param rendersFromField - Whether the option renders from the field's own `uiSchema` entry
 * @param keysFromField - Whether the option renders the extra keys it takes from the field with the field's entry
 * @param xxxOfKey - The keyword holding the options
 * @param selectedOption - The index of the option shown
 * @returns - The option's entry
 */
export function optionWarnEntry(
  entry: TemplateWarnEntry,
  rendersFromField: boolean,
  keysFromField: boolean,
  xxxOfKey: string,
  selectedOption: number,
): TemplateWarnEntry {
  const schemaLabel = lazyLabel(() => `the ${xxxOfKey}[${selectedOption}] option of ${entry.schemaLabel()}`);
  if (rendersFromField) {
    return { ...entry, schemaLabel };
  }
  const prefix = `uiSchema.${xxxOfKey}[${selectedOption}]`;
  const anchor = { depth: fieldPathToList(entry.fieldPath).length, prefix, owner: entry.label };
  const label = lazyLabel(() => `the ${prefix} entry of ${entry.label()}`);
  return { ...entry, label, schemaLabel, anchor, extraKeysFrom: keysFromField ? entry : undefined };
}

export default TemplateWarnEntryContext;
