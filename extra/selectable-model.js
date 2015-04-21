

class SelectableModel extends jaffamvc.Model {
  constructor(models, options) {
    super(models, options);

    this._select = new Selectable(this);
    utils.assign(this, this._select);

    this.select = this._select.select;
    this.deselect = this._select.deselect;
  }
}