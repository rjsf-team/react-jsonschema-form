# Customizing material-ui fields and widgets

Unlike most other themes, the `material-ui` theme supports both the two distinct version of Material UI (versions 4 and 5) side-by-side.
Material UI version 4 is provided by the scoped packages under `@material-ui` and version 5 is provided by the scoped packages under `@mui`. 

The components used by `@rjsf/material-ui` for Material UI version 4 and version 5 have identical names and props.
As a result, all of the `fields` and `widgets` provided by the theme are identical as well.
The trick to making the two versions function side-by-side, was done by creating a React context, `MuiComponentContext`, that provides the set components used by theme.

In addition to this context, a custom hook, `useMuiComponent()`, is provided to allow quick access to that component set.

## Example of a custom widget for `@rjsf/material-ui`

Here is an update to the `MyCustomWidget` for the `material-ui` theme

```jsx
const schema = {
  type: "string"
};

import { useMuiComponent } from '@rjsf/material-ui/v4';

function MyCustomWidget(props) {
  const {options, ...otherProps} = props;
  const {color, backgroundColor} = options;
  const { TextInput } = useMuiComponent();
  return <TextInput {...otherProps} style={{color, backgroundColor}} />;
}

MyCustomWidget.defaultProps = {
  options: {
    color: "red"
  }
};

const uiSchema = {
  "ui:widget": MyCustomWidget,
  "ui:options": {
    backgroundColor: "yellow"
  }
};

// renders red on yellow input
render((
  <Form schema={schema}
        uiSchema={uiSchema} />
), document.getElementById("app"));
```
