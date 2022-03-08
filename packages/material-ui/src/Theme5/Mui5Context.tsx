import React, { ComponentType } from "react";
import { BoxProps, ButtonProps } from "@mui/material";
import Mui5ContextProps, { defaultMui5Context } from "./Mui5ContextProps";

export const Mui5Context: Mui5ContextProps = defaultMui5Context;

try {
  /**
   * Dynamically import MUI components so we get full tree-shaking support
   */
  import("@mui/icons-material/Add").then(Add => {
    Mui5Context.AddIcon = Add.default;
  });
  import("@mui/icons-material/ArrowDownward").then(ArrowDownward => {
    Mui5Context.ArrowDownwardIcon = ArrowDownward.default;
  });
  import("@mui/icons-material/ArrowUpward").then(ArrowUpward => {
    Mui5Context.ArrowUpwardIcon = ArrowUpward.default;
  });
  import("@mui/material/Box").then(Box => {
    Mui5Context.Box = Box.default;
  });
  import("@mui/material/Button").then(Button => {
    Mui5Context.Button = Button.default;
  });
  import("@mui/material/Checkbox").then(Checkbox => {
    Mui5Context.Checkbox = Checkbox.default;
  });
  import("@mui/material/Divider").then(Divider => {
    Mui5Context.Divider = Divider.default;
  });
  import("@mui/icons-material/Error").then(Error => {
    Mui5Context.ErrorIcon = Error.default;
  });
  import("@mui/material/FormControl").then(FormControl => {
    Mui5Context.FormControl = FormControl.default;
  });
  import("@mui/material/FormControlLabel").then(FormControlLabel => {
    Mui5Context.FormControlLabel = FormControlLabel.default;
  });
  import("@mui/material/FormGroup").then(FormGroup => {
    Mui5Context.FormGroup = FormGroup.default;
  });
  import("@mui/material/FormHelperText").then(FormHelperText => {
    Mui5Context.FormHelperText = FormHelperText.default;
  });
  import("@mui/material/FormLabel").then(FormLabel => {
    Mui5Context.FormLabel = FormLabel.default;
  });
  import("@mui/material/Grid").then(Grid => {
    Mui5Context.Grid = Grid.default;
  });
  import("@mui/material/IconButton").then(IconButton => {
    Mui5Context.IconButton = IconButton.default;
  });
  import("@mui/material/OutlinedInput").then(OutlinedInput => {
    Mui5Context.Input = OutlinedInput.default;
  });
  import("@mui/material/InputLabel").then(InputLabel => {
    Mui5Context.InputLabel = InputLabel.default;
  });
  import("@mui/material/List").then(List => {
    Mui5Context.List = List.default;
  });
  import("@mui/material/ListItem").then(ListItem => {
    Mui5Context.ListItem = ListItem.default;
  });
  import("@mui/material/ListItemIcon").then(ListItemIcon => {
    Mui5Context.ListItemIcon = ListItemIcon.default;
  });
  import("@mui/material/ListItemText").then(ListItemText => {
    Mui5Context.ListItemText = ListItemText.default;
  });
  import("@mui/material/MenuItem").then(MenuItem => {
    Mui5Context.MenuItem = MenuItem.default;
  });
  import("@mui/material/Paper").then(Paper => {
    Mui5Context.Paper = Paper.default;
  });
  import("@mui/material/Radio").then(Radio => {
    Mui5Context.Radio = Radio.default;
  });
  import("@mui/material/RadioGroup").then(RadioGroup => {
    Mui5Context.RadioGroup = RadioGroup.default;
  });
  import("@mui/icons-material/Remove").then(Remove => {
    Mui5Context.RemoveIcon = Remove.default;
  });
  import("@mui/material/Slider").then(Slider => {
    Mui5Context.Slider = Slider.default;
  });
  import("@mui/material/SvgIcon").then(SvgIcon => {
    Mui5Context.SvgIcon = SvgIcon.default;
  });
  import("@mui/material/TextField").then(TextField => {
    Mui5Context.TextField = TextField.default;
  });
  import("@mui/material/Typography").then(Typography => {
    Mui5Context.Typography = Typography.default;
  });
} catch (err) {
  // no-op
}

export const DefaultChildren = () => {
  if (
    Object.keys(Mui5Context).length &&
    Mui5Context.Box &&
    Mui5Context.Button &&
    Mui5Context.AddIcon
  ) {
    const { Box, Button } = Mui5Context;
    const BoxComp = Box as ComponentType<BoxProps>;
    const ButtonComp = Button as ComponentType<ButtonProps>;

    return (
      <BoxComp marginTop={3}>
        <ButtonComp type="submit" variant="contained" color="primary">
          Submit
        </ButtonComp>
      </BoxComp>
    );
  }

  return <div>@mui not available</div>;
};
