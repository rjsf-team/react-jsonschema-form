import React, { Component } from "react";
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import Button from 'react-bootstrap/Button';

/**
 * Class component of Confirmation
 */
export default class Confirmation extends Component {
  constructor(props) {
    super(props);
    // Initial state declaration
    this.state = {
      show: false,
      target: null
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleHeaderClick = this.handleHeaderClick.bind(this);
  }
  
  handleClick = (event) => {
    const { show } = this.state;
    this.setState({
      show: !show 
    });
  };

  handleHeaderClick = (event) => {
    const { show } = this.state;
    if (show === false) {
      this.setState({
        target: event.target,
        show: !show 
      });
    }
  };

  render() {
    const { cancelButtonText = "Cancel", okButtonText = "OK", ButtonText = "Delete", headingText = "Are you sure you want to delete?", bodyText = "", disabled = false, className = "mr-2", variant = "secondary" } = this.props;
    const { show, target } = this.state;

    return (
      <div>
        <Button variant={variant} size="sm" disabled={disabled} className={className} onClick={this.handleHeaderClick} title={ButtonText}>{ButtonText}</Button>
        <Overlay
          show={show}
          target={target}
          onHide={this.handleClick}
          placement="bottom"
          rootClose={true}
        >
          <Popover id="popover-contained">
            <Popover.Title>{headingText}</Popover.Title>
            <Popover.Content>
              {bodyText}
              <div className="text-center">
                <Button variant="secondary" size="sm" className="mr-2" onClick={this.handleClick}>{cancelButtonText}</Button>
                <Button variant="outline-primary" size="sm" className="mr-2" onClick={this.props.onConfirmation}>{okButtonText}</Button>
              </div>
            </Popover.Content>
          </Popover>
        </Overlay>
      </div>
    );
  }
}