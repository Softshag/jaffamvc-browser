

class SelectableModel extends jaffamvc.Model {
  constructor(models, options) {
    super(models, options);

    this._select = new Selectable(this);
    utils.extend(this, this._select);

  }
}