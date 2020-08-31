function replaceContent(range,node){
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._range = null;
  }

  setAttribute(name,value){
    this.props[name] = value;
  }

  appendChild(component){
    this.children.push(component);
  }

  get vdom(){
    return this.render().vdom;
  }

  renderDOM(range){
    this._range = range;
    this._vdom = this.vdom;
    this._vdom.renderDOM(range);
  }

  update(){
    let isSameNode = (oldNode, newNode)=>{
      console.log('oldNode,newNode',oldNode,newNode);
      if(oldNode.type !== newNode.type){
        return false;
      }

      for(let name in newNode.props){
        if(newNode.props[name] !== oldNode.props[name]){
          return false;
        }
      }

      if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length){
        return false;
      }

      if(newNode.type === '#text'){
        if(newNode.content !== oldNode.content){
          return false;
        }
      }
      return true;
    }

    let update = (oldNode, newNode)=>{
      if(!isSameNode(oldNode,newNode)){
        newNode.renderDOM(oldNode._range);
        return;
      }
      newNode._range = oldNode._range;

      let newChildren = newNode.vchildren;
      let oldChildren = oldNode.vchildren;

      if(!newChildren || !newChildren.length){
        return ;
      }

      let tailRange = oldChildren[oldChildren.length -1]._range;

      for(let i=0;i<newChildren.length;i++){
        let newChild = newChildren[i];
        let oldChild = oldChildren[i];
        if(i<oldChildren.length){
          update(oldChild,newChild);
        }else{
          let range = document.createRange();
          range.setStart(tailRange.endContainer,tailRange.endOffset);
          range.endStart(tailRange.endContainer,tailRange.endOffset);
          newChild.renderDOM(range);
          tailRange = range;
        }
      }
    }
    let vdom = this.vdom; // 获取最新的VDOM
    update(this._vdom,vdom);
    this._vdom = vdom;
  }

  setState(newState){
    if(this.state === null || typeof this.state !== "object"){
      this.state = newState;
      this.update();
      return;
    }
    let merge = (oldState,newState)=>{
      for (let p in newState){
        if(oldState[p] === null || typeof oldState[p] !== "object"){
          oldState[p] = newState[p];
        }else{
          merge(oldState[p] , newState[p]);
        }
      }
    }

    merge(this.state,newState);
    this.update();
  }
}

class ElementWrapper extends Component{
  constructor(type) {
    super(type);
    this.type = type;
  }

  get vdom (){
    this.vchildren = this.children.map(child => child.vdom);
    return this;
  }

  renderDOM(range){
    this._range = range;
    let root = document.createElement(this.type);

    for(let name in this.props){
      let value = this.props[name];
      if(name.match(/^on([\s\S]+)$/)){
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/,(c)=> c.toLocaleLowerCase()),value);
      }else{
        if(name === 'className'){
          root.setAttribute("class",value);
        }else{
          root.setAttribute(name,value);
        }
      }
    }

    if(!this.vchildren) {
      this.vchildren = this.children.map(child => child.vdom);
    }

    for (let child of this.vchildren){
      let childRange = document.createRange();
      childRange.setStart(root,root.childNodes.length);
      childRange.setEnd(root,root.childNodes.length);
      child.renderDOM(childRange);
    }

    replaceContent(range,root);
  }
}

class TextWrapper extends Component{
  constructor(content) {
    super(content);
    this.type = "#text";
    this.content = content;
  }

  get vdom(){
    return this;
  }

  renderDOM(range){
    this._range = range;
    let root = document.createTextNode(this.content);
    replaceContent(range,root);
  }
}

export function createElement(type,attributes,...children){
  console.log("createElement",type,attributes,children);
  // 根据 type 创建DOM节点
  let e ;
  // 如果 type 是字符型说明是原生标签如div，那么直接调用 ElementWrapper
  if(typeof type === 'string'){
    e = new ElementWrapper(type)
  }else{
    // 如果 type 是自定义 Class 的话则直接实例化
    e = new type;
  }
  console.log("e",e);
  // 设置属性
  for(let p in attributes){
    e.setAttribute(p,attributes[p]);
  }

  // 递归插入子节点
  let insertChildren = (children)=>{
    for(let child of children){
      // 文本节点
      if(typeof child === 'string'){
        child = new TextWrapper(child);
      }
      if(child === null){
        continue;
      }
      // child 等于数组时，说明`{this.children}`这样使用的
      if(typeof child === "object" && child instanceof Array){
        insertChildren(child);
      }else{
        e.appendChild(child);
      }
    }
  }
  insertChildren(children);

  return e;
}

// 整体 DOM 插入 body 中
export function render(component,parentElement) {
  console.log('render',component);
  let range = document.createRange();
  range.setStart(parentElement,0);
  range.setEnd(parentElement,parentElement.childNodes.length);
  range.deleteContents();

  component.renderDOM(range);
}
