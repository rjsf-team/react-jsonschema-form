import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'semantic-ui-react';

function IconButton(props) {
  const { icon, className, ...otherProps } = props;
  return (<Button icon={icon} className={className} {...otherProps} />);
}

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default IconButton;
