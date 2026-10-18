import {
  allowsAdditionalProperties,
  getAdditionalPropertySchema,
  getMatchingPatternProperties,
} from './additionalPropertiesUtils.ts';
import AdditionalPropertyKeySelect from './AdditionalPropertyKeySelect.tsx';
import type { AdditionalPropertyKeySelectProps } from './AdditionalPropertyKeySelect.tsx';
import allowAdditionalItems from './allowAdditionalItems.ts';
import asNumber from './asNumber.ts';
import callWithDeferredThrow from './callWithDeferredThrow.ts';
import canExpand from './canExpand.ts';
import createErrorHandler from './createErrorHandler.ts';
import createRootSchemaGuard from './createRootSchemaGuard.ts';
import createSchemaUtils from './createSchemaUtils.ts';
import dataURItoBlob from './dataURItoBlob.ts';
import dateElementLabel, { dateElementAriaLabel } from './dateElementLabel.ts';
import dateRangeOptions from './dateRangeOptions.ts';
import deepEquals, { deepEqualsUndefinedAsMissing } from './deepEquals.ts';
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
  toFieldPath,
} from './fieldPath.ts';
import findSchemaDefinition from './findSchemaDefinition.ts';
import flattenGroupedOptions from './flattenGroupedOptions.ts';
import getArrayDescription from './getArrayDescription.ts';
import getChangedFields from './getChangedFields.ts';
import getControlAriaLabel from './getControlAriaLabel.ts';
import getControlAttributes from './getControlAttributes.ts';
import getControlDescribedBy from './getControlDescribedBy.ts';
import getControlFallbackName from './getControlFallbackName.ts';
import type { DateElementFormat, DateElementProp } from './getDateElementProps.ts';
import getDateElementProps from './getDateElementProps.ts';
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
import getInputProps from './getInputProps.ts';
import getItemUiSchemaForItem from './getItemUiSchemaForItem.ts';
import getLabelId from './getLabelId.ts';
import getNumericInputTitle from './getNumericInputTitle.ts';
import getOptionSelectorSchema from './getOptionSelectorSchema.ts';
import getOptionUiSchema, { selectOptionUiSchema } from './getOptionUiSchema.ts';
import getOptionValueFormat from './getOptionValueFormat.ts';
import type { PresentationSource, PresentationSubject } from './getPresentationDeclaration.ts';
import getPresentationDeclaration, { WIDGET_FIELD_PRESENTATION } from './getPresentationDeclaration.ts';
import getPropertySchema from './getPropertySchema.ts';
import getRenderedOptionSchema from './getRenderedOptionSchema.ts';
import getSchemaOwnTypes from './getSchemaOwnTypes.ts';
import getSchemaType from './getSchemaType.ts';
import getSchemaTypeForValue from './getSchemaTypeForValue.ts';
import getSelectFieldType from './getSelectFieldType.ts';
import getSelectorPresentation from './getSelectorPresentation.ts';
import getStaticItemsUiSchema from './getStaticItemsUiSchema.ts';
import getSubmitButtonOptions from './getSubmitButtonOptions.ts';
import getTemplate from './getTemplate.ts';
import getTemplates from './getTemplates.ts';
import getTestIds from './getTestIds.ts';
import getUiOptions from './getUiOptions.ts';
import getUnionTypes, { getKnownTypes } from './getUnionTypes.ts';
import type { VisibleErrorsProps } from './getVisibleErrors.ts';
import getVisibleErrors from './getVisibleErrors.ts';
import type { WidgetAliasFor } from './getWidget.tsx';
import getWidget, {
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
import hashForSchema, { hashObject, hashString, schemaKey, sortedJSONStringify } from './hashForSchema.ts';
import hasTemplateErrors from './hasTemplateErrors.ts';
import hasVisibleErrors from './hasVisibleErrors.ts';
import hasWidget from './hasWidget.ts';
import hasWidgetErrors from './hasWidgetErrors.ts';
import {
  ariaDescribedByIds,
  buttonId,
  dateElementId,
  descriptionId,
  errorId,
  examplesId,
  expandButtonId,
  fieldLabelId,
  helpId,
  optionalControlsId,
  optionDescriptionId,
  optionHelpId,
  optionId,
  optionLabelId,
  selectedOptionDescriptionId,
  titleId,
} from './idGenerators.ts';
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
import labelValue from './labelValue.ts';
import localTimeToOffsetTime from './localTimeToOffsetTime.ts';
import localToUTC from './localToUTC.ts';
import logOnce, { resetLogOnce } from './logOnce.ts';
import type { LogOnceLevel } from './logOnce.ts';
import logUnsupportedDefaultForEnum from './logUnsupportedDefaultForEnum.ts';
import lookupFromFormContext from './lookupFromFormContext.ts';
import mergeDefaultsWithFormData from './mergeDefaultsWithFormData.ts';
import mergeObjects from './mergeObjects.ts';
import mergeSchemas from './mergeSchemas.ts';
import mergeThemePresentation from './mergeThemePresentation.ts';
import { bracketNameGenerator, dotNotationNameGenerator } from './nameGenerators.ts';
import noop from './noop.ts';
import offsetTimeToLocalTime from './offsetTimeToLocalTime.ts';
import omitConsumedStyling from './omitConsumedStyling.ts';
import optionsList from './optionsList.ts';
import orderProperties from './orderProperties.ts';
import pad from './pad.ts';
import padTimeSeconds from './padTimeSeconds.ts';
import parseDateString from './parseDateString.ts';
import { getByPath, hasByPath, propertyToPath, setByPath, toPath, unsetByPath } from './pathUtils.ts';
import type { ObjectPath } from './pathUtils.ts';
import rangeSpec from './rangeSpec.ts';
import rendersOwnFieldBesideOption from './rendersOwnFieldBesideOption.ts';
import replaceEqualDeep from './replaceEqualDeep.ts';
import replaceStringParameters from './replaceStringParameters.ts';
import resolveDefaultWidget from './resolveDefaultWidget.ts';
import type { FieldPresentationInputs } from './resolveFieldPresentation.ts';
import resolveFieldPresentation from './resolveFieldPresentation.ts';
import resolveUiSchema from './resolveUiSchema.ts';
import schemaRequiresTrueValue from './schemaRequiresTrueValue.ts';
import { keywordShape, normalizeUri, resolveUri } from './schemaUri.ts';
import SelectedOptionDescription from './SelectedOptionDescription.tsx';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import setOwn from './setOwn.ts';
import shouldRenderOptionalField, { getOptionalDataControlsType } from './shouldRenderOptionalField.ts';
import templateDrawsDescription from './templateDrawsDescription.ts';
import templateDrawsLabel from './templateDrawsLabel.ts';
import templateDrawsPlannedLabel from './templateDrawsPlannedLabel.ts';
import templateLabelFor from './templateLabelFor.ts';
import templateMarksRequired from './templateMarksRequired.ts';
import titleDrawsOptionalDataControl from './titleDrawsOptionalDataControl.ts';
import toConstant from './toConstant.ts';
import toDateString from './toDateString.ts';
import toErrorList from './toErrorList.ts';
import toErrorSchema from './toErrorSchema.ts';
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
import withIdRefPrefix, { rootSchemaIdOf, withRootIdRefPrefix } from './withIdRefPrefix.ts';

export type * from './types.ts';
export * from './enums.ts';

export * from './constants.ts';
export * from './parser/index.ts';
export * from './schema/index.ts';

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
  SelectedOptionDescriptionProps,
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
  AdditionalPropertyKeySelect,
  allowAdditionalItems,
  allowsAdditionalProperties,
  ariaDescribedByIds,
  asNumber,
  buttonId,
  callWithDeferredThrow,
  canExpand,
  createErrorHandler,
  createRootSchemaGuard,
  createSchemaUtils,
  DateElement,
  dataURItoBlob,
  dateElementId,
  dateElementAriaLabel,
  dateElementLabel,
  dateRangeOptions,
  deepEquals,
  deepEqualsUndefinedAsMissing,
  DEFAULT_BOOLEAN_WIDGET,
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
  fieldLabelId,
  // oxlint-disable-next-line typescript/no-deprecated -- re-exported for callers written against 6.x
  findSchemaDefinition,
  flattenGroupedOptions,
  getAdditionalPropertySchema,
  getArrayDescription,
  getChangedFields,
  getControlAriaLabel,
  getControlAttributes,
  getControlDescribedBy,
  getControlFallbackName,
  getDateElementProps,
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
  getInputProps,
  getItemUiSchemaForItem,
  getLabelId,
  getMatchingPatternProperties,
  getNumericInputTitle,
  getOptionalDataControlsType,
  getOptionSelectorSchema,
  getOptionUiSchema,
  getPresentationDeclaration,
  getPropertySchema,
  getOptionValueFormat,
  getRenderedOptionSchema,
  getSchemaOwnTypes,
  getSchemaType,
  getSchemaTypeForValue,
  getSelectFieldType,
  getSelectorPresentation,
  getByPath,
  getKnownTypes,
  getStaticItemsUiSchema,
  getSubmitButtonOptions,
  getTemplate,
  getTemplates,
  getTestIds,
  getUiOptions,
  getUnionTypes,
  // oxlint-disable-next-line typescript/no-deprecated -- deprecated, and kept exported through v7
  getVisibleErrors,
  getWidget,
  getWidgetDescription,
  getWidgetType,
  getXxxOfKey,
  getXxxOfOptions,
  groupEnumOptions,
  guessType,
  hasAdditionalKeyLabel,
  hasByPath,
  hasTemplateErrors,
  // oxlint-disable-next-line typescript/no-deprecated -- deprecated, and kept exported through v7
  hasVisibleErrors,
  hasWidget,
  hasWidgetErrors,
  hashForSchema,
  hashObject,
  hashString,
  helpId,
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
  labelValue,
  localTimeToOffsetTime,
  localToUTC,
  logOnce,
  logUnsupportedDefaultForEnum,
  lookupFromFormContext,
  mergeDefaultsWithFormData,
  mergeObjects,
  mergeSchemas,
  mergeThemePresentation,
  noop,
  offsetTimeToLocalTime,
  omitConsumedStyling,
  optionalControlsId,
  optionDescriptionId,
  optionHelpId,
  optionId,
  optionLabelId,
  optionsList,
  orderProperties,
  pad,
  padTimeSeconds,
  parseDateString,
  rangeSpec,
  rendersOwnFieldBesideOption,
  replaceEqualDeep,
  replaceStringParameters,
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
  selectedOptionDescriptionId,
  selectOptionUiSchema,
  shouldRenderOptionalField,
  sortedJSONStringify,
  templateDrawsDescription,
  templateDrawsLabel,
  templateDrawsPlannedLabel,
  templateLabelFor,
  templateMarksRequired,
  titleDrawsOptionalDataControl,
  titleId,
  toConstant,
  toDateString,
  toErrorList,
  toErrorSchema,
  ROOT_FIELD_PATH,
  toFieldPath,
  fieldPathFromList,
  fieldPathToId,
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
  withIdRefPrefix,
  withRootIdRefPrefix,
  rootSchemaIdOf,
  keywordShape,
  normalizeUri,
  resolveUri,
  bracketNameGenerator,
  dotNotationNameGenerator,
};
