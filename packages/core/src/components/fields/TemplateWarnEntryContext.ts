'use client';

import { createContext, use, useMemo } from 'react';
import {
  ADDITIONAL_PROPERTY_FLAG,
  EXTRA_KEY_OPTION_KEY,
  fieldPathToList,
  hasSchemaMarker,
  isObject,
  UI_DEFINITION_ORIGIN_KEY,
  UI_OPTIONS_KEY,
} from '@rjsf/utils';
import type { FieldPath, GlobalFormOptions } from '@rjsf/utils';

import { anchoredEntryLabel, entryLabelForLog, writeEntrySegment } from '../../fieldLabelForLog.ts';
import type { EntryAnchor, OptionAnchor } from '../../fieldLabelForLog.ts';
import { getAt } from '../dataPaths.ts';

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
  /** Builds the label once per `key`, when something is actually invalid. Given the uiSchema option a warning is about,
   * such as `field` or `FieldTemplate`, it names whichever holds the option, where a `ui:definitions` entry is merged
   * under the entry the uiSchema gives: that entry, or the definition
   */
  label: (key?: string) => string;
  /** Builds the label of the entry as the uiSchema gives it, naming no `ui:definitions` entry merged under it or above */
  localLabel: () => string;
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
  anchor?: OptionAnchor;
  /** The option schema this one sits beneath, which the schema labels of the fields below it are written after */
  schemaAnchor?: EntryAnchor;
  /** Set on a shown option's entry where the field holding the option declares extra-key keywords: that field's entry,
   * whose schema label the option's own extra keys take, since their schema comes from those keywords, alone or joined
   * with the option's
   */
  optionFieldEntry?: TemplateWarnEntry;
  /** Set on an option's entry whose extra keys render from the `additionalProperties` entry of the field holding the
   * option, which `getRenderedOptionUiSchema()` copies into the option's: that field's entry, whose anchor they take.
   * Only the option's extra keys read it, since every field below builds an entry of its own without it
   */
  extraKeysFrom?: TemplateWarnEntry;
  /** The nearest `ui:definitions` entry merged under this entry or one above it, whose holder `label` names */
  definitionOrigin?: DefinitionOrigin;
  /** The options this entry sits below that render from an entry of their own, in the order they nest, which a uiSchema
   * path from a definition above them takes along with the data path
   */
  optionSteps?: readonly OptionStep[];
}

/** An option rendered from its own `uiSchema.anyOf[i]`/`uiSchema.oneOf[i]` entry, which renders at its field's data path
 * and so leaves no segment of its own in it
 */
interface OptionStep {
  /** How many path segments the field holding the option has */
  depth: number;
  /** The keyword holding the options */
  keyword: string;
  /** The index of the option */
  index: number;
}

/** A `ui:definitions` entry `resolveUiSchema()` merged under the uiSchema entry of a field or an option, which the
 * entries below that one are merged from too
 */
export interface DefinitionOrigin {
  /** How many path segments the field holding the merged entry has */
  depth: number;
  /** The `ui:definitions` key */
  ref: string;
  /** The entry as the uiSchema gave it */
  local: unknown;
  /** The `ui:definitions` entry merged under it */
  definition: unknown;
  /** The definition merged above this one, whose merged entry the `local` one comes from */
  parent?: DefinitionOrigin;
  /** How many of the `optionSteps` lie above the merged entry, so a path from it takes only those after */
  stepsBefore: number;
}

/** What `resolveUiSchema()` records under `UI_DEFINITION_ORIGIN_KEY` */
export type DefinitionRecord = Pick<DefinitionOrigin, 'ref' | 'local' | 'definition'>;

/** Returns what `resolveUiSchema()` recorded on `uiSchema` when it merged a `ui:definitions` entry under it. It is built
 * afresh whenever `resolveUiSchema()` runs again, so a memo is keyed on its parts rather than on it
 *
 * @param uiSchema - The uiSchema as `resolveUiSchema()` resolved it
 * @returns - The record, or undefined where no definition was merged
 */
export function definitionRecordOf(uiSchema: unknown): DefinitionRecord | undefined {
  const record: unknown = isObject(uiSchema) ? Reflect.get(uiSchema, UI_DEFINITION_ORIGIN_KEY) : undefined;
  return isObject(record) && typeof record.ref === 'string' ? (record as DefinitionRecord) : undefined;
}

/** Keeps the record `resolveUiSchema()` recorded while its parts stay the same, since it records afresh whenever it runs
 * again for the same entries and the entries built from it are provided to everything below
 *
 * @param record - The record, as `definitionRecordOf()` reads it
 * @returns - The record, the same object while its parts are
 */
export function useStableDefinitionRecord(record: DefinitionRecord | undefined): DefinitionRecord | undefined {
  const ref = record?.ref;
  const local = record?.local;
  const definition = record?.definition;
  return useMemo(() => (ref === undefined ? undefined : { ref, local, definition }), [ref, local, definition]);
}

/** Whether `entry`, walked down `path`, holds the uiSchema option `key`, as `ui:key` or in `ui:options`
 *
 * @param entry - The uiSchema entry
 * @param path - The keys leading from `entry` to the one asked about
 * @param key - The option's name, without `ui:`
 * @returns - Whether the entry holds the option
 */
function holdsUiOption(entry: unknown, path: string[], key: string): boolean {
  const at: unknown = getAt(entry, path);
  if (!isObject(at)) {
    return false;
  }
  const options: unknown = at[UI_OPTIONS_KEY];
  // `getUiOptions()` ignores a `ui:options.field`, so only `ui:field` names a field
  return Object.hasOwn(at, `ui:${key}`) || (key !== 'field' && isObject(options) && Object.hasOwn(options, key));
}

/** Returns the way from a merged entry, of a field with `depth` path segments, to the entry of the field at `fieldPath`:
 * its uiSchema keys, an array index being its array's `items`, an extra key its object's `additionalProperties` and an
 * option its `anyOf`/`oneOf` and index, and that path written after `base`, as the labels write it
 *
 * @param fieldPath - The `FieldPath` of the field
 * @param depth - The number of path segments of the field holding the merged entry
 * @param additionalDepths - The indexes of the path segments that are an extra key
 * @param steps - The option steps below the merged entry
 * @param base - What the written path starts from
 * @returns - The keys, and the written path
 */
function pathBelow(
  fieldPath: FieldPath,
  depth: number,
  additionalDepths: readonly number[] | undefined,
  steps: readonly OptionStep[],
  base: string,
): { keys: string[]; written: string } {
  const segments = fieldPathToList(fieldPath);
  const keys: string[] = [];
  let written = base;
  const optionsAt = (index: number) => {
    for (const step of steps.filter((candidate) => candidate.depth === index)) {
      keys.push(step.keyword, String(step.index));
      written = `${written}.${step.keyword}[${step.index}]`;
    }
  };
  for (let index = depth; index < segments.length; index += 1) {
    optionsAt(index);
    const segment = segments[index];
    const isExtraKey = additionalDepths?.includes(index) ?? false;
    if (typeof segment === 'number') {
      keys.push('items');
    } else {
      keys.push(isExtraKey ? 'additionalProperties' : segment);
    }
    written = writeEntrySegment(written, segment, isExtraKey);
  }
  optionsAt(segments.length);
  return { keys, written };
}

/** Where the uiSchema option `key` of `entry` comes from: the place in a `ui:definitions` entry holding it, written as
 * `ui:definitions['#/$defs/Foo'].b`, `local` where the uiSchema gives it, or undefined where neither holds it. A key the
 * entry the uiSchema gives a merged definition holds came from the definition merged above, if there is one, so the
 * origins are walked outward from the nearest
 */
function holderOf(
  entry: Pick<TemplateWarnEntry, 'definitionOrigin' | 'fieldPath' | 'additionalDepths' | 'optionSteps'>,
  key: string,
): string | undefined {
  const { fieldPath, additionalDepths, optionSteps = [] } = entry;
  for (let at = entry.definitionOrigin; at; at = at.parent) {
    const steps = optionSteps.slice(at.stepsBefore);
    const below = pathBelow(fieldPath, at.depth, additionalDepths, steps, `ui:definitions['${at.ref}']`);
    if (!holdsUiOption(at.local, below.keys, key)) {
      return holdsUiOption(at.definition, below.keys, key) ? below.written : undefined;
    }
  }
  return 'local';
}

/** Returns the place in a `ui:definitions` entry holding the uiSchema option `key` of `entry`, written as
 * `ui:definitions['#/$defs/Foo'].b`, or undefined where the uiSchema gives it or nothing does
 *
 * @param entry - The entry
 * @param key - The option's name, without `ui:`
 * @returns - The place, if a definition holds it
 */
export function definitionHolding(entry: TemplateWarnEntry, key: string): string | undefined {
  const holder = holderOf(entry, key);
  return holder === 'local' ? undefined : holder;
}

/** Returns `anchor` naming its entry, and the one it sits in, as the uiSchema gives them, for a key the uiSchema holds */
function localAnchorOf(anchor: OptionAnchor): OptionAnchor {
  return { ...anchor, definition: undefined, owner: anchor.localOwner };
}

/** Wraps an entry's `fallback` label so that, given a uiSchema option, it names where the option comes from: a place in
 * a `ui:definitions` entry, of the form whose root uiSchema holds it, or the entry the uiSchema gives, as `local`
 * labels it. Each key's label is built once
 *
 * @param fallback - The label for no key, or for one nothing holds
 * @param local - The label of the entry the uiSchema gives
 * @param entry - The parts of the entry `holderOf()` reads
 * @param idPrefix - The form's `idPrefix`
 * @returns - The keyed label
 */
function keyedLabel(
  fallback: () => string,
  local: () => string,
  entry: Parameters<typeof holderOf>[0],
  idPrefix: string,
): (key?: string) => string {
  if (!entry.definitionOrigin) {
    return fallback;
  }
  const byKey = new Map<string, string>();
  return (key) => {
    if (key === undefined) {
      return fallback();
    }
    let built = byKey.get(key);
    if (built === undefined) {
      const from = holderOf(entry, key);
      if (from === 'local') {
        built = local();
      } else {
        built = from ? `the ${from} entry of "${idPrefix}"` : fallback();
      }
      byKey.set(key, built);
    }
    return built;
  };
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
 * @param [extraKeyOption] - The option, as `anyOf[1]`, whose extra-key keywords alone describe the extra key the field
 *        is, where `retrieveSchema()` recorded one
 * @param [definitionRecord] - What `resolveUiSchema()` recorded on the field's uiSchema, as `definitionRecordOf()` reads
 *        it, where it merged a `ui:definitions` entry under the field's own
 * @returns - The field's entry
 */
export function templateWarnEntry(
  entryAbove: TemplateWarnEntry | undefined,
  isAdditional: boolean,
  fieldPath: FieldPath,
  globalFormOptions: GlobalFormOptions,
  extraKeyOption?: string,
  definitionRecord?: DefinitionRecord,
): TemplateWarnEntry {
  if (entryAbove?.fieldPath === fieldPath) {
    return entryAbove;
  }
  const depthsAbove = entryAbove?.additionalDepths;
  const additionalDepths = isAdditional ? [...(depthsAbove ?? []), fieldPathToList(fieldPath).length - 1] : depthsAbove;
  const anchor = isAdditional && entryAbove?.extraKeysFrom ? entryAbove.extraKeysFrom.anchor : entryAbove?.anchor;
  let schemaAnchor = entryAbove?.schemaAnchor;
  if (isAdditional && extraKeyOption && entryAbove) {
    // The object renders the key whichever option describes it, so the key's schema is named after that option
    schemaAnchor = {
      depth: fieldPathToList(fieldPath).length - 1,
      prefix: extraKeyOption,
      owner: entryAbove.schemaLabel,
      noun: 'schema',
    };
  } else if (isAdditional && entryAbove?.optionFieldEntry) {
    schemaAnchor = entryAbove.optionFieldEntry.schemaAnchor;
  }
  const anchoredTo = (labelAnchor?: EntryAnchor) =>
    lazyLabel(() => entryLabelForLog(fieldPath, globalFormOptions, additionalDepths, labelAnchor));
  const plainLabel = anchoredTo();
  const fallbackLabel = anchor ? anchoredTo(anchor) : plainLabel;
  const optionSteps = entryAbove?.optionSteps;
  const originAbove = entryAbove?.definitionOrigin;
  const definitionOrigin = definitionRecord
    ? {
        ...definitionRecord,
        depth: fieldPathToList(fieldPath).length,
        parent: originAbove,
        stepsBefore: optionSteps?.length ?? 0,
      }
    : originAbove;
  const localLabel = anchor ? anchoredTo(localAnchorOf(anchor)) : plainLabel;
  const label = keyedLabel(
    fallbackLabel,
    localLabel,
    { definitionOrigin, fieldPath, additionalDepths, optionSteps },
    globalFormOptions.idPrefix,
  );
  const schemaLabel = schemaAnchor ? anchoredTo(schemaAnchor) : plainLabel;
  return {
    fieldPath,
    label,
    localLabel,
    schemaLabel,
    additionalDepths,
    anchor,
    schemaAnchor,
    definitionOrigin,
    optionSteps,
  };
}

/** The entry of the field at `fieldPath`, as `templateWarnEntry()` builds it from the one above. Memoized on whether
 * the schema is an additional property's stub rather than on the schema, which is retrieved afresh as the data changes,
 * since the entry is provided to everything below
 *
 * @param schema - The schema the field renders
 * @param fieldPath - The `FieldPath` identifying the field in the form
 * @param globalFormOptions - The `GlobalFormOptions` its labels' ids are built from
 * @param [definitionRecord] - What `resolveUiSchema()` recorded on the field's uiSchema, as `definitionRecordOf()` reads
 *        it, kept by its parts since a parent may rebuild the uiSchema on every render
 * @returns - The field's entry
 */
export function useTemplateWarnEntry(
  schema: unknown,
  fieldPath: FieldPath,
  globalFormOptions: GlobalFormOptions,
  definitionRecord?: DefinitionRecord,
): TemplateWarnEntry {
  const entryAbove = use(TemplateWarnEntryContext);
  const isAdditional = hasSchemaMarker(schema, ADDITIONAL_PROPERTY_FLAG);
  const option: unknown = isObject(schema) ? Reflect.get(schema, EXTRA_KEY_OPTION_KEY) : undefined;
  const extraKeyOption = typeof option === 'string' ? option : undefined;
  const record = useStableDefinitionRecord(definitionRecord);
  return useMemo(
    () => templateWarnEntry(entryAbove, isAdditional, fieldPath, globalFormOptions, extraKeyOption, record),
    [entryAbove, isAdditional, fieldPath, globalFormOptions, extraKeyOption, record],
  );
}

/** Returns the entry a shown `anyOf`/`oneOf` option renders from: its field's own where it has no `uiSchema` entry of its
 * own, otherwise its `uiSchema.anyOf[i]`/`uiSchema.oneOf[i]` entry, which the fields below it are named after. Its
 * schema is its own either way, so the schema labels of the fields below it are written after `anyOf[i]`/`oneOf[i]`. A
 * module-level function, so the labels capture only what they read rather than the render they are built in
 *
 * @param entry - The entry of the field holding the option
 * @param rendersFromField - Whether the option renders from the field's own `uiSchema` entry
 * @param keysFromField - Whether the option renders the extra keys it takes from the field with the field's entry
 * @param keySchemaFromField - Whether the field declares extra-key keywords, which the option's extra keys are described by
 * @param xxxOfKey - The keyword holding the options
 * @param selectedOption - The index of the option shown
 * @param globalFormOptions - The `GlobalFormOptions` holding the `idPrefix` a label naming a `ui:definitions` entry
 *        names the form by
 * @param [definition] - The `ui:definitions` key of the option's `$ref`, where `ui:definitions` has an entry for it
 * @param [definitionRecord] - What `resolveUiSchema()` recorded on the option's own entry when it merged that
 *        definition under it, as `definitionRecordOf()` reads it
 * @returns - The option's entry
 */
export function optionWarnEntry(
  entry: TemplateWarnEntry,
  rendersFromField: boolean,
  keysFromField: boolean,
  keySchemaFromField: boolean,
  xxxOfKey: string,
  selectedOption: number,
  globalFormOptions: GlobalFormOptions,
  definition?: string,
  definitionRecord?: DefinitionRecord,
): TemplateWarnEntry {
  const schemaLabel = lazyLabel(() => `the ${xxxOfKey}[${selectedOption}] option of ${entry.schemaLabel()}`);
  const depth = fieldPathToList(entry.fieldPath).length;
  const schemaAnchor = { depth, prefix: `${xxxOfKey}[${selectedOption}]`, owner: entry.schemaLabel, noun: 'schema' };
  // An option nested in an option at the same path takes its extra keys from the outer one's field. Where the field
  // declares no extra-key keyword, the option's extra keys are described by its own alone, and so named after it
  const optionFieldEntry = keySchemaFromField ? (entry.optionFieldEntry ?? entry) : undefined;
  if (rendersFromField) {
    return { ...entry, schemaLabel, schemaAnchor, optionFieldEntry };
  }
  const anchor = {
    depth,
    prefix: `uiSchema.${xxxOfKey}[${selectedOption}]`,
    owner: entry.label,
    localOwner: entry.localLabel,
    definition,
  };
  const fallbackLabel = lazyLabel(() => anchoredEntryLabel(anchor));
  const localLabel = lazyLabel(() => anchoredEntryLabel(localAnchorOf(anchor)));
  // The option's own entry, and the definition of its `$ref` merged under it, sit below this step
  const optionSteps = [...(entry.optionSteps ?? []), { depth, keyword: xxxOfKey, index: selectedOption }];
  const definitionOrigin = definitionRecord
    ? { ...definitionRecord, depth, parent: entry.definitionOrigin, stepsBefore: optionSteps.length }
    : entry.definitionOrigin;
  const label = keyedLabel(
    fallbackLabel,
    localLabel,
    { definitionOrigin, fieldPath: entry.fieldPath, additionalDepths: entry.additionalDepths, optionSteps },
    globalFormOptions.idPrefix,
  );
  // A field that is itself an option taking its own field's extra keys hands on that field's entry, which they render from
  const extraKeysFrom = keysFromField ? (entry.extraKeysFrom ?? entry) : undefined;
  return {
    ...entry,
    label,
    localLabel,
    schemaLabel,
    anchor,
    extraKeysFrom,
    schemaAnchor,
    optionFieldEntry,
    definitionOrigin,
    optionSteps,
  };
}

export default TemplateWarnEntryContext;
