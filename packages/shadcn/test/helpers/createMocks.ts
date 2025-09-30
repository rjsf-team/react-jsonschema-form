import { createSchemaUtils, englishStringTranslator, WidgetProps, RJSFSchema } from '@rjsf/utils';
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
    formContext: {},
    id: '_id',
    name: '_name',
    placeholder: '',
    registry: mockRegistry(),
    ...props,
  };
}
