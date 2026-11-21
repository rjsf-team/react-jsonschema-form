import canExpand from '../canExpand.ts';
import {
  ADDITIONAL_PROPERTIES_KEY,
  ADDITIONAL_PROPERTY_FLAG,
  ANY_OF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PREFIX_ITEMS_KEY,
  RJSF_REF_CYCLE_KEY,
  UI_DEFINITIONS_KEY,
  UI_FIELD_KEY,
} from '../constants.ts';
import ErrorSchemaBuilder from '../ErrorSchemaBuilder.ts';
import { fieldPathFromList } from '../fieldPath.ts';
import getDiscriminatorFieldFromSchema from '../getDiscriminatorFieldFromSchema.ts';
import getInheritedOptionUiSchema from '../getInheritedOptionUiSchema.ts';
import getItemUiSchemaForItem from '../getItemUiSchemaForItem.ts';
import { selectOptionUiSchema } from '../getOptionUiSchema.ts';
import getRenderedOptionSchema, { renderOption } from '../getRenderedOptionSchema.ts';
import getUiOptions from '../getUiOptions.ts';
import { getFieldTypeForUiSchema } from '../getWidget.tsx';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import type { XxxOfOptions } from '../getXxxOfOptions.ts';
import hasSchemaMarker from '../hasSchemaMarker.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import isConstantSelect from '../isConstantSelect.ts';
import isCustomWidget from '../isCustomWidget.ts';
import isFormDataAvailable from '../isFormDataAvailable.ts';
import isObject from '../isObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import mergeSchemas from '../mergeSchemas.ts';
import { getByPath } from '../pathUtils.ts';
import rendersOwnFieldBesideOption, { hasOwnContentBesideOptions } from '../rendersOwnFieldBesideOption.ts';
import resolveUiSchema, { definitionRef, mergeOptionDefinitions } from '../resolveUiSchema.ts';
import { isOptionalDataControlsType } from '../shouldRenderOptionalField.ts';
import type {
  ErrorSchema,
  FormContextType,
  FormFieldState,
  GenericObjectType,
  GlobalUISchemaOptions,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
  UiSchema,
  UiSchemaDefinitions,
} from '../types.ts';
import uiBooleanOption from '../uiBooleanOption.ts';
import { renderedOptionsUiSchema } from './fieldShownOption.ts';
import getClosestMatchingOption from './getClosestMatchingOption.ts';
import { AdditionalItemsHandling, getInnerSchemaForArrayItem } from './getInnerSchemaForArrayItem.ts';
import { getPrefixLength } from './getItemSchema.ts';
import { emptySchema } from './graph/mergePlan.ts';
import isFilesArray from './isFilesArray.ts';
import isMultiSelect from './isMultiSelect.ts';
import retrieveSchema, { expandRefCycle, getValidationTarget, withOptionExtraKeys } from './retrieveSchema.ts';

/** The schema and uiSchema of the `anyOf`/`oneOf` branch that applies to a node, the option shown, and, for an object
 * node, the option itself. An object node's branch merges the whole node into the option, since the walk visits the
 * properties the node's own `ObjectField` renders as well as the option's; whether the option's own field is an
 * Optional Data Control is read from the option as `MultiSchemaField` renders it, which carries only what that field is
 * rendered with. Any other node renders nothing beside its option, so its branch is that rendered option and is gated
 * on as it is.
 */
interface SelectedBranch<T, S extends StrictRJSFSchema, F extends FormContextType> {
  schema: S;
  option?: S;
  uiSchema: UiSchema<T, S, F>;
  shown?: S;
}

/** Resolves the `anyOf`/`oneOf` branch that currently applies to `formData`, the option the form's `fieldState` says
 * the field shows, or without one the option `computeDefaults()` picks, so the walk descends into the branch's schema.
 * Also resolves the uiSchema that `MultiSchemaField` would pass down to that branch's children:
 * `uiSchema[ONE_OF_KEY][index]` / `uiSchema[ANY_OF_KEY][index]` when the matching keyword's uiSchema is an array
 * reaching that index, falling back to `uiSchema` itself, without that list, otherwise (`AnyOfField`'s own
 * `optionsUiSchema`/`optionUiSchema`), with the field's `ui:required` where the option leaves its own unset — a plain
 * per-key entry on `uiSchema` (e.g. `uiSchema.thing.b`) is never consulted for a branch's own fields, matching what
 * actually renders.
 */
function resolveSelectedBranch<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: WalkContext<T, S, F>,
  schema: S,
  { key, options }: XxxOfOptions<S>,
  uiSchema: UiSchema<T, S, F>,
  formData: unknown,
  path: (string | number)[],
): SelectedBranch<T, S, F> {
  const { schemaContext, rootSchema, fieldState } = ctx;
  // Both keywords are dropped, since `MultiSchemaField` renders the option without the one it doesn't read either
  const { [ANY_OF_KEY]: _anyOf, [ONE_OF_KEY]: _oneOf, ...remaining } = schema;
  const discriminator = getDiscriminatorFieldFromSchema<S>(schema);
  // A boolean option is rendered as an empty schema, as `SchemaField` retrieves it, so the form state is asked about
  // the options it shows
  const empty = emptySchema<S>();
  const shownOptions = options.map((option) => (isObject(option) ? option : empty));
  const shownIndex = fieldState
    ? fieldState.selectedOption(fieldPathFromList(path), shownOptions, formData, discriminator)
    : getClosestMatchingOption<unknown, S, F>(schemaContext, rootSchema, formData, options, 0, discriminator);
  // A `fieldState` is a caller's to implement, so an index naming none of the options is none shown
  const index = shownIndex < shownOptions.length ? shownIndex : -1;
  const option = index >= 0 ? shownOptions[index] : empty;
  const optionsUiSchema = mergeOptionDefinitions<T, S, F>(
    options.map(definitionRef),
    renderedOptionsUiSchema<T, S, F>(uiSchema, schema, rootSchema) ?? [],
    ctx,
  );
  const optionUiSchema =
    getInheritedOptionUiSchema<T, S, F>(
      schema,
      option,
      uiSchema,
      selectOptionUiSchema(optionsUiSchema, uiSchema, index),
      key,
    ) ?? {};
  if (!rendersOwnFieldBesideOption<S>(schema, option)) {
    return { schema: getRenderedOptionSchema<S>(schema, option), uiSchema: optionUiSchema, shown: option };
  }
  return { schema: mergeSchemas(remaining, option) as S, option, uiSchema: optionUiSchema, shown: option };
}

interface WalkContext<T, S extends StrictRJSFSchema, F extends FormContextType> {
  schemaContext: SchemaContext<S, F>;
  rootSchema: S;
  uiSchemaDefinitions?: UiSchemaDefinitions<S, F>;
  globalUiOptions?: GlobalUISchemaOptions;
  formContext?: F;
  fieldState?: FormFieldState<S>;
  builder: ErrorSchemaBuilder<T>;
}

/** Whether the object at `path`, offering `anyOf`/`oneOf` options, draws its Optional Data Controls beside them, as
 * the form's `fieldState` says. Without one, an object does when its uiSchema names no `ui:field`, so `SchemaField`
 * renders its `ObjectField` itself, and it has content of its own beside the options
 */
function drawsControlsBesideOptions<T, S extends StrictRJSFSchema, F extends FormContextType>(
  { schemaContext, fieldState }: WalkContext<T, S, F>,
  path: (string | number)[],
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  formData: unknown,
): boolean {
  if (fieldState?.drawsControlsBesideOptions) {
    return fieldState.drawsControlsBesideOptions(fieldPathFromList(path), schema, uiSchema, formData);
  }
  return (
    !getUiOptions<T, S, F>(uiSchema).field &&
    hasOwnContentBesideOptions<T, S, F>(
      { canExpand: (...args) => canExpand<T, S, F>(schemaContext, ...args) },
      schema,
      uiSchema,
    )
  );
}

/** Gets the type the fallback UI's type selector is on for the field for `schema` at `path`, which the form keeps, or
 * undefined where no type selector renders it. `depth` counts the type selectors at the path, from 1 for the outermost
 */
function fallbackTypeAt<T, S extends StrictRJSFSchema, F extends FormContextType>(
  { fieldState }: WalkContext<T, S, F>,
  path: (string | number)[],
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  formData: unknown,
  depth: number,
): string | undefined {
  return Array.isArray(schema.type)
    ? fieldState?.fallbackType?.(fieldPathFromList(path), schema, uiSchema, formData, depth)
    : undefined;
}

/** Gets the type of the field on screen at `path`, whose children are the only ones that can be required of the user:
 * the one a fallback UI's type selector is on, which the form keeps, or the one the type list resolves to
 */
function shownFieldType<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: WalkContext<T, S, F>,
  path: (string | number)[],
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  formData: unknown,
  depth: number,
): string | undefined {
  return (
    fallbackTypeAt<T, S, F>(ctx, path, schema, uiSchema, formData, depth) ??
    getFieldTypeForUiSchema<T, S, F>(schema, uiSchema, ctx.schemaContext.widgets, formData)
  );
}

/** Whether the field renders something the user can answer it with: not a `null`, which has no control, nor a schema with
 * no type, which renders the unsupported-field template unless a `ui:field` or the fallback UI renders it. An
 * `anyOf`/`oneOf` of constants with no type is a select, whose type `SchemaField` infers from the constants
 */
function rendersAnswer<T, S extends StrictRJSFSchema, F extends FormContextType>(
  { schemaContext, fieldState }: WalkContext<T, S, F>,
  path: (string | number)[],
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  depth: number,
) {
  const type = getFieldTypeForUiSchema<T, S, F>(schema, uiSchema, schemaContext.widgets);
  return (
    (type !== undefined && type !== 'null') ||
    (type === undefined && isConstantOptionList<S>(getXxxOfOptions<S>(schema)?.options)) ||
    UI_FIELD_KEY in uiSchema ||
    fieldState?.fallbackType?.(fieldPathFromList(path), schema, uiSchema, undefined, depth) !== undefined
  );
}

/** Whether `ArrayField` renders the array at `path` as one widget, as the form's `fieldState` says, asked on the type
 * the fallback UI's selector is on where the fallback UI renders the field. Without one, it does as `ArrayField` picks
 * its mode, and naming `ArrayField`, or `SchemaField`, which renders the data by its type, still has `ArrayField`
 * render it.
 * shortcut: without the registry, a field named as a component or by `$id`, an unregistered name, and an array with
 * no `items` under `useFallbackUiForUnsupportedType` are guessed wrong; pass `fieldState.rendersArrayWidget` for those
 */
function rendersArrayWidget<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: WalkContext<T, S, F>,
  path: (string | number)[],
  schema: S,
  uiSchema: UiSchema<T, S, F>,
  formData: unknown,
  depth: number,
): boolean {
  const { schemaContext, rootSchema, fieldState } = ctx;
  if (fieldState?.rendersArrayWidget) {
    const shownType = fallbackTypeAt<T, S, F>(ctx, path, schema, uiSchema, formData, depth);
    return fieldState.rendersArrayWidget(
      fieldPathFromList(path),
      shownType === undefined ? schema : { ...schema, type: shownType },
      uiSchema,
      formData,
    );
  }
  const { field } = getUiOptions<T, S, F>(uiSchema);
  return (
    (field === undefined || field === 'ArrayField' || field === 'SchemaField') &&
    (ITEMS_KEY in schema || PREFIX_ITEMS_KEY in schema) &&
    (isMultiSelect<T, S, F>(schemaContext, schema, rootSchema) ||
      isCustomWidget<T, S, F>(uiSchema) ||
      isFilesArray<T, S, F>(schemaContext, schema, uiSchema, rootSchema))
  );
}

/** The field an option walked as a node of its own is shown by, which has reported an empty value already where its own
 * `ui:required` asks for one, asks for an answer where the option it shows marks its label required, numbers the
 * option's type selectors below the ones it renders at the path, lists the places of the options shown above the
 * option at the path, and is an `additionalProperties` entry, which turns off the Optional Data Controls of every
 * option it shows at its path
 */
interface ShowingField {
  uiRequired: boolean;
  asksAnswer: boolean;
  typeSelectorsAbove: number;
  shownAbove: (string | undefined)[];
  isEntry: boolean;
}

/** Whether the field for `schema` renders the options it offers in turn as a field of its own: not a select of
 * constants, which is one control, nor options a `ui:field` renders in place of
 */
function rendersOptions<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schema: S,
  uiSchema: UiSchema<T, S, F>,
) {
  const { field, fieldReplacesAnyOrOneOf } = getUiOptions<T, S, F>(uiSchema);
  return (
    getXxxOfOptions<S>(schema) !== undefined &&
    !isConstantSelect<S>(schema, true) &&
    !(field !== undefined && fieldReplacesAnyOrOneOf === true)
  );
}

function walk<T, S extends StrictRJSFSchema, F extends FormContextType>(
  ctx: WalkContext<T, S, F>,
  schema: S,
  localUiSchema: UiSchema<T, S, F> | undefined,
  formData: unknown,
  path: (string | number)[],
  required: boolean,
  parentPresent: boolean,
  showingField?: ShowingField,
) {
  const { schemaContext, rootSchema, uiSchemaDefinitions, globalUiOptions, formContext, fieldState, builder } = ctx;
  // A recursive $ref that `retrieveSchema()` flagged as a cycle is not rendered until the user expands it (see
  // SchemaField/CyclicSchemaField), so nothing below it can be required of them until then
  if (hasSchemaMarker(schema, RJSF_REF_CYCLE_KEY)) {
    if (!fieldState?.isExpanded(fieldPathFromList(path))) {
      return;
    }
    walk(
      ctx,
      expandRefCycle<S>(schema, rootSchema),
      localUiSchema,
      formData,
      path,
      required,
      parentPresent,
      showingField,
    );
    return;
  }
  const uiSchema = resolveUiSchema<T, S, F>(schema, localUiSchema, { rootSchema, uiSchemaDefinitions });
  const fieldUiRequired = uiBooleanOption(getUiOptions<T, S, F>(uiSchema).required);
  // An option's `ui:required` is its field's, unless it sets its own, so the field it is shown by reports the empty value
  const reportsEmpty = showingField ? showingField.uiRequired : fieldUiRequired === true;
  const typeSelectorsAbove = showingField?.typeSelectorsAbove ?? 0;
  const reportMissing = () => builder.addErrors(`must have required property '${path[path.length - 1]}'`, path);
  if (!showingField && reportsEmpty && path.length > 0 && formData === undefined && !(required && parentPresent)) {
    // Worded exactly as AJV words its own `required` failures, so a ui:required error is indistinguishable from a
    // schema-required one in the error list and in any `ui:help`/ErrorList rendering built around that text. Skipped
    // only when AJV will raise this exact message itself: the field is in its parent's schema `required` list AND
    // that parent is actually present in formData — AJV never applies a subschema's `required` to a property that
    // isn't there, so `parentPresent` being false means the schema-required error would never fire either.
    reportMissing();
  }
  // Children can only carry ui:required through their own uiSchema entry or a ui:definitions fragment
  if (!uiSchemaDefinitions && Object.keys(uiSchema).length === 0) {
    return;
  }
  // Each subschema walked below is one this retrieve handed out, which carries where it came from, so retrieving it in
  // turn flags a recursive $ref as `SchemaField` sees it, one level at a time. Resolving the oneOf/anyOf options too,
  // each for the data as `SchemaField` retrieves them, gives `resolveSelectedBranch()` an option's `properties` rather
  // than its `$ref`
  const resolvedSchema = retrieveSchema<unknown, S, F>(schemaContext, schema, rootSchema, formData, true);
  // A select over object or array constants renders one control for its whole value, with no fields beneath it
  if (isWholeValueSelect<S>(resolvedSchema)) {
    return;
  }
  const effectiveRequired = fieldUiRequired ?? required;
  // An Optional Data Control hides what it holds until the user opts in, so a `ui:required` field beneath it isn't
  // visible for the user to fill in or correct either. ObjectField and ArrayField render the control, and hide their
  // fields whenever `!isFormDataAvailable(formData)`, which is also true for `null`. MultiSchemaField renders
  // no control of its own: it renders the selected option as a field of its own, with the option's uiSchema, so that
  // field is gated. An `additionalProperties` entry and the options it shows at its path have no control, whatever the
  // uiSchema says.
  const xxxOf = getXxxOfOptions<S>(resolvedSchema);
  const {
    schema: retrieved,
    option,
    uiSchema: branchUiSchema,
    shown,
  }: SelectedBranch<T, S, F> = xxxOf
    ? resolveSelectedBranch<T, S, F>(ctx, resolvedSchema, xxxOf, uiSchema, formData, path)
    : { schema: resolvedSchema, uiSchema };
  // The form keeps one pick per option list at a path, so an option shown again below itself at the path offers the
  // same list again and shows itself in turn, a `$ref` loop the form never finishes rendering. Two lists can share
  // their first option, so it is the option shown, not the list, that tells a loop apart. Where it is in the root is
  // worked out only for an option walked below another at the path, or one walked in turn as a node of its own
  const placeOfShown = () => shown && getValidationTarget<S>(shown, rootSchema).$ref;
  const shownAbove = showingField?.shownAbove ?? [];
  const place = showingField && placeOfShown();
  if (place && shownAbove.includes(place)) {
    return;
  }
  // The option's own `SchemaField` reads `ui:required` from the option's uiSchema, and a required option renders its
  // fields rather than an Add button
  const { required: branchUiRequired, widget: branchWidget } = getUiOptions<T, S, F>(branchUiSchema);
  const branchRequired = uiBooleanOption(branchUiRequired) ?? effectiveRequired;
  const isOptionControl = () =>
    !branchRequired &&
    isOptionalDataControlsType<T, S, F>(
      option ? () => getRenderedOptionSchema<S>(resolvedSchema, option) : retrieved,
      branchUiSchema,
      globalUiOptions,
      rootSchema,
    );
  const isEntry = showingField?.isEntry ?? hasSchemaMarker(schema, ADDITIONAL_PROPERTY_FLAG);
  const hidesControlled = path.length > 0 && !isFormDataAvailable(formData) && !isEntry;
  if (
    hidesControlled &&
    // An object node also renders its own ObjectField beside the option (see `getFieldComponent()` in `SchemaField`),
    // showing the properties it shares with the option unless the node is a control that hides them as well, and only
    // such a node's branch carries the option
    (option !== undefined
      ? !effectiveRequired &&
        isOptionalDataControlsType<T, S, F>(resolvedSchema, uiSchema, globalUiOptions, rootSchema) &&
        // One that draws the controls beside the options keeps the selected option off screen until Add, whatever
        // the option's own uiSchema says. The form knows which field renders the object, which decides that, so it is
        // asked only once the cheaper check of the option's own controls fails
        (isOptionControl() ||
          drawsControlsBesideOptions(ctx, path, withOptionExtraKeys<S>(resolvedSchema, option), uiSchema, formData))
      : // An option offering options of its own leaves its controls to the option it shows, unless drawn beside them
        isOptionControl() &&
        (!rendersOptions<T, S, F>(retrieved, branchUiSchema) ||
          drawsControlsBesideOptions(ctx, path, retrieved, branchUiSchema, formData)))
  ) {
    // Such a control is what the field whose label asks for an answer is answered with
    if (
      showingField?.asksAnswer &&
      !showingField.uiRequired &&
      formData === undefined &&
      !(required && parentPresent)
    ) {
      reportMissing();
    }
    return;
  }
  // An object beside its options renders its own properties in its own field and an option's in the option's field,
  // each on the type its own type selector is on: the option's is numbered below the object's where the object has one
  const ownFallbackType = option
    ? fallbackTypeAt<T, S, F>(ctx, path, resolvedSchema, uiSchema, formData, typeSelectorsAbove + 1)
    : undefined;
  const optionTypeSelectorsAbove = typeSelectorsAbove + (ownFallbackType === undefined ? 0 : 1);
  // Below the object's own selector, the option renders from the object with `type` pinned to the type picked, so an
  // option listing no types of its own has no selector, and is on that type. That parent is a copy made here, which
  // no later call finds again, so the option is rendered without keeping it
  let optionField = retrieved;
  if (option) {
    optionField =
      ownFallbackType === undefined
        ? getRenderedOptionSchema<S>(resolvedSchema, option)
        : renderOption<S>({ ...resolvedSchema, type: ownFallbackType }, option);
  }
  // An option offering options of its own renders them as a field of its own at this path, which `MultiSchemaField`
  // hands the option's uiSchema, so it is walked as a node of its own, which reads the option it shows in turn. A select
  // of constants is one control rather than options shown in turn, so its constants' entries don't decide its `ui:required`
  const nestsOptions = rendersOptions<T, S, F>(optionField, branchUiSchema);
  // The option's `ui:required` is read here and not above, which reads the field's, since `resolveSelectedBranch()`
  // hands the field's on to an option leaving it unset. The option a field shows marks the field's label from its own,
  // whatever an option it offers in turn says, which answers for it where it renders no answer itself, and has the `[]`
  // it may hold read by that option. An option shown deeper marks only its own control. An array
  // `ArrayField` renders as one widget, as it picks its mode, holds `[]` with nothing chosen, whether seeded or left by
  // clearing the last choice, which the validator accepts unless a `minItems` has it report this itself. The field says
  // it is required, so `[]` can't pass
  let isUnanswered = false;
  const optionRequired = uiBooleanOption(branchUiRequired) === true;
  const asksAnswer = showingField ? showingField.asksAnswer : optionRequired;
  if (
    path.length > 0 &&
    (asksAnswer || optionRequired) &&
    !(nestsOptions && (formData !== undefined || showingField))
  ) {
    isUnanswered =
      formData === undefined
        ? asksAnswer &&
          !reportsEmpty &&
          !(required && parentPresent) &&
          rendersAnswer<T, S, F>(ctx, path, retrieved, branchUiSchema, typeSelectorsAbove + 1)
        : Array.isArray(formData) &&
          formData.length === 0 &&
          (retrieved.minItems ?? 0) < 1 &&
          // A hidden widget leaves the user nothing to choose with
          branchWidget !== 'hidden' &&
          rendersArrayWidget<T, S, F>(ctx, path, retrieved, branchUiSchema, formData, typeSelectorsAbove + 1);
    if (isUnanswered) {
      reportMissing();
    }
  }
  if (nestsOptions) {
    walk(ctx, optionField, branchUiSchema, formData, path, required, parentPresent, {
      uiRequired: reportsEmpty || isUnanswered,
      asksAnswer,
      typeSelectorsAbove: optionTypeSelectorsAbove,
      shownAbove: [...shownAbove, showingField ? place : placeOfShown()],
      isEntry,
    });
    // An object renders its own properties beside the option, which are walked below
    if (!option) {
      return;
    }
  }
  // Whatever the value, `ObjectField` renders its properties: a string under a `['null', 'object', 'string']` isn't an
  // object, yet the inputs for them are on screen unless the field for another type is
  let shownType: string | undefined;
  let optionShownType: string | undefined;
  if (option) {
    const listedType = getFieldTypeForUiSchema<T, S, F>(retrieved, branchUiSchema, schemaContext.widgets, formData);
    shownType = ownFallbackType ?? listedType;
    optionShownType =
      fallbackTypeAt<T, S, F>(ctx, path, optionField, branchUiSchema, formData, optionTypeSelectorsAbove + 1) ??
      shownType;
  } else {
    shownType = shownFieldType<T, S, F>(ctx, path, retrieved, branchUiSchema, formData, typeSelectorsAbove + 1);
    optionShownType = shownType;
  }
  const ownProperties = resolvedSchema.properties ?? {};
  const optionProperties = option?.properties ?? {};
  // An object's `ObjectField` renders its own properties with its own uiSchema, whether the object is a field or an
  // option walked as a node of its own, and the option beside them with the option's entry, so a property both declare
  // is rendered twice, once with each
  const ownPropertiesUiSchema = option ? uiSchema : branchUiSchema;
  if (shownType === 'object' || optionShownType === 'object') {
    // Matches computeDefaults()'s own `isObject(rawFormData)` handling: when the schema resolves to an object here
    // but `formData` still holds a primitive (e.g. a leftover string from a previous oneOf/anyOf branch, or mismatched
    // caller data), indexing the primitive directly (`'abc'['0']` yields `'a'`, not `undefined`) can make a genuinely
    // missing required child look present.
    const data = isObject(formData) ? formData : ({} as GenericObjectType);
    const childParentPresent = isObject(formData);
    // The option's field hides the properties it declares where it is an Optional Data Control of its own
    const optionFieldHidden = hidesControlled && isOptionControl();
    Object.entries(retrieved.properties ?? {}).forEach(([key, propertySchema]) => {
      if (typeof propertySchema === 'boolean') {
        return;
      }
      const uiKey = hasSchemaMarker(propertySchema, ADDITIONAL_PROPERTY_FLAG) ? ADDITIONAL_PROPERTIES_KEY : key;
      // Each field renders the property on the type its own type selector is on, and an entry both read is walked once
      const childUiSchemas = new Set<UiSchema<T, S, F> | undefined>();
      const inOption = key in optionProperties;
      if ((!inOption || key in ownProperties) && shownType === 'object') {
        childUiSchemas.add(getByPath(ownPropertiesUiSchema, uiKey));
      }
      // A property the option declares is the option's field's too, which an option offering options of its own walks
      if (inOption && !nestsOptions && optionShownType === 'object' && !optionFieldHidden) {
        childUiSchemas.add(getByPath(branchUiSchema, uiKey));
      }
      const childRequired = Boolean(retrieved.required?.includes(key));
      childUiSchemas.forEach((childUiSchema) =>
        walk(ctx, propertySchema as S, childUiSchema, data[key], [...path, key], childRequired, childParentPresent),
      );
    });
  } else if (Array.isArray(formData) && (!Array.isArray(retrieved.type) || shownType === 'array')) {
    // Only names the array in the error a throwing function-form `uiSchema.items` logs, so it isn't worth deriving for
    // the arrays that don't have one — this walks every field of the form on every validation pass
    const arrayFieldPath = typeof branchUiSchema.items === 'function' ? fieldPathFromList(path) : undefined;
    formData.forEach((item, idx) => {
      walk(
        ctx,
        getInnerSchemaForArrayItem<S>(
          retrieved,
          AdditionalItemsHandling.Fallback,
          getPrefixLength<S>(retrieved) > 0 ? idx : -1,
        ),
        getItemUiSchemaForItem<T, S, F>(branchUiSchema, item as never, idx, formContext, arrayFieldPath, retrieved),
        item,
        [...path, idx],
        false,
        true,
      );
    });
  }
}

/** Whether `node` (a uiSchema fragment, or a `ui:definitions` entry) declares `ui:required`/`ui:options.required`
 * anywhere within it. Once a `ui:definitions` fragment is present anywhere, the walk's per-node prune (no local
 * uiSchema, no active definitions) can no longer rule a subtree out — every node's schema gets resolved via
 * `retrieveSchema()` just in case a definition attaches a `ui:required` further down. Scanning the (comparatively
 * tiny) uiSchema/definitions tree once up front, instead of the full data-shaped schema on every validation pass, is
 * what makes the "definitions exist, but no `ui:required` anywhere" case cheap again.
 *
 * The function form of `uiSchema.items` can't be inspected statically — it may return a fragment containing
 * `ui:required` for some item — so it's treated as though it might, rather than silently skipping the walk.
 */
function hasUiRequiredOption<S extends StrictRJSFSchema, F extends FormContextType>(node: unknown): boolean {
  if (typeof node === 'function') {
    return true;
  }
  if (!isObject(node)) {
    return false;
  }
  if (getUiOptions<unknown, S, F>(node).required !== undefined) {
    return true;
  }
  return Object.entries(node).some(([key, value]) => {
    if (key.startsWith('ui:')) {
      return false;
    }
    if (Array.isArray(value)) {
      return value.some((entry) => hasUiRequiredOption<S, F>(entry));
    }
    return hasUiRequiredOption<S, F>(value);
  });
}

/** Sentinel used as the inner cache key in `mightHaveUiRequiredCache` for an `undefined` `uiSchemaDefinitions`, since
 * a `WeakMap` key must be an object.
 */
const NO_DEFINITIONS = {};

/** Caches the result of scanning a given `uiSchema`/`uiSchemaDefinitions` pair for `ui:required`, keyed by object
 * identity. `getUiRequiredErrorSchema()` runs on every `validate()` call — every keystroke under
 * `liveValidate: 'onChange'` — but `uiSchema` (and the `uiSchemaDefinitions` derived from it) stay the same object
 * across those calls far more often than not, so re-walking the whole tree each time to answer a question whose
 * answer can't have changed is wasted work.
 */
const mightHaveUiRequiredCache = new WeakMap<object, WeakMap<object, boolean>>();

/** Returns whether `uiSchema`/`uiSchemaDefinitions` might declare `ui:required` anywhere, memoized by the object
 * identity of both so repeated calls with the same, unchanged `uiSchema` (the common case across live-validation
 * passes) skip the scan entirely. Falls back to scanning uncached when `uiSchema` isn't an object, since there's no
 * key to cache against and the scan is already O(1) in that case.
 */
function computeMightHaveUiRequired<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F> | undefined,
  uiSchemaDefinitions: UiSchemaDefinitions<S, F> | undefined,
): boolean {
  const scan = () =>
    hasUiRequiredOption<S, F>(uiSchema) ||
    (uiSchemaDefinitions !== undefined &&
      Object.values(uiSchemaDefinitions).some((fragment) => hasUiRequiredOption<S, F>(fragment)));
  if (!isObject(uiSchema)) {
    return scan();
  }
  let byDefinitions = mightHaveUiRequiredCache.get(uiSchema);
  if (!byDefinitions) {
    byDefinitions = new WeakMap();
    mightHaveUiRequiredCache.set(uiSchema, byDefinitions);
  }
  const definitionsKey: object = (uiSchemaDefinitions as object | undefined) ?? NO_DEFINITIONS;
  let cached = byDefinitions.get(definitionsKey);
  if (cached === undefined) {
    cached = scan();
    byDefinitions.set(definitionsKey, cached);
  }
  return cached;
}

/** Walks the `schema` (resolved node by node against `formData`, exactly as `SchemaField` does while rendering) and
 * the `uiSchema` (resolved through `ui:definitions` the same way), returning an `ErrorSchema` holding a required
 * error for every field marked `ui:required: true` whose value is missing, which for an array rendered as one widget,
 * such as a group of checkboxes or a multiple select, includes `[]`. The schema handed to the validator is left
 * untouched, so this works identically on the submit and live-validation paths and with precompiled validators.
 * Given the form's `fieldState`, the walk follows the option each field shows and descends into the `$ref` cycles
 * the user expanded, so the fields it walks are the ones on screen.
 */
export default function getUiRequiredErrorSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  formData: T | undefined,
  uiSchemaDefinitions: UiSchemaDefinitions<S, F> | undefined = uiSchema?.[UI_DEFINITIONS_KEY],
  globalUiOptions?: GlobalUISchemaOptions,
  formContext?: F,
  fieldState?: FormFieldState<S>,
): ErrorSchema<T> {
  const builder = new ErrorSchemaBuilder<T>();
  const hasDefinitions = uiSchemaDefinitions && Object.keys(uiSchemaDefinitions).length > 0;
  const mightHaveUiRequired = computeMightHaveUiRequired<T, S, F>(uiSchema, uiSchemaDefinitions);
  if (!mightHaveUiRequired) {
    return builder.ErrorSchema;
  }
  walk<T, S, F>(
    {
      schemaContext: context,
      rootSchema,
      uiSchemaDefinitions: hasDefinitions ? uiSchemaDefinitions : undefined,
      globalUiOptions,
      formContext,
      fieldState,
      builder,
    },
    rootSchema,
    uiSchema,
    formData,
    [],
    true,
    true,
  );
  return builder.ErrorSchema;
}
