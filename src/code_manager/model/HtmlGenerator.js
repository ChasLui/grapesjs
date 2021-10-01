import { Model } from 'backbone';

export default class HTMLGenerator extends Model {
  build(model, opts = {}) {
    const models = model.components();
    const htmlOpts = {};
    const { em } = opts;

    // Remove unnecessary IDs
    if (opts.cleanId && em) {
      const rules = em.get('CssComposer').getAll();
      const idRules = rules
        .toJSON()
        .map(rule => {
          const sels = rule.selectors;
          const sel = sels && sels.length === 1 && sels.models[0];
          return sel && sel.isId() && sel.get('name');
        })
        .filter(i => i);

      htmlOpts.attributes = (mod, attrs) => {
        const { id } = attrs;
        if (
          id &&
          id[0] === 'i' && // all autogenerated IDs start with 'i'
          !mod.get('script') && // if the component has script, we have to leave the ID
          !mod.get('attributes').id && // id is not intentionally in attributes
          idRules.indexOf(id) < 0 // we shouldn't have any rule with this ID
        ) {
          delete attrs.id;
        }
        return attrs;
      };
    }

    if (opts.exportWrapper) {
      return model.toHTML({
        ...htmlOpts,
        ...(opts.wrapperIsBody && model.is('wrapper') && { tag: 'body' })
      });
    }

    return this.buildModels(models, htmlOpts);
  }

  buildModels(models, opts = {}) {
    let code = '';
    models.forEach(mod => (code += mod.toHTML(opts)));
    return code;
  }
}