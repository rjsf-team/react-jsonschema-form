import acceptAttribute from './acceptAttribute.ts';
import { getAdditionalPropertySchema, getMatchingPatternProperties } from './additionalPropertiesUtils.ts';
import AdditionalPropertyKeySelect from './AdditionalPropertyKeySelect.tsx';
import type { AdditionalPropertyKeySelectProps } from './AdditionalPropertyKeySelect.tsx';
import allowAdditionalItems from './allowAdditionalItems.ts';
import asNumber from './asNumber.ts';
import callerInputProps from './callerInputProps.ts';
import callWithDeferredThrow from './callWithDeferredThrow.ts';
import createErrorHandler from './createErrorHandler.ts';
import createRootSchemaGuard from './createRootSchemaGuard.ts';
import createSchemaUtils from './createSchemaUtils.ts';
import deepEquals, { deepEqualsUndefinedAsMissing } from './deepEquals.ts';
import describeUnresolvedComponent from './describeUnresolvedComponent.ts';
import englishStringTranslator from './englishStringTranslator.ts';
import enumOptionsAutofocusIndex from './enumOptionsAutofocusIndex.ts';
import enumOptionsDeselectValue from './enumOptionsDeselectValue.ts';
import enumOptionsDomValues from './enumOptionsDomValues.ts';
import enumOptionSelectedValue from './enumOptionSelectedValue.ts';
import enumOptionsIndexForValue from './enumOptionsIndexForValue.ts';
import enumOptionsIsDisabled from './enumOptionsIsDisabled.ts';
import enumOptionsIsSelected from './enumOptionsIsSelected.ts';
import enumOptionsSelectValue from './enumOptionsSelectValue.ts';
import enumOptionsValueForIndex from './enumOptionsValueForIndex.ts';
import enumOptionValueDecoder from './enumOptionValueDecoder.ts';
import enumOptionValueLabel from './enumOptionValueLabel.ts';
import ErrorSchemaBuilder from './ErrorSchemaBuilder.ts';
import errorSchemaChild from './errorSchemaChild.ts';
import {
  ROOT_FIELD_PATH,
  fieldPathEndsWithIndex,
  fieldPathFromList,
  fieldPathToId,
  fieldPathToList,
  fieldPathToName,
  idSegment,
  toFieldPath,
} from './fieldPath.ts';
import fieldShowsOwnErrors from './fieldShowsOwnErrors.ts';
import flattenGroupedOptions from './flattenGroupedOptions.ts';
import getAdditionalKeyAttributes from './getAdditionalKeyAttributes.ts';
import getArrayDescription from './getArrayDescription.ts';
import getBaseInputProps from './getBaseInputProps.ts';
import getChangedFields from './getChangedFields.ts';
import getContainerAttributes from './getContainerAttributes.ts';
import getControlAttributes from './getControlAttributes.ts';
import getControlDescribedBy from './getControlDescribedBy.ts';
import getControlFallbackName from './getControlFallbackName.ts';
import type { DateElementFormat, DateElementProp } from './getDateElementProps.ts';
import type { DateTimeLocalValueResult } from './getDateTimeLocalValue.ts';
import getDateTimeLocalValue from './getDateTimeLocalValue.ts';
import getDecimalSeparator from './getDecimalSeparator.ts';
import getDeprecatedHandling from './getDeprecatedHandling.ts';
import getDescribedControlAttributes from './getDescribedControlAttributes.ts';
import getDiscriminatorFieldFromSchema from './getDiscriminatorFieldFromSchema.ts';
import getErrorsToDraw from './getErrorsToDraw.ts';
import getExampleSuggestions from './getExampleSuggestions.ts';
import getFieldClassNames from './getFieldClassNames.ts';
import type { FieldLabelSources } from './getFieldLabel.ts';
import getFieldLabel from './getFieldLabel.ts';
import getFreePropertyNames from './getFreePropertyNames.ts';
import getGroupAttributes from './getGroupAttributes.ts';
import type { GroupRole } from './getGroupAttributes.ts';
import getGroupLabelling from './getGroupLabelling.ts';
import getItemUiSchemaForItem from './getItemUiSchemaForItem.ts';
import getLabelId from './getLabelId.ts';
import getOptionSelectorSchema from './getOptionSelectorSchema.ts';
import getOptionUiSchema, { selectOptionUiSchema } from './getOptionUiSchema.ts';
import getOptionValueFormat from './getOptionValueFormat.ts';
import type { PresentationSource, PresentationSubject } from './getPresentationDeclaration.ts';
import getPresentationDeclaration, { WIDGET_FIELD_PRESENTATION } from './getPresentationDeclaration.ts';
import getPropertySchema from './getPropertySchema.ts';
import getRenderedOptionSchema from './getRenderedOptionSchema.ts';
import getRenderedOptionUiSchema from './getRenderedOptionUiSchema.ts';
import getSchemaOwnTypes from './getSchemaOwnTypes.ts';
import getSchemaType from './getSchemaType.ts';
import getSelectFieldType from './getSelectFieldType.ts';
import getSelectorPresentation from './getSelectorPresentation.ts';
import getStaticItemsUiSchema from './getStaticItemsUiSchema.ts';
import getSubmitButtonOptions from './getSubmitButtonOptions.ts';
import getTemplates from './getTemplates.ts';
import getTestIds from './getTestIds.ts';
import getUiOptions from './getUiOptions.ts';
import getUnionTypes from './getUnionTypes.ts';
import type { WidgetAliasFor } from './getWidget.tsx';
import {
  DEFAULT_BOOLEAN_WIDGET,
  getFieldTypeForUiSchema,
  getFieldTypeForWidget,
  getWidgetType,
  resolveWidget,
} from './getWidget.tsx';
import getWidgetDescription from './getWidgetDescription.ts';
import getXxxOfKey from './getXxxOfKey.ts';
import getXxxOfOptions from './getXxxOfOptions.ts';
import groupEnumOptions from './groupEnumOptions.ts';
import guessType from './guessType.ts';
import hasAdditionalKeyLabel from './hasAdditionalKeyLabel.ts';
import { hashObject, schemaKey } from './hashObject.ts';
import hasSchemaMarker from './hasSchemaMarker.ts';
import type { SchemaFlagMarker } from './hasSchemaMarker.ts';
import type { VisibleErrorsProps } from './hasVisibleErrors.ts';
import hasVisibleErrors from './hasVisibleErrors.ts';
import hasWidget from './hasWidget.ts';
import hasWidgetErrors from './hasWidgetErrors.ts';
import {
  additionalKeyId,
  besideOptionsId,
  buttonId,
  descriptionId,
  errorId,
  examplesId,
  expandButtonId,
  fallbackTypeSelectorId,
  fieldLabelId,
  helpId,
  optionalControlsId,
  optionId,
  optionSelectorId,
  partId,
  titleId,
} from './idGenerators.ts';
import isAdditionalKeyDisabled from './isAdditionalKeyDisabled.ts';
import isAdditionalRemoveDisabled from './isAdditionalRemoveDisabled.ts';
import isComponentType from './isComponentType.ts';
import isConstant from './isConstant.ts';
import isConstantOptionList from './isConstantOptionList.ts';
import isConstantSelect from './isConstantSelect.ts';
import isCustomWidget from './isCustomWidget.ts';
import isEnumOptionsGroup from './isEnumOptionsGroup.ts';
import isFixedItems from './isFixedItems.ts';
import isFormDataAvailable from './isFormDataAvailable.ts';
import isLabelledByTemplate from './isLabelledByTemplate.ts';
import isNamedByTemplateLabel from './isNamedByTemplateLabel.ts';
import isObject, { isSchemaObject } from './isObject.ts';
import isPlainObject from './isPlainObject.ts';
import isWholeValueSelect from './isWholeValueSelect.ts';
import joinClassNames from './joinClassNames.ts';
import labelValue from './labelValue.ts';
import listboxAriaProps from './listboxAriaProps.ts';
import localToUTC from './localToUTC.ts';
import logGridSpanWarning from './logGridSpanWarning.ts';
import logOnce, { resetLogOnce } from './logOnce.ts';
import type { LogOnceLevel } from './logOnce.ts';
import logUnsupportedDefaultForEnum from './logUnsupportedDefaultForEnum.ts';
import lookupFromFormContext from './lookupFromFormContext.ts';
import mergeClassMaps from './mergeClassMaps.ts';
import mergeObjects from './mergeObjects.ts';
import mergeSchemas from './mergeSchemas.ts';
import mergeThemePresentation from './mergeThemePresentation.ts';
import { bracketNameGenerator, dotNotationNameGenerator } from './nameGenerators.ts';
import noop from './noop.ts';
import numericWidgetStoresString from './numericWidgetStoresString.ts';
import offersClearButton from './offersClearButton.ts';
import offsetTimeToLocalTime from './offsetTimeToLocalTime.ts';
import omitConsumedStyling from './omitConsumedStyling.ts';
import optionsList from './optionsList.ts';
import orderProperties from './orderProperties.ts';
import padTimeSeconds from './padTimeSeconds.ts';
import { getByPath, hasByPath, propertyToPath, setByPath, toPath, unsetByPath } from './pathUtils.ts';
import type { ObjectPath } from './pathUtils.ts';
import pickGlobalUiOptions from './pickGlobalUiOptions.ts';
import rangeSpec from './rangeSpec.ts';
import ratingStarValues from './ratingStarValues.ts';
import rendersOwnFieldBesideOption, { hasOwnContentBesideOptions } from './rendersOwnFieldBesideOption.ts';
import replaceEqualDeep from './replaceEqualDeep.ts';
import resolveDefaultWidget from './resolveDefaultWidget.ts';
import type { FieldPresentationInputs } from './resolveFieldPresentation.ts';
import resolveFieldPresentation from './resolveFieldPresentation.ts';
import resolveUiSchema from './resolveUiSchema.ts';
import schemaRequiresTrueValue from './schemaRequiresTrueValue.ts';
import { keywordShape, normalizeUri, resolveUri } from './schemaUri.ts';
import SelectedOptionDescription from './SelectedOptionDescription.tsx';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import setOwn from './setOwn.ts';
import type { SharedCopyPart } from './sharedCopyParts.ts';
import sharedCopyParts from './sharedCopyParts.ts';
import shouldRenderOptionalField, { getOptionalDataControlsType } from './shouldRenderOptionalField.ts';
import templateDrawsDescription from './templateDrawsDescription.ts';
import templateDrawsLabel from './templateDrawsLabel.ts';
import templateDrawsPlannedLabel from './templateDrawsPlannedLabel.ts';
import templateLabelFor from './templateLabelFor.ts';
import templateMarksRequired from './templateMarksRequired.ts';
import titleDrawsOptionalDataControl from './titleDrawsOptionalDataControl.ts';
import toConstant from './toConstant.ts';
import toErrorList from './toErrorList.ts';
import toErrorSchema from './toErrorSchema.ts';
import toInputValue from './toInputValue.ts';
import toNumericValue from './toNumericValue.ts';
import uiBooleanOption from './uiBooleanOption.ts';
import unwrapErrorHandler from './unwrapErrorHandler.ts';
import type { DateElementProps, UseAltDateWidgetResult } from './useAltDateWidgetProps.tsx';
import useAltDateWidgetProps, { DateElement } from './useAltDateWidgetProps.tsx';
import type { FileInfoType, UseFileWidgetPropsResult } from './useFileWidgetProps.ts';
import useFileWidgetProps from './useFileWidgetProps.ts';
import type { UseOptionFocusHandlersResult } from './useOptionFocusHandlers.ts';
import useOptionFocusHandlers from './useOptionFocusHandlers.ts';
import type { UseSelectFocusHandlersResult } from './useSelectFocusHandlers.ts';
import useSelectFocusHandlers from './useSelectFocusHandlers.ts';
import type { UseTimeWidgetPropsResult } from './useTimeWidgetProps.ts';
import useTimeWidgetProps from './useTimeWidgetProps.ts';
import utcToLocal from './utcToLocal.ts';
import validationDataMerge from './validationDataMerge.ts';
import type { WidgetAriaPropsInput } from './widgetAriaProps.ts';
import widgetAriaProps from './widgetAriaProps.ts';
import widgetDrawsLabel from './widgetDrawsLabel.ts';
import widgetDrawsLabelText from './widgetDrawsLabelText.ts';
import { rootSchemaIdOf, withRootIdRefPrefix } from './withIdRefPrefix.ts';

export type * from './types.ts';
export { TranslatableString } from './enums.ts';

export {
  ADDITIONAL_PROPERTY_FLAG,
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  CONST_KEY,
  DEFAULT_KEY,
  ELSE_KEY,
  ERRORS_KEY,
  GUESSED_TYPE_FLAG,
  ID_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  READONLY_KEY,
  REQUIRED_KEY,
  SUBMIT_BTN_OPTIONS_KEY,
  REF_KEY,
  THEN_KEY,
  UNEVALUATED_PROPERTIES_KEY,
  RJSF_REF_KEY,
  RJSF_REF_CYCLE_KEY,
  SCHEMA_KEY,
  DEFAULT_ID_PREFIX,
  DEFAULT_ID_SEPARATOR,
  LOOKUP_MAP_NAME,
  RJSF_ADDITIONAL_PROPERTIES_FLAG,
  ROOT_SCHEMA_PREFIX,
  UI_FIELD_KEY,
  UI_WIDGET_KEY,
  UI_OPTIONS_KEY,
  UI_GLOBAL_OPTIONS_KEY,
  UI_DEFINITIONS_KEY,
  JSON_SCHEMA_DRAFT_2019_09,
  JSON_SCHEMA_DRAFT_2020_12,
  JSON_SCHEMA_TYPES,
} from './constants.ts';
export { RESERVED_UI_OPTION_NAMES } from './globalUiOptionsKeys.ts';
export type { SchemaMap } from './parser/schemaParser.ts';
export { getValidationSchemas } from './parser/schemaParser.ts';
export {
  constrainsAlike,
  constrainsValue,
  expandRefCycle,
  getAdditionalPropertyType,
  getDefaultFormState,
  getItemSchema,
  getPrefixLength,
  getValidationTarget,
  namesEveryType,
} from './schema/index.ts';
/** @public The validator-based API that `createSchemaUtils()` binds, which consumers call directly with a validator */
export {
  findFieldInSchema,
  findSelectedOptionInXxxOf,
  getClosestMatchingOption,
  // oxlint-disable-next-line typescript/no-deprecated -- deprecated, and kept exported through v7
  getDisplayLabel,
  getFirstMatchingOption,
  getFromSchema,
  getUiRequiredErrorSchema,
  isFilesArray,
  isMultiSelect,
  isSelect,
  omitExtraData,
  retrieveSchema,
  sanitizeDataForNewSchema,
} from './schema/index.ts';

export type {
  AdditionalPropertyKeySelectProps,
  DateElementFormat,
  DateElementProp,
  DateElementProps,
  DateTimeLocalValueResult,
  FieldLabelSources,
  FieldPresentationInputs,
  FileInfoType,
  GroupRole,
  LogOnceLevel,
  ObjectPath,
  PresentationSource,
  PresentationSubject,
  SchemaFlagMarker,
  SelectedOptionDescriptionProps,
  SharedCopyPart,
  UseAltDateWidgetResult,
  UseFileWidgetPropsResult,
  UseOptionFocusHandlersResult,
  UseSelectFocusHandlersResult,
  UseTimeWidgetPropsResult,
  // oxlint-disable-next-line typescript/no-deprecated -- deprecated, and kept exported through v7
  VisibleErrorsProps,
  WidgetAliasFor,
  WidgetAriaPropsInput,
};

export {
  additionalKeyId,
  AdditionalPropertyKeySelect,
  acceptAttribute,
  allowAdditionalItems,
  asNumber,
  besideOptionsId,
  buttonId,
  callerInputProps,
  callWithDeferredThrow,
  createErrorHandler,
  createRootSchemaGuard,
  createSchemaUtils,
  DateElement,
  deepEquals,
  deepEqualsUndefinedAsMissing,
  DEFAULT_BOOLEAN_WIDGET,
  describeUnresolvedComponent,
  descriptionId,
  englishStringTranslator,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueLabel,
  enumOptionsAutofocusIndex,
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIndexForValue,
  enumOptionsIsDisabled,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  enumOptionsValueForIndex,
  errorId,
  errorSchemaChild,
  examplesId,
  expandButtonId,
  ErrorSchemaBuilder,
  fallbackTypeSelectorId,
  fieldLabelId,
  fieldShowsOwnErrors,
  flattenGroupedOptions,
  getAdditionalKeyAttributes,
  getAdditionalPropertySchema,
  getArrayDescription,
  getBaseInputProps,
  getChangedFields,
  getContainerAttributes,
  getControlAttributes,
  getControlDescribedBy,
  getControlFallbackName,
  getDateTimeLocalValue,
  getDecimalSeparator,
  getDeprecatedHandling,
  getDescribedControlAttributes,
  getDiscriminatorFieldFromSchema,
  getErrorsToDraw,
  getExampleSuggestions,
  getFieldClassNames,
  getFieldLabel,
  getFieldTypeForUiSchema,
  getFieldTypeForWidget,
  getFreePropertyNames,
  getGroupAttributes,
  getGroupLabelling,
  getItemUiSchemaForItem,
  getLabelId,
  getMatchingPatternProperties,
  getOptionalDataControlsType,
  getOptionSelectorSchema,
  getOptionUiSchema,
  getPresentationDeclaration,
  getPropertySchema,
  getOptionValueFormat,
  getRenderedOptionSchema,
  getRenderedOptionUiSchema,
  getSchemaOwnTypes,
  getSchemaType,
  getSelectFieldType,
  getSelectorPresentation,
  getByPath,
  getStaticItemsUiSchema,
  getSubmitButtonOptions,
  getTemplates,
  getTestIds,
  getUiOptions,
  getUnionTypes,
  getWidgetDescription,
  getWidgetType,
  getXxxOfKey,
  getXxxOfOptions,
  groupEnumOptions,
  guessType,
  hasAdditionalKeyLabel,
  hasByPath,
  hasOwnContentBesideOptions,
  hasSchemaMarker,
  // oxlint-disable-next-line typescript/no-deprecated -- deprecated, and kept exported through v7
  hasVisibleErrors,
  hasWidget,
  hasWidgetErrors,
  hashObject,
  helpId,
  isAdditionalKeyDisabled,
  isAdditionalRemoveDisabled,
  isComponentType,
  isConstant,
  isConstantOptionList,
  isConstantSelect,
  isCustomWidget,
  isEnumOptionsGroup,
  isFixedItems,
  isFormDataAvailable,
  isLabelledByTemplate,
  isNamedByTemplateLabel,
  isObject,
  isPlainObject,
  isSchemaObject,
  isWholeValueSelect,
  joinClassNames,
  labelValue,
  listboxAriaProps,
  localToUTC,
  logGridSpanWarning,
  logOnce,
  logUnsupportedDefaultForEnum,
  lookupFromFormContext,
  mergeClassMaps,
  mergeObjects,
  mergeSchemas,
  mergeThemePresentation,
  noop,
  offsetTimeToLocalTime,
  omitConsumedStyling,
  optionalControlsId,
  optionId,
  optionSelectorId,
  optionsList,
  orderProperties,
  padTimeSeconds,
  partId,
  pickGlobalUiOptions,
  rangeSpec,
  rendersOwnFieldBesideOption,
  replaceEqualDeep,
  resetLogOnce,
  resolveDefaultWidget,
  resolveFieldPresentation,
  resolveUiSchema,
  resolveWidget,
  schemaKey,
  schemaRequiresTrueValue,
  setByPath,
  setOwn,
  SelectedOptionDescription,
  selectOptionUiSchema,
  sharedCopyParts,
  shouldRenderOptionalField,
  templateDrawsDescription,
  templateDrawsLabel,
  templateDrawsPlannedLabel,
  templateLabelFor,
  templateMarksRequired,
  titleDrawsOptionalDataControl,
  titleId,
  toConstant,
  toErrorList,
  toErrorSchema,
  numericWidgetStoresString,
  ratingStarValues,
  toInputValue,
  offersClearButton,
  toNumericValue,
  ROOT_FIELD_PATH,
  toFieldPath,
  fieldPathFromList,
  fieldPathToId,
  idSegment,
  fieldPathEndsWithIndex,
  fieldPathToList,
  fieldPathToName,
  toPath,
  propertyToPath,
  uiBooleanOption,
  unsetByPath,
  unwrapErrorHandler,
  useAltDateWidgetProps,
  useFileWidgetProps,
  useOptionFocusHandlers,
  useSelectFocusHandlers,
  useTimeWidgetProps,
  utcToLocal,
  validationDataMerge,
  WIDGET_FIELD_PRESENTATION,
  widgetAriaProps,
  widgetDrawsLabel,
  widgetDrawsLabelText,
  withRootIdRefPrefix,
  rootSchemaIdOf,
  keywordShape,
  normalizeUri,
  resolveUri,
  bracketNameGenerator,
  dotNotationNameGenerator,
};

/** @public The stamp `retrieveSchema()` leaves on each subschema, which consumers' tests strip to compare one with a
 * schema written by hand
 */
export { RJSF_PROVENANCE_KEY } from './constants.ts';
/** @public The start of the `$id` an option's scoring copy gives a part it holds once, by which a custom validator
 * recognises such a part, as `sharedCopyParts()` does
 */
export { SHARED_COPY_ID } from './constants.ts';
/** @public Ids RJSF renders that no other RJSF package's source needs, by which consumers' code and tests find those
 * parts
 */
export { optionDescriptionId, optionHelpId, selectedOptionDescriptionId } from './idGenerators.ts';
