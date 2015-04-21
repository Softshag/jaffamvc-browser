

class SelectableModel extends jaffamvc.Model {
  constructor(models, options) {
    super(models, options);

    this._select = new Selectable(this);
    utils.assign(this, this._select);
  }
}