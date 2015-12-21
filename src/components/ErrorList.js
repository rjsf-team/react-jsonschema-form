import React from "react";


export default function ErrorList({errors}) {
  return (
    <div className="errors">
      <h2>Errors</h2>
      <ul>{
        errors.map((error, i) => {
          return <li key={i}>{error.stack}</li>;
        })
      }</ul>
    </div>
  );
}

