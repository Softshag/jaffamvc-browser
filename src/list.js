
class List {
  /**
   * Simple list implemntation
   */
  constructor (options={}) {
    this.options = options;
		this._items = [];
		this.length = 0;
		this.onRemove = options.onRemove || this.onRemove;
		this.onAdd = options.onAdd || this.onAdd;
  }

  /**
   * Checks if the list has an object
   * @param {Mixed} item
   * @return {Boolean}
   */
  has (item) {
    /*jslint bitwise: true */
    return ~this._items.indexOf(item);
  }


  add (item) {
    if (!this.has(item)) {
      this._items.push(item);
      this._updateLength.call(this);
      if (this.onAdd) this.onAdd(item);
    }
  }

  remove (item) {
    if (this.has(item)) {
      this._items.splice(this._items.indexOf(item), 1);
      this._updateLength.call(this);
      if (this.onRemove) this.onRemove(item);
    }

  }

  empty () {
    this.forEach(this.remove, this);
    this._items = [];
    this._updateLength.call(this);
  }

  find (fn, ctx) {
    let item;
    for (var i = 0; i < this._items.length; i++ ) {
      item = this._items[i];
      if (fn.call(ctx, item) === true) return item;
    }
    return null;

  }
  forEach (fn, ctx) {
    return this._items.forEach(fn, ctx);
  }

  _updateLength () {
		this.length = this._items.length;
	}

}
