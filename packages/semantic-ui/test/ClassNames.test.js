import { expect } from "chai";
import React from 'react';

import { SemanticUIForm } from "../src";
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';

describe("testing classNames presence", () => {
  let container;

     beforeEach(() => {
       container = document.createElement('div');
       document.body.appendChild(container);
     });

     afterEach(() => {
       document.body.removeChild(container);
       container = null;
     });

     describe("custom classNames", () => {
       const schema = {
         type: "object",
         properties: {
           foo: {
             type: "string",
           },
           bar: {
             type: "string",
           },
         },
       };

       const uiSchema = {
         foo: {
           classNames: "class-for-foo",
         },
         bar: {
           classNames: "class-for-bar another-for-bar",
         },
       };

       it("should apply custom class names to target widgets", () => {
           act(() => {
            ReactDOM.render(<SemanticUIForm schema={schema} uiSchema={uiSchema}
            formContext={{ semantic: { wrapLabel: true, wrapContent: true } }}
            />, container);
          });
         const [stringField1, stringField2] =
           container.querySelectorAll(".sui-field-content");
         expect(stringField1.querySelectorAll(".class-for-foo")).to.exist;
         expect(stringField2.querySelectorAll(".class-for-bar")).to.exist;

       });
     });

});
