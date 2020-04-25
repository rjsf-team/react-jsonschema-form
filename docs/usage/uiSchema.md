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

## ui:autofocus

If you want to automatically focus on a text input or textarea input, set the `ui:autofocus` uiSchema directive to `true`.

```js
const schema = {type: "string"};
const uiSchema = {
  "ui:widget": "textarea",
  "ui:autofocus": true
}
```

## ui:description

Sometimes it's convenient to change the description of a field. This is the purpose of the `ui:description` uiSchema directive:

```js
const schema = {type: "string"};
const uiSchema = {
  "ui:widget": "password",
  "ui:description": "The best password"
};
```

## ui:disabled

The `ui:disabled` uiSchema directive will disable all child widgets from a given field.

> Note: If you're wondering about the difference between a `disabled` field and a `readonly` one: Marking a field as read-only will render it greyed out, but its text value will be selectable. Disabling it will prevent its value to be selected at all.

## ui:enumDisabled

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

This will be rendered using a select box as follows:

```html
<select>
  <option value="one">one</option>
  <option value="two" disabled>two</option>
  <option value="three">three</option>
</select>
```

## ui:help

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

## ui:order

Since the order of object properties in Javascript and JSON is not guaranteed, the `uiSchema` object spec allows you to define the order in which properties are rendered using the `ui:order` property:

```jsx
const schema = {
  type: "object",
  properties: {
    foo: {type: "string"},
    bar: {type: "string"}
  }
};

const uiSchema = {
  "ui:order": ["bar", "foo"]
};

render((
  <Form schema={schema}
        uiSchema={uiSchema} />
), document.getElementById("app"));
```

If a guaranteed fixed order is only important for some fields, you can insert a wildcard `"*"` item in your `ui:order` definition. All fields that are not referenced explicitly anywhere in the list will be rendered at that point:

```js
const uiSchema = {
  "ui:order": ["bar", "*"]
};
```

## ui:placeholder

You can add placeholder text to an input by using the `ui:placeholder` uiSchema directive:

```jsx
const schema = {type: "string", format: "uri"};
const uiSchema = {
  "ui:placeholder": "http://"
};
```

![](https://i.imgur.com/MbHypKg.png)

Fields using `enum` can also use `ui:placeholder`. The value will be used as the text for the empty option in the select widget.

```jsx
const schema = {type: "string", enum: ["First", "Second"]};
const uiSchema = {
  "ui:placeholder": "Choose an option"
};
```

## ui:readonly

The `ui:readonly` uiSchema directive will mark all child widgets from a given field as read-only. This is equivalent to setting the `readOnly` property in the schema.

> Note: If you're wondering about the difference between a `disabled` field and a `readonly` one: Marking a field as read-only will render it greyed out, but its text value will be selectable. Disabling it will prevent its value to be selected at all.

## ui:rootFieldId

By default, this library will generate ids unique to the form for all rendered widgets. If you plan on using multiple instances of the `Form` component in a same page, it's wise to declare a root prefix for these, using the `ui:rootFieldId` uiSchema directive:

```js
const uiSchema = {
  "ui:rootFieldId": "myform"
};
```

So all widgets will have an id prefixed with `myform`.

## ui:title

Sometimes it's convenient to change a field's title. this is the purpose of the `ui:title` uiSchema directive:

```js
const schema = {type: "string"};
const uiSchema = {
  "ui:widget": "password",
  "ui:title": "Your password"
};
```

## ui:options["inputType"]

To change the input type (for example, `tel` or `email`) you can specify the `inputType` in the `ui:options` uiSchema directive.

```jsx
const schema = {type: "string"};
const uiSchema = {
  "ui:options": {
    inputType: 'tel'
  }
};
```

## ui:options["label"]

Field labels are rendered by default. Labels may be omitted by setting the `label` option to `false` in the `ui:options` uiSchema directive.

```jsx
const schema = {type: "string"};
const uiSchema = {
  "ui:options": {
    label: false
  }
};
```

## ui:options["rows"]

You can set the initial height of a textarea widget by specifying `rows` option.

```js
const schema = {type: "string"};
const uiSchema = {
  "ui:widget": "textarea",
  "ui:options": {
    rows: 15
  }
}
```