import allowAdditionalItems from './allowAdditionalItems.ts';
import asNumber from './asNumber.ts';
import canExpand from './canExpand.ts';
import createErrorHandler from './createErrorHandler.ts';
import createSchemaUtils from './createSchemaUtils.ts';
import dataURItoBlob from './dataURItoBlob.ts';
import dateRangeOptions from './dateRangeOptions.ts';
import deepEquals from './deepEquals.ts';
import englishStringTranslator from './englishStringTranslator.ts';
import enumOptionsDeselectValue from './enumOptionsDeselectValue.ts';
import enumOptionSelectedValue from './enumOptionSelectedValue.ts';
import enumOptionsIndexForValue from './enumOptionsIndexForValue.ts';
import enumOptionsIsSelected from './enumOptionsIsSelected.ts';
import enumOptionsSelectValue from './enumOptionsSelectValue.ts';
import enumOptionsValueForIndex from './enumOptionsValueForIndex.ts';
import enumOptionValueDecoder from './enumOptionValueDecoder.ts';
import enumOptionValueEncoder from './enumOptionValueEncoder.ts';
import ErrorSchemaBuilder from './ErrorSchemaBuilder.ts';
import findSchemaDefinition from './findSchemaDefinition.ts';
import getChangedFields from './getChangedFields.ts';
import type { DateElementFormat, DateElementProp } from './getDateElementProps.ts';
import getDateElementProps from './getDateElementProps.ts';
import getDecimalSeparator from './getDecimalSeparator.ts';
import getDiscriminatorFieldFromSchema from './getDiscriminatorFieldFromSchema.ts';
import getInputProps from './getInputProps.ts';
import getOptionMatchingSimpleDiscriminator from './getOptionMatchingSimpleDiscriminator.ts';
import getOptionValueFormat from './getOptionValueFormat.ts';
import getPropertySchema from './getPropertySchema.ts';
import getSchemaType from './getSchemaType.ts';
import getSubmitButtonOptions from './getSubmitButtonOptions.ts';
import getTemplate from './getTemplate.ts';
import getTestIds from './getTestIds.ts';
import getUiOptions from './getUiOptions.ts';
import getWidget from './getWidget.tsx';
import guessType from './guessType.ts';
import hashForSchema, { hashObject, hashString, sortedJSONStringify } from './hashForSchema.ts';
import hasWidget from './hasWidget.ts';
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
} from './idGenerators.ts';
import isConstant from './isConstant.ts';
import isCustomWidget from './isCustomWidget.ts';
import isFixedItems from './isFixedItems.ts';
import isFormDataAvailable from './isFormDataAvailable.ts';
import isObject from './isObject.ts';
import isPlainObject from './isPlainObject.ts';
import isRootSchema from './isRootSchema.ts';
import labelValue from './labelValue.ts';
import localToUTC from './localToUTC.ts';
import logUnsupportedDefaultForEnum from './logUnsupportedDefaultForEnum.ts';
import lookupFromFormContext from './lookupFromFormContext.ts';
import mergeDefaultsWithFormData from './mergeDefaultsWithFormData.ts';
import mergeObjects from './mergeObjects.ts';
import mergeSchemas from './mergeSchemas.ts';
import { bracketNameGenerator, dotNotationNameGenerator } from './nameGenerators.ts';
import noop from './noop.ts';
import optionsList from './optionsList.ts';
import orderProperties from './orderProperties.ts';
import pad from './pad.ts';
import parseDateString from './parseDateString.ts';
import { getByPath, hasByPath, setByPath, toPath, unsetByPath } from './pathUtils.ts';
import type { ObjectPath } from './pathUtils.ts';
import rangeSpec from './rangeSpec.ts';
import removeOptionalEmptyObjects from './removeOptionalEmptyObjects.ts';
import replaceStringParameters from './replaceStringParameters.ts';
import resolveUiSchema from './resolveUiSchema.ts';
import schemaRequiresTrueValue from './schemaRequiresTrueValue.ts';
import SelectedOptionDescription from './SelectedOptionDescription.tsx';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import shallowEquals from './shallowEquals.ts';
import type { ComponentUpdateStrategy } from './shouldRender.ts';
import shouldRender from './shouldRender.ts';
import shouldRenderOptionalField from './shouldRenderOptionalField.ts';
import toConstant from './toConstant.ts';
import toDateString from './toDateString.ts';
import toErrorList from './toErrorList.ts';
import toErrorSchema from './toErrorSchema.ts';
import toFieldPathId from './toFieldPathId.ts';
import unwrapErrorHandler from './unwrapErrorHandler.ts';
import type { DateElementProps, UseAltDateWidgetResult } from './useAltDateWidgetProps.tsx';
import useAltDateWidgetProps, { DateElement } from './useAltDateWidgetProps.tsx';
import useDeepCompareMemo from './useDeepCompareMemo.ts';
import type { FileInfoType, UseFileWidgetPropsResult } from './useFileWidgetProps.ts';
import useFileWidgetProps from './useFileWidgetProps.ts';
import utcToLocal from './utcToLocal.ts';
import validationDataMerge from './validationDataMerge.ts';
import withIdRefPrefix from './withIdRefPrefix.ts';

export type * from './types.ts';
export * from './enums.ts';

export * from './constants.ts';
export * from './parser/index.ts';
export * from './schema/index.ts';

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
