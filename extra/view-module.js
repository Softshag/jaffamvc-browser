/* global jaffamvc:true */

const ViewModule = (function () {

  function ViewModule() {
    var init = this.initialize;

    this.initialize = null;
    jaffamvc.Module.apply(this, arguments);
    this.initialize = init;

    if (typeof this.init === 'function')
      this.addInitializer(this.init);

    if (typeof this.finit === 'function')
      this.addFinalizer(this.finit);

    this.addInitializer('init:layout', this.initLayout);
    this.addFinalizer('deinit:layout', this.deinitLayout);

    this.addInitializer('init:views', this.initViews);
    this.addFinalizer('deinit:views', this.deinitViews);

    if (typeof this.initialize === 'function')
      this.initialize.call(this, this.options);

    this._initRoutes();

  }

  utils.inherits(ViewModule, jaffamvc.Module);

  utils.assign(ViewModule.prototype, {
    route: function (route, name, callback) {
      var slice = [].slice;

      if (arguments.length === 2) {
        callback = name;
        name = route;
      }

      if (this.router == null) {
        this.router = new jaffamvc.Router();
      }

      var self = this;

      this.router.route(route, name, function () {
        var args = slice.call(arguments);

        if (typeof callback === 'function') {
          return utils.callFunction(callback, self, args);
        }


      });
    },
    showInRegion: function (region) {
      let defer = utils.deferred();

      this.listenToOnce(this.layout, 'show', () => {
        this.triggerMethod('show');
        defer.resolve();
      });

      try {
        region.show(this.layout);
      } catch (e) {
        defer.reject(e);
      }

      return defer.promise;
    },
    // ------------------------
    initLayout: function (options) {
      var template = this.getOption('template', options),
        regions = this.getOption('regions', options),
        model = this.getOption('model', options),
        collection = this.getOption('collection', options),
        el = this.getOption('el', options),
        layoutOptions = this.getOption('layoutOptions', options);

      var opts = {};
      if (template) opts.template = template;
      if (regions) opts.regions = regions;
      if (model) opts.model = model;
      if (collection) opts.collection = collection;
      if (el) opts.el = el;

      if (layoutOptions) {
        opts = utils.extend(opts, layoutOptions);
      }


      var LayoutView = this.getOption('layoutView', options) || jaffamvc.LayoutView;

      this.layout = new LayoutView(opts);

      this.listenTo(this.layout, 'destroy', this.stop);

      this.listenTo(this.layout, 'show', function () {
        this.triggerMethod('layout:show');
      });


      var autoRender = this.getOption('autoRender', options);

      if (autoRender === false) {
        return;
      }

      var region = this.getOption('region', options);

      if (region != null) {
        this.showInRegion(region);
      }
    },
    initViews: function () {},
    deinitLayout: function () {
      if (this.layout) {
        this.stopListening(this.layout);
        this.layout.destroy();
        delete this.layout;

      }

    },
    deinitViews: function () {},
    _initRoutes: function () {
      var h, r, results, routes;
      routes = this.getOption('routes');

      if (routes == null) {
        return;
      }
      if (this.router != null) {
        return;
      }

      for (r in routes) {
        h = routes[r];
        if (typeof h === 'string') {
          h = this[h];
        }
        this.route(r, h);
      }
    },
  });

  return ViewModule;

})();