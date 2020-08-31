import { createElement, Component ,render } from "./toy-react";

class MyCom extends Component{
  constructor() {
    super();
    this.state = {
      a:1
    }
  }
  render(){
    return <div>
      my Component
      <button onClick={()=>{ this.setState({a: this.state.a + 1}) }}>add</button>
      {this.state.a.toString()}
    </div>
  }
}

let app = (
  <MyCom id="a">
    <p>abc</p>
    <p>bcd</p>
  </MyCom>
);

render(app,document.getElementById("root"));
