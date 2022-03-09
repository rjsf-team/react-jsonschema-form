import React from 'react';

import Mui5ContextProps from './Mui5ContextProps';

/** Use require for loading these libraries in case they are not available in order to perform a useful fallback
 * We are explicitly loading each component with the `#__PURE__` webpack magic comment so that tree-shaking works.
 */
let mui;
let icons;
try {
  mui = {
    Box: /*#__PURE__*/require('@mui/material/Box').default,
    Button: /*#__PURE__*/require('@mui/material/Button').default,
    Checkbox: /*#__PURE__*/require('@mui/material/Checkbox').default,
    Divider: /*#__PURE__*/require('@mui/material/Divider').default,
    FormControl: /*#__PURE__*/require('@mui/material/FormControl').default,
    FormControlLabel: /*#__PURE__*/require('@mui/material/FormControlLabel').default,
    FormHelperText: /*#__PURE__*/require('@mui/material/FormHelperText').default,
    FormGroup: /*#__PURE__*/require('@mui/material/FormGroup').default,
    FormLabel: /*#__PURE__*/require('@mui/material/FormLabel').default,
    Grid: /*#__PURE__*/require('@mui/material/Grid').default,
    IconButton: /*#__PURE__*/require('@mui/material/IconButton').default,
    InputLabel: /*#__PURE__*/require('@mui/material/InputLabel').default,
    List: /*#__PURE__*/require('@mui/material/List').default,
    ListItem: /*#__PURE__*/require('@mui/material/ListItem').default,
    ListItemIcon: /*#__PURE__*/require('@mui/material/ListItemIcon').default,
    ListItemText: /*#__PURE__*/require('@mui/material/ListItemText').default,
    MenuItem: /*#__PURE__*/require('@mui/material/MenuItem').default,
    OutlinedInput: /*#__PURE__*/require('@mui/material/OutlinedInput').default,
    Paper: /*#__PURE__*/require('@mui/material/Paper').default,
    Radio: /*#__PURE__*/require('@mui/material/Radio').default,
    RadioGroup: /*#__PURE__*/require('@mui/material/RadioGroup').default,
    Slider: /*#__PURE__*/require('@mui/material/Slider').default,
    TextField: /*#__PURE__*/require('@mui/material/TextField').default,
    Typography: /*#__PURE__*/require('@mui/material/Typography').default,
  };
  icons = {
    Add: /*#__PURE__*/require('@mui/icons-material/Add').default,
    ArrowUpward: /*#__PURE__*/require('@mui/icons-material/ArrowUpward').default,
    ArrowDownward: /*#__PURE__*/require('@mui/icons-material/ArrowDownward').default,
    Error: /*#__PURE__*/require('@mui/icons-material/Error').default,
    Remove: /*#__PURE__*/require('@mui/icons-material/Remove').default
  };
} catch (err) {
  // purposely a no-op
}

export let Mui5Context: Mui5ContextProps;
export let DefaultChildren = () => <div>@mui not available</div>;

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
    Slider,
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
    Slider,
    TextField,
    Typography,
    AddIcon,
    ArrowDownwardIcon,
    ArrowUpwardIcon,
    ErrorIcon,
    RemoveIcon,
  };
}
