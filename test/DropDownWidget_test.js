import React from 'react';
import { expect } from 'chai';
import sinon from "sinon";
import { configure,  mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import DropDownWidget from '../src/components/widgets/DropDownWidget';

describe('<DropDownWidget />', () => {
  configure({ adapter: new Adapter() });

  let wrapper, handleGetListItems;
  let areas = [
    {
      "label": "label 1",
      "value": "value 1"
    }, {
      "label": "label 2",
      "value": "value 2"
    }];

  const props = {
    placeholder: 'placeholder',
    label: 'area',
    handleGetListItems: () => {
    }
  };

  afterEach(() => {
    handleGetListItems.restore();
  });

  it('Should display values returned from handleGetListItems', async () => {
    handleGetListItems = sinon.stub(props, 'handleGetListItems').resolves(areas);
    wrapper = mount(<DropDownWidget {...props}/>);

    expect(wrapper.contains(<option value={null}>placeholder</option>)).to.equal(true);
    expect(wrapper.contains(<option value={"value 1"}>{"label 1"}</option>)).to.equal(false);

    await wrapper.instance().componentDidMount();
    wrapper.update();

    expect(wrapper.contains(<option value={null}>placeholder</option>)).to.equal(true);
    expect(wrapper.contains(<option value={"value 1"}>{"label 1"}</option>)).to.equal(true);
    expect(wrapper.contains(<option value={"value 2"}>{"label 2"}</option>)).to.equal(true);
  });

  it('Should not display any values on error', async () => {
    handleGetListItems = sinon.stub(props, 'handleGetListItems').rejects('ghsfdahg');

    wrapper = await mount(<DropDownWidget {...props}/>);

    expect(wrapper.contains(<option value={null}>placeholder</option>)).to.equal(true);
    expect(wrapper.contains(<option value={"value 1"}>{"label 1"}</option>)).to.equal(false);

    await wrapper.instance().componentDidMount();
    wrapper.update();

    expect(wrapper.contains(<option value={null}>placeholder</option>)).to.equal(true);
    expect(wrapper.contains(<option value={"value 1"}>{"label 1"}</option>)).to.equal(false);
  });

  it("Should call onChange method", async() => {
    const onChange = sinon.spy();
    handleGetListItems = sinon.stub(props, 'handleGetListItems').resolves(areas);

    wrapper =  mount(<DropDownWidget {...props} onChange={onChange}/>);
    wrapper.find('.css-1nkqoy0').simulate('change');

    expect(onChange.called).to.be.true;
  });

  //Need to test handleChange
});
