import { ComponentDefinitionDefined } from './../../../dom_components/model/types';
import { isArray } from 'underscore';
import Component from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions, ComponentProperties } from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import { ConditionDefinition, ConditionalVariableType } from '../conditional_variables/DataCondition';
import DataSource from '../DataSource';
import { DataVariableType } from '../DataVariable';

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
    let items = [];
    switch (true) {
      case isArray(dataSource):
        items = dataSource;
        break;
      case typeof dataSource === 'object' && dataSource instanceof DataSource:
        items = dataSource.getRecords();
        break;
      case typeof dataSource === 'object' && dataSource.type === DataVariableType:
        const resolvedPath = opt.em.DataSources.fromPath(dataSource.path);
        if (typeof resolvedPath[0] === 'object' && resolvedPath[0] instanceof DataSource) {
          items = resolvedPath[0].getRecords();
        } else {
          items = resolvedPath;
        }
        break;
      default:
    }

    const components: ComponentDefinitionDefined[] = items.map((item) => resolveBlockValue(item, block));
    const conditionalCmptDef = {
      ...props,
      type: ConditionalVariableType,
      components: components,
      dropbbable: false,
    };
    // @ts-expect-error
    super(conditionalCmptDef, opt);
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === ConditionalVariableType;
  }
}

function resolveBlockValue(item: any, block: any) {
  const stringifiedItem = JSON.stringify(item);
  const keys = Object.keys(block);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = block[key];
    if (typeof value === 'object') {
      if (value.type === 'parent-collection-variable') {
        if (!value.path || value.path === 'item') {
          block[key] = stringifiedItem;
        } else {
          const arr = value.path.split('.');
          if (item.get) {
            block[key] = item.get?.(arr[0]);
          } else {
            block[key] = item[arr[0]];
          }
        }
      } else {
        block[key] = resolveBlockValue(item, value);
      }
    }
  }
  block['droppable'] = false;
  block['draggable'] = false;
  
  return block;
}
