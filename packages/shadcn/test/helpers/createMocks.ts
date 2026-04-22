import { WidgetProps, RJSFSchema } from '@rjsf/utils';
import { getTestRegistry } from '@rjsf/core';

import Templates from '../../src/Templates';
import BaseInputTemplate from '../../src/BaseInputTemplate';

export const mockSchema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

export const mockEventHandlers = (): void => void 0;

export function mockRegistry() {
  return getTestRegistry({ templates: Templates, rootSchema: mockSchema, widgets: { TextWidget: BaseInputTemplate } });
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
