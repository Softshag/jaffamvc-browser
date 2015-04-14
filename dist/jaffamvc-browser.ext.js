/*!
 * JaffaMVC.Ext.js 0.1.4
 * (c) 2015 Rasmus Kildevæld, Softshag.
 * Inspired and based on Backbone.Marionette.js
 * (c) 2014 Derick Bailey, Muted Solutions, LLC.
 * (c) 2014 Adam Krebs, Jimmy Yuen Ho Wong
 * JaffaMVC may be freely distributed under the MIT license.
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jaffamvc'], factory);
  } else if (typeof exports === 'object') {
    var jaffamvc = require('jaffamvc-browser')
    module.exports = factory(jaffamvc);
  } else {
    root.JaffaMVC = factory(root.JaffaMVC);
  }
}(this, function(jaffamvc) {

  "use strict";


  var utils = jaffamvc.utils;

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
    route: function(route, name, callback) {
      var slice = [].slice;

      if (arguments.length === 2) {
        callback = name;
        name = route;
      }

      if (this.router == null) {
        this.router = new jaffamvc.Router();
      }
      console.log(route, name, callback)
      var self = this;

      this.router.route(route, name, function() {
        var args = slice.call(arguments);

        var fn = function() {
          if (typeof callback === 'function') {
            return utils.callFunction(callback, self, args);
          }
        };


        if (self.isRunning) {
          fn();
        } else {
          self.start().then(function() {
            fn();
          })['catch'](function(err) {
            self.app.trigger('error', err);
          });
        }

      });
    },
    showInRegion: function(region) {
      region.show(this.layout);
    },
    // ------------------------
    initLayout: function(options) {
      var template = this.getOption('template', options),
        regions = this.getOption('regions', options),
        model = this.getOption('model', options),
        collection = this.getOption('collection', options);

      var opts = {};
      if (template) opts.template = template;
      if (regions) opts.regions = regions;
      if (model) opts.model = model;
      if (collection) opts.collection = collection;

      var LayoutView = this.getOption('layoutView', options) || jaffamvc.LayoutView;

      this.layout = new LayoutView(opts);

      this.listenTo(this.layout, 'destroy', this.stop);

      var autoRender = this.getOption('autoRender', options);

      if (autoRender === false) {
        return;
      }

      var region = this.getOption('region', options);

      if (region != null) {
        region.show(this.layout);
      }
    },
    initViews: function() {},
    deinitLayout: function() {
      if (this.layout) {
        this.stopListening(this.layout);
        this.layout.destroy();
        delete this.layout;

      }

    },
    deinitViews: function() {},
    _initRoutes: function() {
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

  jaffamvc.ViewModule = ViewModule;


  return jaffamvc;

}));
