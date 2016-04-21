import React from "react";
import AutocompleteWidget from "./AutocompleteWidget";
import Awesomplete from "awesomplete";

export default class ComboAutocompleteWidget extends AutocompleteWidget {
  initAwesomplete(){
    var input = document.getElementById("autocomplete" + this.uniqId);
    var comboplete = new Awesomplete(input, {
      minChars: this.getOption("minChar"),
      list: this.state.ajaxData,
      replace: this.onReplace(input),
      autoFirst: this.getOption("auto_first")?true:false,
      filter: this.filter()
    });
    
    // on dropdown button
    this.dropdownOnClickFunction = () => {
      if (comboplete.ul.childNodes.length === 0) {
        comboplete.minChars = this.getOption("minChar");
        comboplete.evaluate();
      } else if (comboplete.ul.hasAttribute("hidden")) {
        comboplete.open();
      } else {
        comboplete.close();
      }
    };
    
    // on close event
    input.addEventListener("awesomplete-close", (event) => {
      // if not in selection, clear the input value, length test avoid open-closing
      if(!this.inArray(comboplete._list, input.value) && input.value.length >= this.getOption("minChar")){
        input.value = null;
      }
    });
  }
  
  inArray(array, value){
    return array.filter((item) => {return item.label === value;}).length > 0;
  }
  
  dropdownOnClick() {
    this.dropdownOnClickFunction();
  }
  
  getDefaultOptions(){
    return Object.assign({}, super.getDefaultOptions(), {
      "minChar": 0
    });
  }

  render(){
    return (
      <div>
        <div class="input-group">
          <input 
            value={this.state.label}
            class="form-control dropdown-input" 
            id={"autocomplete" + this.uniqId} 
            onChange={this.onChange.bind(this)}
            />
          <span class="input-group-btn dropdown-btn">
            <button 
              onClick={this.dropdownOnClick.bind(this)}
              id={"dropdown-btn2" + this.uniqId} class="btn btn-default" type="button"><span class="caret"></span></button>
          </span>
        </div>
      </div>
    );
  }
}