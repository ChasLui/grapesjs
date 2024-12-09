import { ObjectAny } from '../../common';
import { evaluateDynamicValueDefinition, isDynamicValueDefinition } from '../../data_sources/model/utils';
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

  static evaluateComponentDef(
    values: {
      [key: string]: any;
    },
    em: EditorModel,
  ) {
    const props = DynamicValueWatcher.getStaticValues(values, em);
    props.attributes = DynamicValueWatcher.getStaticValues(props.attributes, em);

    return props;
  }

  watchComponentDef(values: { [key: string]: any }) {
    this.watchProps(values);
    this.watchAttributes(values.attributes);
  }

  watchProps(props: ObjectAny) {
    this.propertyWatchClass.watchDynamicValue(props);
  }

  setAttributes(attributes: ObjectAny) {
    this.attributeWatchClass.removeListeners();
    this.attributeWatchClass.watchDynamicValue(attributes);
  }

  removeAttributes(attrArr: string[]) {
    this.attributeWatchClass.removeListeners(attrArr);
  }

  watchAttributes(attributes: ObjectAny) {
    this.attributeWatchClass.watchDynamicValue(attributes);
  }
}
