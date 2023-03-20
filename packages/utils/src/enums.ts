/** An enumeration of all the translatable strings used by `@rjsf/core` and its themes. The value of each of the
 * enumeration keys is expected to be the actual english string. Some strings contain replaceable parameter values
 * as indicated by `%1`, `%2`, etc. The number after the `%` indicates the order of the parameter. The ordering of
 * parameters is important because some languages may choose to put the second parameter before the first in its
 * translation. Also, some strings are rendered using `markdown-to-jsx` and thus support markdown and inline html.
 */
export enum TranslatableString {
  /** Fallback title of an array item, used by ArrayField */
  ArrayItemTitle = 'Item',
  /** Missing items reason, used by ArrayField */
  MissingItems = 'Missing items definition',
  /** Yes label, used by BooleanField */
  YesLabel = 'Yes',
  /** No label, used by BooleanField */
  NoLabel = 'No',
  /** Close label, used by ErrorList */
  CloseLabel = 'Close',
  /** Errors label, used by ErrorList */
  ErrorsLabel = 'Errors',
  /** New additionalProperties string default value, used by ObjectField */
  NewStringDefault = 'New Value',
  /** Add button title, used by AddButton */
  AddButton = 'Add',
  /** Add button title, used by AddButton */
  AddItemButton = 'Add Item',
  /** Copy button title, used by IconButton */
  CopyButton = 'Copy',
  /** Move down button title, used by IconButton */
  MoveDownButton = 'Move down',
  /** Move up button title, used by IconButton */
  MoveUpButton = 'Move up',
  /** Remove button title, used by IconButton */
  RemoveButton = 'Remove',
  /** Now label, used by AltDateWidget */
  NowLabel = 'Now',
  /** Clear label, used by AltDateWidget */
  ClearLabel = 'Clear',
  /** Aria date label, used by DateWidget */
  AriaDateLabel = 'Select a date',
  /** File preview label, used by FileWidget */
  PreviewLabel = 'Preview',
  /** Decrement button aria label, used by UpDownWidget */
  DecrementAriaLabel = 'Decrease value by 1',
  /** Increment button aria label, used by UpDownWidget */
  IncrementAriaLabel = 'Increase value by 1',
  // Strings with replaceable parameters
  /** Unknown field type reason, where %1 will be replaced with the type as provided by SchemaField */
  UnknownFieldType = 'Unknown field type %1',
  /** Option prefix, where %1 will be replaced with the option index as provided by MultiSchemaField */
  OptionPrefix = 'Option %1',
  /** Option prefix, where %1 and %2 will be replaced by the schema title and option index, respectively as provided by
   * MultiSchemaField
   */
  TitleOptionPrefix = '%1 option %2',
  /** Key label, where %1 will be replaced by the label as provided by WrapIfAdditionalTemplate */
  KeyLabel = '%1 Key',
  // Strings with replaceable parameters AND/OR that support markdown and html
  /** Invalid object field configuration as provided by the ObjectField */
  InvalidObjectField = 'Invalid "%1" object field configuration: <em>%2</em>.',
  /** Unsupported field schema, used by UnsupportedField */
  UnsupportedField = 'Unsupported field schema.',
  /** Unsupported field schema, where %1 will be replaced by the idSchema.$id as provided by UnsupportedField */
  UnsupportedFieldWithId = 'Unsupported field schema for field <code>%1</code>.',
  /** Unsupported field schema, where %1 will be replaced by the reason string as provided by UnsupportedField */
  UnsupportedFieldWithReason = 'Unsupported field schema: <em>%1</em>.',
  /** Unsupported field schema, where %1 and %2 will be replaced by the idSchema.$id and reason strings, respectively,
   * as provided by UnsupportedField
   */
  UnsupportedFieldWithIdAndReason = 'Unsupported field schema for field <code>%1</code>: <em>%2</em>.',
  /** File name, type and size info, where %1, %2 and %3 will be replaced by the file name, file type and file size as
   * provided by FileWidget
   */
  FilesInfo = '<strong>%1</strong> (%2, %3 bytes)',
}
