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
  InputLabelProps,
  ListProps,
  ListItemProps,
  ListItemIconProps,
  ListItemTextProps,
  MenuItemProps,
  OutlinedInputProps,
  PaperProps,
  RadioProps,
  RadioGroupProps,
  SliderProps,
  SvgIconProps,
  TextFieldProps,
  TypographyProps,
} from '@mui/material';

export default interface Mui5ContextProps {
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
  Input: ComponentType<OutlinedInputProps>;
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
