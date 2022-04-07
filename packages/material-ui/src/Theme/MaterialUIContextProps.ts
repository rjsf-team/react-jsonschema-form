import { ComponentType } from 'react';
import type {
  BoxProps,
  ButtonProps,
  CheckboxProps,
  DividerProps,
  GridProps,
  FormControlProps,
  FormControlLabelProps,
  FormGroupProps,
  FormHelperTextProps,
  FormLabelProps,
  IconButtonProps,
  InputProps,
  InputLabelProps,
  ListProps,
  ListItemProps,
  ListItemIconProps,
  ListItemTextProps,
  MenuItemProps,
  PaperProps,
  RadioProps,
  RadioGroupProps,
  SliderProps,
  SvgIconProps,
  TextFieldProps,
  TypographyProps,
} from '@material-ui/core';

export default interface MaterialUIContextProps {
  Box: ComponentType<BoxProps>;
  Button: ComponentType<ButtonProps>;
  Checkbox: ComponentType<CheckboxProps>;
  Divider: ComponentType<DividerProps>;
  Grid: ComponentType<GridProps>;
  FormControl: ComponentType<FormControlProps>;
  FormControlLabel: ComponentType<FormControlLabelProps>;
  FormGroup: ComponentType<FormGroupProps>;
  FormHelperText: ComponentType<FormHelperTextProps>;
  FormLabel: ComponentType<FormLabelProps>;
  IconButton: ComponentType<IconButtonProps>;
  Input: ComponentType<InputProps>;
  InputLabel: ComponentType<InputLabelProps>;
  List: ComponentType<ListProps>;
  ListItem:ComponentType<ListItemProps>;
  ListItemIcon: ComponentType<ListItemIconProps>;
  ListItemText: ComponentType<ListItemTextProps>;
  MenuItem: ComponentType<MenuItemProps>;
  Paper: ComponentType<PaperProps>;
  Radio: ComponentType<RadioProps>;
  RadioGroup: ComponentType<RadioGroupProps>;
  Slider: ComponentType<SliderProps>;
  TextField: ComponentType<Omit<TextFieldProps, 'color' | 'variant'>>;
  Typography: ComponentType<TypographyProps>;
  AddIcon: ComponentType<SvgIconProps>;
  ArrowDownwardIcon: ComponentType<SvgIconProps>;
  ArrowUpwardIcon: ComponentType<SvgIconProps>;
  ErrorIcon: ComponentType<SvgIconProps>;
  RemoveIcon: ComponentType<SvgIconProps>;
}
