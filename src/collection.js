
const Collection = (function (__super) {

  utils.inherits(Collection, __super);

  function Collection (models, options) {
    __super.call(this, models, options);
  }

  utils.assign(Collection.prototype, {
    getOption: utils.getOption,
    triggerMethod: utils.triggerMethod
  });

  return Collection;

})(Backbone.Collection);