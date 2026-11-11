import type { RJSFSchema } from '@rjsf/utils';

/** The schema each widget needs in order to be the one that renders. Keyed by the name a widget is registered
 * under, which is also what `ui:widget` resolves against, so a theme adding a widget only has to add an entry here,
 * or, from outside this repo, hand one to `hideErrorTests()` or `presentationContractTests()` as its `fixtures` argument.
 */
export const WIDGET_FIXTURES: Record<string, RJSFSchema> = {
  AltDateTimeWidget: { type: 'string', format: 'date-time' },
  AltDateWidget: { type: 'string', format: 'date' },
  CheckboxWidget: { type: 'boolean' },
  CheckboxesWidget: { type: 'array', items: { type: 'string', enum: ['north', 'south'] }, uniqueItems: true },
  ColorWidget: { type: 'string', format: 'color' },
  DateTimeWidget: { type: 'string', format: 'date-time' },
  DateWidget: { type: 'string', format: 'date' },
  EmailWidget: { type: 'string', format: 'email' },
  FileWidget: { type: 'string', format: 'data-url' },
  HiddenWidget: { type: 'string' },
  NativeSelectWidget: { type: 'string', enum: ['primary', 'secondary'] },
  PasswordWidget: { type: 'string' },
  RadioWidget: { type: 'string', enum: ['gold', 'silver'] },
  RangeWidget: { type: 'number', minimum: 0, maximum: 10 },
  RatingWidget: { type: 'number', minimum: 0, maximum: 5 },
  SelectWidget: { type: 'string', enum: ['primary', 'secondary'] },
  TextareaWidget: { type: 'string' },
  TextWidget: { type: 'string' },
  TimeWidget: { type: 'string', format: 'time' },
  toggle: { type: 'boolean' },
  UpDownWidget: { type: 'number' },
  URLWidget: { type: 'string', format: 'uri' },
};
