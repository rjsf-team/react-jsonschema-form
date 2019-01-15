import React from "react";
import styled from "@emotion/styled";

class DocumentWidget extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const Button = styled.button`
      color: turquoise;
      `

    return (
      <div className="form-group document-form-group">
        <Button>This my button component.</Button>)
        <input type="file" />
      </div>
    );
  }
}

export default DocumentWidget;
