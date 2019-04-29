import React, { useState } from "react";
import Tooltip from "@material-ui/core/Tooltip";
import InfoIcon from "@material-ui/icons/Info";
import IconButton from "@material-ui/core/IconButton";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";

const TooltipWrapper = props => {
  let [open, setTooltip] = useState(false);
  return (
    <span>
      <ClickAwayListener
        onClickAway={() => {
          setTooltip((open = false));
        }}>
        <Tooltip
          PopperProps={{
            disablePortal: true,
          }}
          onClose={() => {
            setTooltip((open = false));
          }}
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={props.help}>
          <IconButton
            onClick={() => {
              setTooltip((open = true));
            }}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </ClickAwayListener>
    </span>
  );
};
export default TooltipWrapper;
