# uiSchema
JSON Schema is limited for describing how a given data type should be rendered as a form input component. That's why this library introduces the concept of uiSchema.

A UI schema is basically an object literal providing information on **how** the form should be rendered, while the JSON schema tells **what**.

The uiSchema object follows the tree structure of the form field hierarchy, and defines how each property should be rendered.

Note that every property within uiSchema can be rendered in one of two ways: `{"ui:options": {[property]: [value]}}`, or `{"ui:[property]": value}`.

In other words, the following uiSchemas are equivalent:

```json
{
  "ui:title": "Title",
  "ui:description": "Description",
  "ui:submitButtonOptions": {
    "props": {
      "disabled": false,
      "className": "btn btn-info",
    },
      "norender": false,
      "submitText": "Submit"
    },
}
```

```json
{
  "ui:options": {
    "title": "Title",
    "description": "Description",
    "submitButtonOptions": {
      "props": {
        "disabled": false,
        "className": "btn btn-info",
      },
      "norender": false,
      "submitText": "Submit"
    },
  }
}
```

## classNames

The uiSchema object accepts a `classNames` property for each field of the schema:

```jsx
const uiSchema = {
  title: {
    classNames: "task-title foo-bar"
  }
};
```

Will result in:

```html
<div class="field field-string task-title foo-bar" >
  <label>
    <span>Title*</span>
    <input value="My task" required="" type="text">
  </label>
</div>
```

## autofocus

If you want to automatically focus on a text input or textarea input, set the `ui:autofocus` uiSchema directive to `true`.

```js
const schema = {type: "string"};
const uiSchema = {
  "ui:widget": "textarea",
  "ui:autofocus": true
}
```

## description

Sometimes it's convenient to change the description of a field. This is the purpose of the `ui:description` uiSchema directive:

```js
const schema = {type: "string"};
const uiSchema = {
  "ui:widget": "password",
  "ui:description": "The best password"
};
```

## disabled

The `ui:disabled` uiSchema directive will disable all child widgets from a given field.

> Note: If you're wondering about the difference between a `disabled` field and a `readonly` one: Marking a field as read-only will render it greyed out, but its text value will be selectable. Disabling it will prevent its value to be selected at all.

## enumDisabled

To disable an option, use the `enumDisabled` property in uiSchema.

```js
const schema = {
  type: "string",
  enum: ["one", "two", "three"],
};

const uiSchema={
  "ui:enumDisabled": ['two'],
}
```

## help

Sometimes it's convenient to add text next to a field to guide the end user filling it. This is the purpose of the `ui:help` uiSchema directive:

```js
const schema = {type: "string"};
const uiSchema = {
  "ui:widget": "password",
  "ui:help": "Hint: Make it strong!"
};
```

![](https://i.imgur.com/scJUuZo.png)

Help texts work for any kind of field at any level, and will always be rendered immediately below the field component widget(s) (after contextualized errors, if any).

## hideError

The `ui:hideError` uiSchema directive will, if set to `true`, hide the default error display for the given field AND all of its child fields in the hierarchy.

If you need to enable the default error display of a child in the hierarchy after setting `hideError: true` on the parent field, simply set `hideError: false` on the child.

This is useful when you have a custom field or widget that utilizes either the `rawErrors` or the `errorSchema` to manipulate and/or show the error(s) for the field/widget itself.

## inputType

To change the input type (for example, `tel` or `email`) you can specify the `inputType` in the `ui:options` uiSchema directive.

```jsx
const schema = {type: "string"};
const uiSchema = {
  "ui:options": {
    inputType: 'tel'
  }
};
```

## label

Field labels are rendered by default. Labels may be omitted by setting the `label` option to `false` in the `ui:options` uiSchema directive.

```jsx
const schema = {type: "string"};
const uiSchema = {
  "ui:options": {
    label: false
  }
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

## order

This property allows you to reorder the properties that are shown for a particular object. See [Objects](../usage/objects.md) for more information.

## placeholder

You can add placeholder text to an input by using the `ui:placeholder` uiSchema directive:

```jsx
const schema = {type: "string", format: "uri"};
const uiSchema = {
  "ui:placeholder": "http://"
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

Fields using `enum` can also use `ui:placeholder`. The value will be used as the text for the empty option in the select widget.

```jsx
const schema = {type: "string", enum: ["First", "Second"]};
const uiSchema = {
  "ui:placeholder": "Choose an option"
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

## readonly

The `ui:readonly` uiSchema directive will mark all child widgets from a given field as read-only. This is equivalent to setting the `readOnly` property in the schema.

> Note: If you're wondering about the difference between a `disabled` field and a `readonly` one: Marking a field as read-only will render it greyed out, but its text value will be selectable. Disabling it will prevent its value to be selected at all.

## rootFieldId

By default, this library will generate ids unique to the form for all rendered widgets. If you plan on using multiple instances of the `Form` component in a same page, it's wise to declare a root prefix for these, using the `ui:rootFieldId` uiSchema directive:

```js
const uiSchema = {
  "ui:rootFieldId": "myform"
};
```

This will make all widgets have an id prefixed with `myform`.

## rows

You can set the initial height of a textarea widget by specifying `rows` option.

```js
const schema = {type: "string"};
const uiSchema = {
  "ui:widget": "textarea",
  "ui:options": {
    rows: 15
  }
};

render((
  <Form schema={schema} uiSchema={uiSchema} />
), document.getElementById("app"));
```

## title

Sometimes it's convenient to change a field's title. This is the purpose of the `ui:title` uiSchema directive:

```js
const schema = {type: "string"};
const uiSchema = {
  "ui:widget": "password",
  "ui:title": "Your password"
};
```

## submitButtonOptions

Sometimes it's convenient to change the behavior of the submit button for the form. This is the purpose of the `ui:submitButtonOptions` uiSchema directive:

You can pass any other prop to the submit button if you want, by default, this library will set the following options / props mentioned below for all submit buttons:

### `norender` option

You can set this property to `true` to remove the submit button completely from the form. Nice option, if the form is just for viewing purposes.

### `submitText` option

You can use this option to change the text of the submit button. Set to "Submit" by default.

### `props` section

You can pass any other prop to the submit button if you want, via this section.


####  `disabled` prop

You can use this option to disable the submit button.

#### `className` prop

You can use this option to specify a class name for the submit button.

```js
const uiSchema = {
 "ui:submitButtonOptions": {
   "props": {
      "disabled": false,
      "className": "btn btn-info",
   },
    "norender": false,
    "submitText": "Submit"
  }
};
```
## Theme Options
[Semantic UI](themes/semantic-ui/uiSchema.md)
[Chakra UI](themes/chakra-ui/uiSchema.md)
