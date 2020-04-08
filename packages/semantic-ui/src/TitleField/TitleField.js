import React from "react";
import PropTypes from "prop-types";
import { Header } from "semantic-ui-react";

function TitleField({ title, options }) {
  const { semanticProps } = options;
  if (title) {
    return (
      <Header {...semanticProps} as="h5">
        {title}
      </Header>
    );
  }
}

TitleField.defaultProps = {
  options: {
    semanticProps: {
      inverted: false,
      dividing: true,
    },
  },
};

TitleField.propTypes = {
  options: PropTypes.object,
};

export default TitleField;
