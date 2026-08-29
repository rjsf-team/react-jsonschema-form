import findFieldInSchema from './findFieldInSchema.js';
import findSelectedOptionInXxxOf from './findSelectedOptionInXxxOf.js';
import getClosestMatchingOption from './getClosestMatchingOption.js';
import getDefaultFormState from './getDefaultFormState.js';
import getDisplayLabel from './getDisplayLabel.js';
import getFirstMatchingOption from './getFirstMatchingOption.js';
import getFromSchema from './getFromSchema.js';
import isFilesArray from './isFilesArray.js';
import isMultiSelect from './isMultiSelect.js';
import isSelect from './isSelect.js';
import omitExtraData, { getUsedFormData, getFieldNames, isValueEmpty } from './omitExtraData.js';
import retrieveSchema, { relaxOptionsForScoring } from './retrieveSchema.js';
import sanitizeDataForNewSchema from './sanitizeDataForNewSchema.js';
import toPathSchema from './toPathSchema.js';

export {
  findFieldInSchema,
  findSelectedOptionInXxxOf,
  getDefaultFormState,
  getDisplayLabel,
  // oxlint-disable-next-line typescript/no-deprecated
  getFieldNames, // Exported only to prevent breaking change in core
  getClosestMatchingOption,
  getFirstMatchingOption,
  getFromSchema,
  // oxlint-disable-next-line typescript/no-deprecated
  getUsedFormData, // Exported only to prevent breaking change in core
  isFilesArray,
  isMultiSelect,
  isSelect,
  isValueEmpty,
  omitExtraData,
  relaxOptionsForScoring,
  retrieveSchema,
  sanitizeDataForNewSchema,
  // oxlint-disable-next-line typescript/no-deprecated
  toPathSchema,
};
