import { ObjectAny } from '../../common';
import EditorModel from '../../editor/model/Editor';
import Component, { dynamicAttrKey } from './Component';
import { DynamicValueWatcher } from './DynamicValueWatcher';

export class ComponentDynamicValueListener {
  propertyWatchClass: DynamicValueWatcher;
  attributeWatchClass: DynamicValueWatcher;
  traitsWatchClass: DynamicValueWatcher;

  constructor(
    private component: Component,
    em: EditorModel,
  ) {
    this.propertyWatchClass = new DynamicValueWatcher((key: string, value: any) => {
      this.component.set(key, value, { updateDynamicWatchers: false });
    }, em);

    this.attributeWatchClass = new DynamicValueWatcher((key: string, value: any) => {
      this.component.setAttributes({ [key]: value }, { updateDynamicWatchers: false });
    }, em);

    this.traitsWatchClass = new DynamicValueWatcher((key: string, value: any) => {
      this.component.updateTrait(key, { value });
      const trait = this.component.getTrait(key);
      trait.setTargetValue(value);
    }, em);
  }

  static evaluateComponentDef(values: ObjectAny, em: EditorModel) {
    const props = DynamicValueWatcher.getStaticValues(values, em);

    if (values.attributes) {
      props.attributes = DynamicValueWatcher.getStaticValues(values.attributes, em);
    }

    if (Array.isArray(values[dynamicAttrKey]) && values[dynamicAttrKey].length > 0) {
      values.traits = values.traits
        ? [...values[dynamicAttrKey], ...values.traits]
        : values[dynamicAttrKey];
    }

    if (values.traits) {
      const evaluatedTraitsValues = DynamicValueWatcher.getStaticValues(
        values.traits.map((trait: any) => trait.value),
        em
      );

      props.traits = values.traits.map((trait: any, index: number) => ({
        ...trait,
        value: evaluatedTraitsValues[index]
      }));
    }

    return props;
  }

  watchComponentDef(values: ObjectAny) {
    this.watchProps(values);
    this.watchAttributes(values.attributes);
    this.watchTraits(values.traits);
  }

  watchProps(props: ObjectAny) {
    this.propertyWatchClass.removeListeners(Object.keys(props));
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

  watchTraits(traits: (string | ObjectAny)[]) {
    const evaluatedTraits: { [key: string]: ObjectAny } = {}
    traits?.forEach((trait: any) => {
      if (typeof trait === 'string' || !trait.name) {
        return;
      } else if (typeof trait === 'object') {
        evaluatedTraits[trait.name] = trait.value;
      }
    });
    this.traitsWatchClass.watchDynamicValue(evaluatedTraits);
  }

  removeAttributes(attributes: string[]) {
    this.attributeWatchClass.removeListeners(attributes);
  }

  getAttributesDefsOrValues(attributes: ObjectAny) {
    return this.attributeWatchClass.getSerializableValues(attributes);
  }

  getTraitsDefs() {
    return this.traitsWatchClass.getAllSerializableValues();
  }

  getPropsDefsOrValues(props: ObjectAny) {
    return this.propertyWatchClass.getSerializableValues(props);
  }

  destroy() {
    this.propertyWatchClass.removeListeners();
    this.attributeWatchClass.removeListeners();
    this.traitsWatchClass.removeListeners();
  }
}
