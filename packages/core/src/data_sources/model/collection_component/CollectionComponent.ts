import { ComponentDefinitionDefined } from './../../../dom_components/model/types';
import { isArray } from 'underscore';
import Component from '../../../dom_components/model/Component';
import { ComponentDefinition, ComponentOptions, ComponentProperties } from '../../../dom_components/model/types';
import { toLowerCase } from '../../../utils/mixins';
import { ConditionDefinition } from '../conditional_variables/DataCondition';
import DataSource from '../DataSource';
import { DataVariableType } from '../DataVariable';

export const CollectionVariableType = 'collection-component';
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
    let items: any[] = [];
    switch (true) {
      case isArray(dataSource):
        items = dataSource;
        break;
      case typeof dataSource === 'object' && dataSource instanceof DataSource:
        items = dataSource.getRecords();
        break;
      case typeof dataSource === 'object' && dataSource.type === DataVariableType:
        const pathArr = dataSource.path.split('.');
        if (pathArr.length === 1) {
          const resolvedPath = opt.em.DataSources.getValue(dataSource.path, []);
          const keys = Object.keys(resolvedPath);
          items = keys.map(key => resolvedPath[key]);
        } else {
          items = opt.em.DataSources.getValue(dataSource.path, []);
        }
        break;
      default:
    }

    const components: ComponentDefinitionDefined[] = items.map((item: any, index) => resolveBlockValue({
      currentIndex: index,
      firstIndex: config.startIndex,
      currentItem: item,
      lastIndex: config.endIndex,
      collectionName: props.collectionName,
      totalItems: items.length,
      remainingItems: items.length - index,
    }, block)
    );
    const conditionalCmptDef = {
      ...props,
      type: CollectionVariableType,
      components: components,
      dropbbable: false,
    };
    // @ts-expect-error
    super(conditionalCmptDef, opt);
  }

  static isComponent(el: HTMLElement) {
    return toLowerCase(el.tagName) === CollectionVariableType;
  }
}

/**
 * Deeply clones an object.
 * @template T The type of the object to clone.
 * @param {T} obj The object to clone.
 * @returns {T} A deep clone of the object, or the original object if it's not an object or is null. Returns undefined if input is undefined.
 */
function deepCloneObject<T extends Record<string, any> | null | undefined>(obj: T): T {
  if (obj === null) return null as T;
  if (obj === undefined) return undefined as T;
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return obj; // Return primitives directly
  }

  const clonedObj: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepCloneObject(obj[key]);
    }
  }

  return clonedObj as T;
}

function resolveBlockValue(item: any, block: any): any {
  const clonedBlock = deepCloneObject(block);

  if (typeof clonedBlock === 'object' && clonedBlock !== null) {
    const stringifiedItem = JSON.stringify(item.currentItem);
    const keys = Object.keys(clonedBlock);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      let value = clonedBlock[key];

      if (typeof value === 'object') {
        if (value.type === 'parent-collection-variable') {
          if (value.variable_type === 'current_item') {
            if (!value.path) {
              clonedBlock[key] = stringifiedItem;
            } else {
              const pathParts = value.path.split('.');
              let resolvedValue = item.currentItem;
              for (const part of pathParts) {
                if (resolvedValue && typeof resolvedValue === 'object' && resolvedValue.hasOwnProperty(part)) {
                  resolvedValue = resolvedValue[part];
                } else {
                  resolvedValue = undefined; // Handle cases where the path doesn't exist
                  break;
                }
              }
              clonedBlock[key] = resolvedValue;
            }
          } else if (value.variable_type === 'current_index') {
            clonedBlock[key] = String(item.currentIndex);
          } else if (value.variable_type === 'first_index') {
            clonedBlock[key] = String(item.firstIndex);
          } else if (value.variable_type === 'last_index') {
            clonedBlock[key] = String(item.lastIndex);
          } else if (value.variable_type === 'collection_name') {
            clonedBlock[key] = String(item.collectionName);
          } else if (value.variable_type === 'total_items') {
            clonedBlock[key] = String(item.totalItems);
          } else if (value.variable_type === 'remaining_items') {
            clonedBlock[key] = String(item.remainingItems);
          }
        } else if (Array.isArray(value)) {
          // Handle arrays: Resolve each item in the array
          clonedBlock[key] = value.map((itemInArray: any) => {
            if (typeof itemInArray === 'object') {
              return resolveBlockValue(item, itemInArray);
            }

            return itemInArray; // Return primitive values directly
          });
        } else {
          clonedBlock[key] = resolveBlockValue(item, value);
        }
      }
    }
  }

  return clonedBlock;
}
