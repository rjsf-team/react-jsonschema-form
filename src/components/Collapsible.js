import React, { Component, PropTypes } from "react";


class Collapsible extends Component {
  constructor(props) {
    super(props);
    this.state = {collapsed: false};
  }

  toggle = (event) => {
    event.preventDefault();
    this.setState({collapsed: !this.state.collapsed});
  };

  render() {
    const {children} = this.props;
    const {collapsed} = this.state;
    const style = {display: collapsed ? "none" : "block"};
    return (
      <div>
        <h2><a href="#" onClick={this.toggle}>Collapsible wrapper</a></h2>
        <div style={style}>{children}</div>
      </div>
    );
  }
}

Collapsible.propTypes = {
  children: PropTypes.element.isRequired,
};

export default Collapsible;
