

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
    let found = null;
    for (let item of this._items) {
      if (fn.call(ctx, item) === true) return item;
    }
    return null;
  }

  size () { return this._items.size; }

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
