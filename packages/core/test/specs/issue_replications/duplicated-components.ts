import Editor from '../../../src/editor/model/Editor';
import ComponentWrapper from '../../../src/dom_components/model/ComponentWrapper';

// https://github.com/GrapesJS/grapesjs/discussions/6314
describe('Duplicated Components', () => {
  let em: Editor;
  let fixtures: HTMLElement;
  let cmpRoot: ComponentWrapper;

  beforeEach(() => {
    em = new Editor({
      mediaCondition: 'max-width',
      avoidInlineStyle: true,
    });
    document.body.innerHTML = '<div id="fixtures"></div>';
    const { Pages, Components } = em;
    Pages.onLoad();
    cmpRoot = Components.getWrapper()!;
    const View = Components.getType('wrapper')!.view;
    const wrapperEl = new View({
      model: cmpRoot,
      config: { ...cmpRoot.config, em },
    });
    wrapperEl.render();
    fixtures = document.body.querySelector('#fixtures')!;
    fixtures.appendChild(wrapperEl.el);
  });

  afterEach(() => {
    em.destroy();
  });

  test('should assert that only 1 component:add event is emitted', (done) => {
    expect.assertions(1);

    em.on('component:add', (component) => {
      expect(component).toBeDefined();

      done();
    });

    cmpRoot.append({
      type: 'text',
      tagName: 'input',
    });
  });
});
