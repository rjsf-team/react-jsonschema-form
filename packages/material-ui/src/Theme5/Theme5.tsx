import React, { PropsWithChildren, Ref } from 'react';
import { ThemeProps } from '@rjsf/core';

import MuiComponentContext from '../MuiComponentContext';
import Mui5ContextProps from 'Theme5/Mui5ContextProps';
import ThemeCommon from '../ThemeCommon';

const mui = require('@mui/material');
const icons = require('@mui/icons-material');

export let Mui5Context: Mui5ContextProps;
let DefaultChildren = () => <div>@mui not available</div>;

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
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    OutlinedInput,
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

  Mui5Context = {
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
    Input: OutlinedInput,
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

const Mui5TagName = React.forwardRef(
  function Mui5TagName(props: Omit<PropsWithChildren<HTMLFormElement>, 'contentEditable'>,
                       ref: Ref<HTMLFormElement>) {
    const { children, ...rest } = props;
    return (
      <MuiComponentContext.Provider value={Mui5Context || {}}>
        <form ref={ref} {...rest}>
          {Mui5Context ? children : <div>@mui/material and/or @mui/icons-material is not available</div>}
        </form>
      </MuiComponentContext.Provider>
    );
  }
);

const Theme5: ThemeProps = {
  tagName: Mui5TagName,
  children: <DefaultChildren />,
  ...ThemeCommon,
};

export default Theme5;
