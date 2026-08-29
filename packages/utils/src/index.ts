import allowAdditionalItems from './allowAdditionalItems.js';
import asNumber from './asNumber.js';
import canExpand from './canExpand.js';
import createErrorHandler from './createErrorHandler.js';
import createSchemaUtils from './createSchemaUtils.js';
import dataURItoBlob from './dataURItoBlob.js';
import dateRangeOptions from './dateRangeOptions.js';
import deepEquals from './deepEquals.js';
import englishStringTranslator from './englishStringTranslator.js';
import enumOptionsDeselectValue from './enumOptionsDeselectValue.js';
import enumOptionSelectedValue from './enumOptionSelectedValue.js';
import enumOptionsIndexForValue from './enumOptionsIndexForValue.js';
import enumOptionsIsSelected from './enumOptionsIsSelected.js';
import enumOptionsSelectValue from './enumOptionsSelectValue.js';
import enumOptionsValueForIndex from './enumOptionsValueForIndex.js';
import enumOptionValueDecoder from './enumOptionValueDecoder.js';
import enumOptionValueEncoder from './enumOptionValueEncoder.js';
import ErrorSchemaBuilder from './ErrorSchemaBuilder.js';
import findSchemaDefinition from './findSchemaDefinition.js';
import getChangedFields from './getChangedFields.js';
import type { DateElementFormat, DateElementProp } from './getDateElementProps.js';
import getDateElementProps from './getDateElementProps.js';
import getDecimalSeparator from './getDecimalSeparator.js';
import getDiscriminatorFieldFromSchema from './getDiscriminatorFieldFromSchema.js';
import getInputProps from './getInputProps.js';
import getOptionMatchingSimpleDiscriminator from './getOptionMatchingSimpleDiscriminator.js';
import getOptionValueFormat from './getOptionValueFormat.js';
import getPropertySchema from './getPropertySchema.js';
import getSchemaType from './getSchemaType.js';
import getSubmitButtonOptions from './getSubmitButtonOptions.js';
import getTemplate from './getTemplate.js';
import getTestIds from './getTestIds.js';
import getUiOptions from './getUiOptions.js';
import getWidget from './getWidget.js';
import guessType from './guessType.js';
import hashForSchema, { hashObject, hashString, sortedJSONStringify } from './hashForSchema.js';
import hasWidget from './hasWidget.js';
import {
  ariaDescribedByIds,
  buttonId,
  descriptionId,
  errorId,
  examplesId,
  helpId,
  optionalControlsId,
  optionId,
  titleId,
} from './idGenerators.js';
import isConstant from './isConstant.js';
import isCustomWidget from './isCustomWidget.js';
import isFixedItems from './isFixedItems.js';
import isFormDataAvailable from './isFormDataAvailable.js';
import isObject from './isObject.js';
import isPlainObject from './isPlainObject.js';
import isRootSchema from './isRootSchema.js';
import labelValue from './labelValue.js';
import localToUTC from './localToUTC.js';
import logUnsupportedDefaultForEnum from './logUnsupportedDefaultForEnum.js';
import lookupFromFormContext from './lookupFromFormContext.js';
import mergeDefaultsWithFormData from './mergeDefaultsWithFormData.js';
import mergeObjects from './mergeObjects.js';
import mergeSchemas from './mergeSchemas.js';
import { bracketNameGenerator, dotNotationNameGenerator } from './nameGenerators.js';
import noop from './noop.js';
import optionsList from './optionsList.js';
import orderProperties from './orderProperties.js';
import pad from './pad.js';
import parseDateString from './parseDateString.js';
import { getByPath, hasByPath, setByPath, toPath, unsetByPath } from './pathUtils.js';
import type { ObjectPath } from './pathUtils.js';
import rangeSpec from './rangeSpec.js';
import removeOptionalEmptyObjects from './removeOptionalEmptyObjects.js';
import replaceStringParameters from './replaceStringParameters.js';
import resolveUiSchema from './resolveUiSchema.js';
import schemaRequiresTrueValue from './schemaRequiresTrueValue.js';
import SelectedOptionDescription from './SelectedOptionDescription.js';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.js';
import shallowEquals from './shallowEquals.js';
import type { ComponentUpdateStrategy } from './shouldRender.js';
import shouldRender from './shouldRender.js';
import shouldRenderOptionalField from './shouldRenderOptionalField.js';
import toConstant from './toConstant.js';
import toDateString from './toDateString.js';
import toErrorList from './toErrorList.js';
import toErrorSchema from './toErrorSchema.js';
import toFieldPathId from './toFieldPathId.js';
import unwrapErrorHandler from './unwrapErrorHandler.js';
import type { DateElementProps, UseAltDateWidgetResult } from './useAltDateWidgetProps.js';
import useAltDateWidgetProps, { DateElement } from './useAltDateWidgetProps.js';
import useDeepCompareMemo from './useDeepCompareMemo.js';
import type { FileInfoType, UseFileWidgetPropsResult } from './useFileWidgetProps.js';
import useFileWidgetProps from './useFileWidgetProps.js';
import utcToLocal from './utcToLocal.js';
import validationDataMerge from './validationDataMerge.js';
import withIdRefPrefix from './withIdRefPrefix.js';

export type * from './types.js';
export * from './enums.js';

export * from './constants.js';
export * from './parser/index.js';
export * from './schema/index.js';

export type {
  ComponentUpdateStrategy,
  DateElementFormat,
  DateElementProp,
  DateElementProps,
  FileInfoType,
  ObjectPath,
  SelectedOptionDescriptionProps,
  UseAltDateWidgetResult,
  UseFileWidgetPropsResult,
};

export {
  allowAdditionalItems,
  ariaDescribedByIds,
  asNumber,
  buttonId,
  canExpand,
  createErrorHandler,
  createSchemaUtils,
  DateElement,
  dataURItoBlob,
  dateRangeOptions,
  deepEquals,
  descriptionId,
  englishStringTranslator,
  enumOptionSelectedValue,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsDeselectValue,
  enumOptionsIndexForValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  enumOptionsValueForIndex,
  errorId,
  examplesId,
  ErrorSchemaBuilder,
  findSchemaDefinition,
  getChangedFields,
  getDateElementProps,
  getDecimalSeparator,
  getDiscriminatorFieldFromSchema,
  getInputProps,
  getOptionMatchingSimpleDiscriminator,
  getPropertySchema,
  getOptionValueFormat,
  getSchemaType,
  getByPath,
  getSubmitButtonOptions,
  getTemplate,
  getTestIds,
  getUiOptions,
  getWidget,
  guessType,
  hasByPath,
  hasWidget,
  hashForSchema,
  hashObject,
  hashString,
  helpId,
  isConstant,
  isCustomWidget,
  isFixedItems,
  isFormDataAvailable,
  isObject,
  isPlainObject,
  isRootSchema,
  labelValue,
  localToUTC,
  logUnsupportedDefaultForEnum,
  lookupFromFormContext,
  mergeDefaultsWithFormData,
  mergeObjects,
  mergeSchemas,
  noop,
  optionalControlsId,
  optionId,
  optionsList,
  orderProperties,
  pad,
  parseDateString,
  rangeSpec,
  // oxlint-disable-next-line typescript/no-deprecated
  removeOptionalEmptyObjects,
  replaceStringParameters,
  resolveUiSchema,
  schemaRequiresTrueValue,
  setByPath,
  SelectedOptionDescription,
  shallowEquals,
  shouldRender,
  shouldRenderOptionalField,
  sortedJSONStringify,
  titleId,
  toConstant,
  toDateString,
  toErrorList,
  toErrorSchema,
  toFieldPathId,
  toPath,
  unsetByPath,
  unwrapErrorHandler,
  useAltDateWidgetProps,
  useDeepCompareMemo,
  useFileWidgetProps,
  utcToLocal,
  validationDataMerge,
  withIdRefPrefix,
  bracketNameGenerator,
  dotNotationNameGenerator,
};
