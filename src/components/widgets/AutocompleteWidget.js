import React from "react";
import {isUndefined, uniqueId, isNull, isObject, isArray} from "lodash";
import Awesomplete from "awesomplete";

export default class AutocompleteWidget extends React.Component {
  
  constructor(props){
    super(props);
    this.uniqId = uniqueId('AcW');
    this.state = {
      label: this.props.defaultValue,
      ajaxData: this.valuesHandler(this.props.schema.autocomplete.values)
    }
  }
  
  // adapt the object data to awesomplete data schema
  valuesHandler(values){
    if(isObject(values)){
      var newValues = [];
      Object.keys(values).map((key) => {
        newValues.push({"label": values[key], "value": parseInt(key)});
      });
      values = newValues;
    }
    return values;
  }
  
  // handle the ajax response, transform the array for awesomplete
  ajaxHandler(values, valueFieldname, labelFieldname){
    if(isArray(values)){
      var newValues = [];
      const value = valueFieldname;
      const label = labelFieldname;
      values.map((item) => {
        newValues.push({"label": item[label], "value": item[value]});
      })
      values = newValues;
    }
    return values;
  }
  
  componentWillReceiveProps(nextProps){
    if(!isUndefined(nextProps.value) && this.props.value != nextProps.value){
      // select the label for render
      this.setState({label: this.getLabelFromValue(nextProps.value) });
      // update the parent form data
      this.props.onChange(nextProps.value);
    }
  }
  
  // from the ajaxData, get the label with the value
  getLabelFromValue(value){
    if(!this.state.ajaxData){
      return null;
    }
    var item = this.state.ajaxData.filter((item) => {
      return item.value == value;
    }).shift();
    // if nothing is found, return null
    return (item)?item.label:null;
  }
  
  componentDidMount(){
    // send value to the parent form and adapt depending on data type
    this.props.onChange(this.onChangeHandler(this.props.value));
    if(this.props.schema.autocomplete.values){
      //init the autocomplete
      this.initAwesomplete();
    } else {
      //the data and init autocomplete via CallBack
      this.initDataFetch((data) => {
        this.setState({ajaxData: this.getOption('remote_ajaxHandler')(data, this.getOption('remote_value'), this.getOption('remote_label'))});
        //init the autocomplete
        this.initAwesomplete();
      });
    }
  }
  
  // anytime the awesomplete replace, the state and parent form data change
  onReplace(input) {
    return ((item) => {
    	  this.props.onChange(this.onChangeHandler(item.value));
    	  this.setState({label: item.label});
    	}).bind(this)
  }
  
  // Adapt the data depending on the schema type
  onChangeHandler(value) {
    // needs to adapt data for form validation
    if(isUndefined(value) || isNull(value) || isNaN(value)){
      switch(this.props.schema.type){
        case "integer":
          return value = 0;
        default:
          return value;
      }
    }
    return value;
  }
  
  // Init awesomplete
  initAwesomplete(){
    var input = document.getElementById("autocomplete" + this.uniqId);
    var awesomplete = new Awesomplete(input, {
      minChars: this.getOption('minChar'),
    	list: this.state.ajaxData,
    	replace: this.onReplace(input),
    	autoFirst: this.getOption('auto_first')?true:false,
    	filter: this.filter()
    });
  }
  
  // anytime the input change, the data popup is updated here
  // return a function
  filter(){
    return Awesomplete.FILTER_CONTAINS;
  }
  
  // get option with name
  getOption(optionName){
    return this.options[optionName];
  }
  
  // get all options
  get options(){
    if(!this._options){
      this._options = this.getDefaultOptions()
    }
    return this._options;
  }
  
  // get default options based on props
  getDefaultOptions(){
    const acOptions = this.props.schema.autocomplete;
    const props = this.props;
    return {
      // when popup open, first item is selected
      'auto_first': acOptions['auto_first']?acOptions['only_values']:false,
      // values to display in th popup
      'values': acOptions['values']?acOptions['values']:null,
      // if true, data is needed to validate the form
      'required': props['required']?acOptions['required']:false,
      // minimum character before popup open
      'minChar': acOptions['minChar']?acOptions['minChar']:2,
      // url : remote url where to access data
      'remote_url': acOptions['remote_url']?acOptions['remote_url']:null, 
      // value: from the fetched data, the value will be send to the server
      'remote_value': acOptions['remote_value']?acOptions['remote_value']:null, 
      // label: from the fetched data, the data you want to display in popup
      'remote_label': acOptions['remote_label']?acOptions['remote_label']:null,
      // ajaxHandler: on reception of the remote, convert the Json into 
      // [{'label': label, 'value': value}, {...}] acceptable by awesomplete
      'remote_ajaxHandler': acOptions['remote_ajaxHandler']?acOptions['remote_ajaxHandler']:this.ajaxHandler
      
    };
  }
  
  // fetch the data and callback a function on success
  initDataFetch(cb){
    fetch(this.getOption('remote_url'))
      // parse
      .then((res) => {
        return res.json();
      })
      // cb
      .then(cb)
      // throw if issue
      .catch((ex) => {
        console.log('parsing failed', ex)
      });
  }
  
  // on input change function
  onChange(event){
    this.setState({
      label: event.target.value
    });
  }
  
  render(){
    return (
      <input 
        value={this.state.label}
        class='form-control dropdown-input' 
        id={"autocomplete" + this.uniqId} 
        onChange={this.onChange.bind(this)}
        />
    );
  }
}