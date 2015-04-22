/* global jaffamvc:true */

class SelectableCollection extends jaffamvc.Collection {
  constructor(models, options) {
    options = options||{};
    super(models, options);

    this.options = options;

    if (this.getOption('multi') === true) {
      this._select = new MultiSelect(this);
    } else {
      this._select = new SingleSelect(this);
    }

    utils.extend(this, this._select);

  }
  _addReference (model, options) {
    super(model, options)

    if (!model._select) {
      model._select = new Selectable(model);
      utils.extend(model, model._select);
    }
  }
}