# Validation

## Form data validation

### Live validation

### HTML5 Validation


### Custom validation



### Custom schema validation

To have your schemas validated against any other meta schema than draft-07 (the current version of [JSON Schema](http://json-schema.org/)), make sure your schema has a `$schema` attribute that enables the validator to use the correct meta schema. For example:

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  ...
}
```

Note that react-jsonschema-form only supports the latest version of JSON Schema, draft-07, by default. To support additional meta schemas pass them through the `additionalMetaSchemas` prop to the `Form` component.

### Custom error messages



### Error List Display



### The case of empty strings

When a text input is empty, the field in form data is set to `undefined`. String fields that use `enum` and a `select` widget will have an empty option at the top of the options list that when selected will result in the field being `undefined`.

One consequence of this is that if you have an empty string in your `enum` array, selecting that option in the `select` input will cause the field to be set to `undefined`, not an empty string.

If you want to have the field set to a default value when empty you can provide a `ui:emptyValue` field in the `uiSchema` object.
