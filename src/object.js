

class BaseClass {
  /**
   * The base of things
   * @constructor Object
   * @memberof JaffaMVC
   * @abstract
   * @mixes JaffaMVC.Events
   */
  constructor () {
    if (typeof this.initialize === 'function') {
      utils.callFunction(this.initialize, this, arguments);
    }
  }

  destroy (...args) {

    if (this.isDestroyed) return;

    this.triggerMethod('before:destroy', args);

    this._isDestroyed = true;

    this.triggerMethod('destroy', args);

    this.stopListening();

    return this;

  }

  get isDestroyed () {
    if (this._isDestroyed == null) {
      this._isDestroyed = false;
    }
    return this._isDestroyed
  }

}

BaseClass.extend = Backbone.extend;
// Mixin events
Object.assign(BaseClass.prototype, Backbone.Events, {
  getOption: utils.getOption,
  triggerMethod: utils.triggerMethod
});

