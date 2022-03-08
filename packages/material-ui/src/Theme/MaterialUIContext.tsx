import React, { ComponentType } from 'react';
import { BoxProps, ButtonProps } from '@material-ui/core';
import MaterialUIContextProps, { defaultMaterialUIContext } from './MaterialUIContextProps';

export const MaterialUIContext: MaterialUIContextProps = defaultMaterialUIContext;

try {
  /**
   * Dynamically import MUI components so we get full tree-shaking support
   */
  import('@material-ui/icons/Add').then(Add => {
    MaterialUIContext.AddIcon = Add.default;
  });
  import('@material-ui/icons/ArrowDownward').then(ArrowDownward => {
    MaterialUIContext.ArrowDownwardIcon = ArrowDownward.default;
  });
  import('@material-ui/icons/ArrowUpward').then(ArrowUpward => {
    MaterialUIContext.ArrowUpwardIcon = ArrowUpward.default;
  });
  import('@material-ui/core/Box').then(Box => {
    MaterialUIContext.Box = Box.default;
  });
  import('@material-ui/core/Button').then(Button => {
    MaterialUIContext.Button = Button.default;
  });
  import('@material-ui/core/Checkbox').then(Checkbox => {
    MaterialUIContext.Checkbox = Checkbox.default;
  });
  import('@material-ui/core/Divider').then(Divider => {
    MaterialUIContext.Divider = Divider.default;
  });
  import('@material-ui/icons/Error').then(Error => {
    MaterialUIContext.ErrorIcon = Error.default;
  });
  import('@material-ui/core/FormControl').then(FormControl => {
    MaterialUIContext.FormControl = FormControl.default;
  });
  import('@material-ui/core/FormControlLabel').then(FormControlLabel => {
    MaterialUIContext.FormControlLabel = FormControlLabel.default;
  });
  import('@material-ui/core/FormGroup').then(FormGroup => {
    MaterialUIContext.FormGroup = FormGroup.default;
  });
  import('@material-ui/core/FormHelperText').then(FormHelperText => {
    MaterialUIContext.FormHelperText = FormHelperText.default;
  });
  import('@material-ui/core/FormLabel').then(FormLabel => {
    MaterialUIContext.FormLabel = FormLabel.default;
  });
  import('@material-ui/core/Grid').then(Grid => {
    MaterialUIContext.Grid = Grid.default;
  });
  import('@material-ui/core/IconButton').then(IconButton => {
    MaterialUIContext.IconButton = IconButton.default;
  });
  import('@material-ui/core/OutlinedInput').then(OutlinedInput => {
    MaterialUIContext.Input = OutlinedInput.default;
  });
  import('@material-ui/core/InputLabel').then(InputLabel => {
    MaterialUIContext.InputLabel = InputLabel.default;
  });
  import('@material-ui/core/List').then(List => {
    MaterialUIContext.List = List.default;
  });
  import('@material-ui/core/ListItem').then(ListItem => {
    MaterialUIContext.ListItem = ListItem.default as ComponentType;
  });
  import('@material-ui/core/ListItemIcon').then(ListItemIcon => {
    MaterialUIContext.ListItemIcon = ListItemIcon.default;
  });
  import('@material-ui/core/ListItemText').then(ListItemText => {
    MaterialUIContext.ListItemText = ListItemText.default;
  });
  import('@material-ui/core/MenuItem').then(MenuItem => {
    MaterialUIContext.MenuItem = MenuItem.default as ComponentType;
  });
  import('@material-ui/core/Paper').then(Paper => {
    MaterialUIContext.Paper = Paper.default;
  });
  import('@material-ui/core/Radio').then(Radio => {
    MaterialUIContext.Radio = Radio.default;
  });
  import('@material-ui/core/RadioGroup').then(RadioGroup => {
    MaterialUIContext.RadioGroup = RadioGroup.default;
  });
  import('@material-ui/icons/Remove').then(Remove => {
    MaterialUIContext.RemoveIcon = Remove.default;
  });
  import('@material-ui/core/Slider').then(Slider => {
    MaterialUIContext.Slider = Slider.default;
  });
  import('@material-ui/core/SvgIcon').then(SvgIcon => {
    MaterialUIContext.SvgIcon = SvgIcon.default;
  });
  import('@material-ui/core/TextField').then(TextField => {
    MaterialUIContext.TextField = TextField.default;
  });
  import('@material-ui/core/Typography').then(Typography => {
    MaterialUIContext.Typography = Typography.default;
  });
} catch (err) {
  // no-op
}

export const DefaultChildren = () => {
  if (
    Object.keys(MaterialUIContext).length &&
    MaterialUIContext.Box &&
    MaterialUIContext.Button &&
    MaterialUIContext.AddIcon
  ) {
    const { Box, Button } = MaterialUIContext;
    const BoxComp = Box as ComponentType<BoxProps>;
    const ButtonComp = Button as ComponentType<ButtonProps>;

    return (
      <BoxComp marginTop={3}>
        <ButtonComp type='submit' variant='contained' color='primary'>
          Submit
        </ButtonComp>
      </BoxComp>
    );
  }

  return <div>@material-ui not available</div>;
};

export function useMaterialUIContext(): MaterialUIContextProps {
  return MaterialUIContext;
}
