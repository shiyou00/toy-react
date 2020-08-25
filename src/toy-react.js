class ElementWrapper{
  constructor(type) {
    this.root = document.createElement(type);
  }

  setAttribute(name,value){
    this.root.setAttribute(name,value);
  }

  appendChild(component){
    this.root.appendChild(component.root)
  }
}

class TextWrapper{
  constructor(content) {
    this.root = document.createTextNode(content);
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
  }

  setAttribute(name,value){
    this.props[name] = value;
  }

  appendChild(component){
    this.children.push(component);
  }

  get root(){
    if(!this._root){
      this._root = this.render().root;
    }
    return this._root;
  }
}

export function createElement(type,attributes,...children){
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
export function render(component,root) {
  root.appendChild(component.root);
}
