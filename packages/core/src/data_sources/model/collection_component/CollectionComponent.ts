import { isArray } from 'underscore';
import Component from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions, ComponentProperties } from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import { ConditionDefinition, ConditionalVariableType } from '../conditional_variables/DataCondition';
import DataSource from '../DataSource';

export const CollectionVariableType = 'collection-variable';
// Represents the type for defining a loop’s data source.
type CollectionDataSource =
  | any[]  // Direct array
  | { type: 'datasource-variable'; path: string }  // Object representing a data source
  | { type: 'parent-collection-variable'; path: string };  // Object representing an outer loop variable

// Defines the collection's configuration, such as start and end indexes, and data source.
interface CollectionConfig {
  startIndex?: number;  // The starting index for the collection
  endIndex?: number | ConditionDefinition;  // End index; can be absolute or relative (If omitted will loop over all items)
  dataSource: CollectionDataSource;  // The data source (array or object reference)
}

// Provides access to collection state variables during iteration.
interface CollectionStateVariables {
  currentIndex: number;  // Current collection index
  firstIndex: number;  // Start index
  currentItem: any;  // Current item in the iteration
  lastIndex: number;  // End index
  collectionName?: string;  // Optional name of the collection
  totalItems: number;  // Total number of items in the collection
  remainingItems: number; // Remaining items in the collection
}

// Defines the complete structure for a collection, including configuration and state variables.
interface CollectionDefinition {
  type: typeof CollectionVariableType;
  collectionName?: string;  // Optional collection name
  config: CollectionConfig;  // Loop configuration details
  block: ComponentDefinition;  // Component definition for each iteration
}

export default class CollectionComponent extends Component {
  constructor(props: CollectionDefinition & ComponentProperties, opt: ComponentOptions) {
    const { block, config } = props.collectionDefinition;
    const { dataSource } = config;
    console.log("🚀 ~ CollectionComponent ~ constructor ~ dataSource:", dataSource);
    let items = [];
    switch (true) {
      case isArray(dataSource):
        items = dataSource;
        break;
      case typeof dataSource === 'object' && dataSource instanceof DataSource:
        items = dataSource.getRecords();
        console.log("🚀 ~ CollectionComponent ~ constructor ~ items:", items)
        break;
      default:
    }
    const components = items.map((item) => block(item));
    const conditionalCmptDef = {
      type: ConditionalVariableType,
      components: components,
      // ...super.defaults
    };
    //@ts-ignore
    super(conditionalCmptDef, opt);
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === ConditionalVariableType;
  }
}
