import Editor from '../../../../src/editor/model/Editor';
import DataSourceManager from '../../../../src/data_sources';
import ComponentWrapper from '../../../../src/dom_components/model/ComponentWrapper';
import { DataVariableType } from '../../../../src/data_sources/model/DataVariable';
import { setupTestEditor } from '../../../common';
import { Component } from '../../../../src';

const staticAttributeValue = 'some tiltle';
describe('TraitDataVariable', () => {
  let em: Editor;
  let dsm: DataSourceManager;
  let cmpRoot: ComponentWrapper;
  const staticAttributes = {
    staticAttribute: staticAttributeValue,
  };

  beforeEach(() => {
    ({ em, dsm, cmpRoot } = setupTestEditor());
  });

  afterEach(() => {
    em.destroy();
  });

  describe('dynamic attributes', () => {
    test('static and dynamic attributes', () => {
      const inputDataSource = {
        id: 'ds_id',
        records: [{ id: 'id1', value: 'test-value' }],
      };
      dsm.add(inputDataSource);

      const attributes = {
        ...staticAttributes,
        dynamicAttribute: {
          type: DataVariableType,
          defaultValue: 'default',
          path: 'ds_id.id1.value',
        },
      };
      const cmp = cmpRoot.append({
        tagName: 'input',
        attributes,
      })[0];

      testAttribute(cmp, 'dynamicAttribute', 'test-value');
      testStaticAttributes(cmp);
    });

    test('dynamic attributes should listen to change', () => {
      const dataSource = {
        id: 'ds_id',
        records: [{ id: 'id1', value: 'test-value' }],
      };
      dsm.add(dataSource);

      const attributes = {
        ...staticAttributes,
        dynamicAttribute: {
          type: DataVariableType,
          defaultValue: 'default',
          path: 'ds_id.id1.value',
        },
      };
      const cmp = cmpRoot.append({
        tagName: 'input',
        attributes,
      })[0];

      testAttribute(cmp, 'dynamicAttribute', 'test-value');
      testStaticAttributes(cmp);

      changeDataSourceValue(dsm);
      testAttribute(cmp, 'dynamicAttribute', 'changed-value');
    });

    test('dynamic attributes should listen to the latest dynamic value', () => {
      const dataSource = {
        id: 'ds_id',
        records: [
          { id: 'id1', value: 'test-value' },
          { id: 'id2', value: 'test-value' },
        ],
      };
      dsm.add(dataSource);

      const attributes = {
        ...staticAttributes,
        dynamicAttribute: {
          type: DataVariableType,
          defaultValue: 'default',
          path: 'ds_id.id1.value',
        },
      };
      const cmp = cmpRoot.append({
        tagName: 'input',
        attributes,
      })[0];

      cmp.addAttributes({
        dynamicAttribute: {
          type: DataVariableType,
          defaultValue: 'default',
          path: 'ds_id.id2.value',
        },
      });
      changeDataSourceValue(dsm);
      testAttribute(cmp, 'dynamicAttribute', 'test-value');
    });

    test('dynamic attributes should stop listening to change if the value changed to static', () => {
      const dataSource = {
        id: 'ds_id',
        records: [{ id: 'id1', value: 'test-value' }],
      };
      dsm.add(dataSource);

      const attributes = {
        ...staticAttributes,
        dynamicAttribute: {
          type: DataVariableType,
          defaultValue: 'default',
          path: 'ds_id.id1.value',
        },
      };
      const cmp = cmpRoot.append({
        tagName: 'input',
        attributes,
      })[0];

      testAttribute(cmp, 'dynamicAttribute', 'test-value');
      testStaticAttributes(cmp);

      cmp.setAttributes({
        dynamicAttribute: 'static-value',
      });
      changeDataSourceValue(dsm);
      testAttribute(cmp, 'dynamicAttribute', 'static-value');
    });

    test('dynamic attributes should stop listening to change if the value changed to dynamic value', () => {
      const dataSource = {
        id: 'ds_id',
        records: [{ id: 'id1', value: 'test-value' }],
      };
      dsm.add(dataSource);

      const attributes = {
        ...staticAttributes,
        dynamicAttribute: 'static-value',
      };
      const cmp = cmpRoot.append({
        tagName: 'input',
        attributes,
      })[0];

      cmp.setAttributes({
        dynamicAttribute: {
          type: DataVariableType,
          defaultValue: 'default',
          path: 'ds_id.id1.value',
        },
      });
      testAttribute(cmp, 'dynamicAttribute', 'test-value');
      changeDataSourceValue(dsm);
      testAttribute(cmp, 'dynamicAttribute', 'changed-value');
    });

    test('dynamic attributes should stop listening to change if the attribute was removed', () => {
      const dataSource = {
        id: 'ds_id',
        records: [{ id: 'id1', value: 'test-value' }],
      };
      dsm.add(dataSource);

      const attributes = {
        ...staticAttributes,
        dynamicAttribute: {
          type: DataVariableType,
          defaultValue: 'default',
          path: 'ds_id.id1.value',
        },
      };
      const cmp = cmpRoot.append({
        tagName: 'input',
        attributes,
      })[0];

      testAttribute(cmp, 'dynamicAttribute', 'test-value');
      testStaticAttributes(cmp);

      cmp.removeAttributes('dynamicAttribute');
      changeDataSourceValue(dsm);
      expect(cmp?.getAttributes()['dynamicAttribute']).toBe(undefined);
      const input = cmp.getEl();
      expect(input?.getAttribute('dynamicAttribute')).toBe(null);
    });
  });
});

function changeDataSourceValue(dsm: DataSourceManager) {
  dsm.get('ds_id').getRecord('id1')?.set('value', 'changed-value');
}

function testStaticAttributes(cmp: Component) {
  testAttribute(cmp, 'staticAttribute', staticAttributeValue);
}

function testAttribute(cmp: Component, attribute: string, value: string) {
  expect(cmp?.getAttributes()[attribute]).toBe(value);
  const input = cmp.getEl();
  expect(input?.getAttribute(attribute)).toBe(value);
}
