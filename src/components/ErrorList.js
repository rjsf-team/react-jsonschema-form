import React from "react";

export default function ErrorList(props) {
  const { errors } = props;
  return (
    <div className="panel panel-danger errors">
      <div className="panel-heading">
        <h3 className="panel-title">Errors</h3>
      </div>
      <ul className="list-group">
        {errors.map((error, i) => {
          return (
            <li key={i} className="list-group-item text-danger">
              {error.stack}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
