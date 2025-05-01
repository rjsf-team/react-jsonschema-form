import { createSchemaUtils, englishStringTranslator, WidgetProps, RJSFSchema } from '@rjsf/utils';
import { getDefaultRegistry } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import Templates from '../../src/templates/Templates';
import generateWidgets from '../../src/widgets/Widgets';

// Mock any problematic dependencies
// This helps when a dependency like nanoid uses ESM
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-12345',
}));

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
    widgets: generateWidgets(),
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
    formContext: {},
    id: 'test-id',
    name: 'test-name',
    placeholder: 'Enter value...',
    registry: mockRegistry(),
    ...props,
  };
}
