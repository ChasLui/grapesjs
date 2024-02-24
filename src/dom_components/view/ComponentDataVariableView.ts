import ComponentDataVariable from '../model/ComponentDataVariable';
import ComponentView from './ComponentView';

export default class ComponentDataVariableView extends ComponentView<ComponentDataVariable> {
  initialize(opt = {}) {
    super.initialize(opt);
    const { model, em } = this;
    const { key } = model.attributes;
    this.listenTo(em, key, () => this.postRender());
  }

  postRender() {
    const { key, default: def } = this.model.attributes;
    // this.el.innerHTML = getValue(key, def);
    this.el.innerHTML = def;
    console.log('this.el.innerHTML', { key, def });
    super.postRender();
  }
}
