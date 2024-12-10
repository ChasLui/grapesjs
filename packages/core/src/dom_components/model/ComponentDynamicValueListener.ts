import { ObjectAny } from '../../common';
import EditorModel from '../../editor/model/Editor';
import Component from './Component';
import { DynamicValueWatcher } from './DynamicValueWatcher';

export class ComponentDynamicValueListener {
  propertyWatchClass: DynamicValueWatcher;
  attributeWatchClass: DynamicValueWatcher;

  constructor(
    private component: Component,
    em: EditorModel,
  ) {
    this.propertyWatchClass = new DynamicValueWatcher((key: string, value: any) => {
      this.component.set(key, value);
    }, em);

    this.attributeWatchClass = new DynamicValueWatcher((key: string, value: any) => {
      this.component.setAttributes({ [key]: value });
    }, em);
  }

  static evaluateComponentDef(values: ObjectAny, em: EditorModel) {
    const props = DynamicValueWatcher.getStaticValues(values, em);
    if (values.attributes) {
      props.attributes = DynamicValueWatcher.getStaticValues(values.attributes, em);
    }

    return props;
  }

  watchComponentDef(values: ObjectAny) {
    this.watchProps(values);
    this.watchAttributes(values.attributes);
  }

  watchProps(props: ObjectAny) {
    this.propertyWatchClass.watchDynamicValue(props);
  }

  getDynamicPropsDefs() {
    return this.propertyWatchClass.getAllSerializableValues();
  }

  setAttributes(attributes: ObjectAny) {
    this.attributeWatchClass.removeListeners();
    this.attributeWatchClass.watchDynamicValue(attributes);
  }

  watchAttributes(attributes: ObjectAny) {
    this.attributeWatchClass.watchDynamicValue(attributes);
  }

  removeAttributes(attributes: string[]) {
    this.attributeWatchClass.removeListeners(attributes);
  }

  getAttributesDefsOrValues(attributes: ObjectAny) {
    return this.attributeWatchClass.getSerializableValues(attributes);
  }
}
