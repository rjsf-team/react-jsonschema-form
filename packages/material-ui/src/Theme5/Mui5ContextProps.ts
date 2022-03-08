import { ComponentType } from "react";

export default interface Mui5ContextProps {
  AddIcon: ComponentType<any>;
  ArrowDownwardIcon: ComponentType<any>;
  ArrowUpwardIcon: ComponentType<any>;
  Box: ComponentType<any>;
  Button: ComponentType<any>;
  Checkbox: ComponentType<any>;
  Divider: ComponentType<any>;
  ErrorIcon: ComponentType<any>;
  FormControl: ComponentType<any>;
  FormControlLabel: ComponentType<any>;
  FormGroup: ComponentType<any>;
  FormHelperText: ComponentType<any>;
  FormLabel: ComponentType<any>;
  Grid: ComponentType<any>;
  IconButton: ComponentType<any>;
  Input: ComponentType<any>;
  InputLabel: ComponentType<any>;
  List: ComponentType<any>;
  ListItem: ComponentType<any>;
  ListItemIcon: ComponentType<any>;
  ListItemText: ComponentType<any>;
  MenuItem: ComponentType<any>;
  Paper: ComponentType<any>;
  Radio: ComponentType<any>;
  RadioGroup: ComponentType<any>;
  RemoveIcon: ComponentType<any>;
  Slider: ComponentType<any>;
  SvgIcon: ComponentType<any>;
  TextField: ComponentType<any>;
  Typography: ComponentType<any>;
}

const NullComponent = () => null;

export const defaultMui5Context: Mui5ContextProps = {
  AddIcon: NullComponent,
  ArrowDownwardIcon: NullComponent,
  ArrowUpwardIcon: NullComponent,
  Box: NullComponent,
  Button: NullComponent,
  Checkbox: NullComponent,
  Divider: NullComponent,
  ErrorIcon: NullComponent,
  FormControl: NullComponent,
  FormControlLabel: NullComponent,
  FormGroup: NullComponent,
  FormHelperText: NullComponent,
  FormLabel: NullComponent,
  Grid: NullComponent,
  IconButton: NullComponent,
  Input: NullComponent,
  InputLabel: NullComponent,
  List: NullComponent,
  ListItem: NullComponent,
  ListItemIcon: NullComponent,
  ListItemText: NullComponent,
  MenuItem: NullComponent,
  Paper: NullComponent,
  Radio: NullComponent,
  RadioGroup: NullComponent,
  RemoveIcon: NullComponent,
  Slider: NullComponent,
  SvgIcon: NullComponent,
  TextField: NullComponent,
  Typography: NullComponent,
};
