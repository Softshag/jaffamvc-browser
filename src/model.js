

const Model = (function (__super) {

  utils.inherits(Model, __super);

  function Model (models, options) {
    __super.call(this, models, options);
  }

  utils.assign(Model.prototype, {
    getOption: utils.getOption,
    triggerMethod: utils.triggerMethod
  });

  return Model;

})(Backbone.Model);