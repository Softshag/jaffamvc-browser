

class List  {
  constructor () {
    this._items = new Set();
  }

  add (item) {
    this._items.add(item);
    return this;
  }

  delete (item) {
    this._items.delete(item);
    return this;
  }

  has (item) { return this._items.has(item); }

  clear () {
    this._items.clear();
    return this;
  }

  find (fn, ctx) {
    /*jshint -W084 */
    ctx = ctx||this;
    var item, values = this._items.values();

    while (item = values.next()) {
      if (fn.call(ctx, item.value)) return item.value;
    }
    return null;
  }

  get size () { return this._items.size; }

  onEach (fn, ...args) {
    return this.forEach( item => {
      if (item[fn] && typeof item[fn] === 'function') {
        utils.callFunction(item[fn], item, args);
      }
    });
  }

  forEach (fn, ctx) {
    this._items.forEach(fn, ctx);
    return this;
  }

}
