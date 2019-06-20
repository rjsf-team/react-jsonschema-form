import React from "react";
import Tooltip from "@material-ui/core/Tooltip";
import InfoIcon from "@material-ui/icons/Info";
import IconButton from "@material-ui/core/IconButton";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";

const TooltipWrapper = props => {
  const [open, setOpen] = React.useState(false);

  function handleTooltipClose() {
    setOpen(false);
  }

  function handleTooltipOpen() {
    setOpen(true);
  }

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <span className="click-tooltip__wrapper">
        <Tooltip
          PopperProps={{
            disablePortal: true,
          }}
          onClose={handleTooltipClose}
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={props.help}>
          <IconButton onClick={handleTooltipOpen}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </span>
    </ClickAwayListener>
  );
};
export default TooltipWrapper;
