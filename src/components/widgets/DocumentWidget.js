// /** @jsx jsx */
// import React from "react";
// import PropTypes from "prop-types";
// import styled from "@emotion/styled";
// import { jsx } from '@emotion/core';

// const Image = styled.img`
// max-height: 150px;
// padding-bottom: 20px;
// `
// // class DocumentWidget extends React.Component {

// // }

// const UploadLabel = styled.label`
// display: inline-block;
// max-width: 100%;
// margin-bottom: 5px;
// font-weight: 700;
// letter-spacing: 1.8px;
// padding: 16px 30px;
// border-radius: 3px;
// font-size: 14px;
// letter-spacing: 1.8px;
// line-height: 1.42857143;
// max-width: initial;
// min-width: 170px;
// padding: 16px 30px;
// width: auto;
// color: #fff;
// cursor: pointer;
// opacity: 1;
// font-family: "system-ui";
// font-weight: 700;
// background-color: #1c9440;
// position: relative`

// function DocumentWidget (props) {
//   const { BaseInput } =  props.registry.widgets;

//   return (
//     <div css={{
//       width: '100%',
//       background: '#e1f7e8',
//       align: 'center',
//       border: '1px solid #c3c9d7',
//       display: 'block',
//       margin: '0 auto',
//       padding: '25px',
//       position: 'realtive'
//     }}>
//       <div>
//         <UploadLabel>UPLOAD</UploadLabel>
//         <BaseInput type="file" css=
//           {{ position: 'relative',
//             display: 'inline-block'
//           }} {...props}/>
//       </div>

//       <div>
//         <BaseInput onClick={onItemClick} type='submit' {...props} value='save'/>
//       </div>
//     </div>
//   );
//   }

//   function onItemClick(event) {
//     console.log("i got clicked");
//   }

// export default DocumentWidget

/** @jsx jsx */
import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { jsx } from '@emotion/core';

const UploadLabel = styled.label`
  display: inline-block;
  max-width: 100%;
  margin-bottom: 5px;
  font-weight: 700;
  letter-spacing: 1.8px;
  padding: 16px 30px;
  border-radius: 3px;
  font-size: 14px;
  letter-spacing: 1.8px;
  line-height: 1.42857143;
  max-width: initial;
  min-width: 170px;
  padding: 16px 30px;
  width: auto;
  color: #fff;
  cursor: pointer;
  opacity: 1;
  font-family: 'system-ui';
  font-weight: 700;
  background-color: #1c9440;
  position: relative;
`;

const url =
  'https://7ffa17cf-4860-4140-bce6-31b1ddd7e375.mock.pstmn.io/uploadDoc';

class DocumentWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      image: null,
      imagePreview: null
    };
  }

  uploadFile = url => {
    const data = new FormData();
    data.append('file', this.state.image);

    fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data'
      },
      body: data
    })
    .then(response => response.json())
    .then(response => console.log(response))
    .catch(error => console.error('Error:', error));
  };

  handleSave = url => {
    this.props
      .getDocUploadUrl(
        this.props.options.doc_type,
        this.state.image.name,
        this.state.image.type
      )
      .then(url => {
        console.log(url);
        this.uploadFile(url);
      })
      .catch(err => {
        console.log(err);
      });
  };

  handleFileChange = event => {
    const image = event.target.files[0];
    console.log(image);
    if (image) {
      let reader = new FileReader();

      reader.onload = event => {
        console.log(event);
        this.setState({
          image: image,
          imagePreview: event.target.result
        });
      };

      reader.readAsDataURL(image);
    }
  };

  render() {
    const { BaseInput } = this.props.registry.widgets;
    return (
      <div
        css={{
          width: '100%',
          background: '#e1f7e8',
          align: 'center',
          border: '1px solid #c3c9d7',
          display: 'block',
          margin: '0 auto',
          padding: '25px',
          position: 'realtive'
        }}
      >
        <div>
          <UploadLabel>UPLOAD</UploadLabel>
          <input
            type="file"
            id="imageFile"
            onChange={this.handleFileChange}
            css={{ position: 'relative', display: 'inline-block' }}
          />
        </div>

        <div>
          <BaseInput
            onClick={this.handleSave}
            type="submit"
            {...this.props}
            value="save"
          />
        </div>
        <div>
          <img
            id="imagePreview"
            src={this.state.imagePreview}
            width="100"
            style={{ display: this.state.imagePreview ? 'block' : 'none' }}
          />
        </div>
      </div>
    );
  }
}
export default DocumentWidget;
