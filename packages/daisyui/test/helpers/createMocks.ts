import { getTestRegistry } from '@rjsf/core';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';

import Templates from '../../src/templates/Templates.tsx';
import { generateWidgets } from '../../src/widgets/Widgets.tsx';

const mockSchema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
  },
};

const mockEventHandlers = (): void => undefined;

function mockRegistry() {
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
