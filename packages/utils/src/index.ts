import allowAdditionalItems from './allowAdditionalItems';
import asNumber, { isEmptyOrNaN } from './asNumber';
import canExpand from './canExpand';
import createErrorHandler from './createErrorHandler';
import createSchemaUtils from './createSchemaUtils';
import dataURItoBlob from './dataURItoBlob';
import {
  dateRangeOptions,
  localToUTC,
  parseDateString,
  toDateString,
  utcToLocal,
  getDateElementProps,
} from './dateUtils';
import type { DateElementFormat, DateElementProp } from './dateUtils';
import deepEquals from './deepEquals';
import englishStringTranslator from './englishStringTranslator';
import {
  enumOptionsDeselectValue,
  enumOptionSelectedValue,
  enumOptionsIndexForValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  enumOptionsValueForIndex,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
} from './enumOptions';
import ErrorSchemaBuilder from './ErrorSchemaBuilder';
import findSchemaDefinition from './findSchemaDefinition';
import getChangedFields from './getChangedFields';
import getDiscriminatorFieldFromSchema from './getDiscriminatorFieldFromSchema';
import getInputProps from './getInputProps';
import getOptionMatchingSimpleDiscriminator from './getOptionMatchingSimpleDiscriminator';
import getOptionValueFormat from './getOptionValueFormat';
import getSchemaType from './getSchemaType';
import getSubmitButtonOptions from './getSubmitButtonOptions';
import getTemplate from './getTemplate';
import getTestIds from './getTestIds';
import getUiOptions from './getUiOptions';
import getWidget from './getWidget';
import guessType from './guessType';
import hashForSchema, { hashObject } from './hashForSchema';
import hashString from './hashString';
import sortedJSONStringify from './sortedJSONStringify';
import hasWidget from './hasWidget';
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
} from './idGenerators';
import isConstant from './isConstant';
import isCustomWidget from './isCustomWidget';
import isFixedItems from './isFixedItems';
import isFormDataAvailable from './isFormDataAvailable';
import isObject from './isObject';
import isRootSchema from './isRootSchema';
import labelValue from './labelValue';
import logUnsupportedDefaultForEnum from './logUnsupportedDefaultForEnum';
import lookupFromFormContext from './lookupFromFormContext';
import mergeDefaultsWithFormData from './mergeDefaultsWithFormData';
import mergeObjects from './mergeObjects';
import mergeSchemas from './mergeSchemas';
import { bracketNameGenerator, dotNotationNameGenerator } from './nameGenerators';
import optionsList from './optionsList';
import orderProperties from './orderProperties';
import { pad } from './pad';
import zeroPadNumber from './zeroPadNumber';
import rangeSpec from './rangeSpec';
import removeOptionalEmptyObjects from './removeOptionalEmptyObjects';
import replaceStringParameters from './replaceStringParameters';
import resolveUiSchema from './resolveUiSchema';
import schemaRequiresTrueValue from './schemaRequiresTrueValue';
import shallowEquals from './shallowEquals';
import type { ComponentUpdateStrategy } from './shouldRender';
import shouldRender from './shouldRender';
import shouldRenderOptionalField from './shouldRenderOptionalField';
import toConstant from './toConstant';
import toErrorList from './toErrorList';
import toErrorSchema from './toErrorSchema';
import toFieldPathId from './toFieldPathId';
import unwrapErrorHandler from './unwrapErrorHandler';
import type { DateElementProps, UseAltDateWidgetResult } from './useAltDateWidgetProps';
import useAltDateWidgetProps, { DateElement } from './useAltDateWidgetProps';
import useDeepCompareMemo from './useDeepCompareMemo';
import type { FileInfoType, UseFileWidgetPropsResult } from './useFileWidgetProps';
import useFileWidgetProps from './useFileWidgetProps';
import validationDataMerge from './validationDataMerge';
import withIdRefPrefix from './withIdRefPrefix';

export type * from './types';
export * from './enums';

export * from './constants';
export * from './parser';
export * from './schema';

export type {
  ComponentUpdateStrategy,
  DateElementFormat,
  DateElementProp,
  DateElementProps,
  FileInfoType,
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
  getDiscriminatorFieldFromSchema,
  getInputProps,
  getOptionMatchingSimpleDiscriminator,
  getOptionValueFormat,
  getSchemaType,
  getSubmitButtonOptions,
  getTemplate,
  getTestIds,
  getUiOptions,
  getWidget,
  guessType,
  hasWidget,
  isEmptyOrNaN,
  hashForSchema,
  hashObject,
  hashString,
  helpId,
  isConstant,
  isCustomWidget,
  isFixedItems,
  isFormDataAvailable,
  isObject,
  isRootSchema,
  labelValue,
  localToUTC,
  logUnsupportedDefaultForEnum,
  lookupFromFormContext,
  mergeDefaultsWithFormData,
  mergeObjects,
  mergeSchemas,
  optionalControlsId,
  optionId,
  optionsList,
  orderProperties,
  pad,
  parseDateString,
  zeroPadNumber,
  rangeSpec,
  // oxlint-disable-next-line typescript/no-deprecated
  removeOptionalEmptyObjects,
  replaceStringParameters,
  resolveUiSchema,
  schemaRequiresTrueValue,
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
