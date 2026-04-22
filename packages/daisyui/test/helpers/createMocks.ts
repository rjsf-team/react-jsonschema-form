import { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { getTestRegistry } from '@rjsf/core';

import Templates from '../../src/templates/Templates';
import generateWidgets from '../../src/widgets/Widgets';

export const mockSchema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

export const mockEventHandlers = (): void => void 0;

export function mockRegistry() {
  return getTestRegistry({ templates: Templates, rootSchema: mockSchema, widgets: generateWidgets() });
}

export function makeWidgetMockProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    uiSchema: {},
    schema: mockSchema,
    required: true,
    disabled: false,
    readonly: false,
    autofocus: true,
    label: 'Sample Field Label',
    onChange: mockEventHandlers,
    onBlur: mockEventHandlers,
    onFocus: mockEventHandlers,
    multiple: false,
    rawErrors: [''],
    value: 'test-value',
    options: {},
    id: 'test-id',
    name: 'test-name',
    placeholder: 'Enter value...',
    registry: mockRegistry(),
    ...props,
  };
}
