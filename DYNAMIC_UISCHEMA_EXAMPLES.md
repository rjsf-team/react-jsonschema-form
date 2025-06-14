# Dynamic uiSchema Examples

## Backward Compatibility Examples

### Example 1: Traditional Static uiSchema (No Changes Required)

```javascript
// This continues to work exactly as before
const uiSchema = {
  guests: {
    items: {
      name: { 'ui:placeholder': 'Enter guest name' },
      age: { 'ui:widget': 'updown' },
      relationship: { 'ui:widget': 'select' }
    }
  }
};
```

### Example 2: Dynamic uiSchema with Function

```javascript
// New functionality - dynamic UI based on item data
const uiSchema = {
  guests: {
    items: (itemData, index, formContext) => {
      // Base UI schema for all items
      const baseUiSchema = {
        name: { 'ui:placeholder': `Guest ${index + 1} name` },
        relationship: { 'ui:widget': 'select' }
      };
      
      // Conditionally modify UI based on data
      if (itemData?.relationship === 'child') {
        return {
          ...baseUiSchema,
          age: { 
            'ui:widget': 'updown',
            'ui:help': 'Age is required for children',
            'ui:options': { min: 0, max: 17 }
          },
          guardianName: {
            'ui:placeholder': 'Parent/Guardian name'
          },
          mealPreference: { 'ui:widget': 'hidden' }
        };
      }
      
      if (itemData?.relationship === 'adult') {
        return {
          ...baseUiSchema,
          age: { 'ui:widget': 'hidden' },
          guardianName: { 'ui:widget': 'hidden' },
          mealPreference: { 
            'ui:widget': 'select',
            'ui:placeholder': 'Select meal preference'
          }
        };
      }
      
      // Default for new items or unknown relationships
      return baseUiSchema;
    }
  }
};
```

### Example 3: Using Form Context

```javascript
const uiSchema = {
  participants: {
    items: (itemData, index, formContext) => {
      // Access form-wide settings
      const isConference = formContext?.eventType === 'conference';
      
      return {
        name: { 'ui:placeholder': 'Participant name' },
        email: { 'ui:widget': 'email' },
        // Show workshop selection only for conference events
        workshop: isConference 
          ? { 'ui:widget': 'select' } 
          : { 'ui:widget': 'hidden' }
      };
    }
  }
};
```

## Schema Example

```javascript
const schema = {
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
            enum: ['adult', 'child', 'senior']
          },
          guardianName: { type: 'string', title: 'Guardian Name' },
          mealPreference: { 
            type: 'string', 
            title: 'Meal Preference',
            enum: ['vegetarian', 'vegan', 'standard', 'gluten-free']
          }
        },
        required: ['name', 'relationship']
      }
    }
  }
};
```

## Key Benefits

1. **Backward Compatible**: Existing forms with object-based `uiSchema.items` continue to work without any changes
2. **Progressive Enhancement**: Developers can opt-in to dynamic behavior when needed
3. **Flexible**: Access to item data, index, and form context enables complex UI logic
4. **Safe**: Built-in error handling prevents crashes if the function throws an error
5. **Performant**: Function is called only when rendering, same as existing custom field solutions