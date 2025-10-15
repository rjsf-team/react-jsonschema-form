import {
  createSchemaUtils,
  englishStringTranslator,
  WidgetProps,
  RJSFSchema,
  DEFAULT_ID_SEPARATOR,
  DEFAULT_ID_PREFIX,
} from '@rjsf/utils';
import { getDefaultRegistry } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import Templates from '../../src/Templates';
import BaseInputTemplate from '../../src/BaseInputTemplate';

export const mockSchema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

export const mockEventHandlers = (): void => void 0;

export const mockSchemaUtils = createSchemaUtils(validator, mockSchema);

export function mockRegistry() {
  return {
    fields: {},
    widgets: { TextWidget: BaseInputTemplate },
    templates: { ...getDefaultRegistry().templates, ...Templates },
    formContext: {},
    rootSchema: {},
    schemaUtils: mockSchemaUtils,
    translateString: englishStringTranslator,
    globalFormOptions: { idPrefix: DEFAULT_ID_PREFIX, idSeparator: DEFAULT_ID_SEPARATOR },
  };
}

export function makeWidgetMockProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    uiSchema: {},
    schema: mockSchema,
    required: true,
    disabled: false,
    readonly: true,
    autofocus: true,
    label: 'Some simple label',
    onChange: mockEventHandlers,
    onBlur: mockEventHandlers,
    onFocus: mockEventHandlers,
    multiple: false,
    rawErrors: [''],
    value: 'value',
    options: {},
    id: '_id',
    name: '_name',
    placeholder: '',
    registry: mockRegistry(),
    ...props,
  };
}
