import React from "react";
import "./DocumentWidget.css";

class DocumentWidget extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="form-group document-form-group">
        <input type="file" />
      </div>
    );
  }
}

export default DocumentWidget;
