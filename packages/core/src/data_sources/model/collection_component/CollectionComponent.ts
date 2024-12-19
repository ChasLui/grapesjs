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
  start_index?: number;  // The starting index for the collection
  end_index?: number | ConditionDefinition;  // End index; can be absolute or relative (If omitted will loop over all items)
  dataSource: CollectionDataSource;  // The data source (array or object reference)
}

// Provides access to collection state variables during iteration.
interface CollectionStateVariables {
  current_index: number;  // Current collection index
  start_index: number;  // Start index
  current_item: any;  // Current item in the iteration
  end_index: number;  // End index
  collection_name?: string;  // Optional name of the collection
  total_items: number;  // Total number of items in the collection
  remaining_items: number; // Remaining items in the collection
}

// Defines the complete structure for a collection, including configuration and state variables.
interface CollectionDefinition {
  type: typeof CollectionVariableType;
  collection_name?: string;  // Optional collection name
  config: CollectionConfig;  // Loop configuration details
  block: ComponentDefinition;  // Component definition for each iteration
}

export default class CollectionComponent extends Component {
  constructor(props: CollectionDefinition & ComponentProperties, opt: ComponentOptions) {
    const { collection_name, block, config } = props.collectionDefinition;
    const {
      start_index = 0,
      end_index = Number.MAX_VALUE,
      dataSource = [],
    } = config
    let items: CollectionStateVariables[] = [];
    switch (true) {
      case isArray(dataSource):
        items = dataSource;
        break;
      case typeof dataSource === 'object' && dataSource instanceof DataSource:
        const id = dataSource.get('id')!;
        const resolvedPath = opt.em.DataSources.getValue(id, []);
        const keys = Object.keys(resolvedPath);
        items = keys.map(key => resolvedPath[key]);
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

    const components: ComponentDefinitionDefined[] = items.map((item: CollectionStateVariables, index) => {
      const innerMostCollectionItem = {
        collection_name,
        current_index: index,
        current_item: item,
        start_index,
        end_index,
        total_items: items.length,
        remaining_items: items.length - (index + 1),
      };

      const allCollectionItems = {
        ...props.collectionsItems,
        [innerMostCollectionItem.collection_name ? innerMostCollectionItem.collection_name : 'innerMostCollectionItem']:
          innerMostCollectionItem,
        innerMostCollectionItem
      }

      let components = resolveBlockValues(allCollectionItems, block);
      components['collectionsItems'] = allCollectionItems;

      return components;
    });

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

function resolveBlockValues(context: any, block: any): any {
  const { innerMostCollectionItem } = context;
  const clonedBlock = deepCloneObject(block);

  if (typeof clonedBlock === 'object' && clonedBlock !== null) {
    const blockKeys = Object.keys(clonedBlock);

    for (const key of blockKeys) {
      let blockValue = clonedBlock[key];

      if (typeof blockValue === 'object' && blockValue !== null) {
        if (blockValue.type === 'parent-collection-variable') {
          const collectionItem = blockValue.collection_name
            ? context[blockValue.collection_name]
            : innerMostCollectionItem;
          if (!collectionItem) continue;

          switch (blockValue.variable_type) {
            case 'current_item':
              clonedBlock[key] = blockValue.path
                ? resolvePathValue(collectionItem.current_item, blockValue.path)
                : JSON.stringify(collectionItem.current_item);
              break;
            default:
              clonedBlock[key] = collectionItem[blockValue.variable_type];
              break; // Handle unexpected variable types gracefully
          }
        } else if (Array.isArray(blockValue)) {
          // Resolve each item in the array
          clonedBlock[key] = blockValue.map((arrayItem: any) =>
            typeof arrayItem === 'object' ? resolveBlockValues(context, arrayItem) : arrayItem
          );
        } else {
          clonedBlock[key] = resolveBlockValues(context, blockValue);
        }
      }
    }
  }

  return clonedBlock;
}

function resolvePathValue(object: any, path: string): any {
  const pathSegments = path.split('.');
  let resolvedValue = object;

  for (const segment of pathSegments) {
    if (resolvedValue && typeof resolvedValue === 'object' && segment in resolvedValue) {
      resolvedValue = resolvedValue[segment];
    } else {
      return undefined; // Return undefined if the path doesn't exist
    }
  }

  return resolvedValue;
}
