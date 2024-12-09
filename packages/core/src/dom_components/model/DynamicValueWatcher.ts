import { ObjectAny } from '../../common';
import DynamicVariableListenerManager from '../../data_sources/model/DataVariableListenerManager';
import { evaluateDynamicValueDefinition, isDynamicValueDefinition } from '../../data_sources/model/utils';
import EditorModel from '../../editor/model/Editor';

export class DynamicValueWatcher {
  dynamicVariableListeners: { [key: string]: DynamicVariableListenerManager } = {};
  constructor(
    private updateFn: (key: string, value: any) => void,
    private em: EditorModel,
  ) {}

  static getStaticValues(
    values: {
      [key: string]: any;
    },
    em: EditorModel,
  ) {
    const evaluatedValues = { ...values };
    const propsKeys = Object.keys(evaluatedValues);
    for (let index = 0; index < propsKeys.length; index++) {
      const key = propsKeys[index];
      if (!isDynamicValueDefinition(evaluatedValues[key])) continue;
      const { value } = evaluateDynamicValueDefinition(evaluatedValues[key], em);
      evaluatedValues[key] = value;
    }

    return evaluatedValues;
  }

  static areStaticValues(values: ObjectAny) {
    return Object.keys(values).every((key) => {
      return !isDynamicValueDefinition(values[key]);
    });
  }

  watchDynamicValue(values: ObjectAny) {
    const dynamicProps = this.getDynamicValues(values);
    const propsKeys = Object.keys(dynamicProps);
    for (let index = 0; index < propsKeys.length; index++) {
      const key = propsKeys[index];

      this.dynamicVariableListeners[key] = new DynamicVariableListenerManager({
        em: this.em,
        dataVariable: dynamicProps[key],
        updateValueFromDataVariable: (value: any) => {
          this.updateFn.bind(this)(key, value);
        },
      });
    }

    return dynamicProps;
  }

  private getDynamicValues(values: ObjectAny) {
    const dynamicValues = { ...values };
    const propsKeys = Object.keys(dynamicValues);
    for (let index = 0; index < propsKeys.length; index++) {
      const key = propsKeys[index];
      if (!isDynamicValueDefinition(dynamicValues[key])) {
        delete dynamicValues[key];
        continue;
      }
      const { variable } = evaluateDynamicValueDefinition(dynamicValues[key], this.em);
      dynamicValues[key] = variable;
    }

    return dynamicValues;
  }

  /**
   * removes listeners to stop watching for changes,
   * if keys argument is omitted, remove all listeners
   * @argument keys
   */
  removeListeners(keys?: string[]) {
    const propsKeys = keys ? keys : Object.keys(this.dynamicVariableListeners);
    propsKeys.forEach((key) => this.dynamicVariableListeners[key].destroy());
  }

  getSerializableValues(values: ObjectAny) {
    const serializableValues = { ...values };
    const propsKeys = Object.keys(serializableValues);
    for (let index = 0; index < propsKeys.length; index++) {
      const key = propsKeys[index];
      if (this.dynamicVariableListeners[key]) {
        serializableValues[key] = this.dynamicVariableListeners[key].dynamicVariable.toJSON();
        continue;
      }
    }

    return serializableValues;
  }

  getAllSerializableValues() {
    const serializableValues: ObjectAny = {};
    const propsKeys = Object.keys(this.dynamicVariableListeners);
    for (let index = 0; index < propsKeys.length; index++) {
      const key = propsKeys[index];
      serializableValues[key] = this.dynamicVariableListeners[key].dynamicVariable.toJSON();
    }

    return serializableValues;
  }
}
