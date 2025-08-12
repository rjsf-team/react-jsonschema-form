# Dynamic uiSchema Examples

## Backward Compatibility Examples

### Example 1: Traditional Static uiSchema (No Changes Required)

```typescript
import { UiSchema } from '@rjsf/utils';

// This continues to work exactly as before
const uiSchema: UiSchema = {
  guests: {
    items: {
      name: { 'ui:placeholder': 'Enter guest name' },
      age: { 'ui:widget': 'updown' },
      relationship: { 'ui:widget': 'select' },
    },
  },
};
```

### Example 2: Dynamic uiSchema with Function

```typescript
import { UiSchema, FormContextType } from '@rjsf/utils';

interface GuestData {
  name?: string;
  age?: number;
  relationship?: 'child' | 'adult' | 'senior';
  guardianName?: string;
  mealPreference?: string;
}

// New functionality - dynamic UI based on item data
const uiSchema: UiSchema = {
  guests: {
    items: (itemData: GuestData | undefined, index: number, formContext?: FormContextType): UiSchema => {
      // Note: For newly added items, `itemData` will be undefined or contain default values.
      // Using optional chaining (`?.`) is recommended to handle this case gracefully.

      // Base UI schema for all items
      const baseUiSchema: UiSchema = {
        name: { 'ui:placeholder': `Guest ${index + 1} name` },
        relationship: { 'ui:widget': 'select' },
      };

      // Conditionally modify UI based on data
      if (itemData?.relationship === 'child') {
        return {
          ...baseUiSchema,
          age: {
            'ui:widget': 'updown',
            'ui:help': 'Age is required for children',
            'ui:options': { min: 0, max: 17 },
          },
          guardianName: {
            'ui:placeholder': 'Parent/Guardian name',
          },
          mealPreference: { 'ui:widget': 'hidden' },
        };
      }

      if (itemData?.relationship === 'adult') {
        return {
          ...baseUiSchema,
          age: { 'ui:widget': 'hidden' },
          guardianName: { 'ui:widget': 'hidden' },
          mealPreference: {
            'ui:widget': 'select',
            'ui:placeholder': 'Select meal preference',
          },
        };
      }

      // Default for new items or unknown relationships
      return baseUiSchema;
    },
  },
};
```

### Example 3: Using Form Context

```typescript
import { UiSchema, FormContextType } from '@rjsf/utils';

interface ParticipantData {
  name?: string;
  email?: string;
  workshop?: string;
}

interface MyFormContext extends FormContextType {
  eventType?: 'conference' | 'workshop' | 'webinar';
}

const uiSchema: UiSchema<any, any, MyFormContext> = {
  participants: {
    items: (itemData: ParticipantData | undefined, index: number, formContext?: MyFormContext): UiSchema => {
      // Access form-wide settings
      const isConference = formContext?.eventType === 'conference';

      return {
        name: { 'ui:placeholder': 'Participant name' },
        email: { 'ui:widget': 'email' },
        // Show workshop selection only for conference events
        workshop: isConference ? { 'ui:widget': 'select' } : { 'ui:widget': 'hidden' },
      };
    },
  },
};
```

### Example 4: Falsy Return Values

```typescript
import { UiSchema, FormContextType } from '@rjsf/utils';

interface ItemData {
  needsCustomUI?: boolean;
  field1?: string;
  field2?: string;
}

const uiSchema: UiSchema = {
  items: {
    items: (itemData: ItemData | undefined, index: number): UiSchema | null | undefined => {
      // Only apply custom UI to specific items
      if (itemData?.needsCustomUI) {
        return {
          field1: { 'ui:widget': 'textarea' },
          field2: { 'ui:help': 'This item needs special attention' },
        };
      }

      // Return null or undefined to use default UI rendering
      // This is useful for conditionally applying custom UI
      return null;
    },
  },
};
```

### Example 5: Dynamic UI for Fixed Arrays

For fixed/tuple arrays (where schema.items is an array), the dynamic function can be applied to each position:

```typescript
import { RJSFSchema, UiSchema } from '@rjsf/utils';

interface DetailsData {
  age?: number;
  role?: string;
}

const schema: RJSFSchema = {
  type: 'array',
  items: [
    { type: 'string', title: 'First Name' },
    { type: 'string', title: 'Last Name' },
    { type: 'object', title: 'Details', properties: { age: { type: 'number' }, role: { type: 'string' } } },
  ],
};

const uiSchema: UiSchema = {
  items: [
    { 'ui:placeholder': 'Enter first name' }, // Static UI for first item
    { 'ui:placeholder': 'Enter last name' }, // Static UI for second item
    // Dynamic UI for third item based on its data
    (itemData: DetailsData | undefined, index: number): UiSchema => {
      if (itemData?.role === 'admin') {
        return {
          age: { 'ui:widget': 'hidden' },
          role: { 'ui:help': 'Admin role selected' },
        };
      }
      return {
        age: { 'ui:widget': 'updown' },
        role: { 'ui:widget': 'select' },
      };
    },
  ],
};
```

## Schema Example

```typescript
import { RJSFSchema } from '@rjsf/utils';

const schema: RJSFSchema = {
  type: 'object',
  properties: {
    guests: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
          age: { type: 'number', title: 'Age' },
          relationship: {
            type: 'string',
            title: 'Relationship',
            enum: ['adult', 'child', 'senior'],
          },
          guardianName: { type: 'string', title: 'Guardian Name' },
          mealPreference: {
            type: 'string',
            title: 'Meal Preference',
            enum: ['vegetarian', 'vegan', 'standard', 'gluten-free'],
          },
        },
        required: ['name', 'relationship'],
      },
    },
  },
};
```

## Key Benefits

1. **Backward Compatible**: Existing forms with object-based `uiSchema.items` continue to work without any changes
2. **Progressive Enhancement**: Developers can opt-in to dynamic behavior when needed
3. **Flexible**: Access to item data, index, and form context enables complex UI logic
4. **Safe**: Built-in error handling prevents the entire form from crashing if your function throws an error. When an error occurs for a specific item, it will be caught and logged to the developer console, and the UI for that item will fall back to the default rendering. This ensures the rest of the form remains functional while making debugging easier.
5. **On-Demand Execution**: The function is executed on-demand during the render cycle. However, as it runs for each array item, performance should be carefully managed for large lists (see Performance Considerations below).

## Key Behaviors

- **Falsy Returns**: If your function returns a falsy value (e.g., `null` or `undefined`), the UI for that specific item will fall back to its default rendering. This allows you to conditionally apply custom UI only when needed.
- **Error Handling**: If your function throws an error, it will be caught and logged to the console. The form will continue to work, using default UI for the affected item.
- **New Items**: When a new item is added to the array, `itemData` will be `undefined` or contain default values from the schema. Always use optional chaining (`?.`) to safely access properties.

## Performance Considerations

When using dynamic `uiSchema.items` functions, keep in mind:

- The function is executed **on every render** for **each array item**
- For large arrays, this can impact performance if the function performs expensive operations
- Best practices:
  - Keep the function logic lightweight and fast
  - Avoid heavy computations or external API calls within the function
  - Consider memoizing results if the same inputs produce the same outputs
  - For complex logic, pre-compute values and store them in formContext or component state

Example of a performance-optimized approach:

```typescript
import React, { useMemo } from 'react';
import Form from '@rjsf/core';
import { RJSFSchema, UiSchema, FormContextType, IChangeEvent } from '@rjsf/utils';

interface ItemData {
  type?: string;
  field?: any;
}

interface ExpensiveDataConfig {
  widget: string;
}

interface MyFormProps {
  schema: RJSFSchema;
  formData?: any;
}

// In your React component that renders the form:
function MyFormComponent({ schema, formData }: PropsWithChildren<MyFormProps>) {
  // Pre-compute expensive data once, and only re-compute if dependencies change
  const expensiveData = useMemo<Record<string, ExpensiveDataConfig>>(() => computeExpensiveData(), [/* dependencies */]);

  const defaultConfig: ExpensiveDataConfig = { widget: 'text' };

  // Define the uiSchema inside the component so it can access the memoized data
  const uiSchema: UiSchema = {
    myArrayField: { // Target your specific array field
      items: (itemData: ItemData | undefined, index: number, formContext?: FormContextType): UiSchema => {
        // Use the pre-computed data - this is very fast
        const config = expensiveData[itemData?.type || ''] || defaultConfig;

        return {
          field: { 'ui:widget': config.widget }
        };
      }
    }
  };

  return <Form schema={schema} uiSchema={uiSchema} formData={formData} />;
};

// Placeholder for the expensive computation function
declare function computeExpensiveData(): Record<string, ExpensiveDataConfig>;
```
