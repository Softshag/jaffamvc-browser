

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
    ctx = ctx||this;
    var item;
    for (let i=0;i<this._items.size; i++) {
      item = this._items[i];
      if (fn.call(ctx, item)) return item;
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
