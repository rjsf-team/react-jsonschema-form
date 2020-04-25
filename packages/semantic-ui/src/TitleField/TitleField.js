import React from "react";
import PropTypes from "prop-types";
import { Header } from "semantic-ui-react";

function TitleField({ title, options }) {
  const { semantic } = options;
  if (title) {
    return (
      <Header {...semantic} as="h5">
        {title}
      </Header>
    );
  }
}

TitleField.defaultProps = {
  options: {
    semantic: {
      inverted: false,
      dividing: true,
    },
  },
};

TitleField.propTypes = {
  options: PropTypes.object,
};

export default TitleField;
