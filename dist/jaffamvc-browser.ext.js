/*!
 * JaffaMVC.Ext.js 0.2.10
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

  var utils = jaffamvc.utils,
    __slice = Array.prototype.slice;


  var _inherits = function(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) subClass.__proto__ = superClass;
  };

  var _classCallCheck = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var SingleSelect = (function() {

    function SingleSelect(collection) {
      this.collection = collection;
    }

    utils.assign(SingleSelect.prototype, {

      // Select a model, deselecting any previously
      // selected model
      select: function select(model) {
        if (model && this.selected === model) {
          return;
        }

        this.deselect();

        this.selected = model;
        this.selected.select();
        this.trigger("select:one", model);
      },

      // Deselect a model, resulting in no model
      // being selected
      deselect: function deselect(model) {
        if (!this.selected) {
          return;
        }

        model = model || this.selected;
        if (this.selected !== model) {
          return;
        }

        this.selected.deselect();
        this.trigger("deselect:one", this.selected);
        delete this.selected;
      }

    });

    return SingleSelect;
  })();

  var MultiSelect = (function() {
    function MultiSelect(collection) {
      this.collection = collection;
      this.selected = {};
    }

    utils.assign(MultiSelect.prototype, {

      // Select a specified model, make sure the
      // model knows it's selected, and hold on to
      // the selected model.
      select: function select(model) {
        if (this.selected[model.cid]) {
          return;
        }

        this.selected[model.cid] = model;
        model.select();
        calculateSelectedLength(this);
      },

      // Deselect a specified model, make sure the
      // model knows it has been deselected, and remove
      // the model from the selected list.
      deselect: function deselect(model) {
        if (!this.selected[model.cid]) {
          return;
        }

        delete this.selected[model.cid];
        model.deselect();
        calculateSelectedLength(this);
      },

      // Select all models in this collection
      selectAll: function selectAll() {
        this.each(function(model) {
          model.select();
        });
        calculateSelectedLength(this);
      },

      // Deselect all models in this collection
      selectNone: function selectNone() {
        if (this.selectedLength === 0) {
          return;
        }
        this.each(function(model) {
          model.deselect();
        });
        calculateSelectedLength(this);
      },

      // Toggle select all / none. If some are selected, it
      // will select all. If all are selected, it will select
      // none. If none are selected, it will select all.
      toggleSelectAll: function toggleSelectAll() {
        if (this.selectedLength === this.length) {
          this.selectNone();
        } else {
          this.selectAll();
        }
      }
    });

    // Helper Methods
    // --------------

    // Calculate the number of selected items in a collection
    // and update the collection with that length. Trigger events
    // from the collection based on the number of selected items.
    var calculateSelectedLength = function calculateSelectedLength(collection) {
      collection.selectedLength = Object.keys(collection.selected).length;

      var selectedLength = collection.selectedLength;
      var length = collection.length;

      if (selectedLength === length) {
        collection.trigger("select:all", collection);
        return;
      }

      if (selectedLength === 0) {
        collection.trigger("select:none", collection);
        return;
      }

      if (selectedLength > 0 && selectedLength < length) {
        collection.trigger("select:some", collection);
        return;
      }
    };

    return MultiSelect;
  })();

  var Selectable = (function() {

    function Selectable(model) {
      this.model = model;
    }

    utils.assign(Selectable.prototype, {

      // Select this model, and tell our
      // collection that we're selected
      select: function select() {
        if (this.selected) {
          return;
        }

        this.selected = true;
        this.trigger("selected", this);

        if (this.collection) {
          this.collection.select(this);
        }
      },

      // Deselect this model, and tell our
      // collection that we're deselected
      deselect: function deselect() {
        if (!this.selected) {
          return;
        }

        this.selected = false;
        this.trigger("deselected", this);

        if (this.collection) {
          this.collection.deselect(this);
        }
      },

      // Change selected to the opposite of what
      // it currently is
      toggleSelected: function toggleSelected() {
        if (this.selected) {
          this.deselect();
        } else {
          this.select();
        }
      }
    });

    return Selectable;
  })();
  /* global jaffamvc:true */

  var ViewModule = (function() {

    function ViewModule() {
      var init = this.initialize;

      this.initialize = null;
      jaffamvc.Module.apply(this, arguments);
      this.initialize = init;

      if (typeof this.init === "function") this.addInitializer(this.init);

      if (typeof this.finit === "function") this.addFinalizer(this.finit);

      this.addInitializer("init:layout", this.initLayout);
      this.addFinalizer("deinit:layout", this.deinitLayout);

      this.addInitializer("init:views", this.initViews);
      this.addFinalizer("deinit:views", this.deinitViews);

      if (typeof this.initialize === "function") this.initialize.call(this, this.options);

      this._initRoutes();
    }

    utils.inherits(ViewModule, jaffamvc.Module);

    utils.assign(ViewModule.prototype, {
      route: (function(_route) {
        var _routeWrapper = function route(_x, _x2, _x3) {
          return _route.apply(this, arguments);
        };

        _routeWrapper.toString = function() {
          return _route.toString();
        };

        return _routeWrapper;
      })(function(route, name, callback) {
        var slice = [].slice;

        if (arguments.length === 2) {
          callback = name;
          name = route;
        }

        if (this.router == null) {
          this.router = new jaffamvc.Router();
        }

        var self = this;

        this.router.route(route, name, function() {
          var args = slice.call(arguments);

          if (typeof callback === "function") {
            return utils.callFunction(callback, self, args);
          }
        });
      }),
      showInRegion: function showInRegion(region) {
        region.show(this.layout);
      },
      // ------------------------
      initLayout: function initLayout(options) {
        var template = this.getOption("template", options),
          regions = this.getOption("regions", options),
          model = this.getOption("model", options),
          collection = this.getOption("collection", options),
          el = this.getOption("el", options),
          layoutOptions = this.getOptions("layoutOptions", options);

        var opts = {};
        if (template) opts.template = template;
        if (regions) opts.regions = regions;
        if (model) opts.model = model;
        if (collection) opts.collection = collection;
        if (el) opts.el = el;

        if (layoutOptions) {
          opts = utils.extend(opts, layoutOptions);
        }

        var LayoutView = this.getOption("layoutView", options) || jaffamvc.LayoutView;

        this.layout = new LayoutView(opts);

        this.listenTo(this.layout, "destroy", this.stop);

        this.listenTo(this.layout, "show", function() {
          this.triggerMethod("layout:show");
        });

        var autoRender = this.getOption("autoRender", options);

        if (autoRender === false) {
          return;
        }

        var region = this.getOption("region", options);

        if (region != null) {
          this.showInRegion(region);
        }
      },
      initViews: function initViews() {},
      deinitLayout: function deinitLayout() {
        if (this.layout) {
          this.stopListening(this.layout);
          this.layout.destroy();
          delete this.layout;
        }
      },
      deinitViews: function deinitViews() {},
      _initRoutes: function _initRoutes() {
        var h, r, results, routes;
        routes = this.getOption("routes");

        if (routes == null) {
          return;
        }
        if (this.router != null) {
          return;
        }

        for (r in routes) {
          h = routes[r];
          if (typeof h === "string") {
            h = this[h];
          }
          this.route(r, h);
        }
      }
    });

    return ViewModule;
  })();
  /* global jaffamvc:true */

  var SelectableCollection = (function(_jaffamvc$Collection) {
    function SelectableCollection(models, options) {
      _classCallCheck(this, SelectableCollection);

      options = options || {};
      _jaffamvc$Collection.call(this, models, options);

      this.options = options;

      if (this.getOption("multi") === true) {
        this._select = new MultiSelect(this);
      } else {
        this._select = new SingleSelect(this);
      }

      utils.extend(this, this._select);
    }

    _inherits(SelectableCollection, _jaffamvc$Collection);

    SelectableCollection.prototype._addReference = function _addReference(model, options) {
      _jaffamvc$Collection.prototype._addReference.call(this, model, options);

      if (!model._select) {
        model._select = new Selectable(model);
        utils.extend(model, model._select);
      }
    };

    return SelectableCollection;
  })(jaffamvc.Collection);

  var SelectableModel = (function(_jaffamvc$Model) {
    function SelectableModel(models, options) {
      _classCallCheck(this, SelectableModel);

      _jaffamvc$Model.call(this, models, options);

      this._select = new Selectable(this);
      utils.extend(this, this._select);
    }

    _inherits(SelectableModel, _jaffamvc$Model);

    return SelectableModel;
  })(jaffamvc.Model);

  utils.assign(jaffamvc, {
    ViewModule: ViewModule,
    SelectableCollection: SelectableCollection,
    SelectableModel: SelectableModel
  });

  return jaffamvc;

}));
