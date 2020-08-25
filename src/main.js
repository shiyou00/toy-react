import { createElement, Component ,render } from "./toy-react";

class MyCom extends Component{
  render(){
    return <div>
      my Component
      {this.children}
    </div>
  }
}

let app = (
  <MyCom id="a">
    <p>abc</p>
    <p></p>
    <p></p>
  </MyCom>
);

render(app,document.body);
