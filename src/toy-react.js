const RENDER_TO_DOM = Symbol("render to dom");

class ElementWrapper{
  constructor(type) {
    this.root = document.createElement(type);
  }

  setAttribute(name,value){
    if(name.match(/^on([\s\S]+)$/)){
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/,(c)=> c.toLocaleLowerCase()),value);
    }else{
      if(name === 'className'){
        this.root.setAttribute("class",value);
      }else{
        this.root.setAttribute(name,value);
      }
    }
  }

  appendChild(component){
    let range = document.createRange();
    range.setStart(this.root,this.root.childNodes.length);
    range.setEnd(this.root,this.root.childNodes.length);
    component[RENDER_TO_DOM](range);
  }

  [RENDER_TO_DOM](range){
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper{
  constructor(content) {
    this.root = document.createTextNode(content);
  }

  [RENDER_TO_DOM](range){
    range.deleteContents();
    range.insertNode(this.root);
  }
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

  [RENDER_TO_DOM](range){
    this._range = range;
    this.render()[RENDER_TO_DOM](range);
  }

  rerender(){
    // 保存老range
    let oldRange = this._range;

    // 创建新range，设置成老的 range 起点
    let range = document.createRange();
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    this[RENDER_TO_DOM](range);

    // 完成插入之后，老的range的start挪动到插入的range之后
    oldRange.setStart(range.endContainer, range.endOffset);
    oldRange.deleteContents();

    // 这块不纠结，后面要修改掉
  }

  setState(newState){
    if(this.state === null || typeof this.state !== "object"){
      this.state = newState;
      this.rerender();
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
    this.rerender();
  }
}

export function createElement(type,attributes,...children){
  console.log(type,attributes,children);
  // 根据 type 创建DOM节点
  let e ;
  // 如果 type 是字符型说明是原生标签如div，那么直接调用 ElementWrapper
  if(typeof type === 'string'){
    e = new ElementWrapper(type)
  }else{
    // 如果 type 是自定义 Class 的话则直接实例化
    e = new type;
  }

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
  component[RENDER_TO_DOM](range);
}
