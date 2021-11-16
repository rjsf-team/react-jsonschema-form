import React, { PropsWithChildren, Ref } from 'react';
import { ThemeProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext';
import MaterialUIContextProps from 'Theme/MaterialUIContextProps';
import ThemeCommon from '../ThemeCommon';

const mui = require('@material-ui/core');
const icons = require('@material-ui/icons');

export let Mui4Context: MaterialUIContextProps;
let DefaultChildren = () => <div>@material-ui not available</div>;

if (mui && Object.keys(mui).length && icons && Object.keys(icons).length) {
  const {
    Box,
    Button,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormGroup,
    FormLabel,
    Grid,
    IconButton,
    Input,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography,
  } = mui;
  const {
    Add: AddIcon,
    ArrowUpward: ArrowUpwardIcon,
    ArrowDownward: ArrowDownwardIcon,
    Error: ErrorIcon,
    Remove: RemoveIcon,
  } = icons;

  DefaultChildren = () => (
    <Box marginTop={3}>
      <Button type="submit" variant="contained" color="primary">
        Submit
      </Button>
    </Box>
  );

  Mui4Context = {
    Button,
    Box,
    Checkbox,
    Divider,
    Grid,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
    IconButton,
    Input,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography,
    AddIcon,
    ArrowDownwardIcon,
    ArrowUpwardIcon,
    ErrorIcon,
    RemoveIcon,
  };
}

const Mui4TagName = React.forwardRef(
  function Mui4TagName(props: Omit<PropsWithChildren<HTMLFormElement>, 'contentEditable'>,
                       ref: Ref<HTMLFormElement>) {
    const { children, ...rest } = props;
    return (
      <MuiComponentContext.Provider value={Mui4Context || {}}>
        <form ref={ref} {...rest}>
          {Mui4Context ? children : <div>@material/core and/or @material/icons is not available</div>}
        </form>
      </MuiComponentContext.Provider>
    );
  }
);

const Theme: ThemeProps = {
  tagName: Mui4TagName,
  children: <DefaultChildren />,
  ...ThemeCommon,
};

export default Theme;
