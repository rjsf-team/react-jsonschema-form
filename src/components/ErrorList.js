import React from "react";


export default function ErrorList({errors, idSchema}) {
  return (
    <div className="panel panel-danger errors">
      <div className="panel-heading">
        <h3 className="panel-title">Errors</h3>
      </div>
      <ul className="list-group">{
        errors.map((error, i) => {
          const fieldId = idSchema[error.argument].$id;
          return (
            <li key={i} className="list-group-item text-danger">
              <a href={`#${fieldId}`}>{
              	error.stack
              }</a>
            </li>
          );
        })
      }</ul>
    </div>
  );
}

