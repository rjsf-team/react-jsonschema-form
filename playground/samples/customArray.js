import React, { Component } from "react";

function ArrayFieldTemplate(props) {
  return (
    <div className={props.className}>

      {props.items && props.items.map(element => (
        <div key={element.index}>
          <div>{element.children}</div>
          {element.hasMoveDown &&
            <button onClick={element.onReorderClick(element.index, element.index + 1)}>Down</button>}
          {element.hasMoveUp &&
            <button onClick={element.onReorderClick(element.index, element.index - 1)}>Up</button>}
          <button onClick={element.onDropIndexClick(element.index)}>Delete</button>
          <hr />
        </div>
      ))}

      {props.canAdd &&
        <div className="row">
          <p className="col-xs-3 col-xs-offset-9 array-item-add text-right">
            <button onClick={props.onAddClick} type="button">Custom +</button>
          </p>
        </div>}

    </div>
  );
}

module.exports = {
  schema: {
    title: "Custom array of strings",
    type: "array",
    items: {
      type: "string"
    }
  },
  formData: ["react", "jsonschema", "form"],
  ArrayFieldTemplate
};
