/*!
 * JaffaMVC.js 0.1.0
 * (c) 2015 Rasmus Kildevæld, Softshag.
 * Inspired and based on Backbone.Marionette.js
 * (c) 2014 Derick Bailey, Muted Solutions, LLC.
 * JaffaMVC may be freely distributed under the MIT license.
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(["backbone"], factory);
  } else if (typeof exports === 'object') {
    var backbone = null;
    try {
      backbone = require('exoskeleton');
    } catch (e) {}
    try {
      backbone = require('backbone');
    } catch (e) {}

    module.exports = factory(backbone);
  } else {
    root.JaffaMVC = factory(root.Exoskeleton || root.Backbone);
  }
}(this, function(Backbone) {


  "use strict";

  var _get = function get(object, property, receiver) {
    var desc = Object.getOwnPropertyDescriptor(object, property);
    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);
      if (parent === null) {
        return undefined;
      } else {
        return get(parent, property, receiver);
      }
    } else if ("value" in desc && desc.writable) {
      return desc.value;
    } else {
      var getter = desc.get;
      if (getter === undefined) {
        return undefined;
      }
      return getter.call(receiver);
    }
  };

  var _prototypeProperties = function(child, staticProps, instanceProps) {
    if (staticProps) Object.defineProperties(child, staticProps);
    if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
  };

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

  /**
   * JaffaMVC
   * @namespace JaffaMVC
   */
  var JaffaMVC = {
    Events: Backbone.Events,
    History: Backbone.History,
    Model: Backbone.Model,
    Collection: Backbone.Collection,
    Router: Backbone.Router
  };

  /** Error classes */

  var JaffaError = (function(Error) {
    function JaffaError() {
      _classCallCheck(this, JaffaError);

      if (Error != null) {
        Error.apply(this, arguments);
      }
    }

    _inherits(JaffaError, Error);

    return JaffaError;
  })(Error);

  var InitializerError = (function(JaffaError) {
    function InitializerError() {
      _classCallCheck(this, InitializerError);

      if (JaffaError != null) {
        JaffaError.apply(this, arguments);
      }
    }

    _inherits(InitializerError, JaffaError);

    return InitializerError;
  })(JaffaError);

  /* domready (c) Dustin Diaz 2014 - License MIT */
  var domReady = (function(f) {
    var fns = [],
      listener = undefined,
      doc = document,
      hack = doc.documentElement.doScroll,
      domContentLoaded = "DOMContentLoaded",
      loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState);

    if (!loaded) {
      doc.addEventListener(domContentLoaded, listener = function() {

        doc.removeEventListener(domContentLoaded, listener);
        loaded = 1;
        while (listener = fns.shift()) listener();
      });
    }

    return function(fn) {
      loaded ? fn() : fns.push(fn);
    };
  })();

  JaffaMVC.$ = function(selector, context) {

    if (typeof selector === "function") {
      return domReady(selector);
    }

    context = context || document;
    if (typeof selector !== "string" && "nodeType" in selector) {
      return [selector];
    }
    return context.querySelectorAll(selector);
  };

  var __camelCase = function __camelCase(input) {
    return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
  };

  var __slice = Array.prototype.slice;

  var utils = JaffaMVC.utils = {
    callFunction: function callFunction(fn, ctx, args) {
      switch (args.length) {
        case 0:
          return fn.call(ctx);
        case 1:
          return fn.call(ctx, args[0]);
        case 2:
          return fn.call(ctx, args[0], args[1]);
        case 3:
          return fn.call(ctx, args[0], args[1], args[2]);
        case 4:
          return fn.call(ctx, args[0], args[1], args[2], args[3]);
        default:
          return fn.apply(ctx, args);
      }
    },
    callAsyncFunction: function callAsyncFunction(fn, ctx, arg) {

      return new Promise(function(resolve, reject) {
        var cb = undefined,
          ret = undefined;

        cb = function(err, ret) {
          if (err) return reject(err);
          resolve(ret);
        };

        if (fn.length > 1) {
          return fn.call(ctx, arg, cb);
        } else if (utils.isGenerator(fn) || utils.isGeneratorFunction(fn)) {

          if (co && typeof co.wrap === "function") {
            fn = co.wrap(fn);
          } else {
            throw new Error("generators support needs co! - see https://github.com/tj/co");
          }
        }

        try {
          ret = fn.call(ctx, arg);
        } catch (e) {
          ret = e;
        }

        if (ret instanceof Error) {
          reject(ret);
        } else if (ret && utils.isPromise(ret)) {
          ret.then(resolve, reject);
        } else {
          resolve(ret);
        }
      });
    },
    eachAsync: function eachAsync(array, iterator, ctx) {
      var i = 0,
        len = array.length,
        next = undefined;
      return new Promise(function(resolve, reject) {
        var next = (function(_next) {
          var _nextWrapper = function next() {
            return _next.apply(this, arguments);
          };

          _nextWrapper.toString = function() {
            return _next.toString();
          };

          return _nextWrapper;
        })(function(e) {

          if (e != null || i === len) return e ? reject(e) : resolve();

          utils.callAsyncFunction(iterator, ctx, array[i++]).then(function(r) {
            next();
          }, next);
        });
        next(null);
      });
    },
    bindAll: function bindAll(obj, fns) {
      return utils.proxy(obj, obj, fns);
    },
    getOption: function getOption(option) {
      var options = this.options || {};
      return options[option] || this[option];
    },

    /**
     * Trigger an event and a optional function.
     * A `show` event will trigger a `show` event and call a `onShow` method.
     * A `before:show` event will trigger a `before:show` event and call a `onBeforeShow` method
     * @example
     * this.triggerMethod('show', view, options);
     * // will call:
     * this.trigger('show', view, options);
     * // and if exists:
     * this.onShow(view, options);
     *
     * @param {String} event The event to trigger
     * @memberof JaffaMVC.Utils
     */
    triggerMethod: function triggerMethod(event) {
      var e = __camelCase("on-" + event.replace(/:/, "-")),
        m = utils.getOption.call(this, e),
        args = __slice.call(arguments, 1);
      utils.callFunction(this.trigger, this, __slice.call(arguments));

      if (typeof m === "function") {
        utils.callFunction(m, this, args);
      }
    },
    triggerMethodOn: function triggerMethodOn(o) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      utils.callFunction(utils.triggerMethod, o, args);
      //utils.triggerMethod.apply(o, args);
    },

    /**
     * Forward method from one object ot another
     * @param  {Object} from Source object
     * @param  {Object} to   Destination object
     * @param  {Array<Function>} fns  An array of methods
     * @memberof JaffaMVC.utils
     */
    proxy: function proxy(from, to, fns) {
      if (!Array.isArray(fns)) fns = [fns];
      fns.forEach(function(fn) {
        if (typeof to[fn] === "function") {
          from[fn] = to[fn].bind(to);
        }
      });
    },

    isGenerator: function isGenerator(obj) {
      return "function" === typeof obj.next && "function" === typeof obj["throw"];
    },
    isGeneratorFunction: function isGeneratorFunction(obj) {
      var constructor = obj.constructor;
      if (!constructor) {
        return false;
      }
      if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName) {
        return true;
      }
      return utils.isGenerator(constructor.prototype);
    },
    isPromise: function isPromise(obj) {
      return "function" === typeof obj.then;
    },
    isObject: function isObject(obj) {
      var type = typeof obj;
      return type === "function" || type === "object" && !!obj;
    },
    result: function result(obj, prop) {
      for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }

      if (typeof obj[prop] === "function") {
        return obj[prop].apply(obj, args);
      }
      return obj[prop];
    }

  };

  JaffaMVC.Object = (function() {
    /**
     * The base of things
     * @constructor Object
     * @memberof JaffaMVC
     * @abstract
     * @mixes JaffaMVC.Events
     */

    function Base() {
      _classCallCheck(this, Base);

      if (typeof this.initialize === "function") {
        this.initialize.apply(this, arguments);
      }
    }

    _prototypeProperties(Base, null, {
      destroy: {
        value: function destroy() {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          if (this.isDestroyed) {
            return;
          }
          this.triggerMethod("before:destroy", args);

          this._isDestroyed = true;

          this.triggerMethod("destroy", args);

          this.stopListening();

          return this;
        },
        writable: true,
        configurable: true
      },
      isDestroyed: {
        get: function() {
          if (this._isDestroyed == null) {
            this._isDestroyed = false;
          }
          return this._isDestroyed;
        },
        configurable: true
      }
    });

    return Base;
  })();

  // Mixin events
  Object.assign(JaffaMVC.Object.prototype, Backbone.Events);
  JaffaMVC.Object.extend = Backbone.extend;
  JaffaMVC.Object.prototype.getOption = JaffaMVC.utils.getOption;
  JaffaMVC.Object.prototype.triggerMethod = JaffaMVC.utils.triggerMethod;

  var List = JaffaMVC.List = (function() {
    /**
     * Simple list implemntation
     */

    function List() {
      var options = arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, List);

      this.options = options;
      this._items = [];
      this.length = 0;
      this.onRemove = options.onRemove || this.onRemove;
      this.onAdd = options.onAdd || this.onAdd;
    }

    _prototypeProperties(List, null, {
      has: {

        /**
         * Checks if the list has an object
         * @param {Mixed} item
         * @return {Boolean}
         */

        value: function has(item) {
          return ~this._items.indexOf(item);
        },
        writable: true,
        configurable: true
      },
      add: {
        value: function add(item) {
          if (!this.has(item)) {
            this._items.push(item);
            this._updateLength.call(this);
            if (this.onAdd) this.onAdd(item);
          }
        },
        writable: true,
        configurable: true
      },
      remove: {
        value: function remove(item) {
          if (this.has(item)) {
            this._items.splice(this._items.indexOf(item), 1);
            this._updateLength.call(this);
            if (this.onRemove) this.onRemove(item);
          }
        },
        writable: true,
        configurable: true
      },
      empty: {
        value: function empty() {
          this.forEach(this.remove, this);
          this._items = [];
          this._updateLength.call(this);
        },
        writable: true,
        configurable: true
      },
      find: {
        value: function find(fn, ctx) {
          var item = undefined;
          for (var i = 0; i < this._items.length; i++) {
            item = this._items[i];
            if (fn.call(ctx, item) === true) {
              return item;
            }
          }
          return null;
        },
        writable: true,
        configurable: true
      },
      forEach: {
        value: function forEach(fn, ctx) {
          return this._items.forEach(fn, ctx);
        },
        writable: true,
        configurable: true
      },
      _updateLength: {
        value: function _updateLength() {
          this.length = this._items.length;
        },
        writable: true,
        configurable: true
      }
    });

    return List;
  })();

  var Boot = (function() {
    /**
     * Constructs a new booter
     * @constructor Boot
     * @memberOf JaffaMVC
     */

    function Boot() {
      _classCallCheck(this, Boot);

      this._phases = [];
      this._initialized = false;
    }

    _prototypeProperties(Boot, null, {
      phase: {

        /**
         * Add new phase to the booter
         * @param  {String} [name]
         * @param  {Function} fn
         * @param  {Object} [ctx]
         * @return {JaffaMVC.Boot}
         *
         * @memberOf JaffaMVC.Boot#
         * @method phase
         */

        value: function phase(name, fn, ctx) {
          if (typeof name === "function") {
            fn = name;
            name = fn.name || "unamed";
          }

          var p = {
            n: name,
            fn: fn,
            ctx: ctx || this
          };
          this._phases.push(p);

          if (this.isInitialized) {
            this._runPhase(p);
          }

          return this;
        },
        writable: true,
        configurable: true
      },
      boot: {

        /**
         * Run the booter
         * @param  {Mixed} option
         * @param  {Object} [ctx]
         * @return {Promise}
         * @async
         * @memberOf JaffaMVC.Boot#
         * @method boot
         */

        value: function boot(options, ctx) {
          var _this16 = this;

          // If already started throw an error
          if (this.isInitialized) {
            throw new InitializerError("already initalized");
          }

          var phases = this._phases;

          return utils.eachAsync(phases, function(p) {
            return _this16._runPhase(p, options);
          }).then(function() {
            _this16._initialized = true;
          });
        },
        writable: true,
        configurable: true
      },
      reset: {

        /**
         * Reset the booter
         * @return {JaffaMVC.Boot}
         *
         * @memberOf JaffaMVC.Boot#
         * @method reset
         */

        value: function reset() {
          this._initialized = false;
          return this;
        },
        writable: true,
        configurable: true
      },
      _runPhase: {

        /**
         * Run phase
         * @private
         * @memberOf JaffaMVC.Boot#
         * @method _runPhase
         */

        value: function _runPhase(phase, options) {
          return utils.callAsyncFunction(phase.fn, phase.ctx, options);
        },
        writable: true,
        configurable: true
      },
      isInitialized: {

        /**
         * @property {Boolean} isInitialized Whether the booter is initialized
         * @memberOf JaffaMVC.Boot#
         */

        get: function() {
          return this._initialized;
        },
        configurable: true
      }
    });

    return Boot;
  })();

  var ChannelError = (function(JaffaError) {
    function ChannelError() {
      _classCallCheck(this, ChannelError);

      if (JaffaError != null) {
        JaffaError.apply(this, arguments);
      }
    }

    _inherits(ChannelError, JaffaError);

    return ChannelError;
  })(JaffaError);

  /**
   * Commands
   * @mixin
   * @memberof JaffaMVC.Channel
   */
  var Commands = {
    /**
     * Comply to a Commands
     * @param  {String}   cmd The name of the Commands
     * @param  {Function} fn  The function to run
     * @param  {Object}   ctx The context of which to run the function
     */
    comply: function comply(cmd, fn, ctx) {
      this._cmds = this._cmds || {};
      this._cmds[cmd] = {
        fn: fn,
        ctx: ctx || this
      };
    },
    /**
     * Execute Commands
     * @param  {String} cmd The name of the Commands
     */
    command: function command(cmd) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      this._cmds = this._cmds || {};

      if (this._cmds.hasOwnProperty(cmd)) {
        var _cmds$cmd = this._cmds[cmd];
        var fn = _cmds$cmd.fn;
        var ctx = _cmds$cmd.ctx;

        utils.callFunction(fn, ctx, args);
      } else {
        throw new ChannelError("no handler for command: ", cmd);
      }
    },
    /**
     * Stop complying to a command
     * @param {String}   cmd The name of the command
     * @param {Function} fn  [description]
     * @param {Object}   ctx [description]
     */
    stopComplying: function stopComplying(cmd, fn, ctx) {
      this._cmds = this._cmds || {};
      ctx = ctx || this;
      delete this._cmds[cmd];
    }
  };
  /**
   * Requests
   * @mixin
   * @memberof JaffaMVC.Channel
   */
  var Request = {
    /**
     * Reply to a Request
     * @param  {String}   req The name of the request
     * @param  {Function} fn  replying function
     * @param  {Object}   ctx The context in which the function is called
     */
    reply: function reply(req, fn, ctx) {
      this._reqs = this._reqs || {};
      this._reqs[req] = {
        fn: fn,
        ctx: ctx || this
      };
    },
    /**
     * Request
     * @param  {String} req The name of the request
     */
    request: function request(req) {
      this._reqs = this._reqs || {};

      if (this._reqs.hasOwnProperty(req)) {
        var _reqs$req = this._reqs[req];
        var fn = _reqs$req.fn;
        var ctx = _reqs$req.ctx;

        if (utils.isGenerator(fn) || utils.isGeneratorFunction(fn)) {
          fn = co.wrap(fn);
        }
        var ret = fn.apply(req.ctx, __slice.call(arguments, 1));
        if (utils.isPromise(ret)) {
          return ret;
        } else if (ret instanceof Error) {
          ret = Promise.reject(ret);
        } else {
          ret = Promise.resolve(ret);
        }
        return ret;
      } else {
        // FIXME: Fix error handeling
        return Promise.reject(new ChannelError("no handler for request: " + req));
      }
    },
    /**
     * Stop replying to a request
     * @param {String}   req The name of the request
     * @param {Function} fn  The function
     * @param {Object}   ctx the context
     */
    stopReplying: function stopReplying(req, fn, ctx) {
      this._reqs = this._reqs || {};
      ctx = ctx || this;
      delete this._reqs[req];
    }
  };

  var Channel = JaffaMVC.Channel = (function(_JaffaMVC$Object) {
    /**
     * Channel
     * @param {String} name The name of the channel
     * @memberof JaffaMVC
     * @constructor Channel
     * @mixes JaffaMVC.Channel.Request
     * @mixes JaffaMVC.Channel.Commands
     * @extends JaffaMVC.Object
     */

    function Channel(name) {
      _classCallCheck(this, Channel);

      this._name = name;
    }

    _inherits(Channel, _JaffaMVC$Object);

    _prototypeProperties(Channel, {
      Commands: {
        get: function() {
          return Commands;
        },
        configurable: true
      },
      Requests: {
        get: function() {
          return Request;
        },
        configurable: true
      }
    }, {
      extendObject: {
        value: function extendObject(obj) {
          JaffaMVC.utils.proxy(obj, this, ["comply", "command", "stopComplying", "reply", "request", "stopReplying"]);
        },
        writable: true,
        configurable: true
      }
    });

    return Channel;
  })(JaffaMVC.Object);

  Object.assign(JaffaMVC.Channel.prototype, Commands, Request);

  var Module = JaffaMVC.Module = (function(_JaffaMVC$Object2) {
    function Module(name, options, app) {
      _classCallCheck(this, Module);

      Object.assign(this, {
        options: options,
        name: name,
        app: app
      });
      _get(Object.getPrototypeOf(Module.prototype), "constructor", this).call(this);
    }

    _inherits(Module, _JaffaMVC$Object2);

    _prototypeProperties(Module, null, {
      startWithParent: {
        get: function() {
          if (this._startWithParent == null) {
            this._startWithParent = true;
          }
          return this._startWithParent;
        },
        set: function(val) {
          this._startWithParent = val;
        },
        configurable: true
      },
      addInitializer: {
        value: function addInitializer(name, fn, ctx) {
          this.initializer.phase(name, fn, ctx || this);
        },
        writable: true,
        configurable: true
      },
      addFinalizer: {
        value: function addFinalizer(name, fn, ctx) {
          this.finalizer.phase(name, fn, ctx || this);
        },
        writable: true,
        configurable: true
      },
      start: {
        value: function start(options) {
          var _this16 = this;

          if (this.initializer.isInitialized) {
            return Promise.resolve();
          }
          this.triggerMethod("before:start", options);
          return this.initializer.boot(options).then(function(ret) {
            return _this16._startSubmodules();
          }).then(function() {
            _this16.triggerMethod("start", options);
          });
        },
        writable: true,
        configurable: true
      },
      stop: {
        value: function stop(options) {
          var _this16 = this;

          if (!this.isRunning) {
            return Promise.resolve();
          }

          this.triggerMethod("before:stop", options);
          return this.finalizer.boot(options).then(function(r) {
            return _this16._stopSubmodules(options);
          }).then(function() {
            // Reset intializers
            _this16.initializer.reset();
            _this16.finalizer.reset();

            _this16.triggerMethod("stop", options);
          });
        },
        writable: true,
        configurable: true
      },
      module: {
        value: function module(name, def) {
          var options = arguments[2] === undefined ? {} : arguments[2];

          if (def == null) {
            return this.modules[name];
          }

          if (this.modules.hasOwnProperty(name)) {
            throw new Error("Module already defined " + name);
          }

          var Klass = def;
          if (typeof def !== "function") {
            Klass = Module.extend(def);
          }

          this.modules[name] = new Klass(name, options, this.app || this);
          return this.modules[name];
        },
        writable: true,
        configurable: true
      },
      removeModule: {
        value: function removeModule(name) {
          var module = this.module(name);
          if (!module) {
            return;
          }
          module.stop().then(function() {
            module.destroy();
          });
        },
        writable: true,
        configurable: true
      },
      removeAllModules: {
        value: function removeAllModules() {
          for (var key in this.modules) {
            this.removeModule(key);
          }
        },
        writable: true,
        configurable: true
      },
      initializer: {
        get: function() {
          if (!this._initializer) {
            this._initializer = new Boot();
          }
          return this._initializer;
        },
        configurable: true
      },
      finalizer: {
        get: function() {
          if (!this._finalizer) {
            this._finalizer = new Boot();
          }
          return this._finalizer;
        },
        configurable: true
      },
      modules: {
        get: function() {
          if (this._modules == null) {
            this._modules = [];
          }
          return this._modules;
        },
        configurable: true
      },
      isRunning: {
        get: function() {
          return this.initializer.isInitialized && !this.finalizer.isInitialized;
        },
        configurable: true
      },
      _startSubmodules: {

        // Private API

        value: function _startSubmodules(options) {
          var _this16 = this;

          return utils.eachAsync(Object.keys(this.modules), function(name) {
            var mod = _this16.modules[name];
            if (mod.startWithParent) {
              return mod.start(options);
            }
          });
        },
        writable: true,
        configurable: true
      },
      _stopSubmodules: {
        value: function _stopSubmodules() {
          return utils.eachAsync(this.modules, function(mod) {
            return mod.stop();
          });
        },
        writable: true,
        configurable: true
      }
    });

    return Module;
  })(JaffaMVC.Object);

  JaffaMVC.Module.extend = Backbone.extend;

  JaffaMVC.Region = (function(_JaffaMVC$Object3) {

    /**
     * Regions manage a view
     * @param {Object} options
     * @param {Element} options.el  A Html element
     * @memberof JaffaMVC
     * @constructor Region
     * @augments Base
     * @inheritdoc
     */

    function Region() {
      var options = arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, Region);

      this.options = options;
      this.el = this.getOption("el");
      _get(Object.getPrototypeOf(Region.prototype), "constructor", this).call(this);
    }

    _inherits(Region, _JaffaMVC$Object3);

    _prototypeProperties(Region, {
      buildRegion: {
        /**
         * Build region from a definition
         * @param {Object|String|JaffaMVC.Region} def The description of the region
         * @return {JaffaMVC.Region}
         * @memberof JaffaMVC.Region
         */

        value: function buildRegion(def) {
          if (def instanceof Region) {
            return def;
          } else if (typeof def === "string") {
            return buildBySelector(def, Region);
          } else {
            return buildByObject(def);
          }
        },
        writable: true,
        configurable: true
      }
    }, {
      show: {

        /**
         * Show a view in the region.
         * This will destroy or remove any existing views.
         * @param  {View} view    The view to Show
         * @return {Region}       this for chaining.
         * @memberof JaffaMVC.Region#
         */

        value: function show(view, options) {
          var diff = view !== this.currentView;
          // Remove any containing views
          this.empty();

          if (diff) {
            // If the view is destroyed be others
            view.once("destroy", this.empty, this);
            view.render();

            utils.triggerMethodOn(view, "before:show");

            this._attachHtml(view);

            this.currentView = view;

            utils.triggerMethodOn(view, "show");
          }

          return this;
        },
        writable: true,
        configurable: true
      },
      destroy: {

        /**
         * Destroy the region, this will remove any views, but not the containing element
         * @return {Region} this for chaining
         * @memberof JaffaMVC.Region#
         */

        value: function destroy() {
          this.empty();
          this.stopListening();
        },
        writable: true,
        configurable: true
      },
      empty: {

        /**
         * Empty the region. This will destroy any existing view.
         * @memberof JaffaMVC.Region#
         * @return {Region} this for chaining;
         */

        value: function empty() {

          if (!this.currentView) {
            return;
          }
          var view = this.currentView;

          view.off("destroy", this.empty, this);
          this.trigger("before:empty", view);
          this._destroyView();
          this.trigger("empty", view);

          delete this.currentView;

          return this;
        },
        writable: true,
        configurable: true
      },
      _attachHtml: {
        value: function _attachHtml(view) {
          this.el.innerHtml = "";
          this.el.appendChild(view.el);
        },
        writable: true,
        configurable: true
      },
      _destroyView: {
        value: function _destroyView() {
          var view = this.currentView;

          if (view.destroy && typeof view.destroy === "function" && !view.isDestroyed) {
            view.destroy();
          } else if (view.remove && typeof view.remove === "function") {
            view.remove();
          }
        },
        writable: true,
        configurable: true
      }
    });

    return Region;
  })(JaffaMVC.Object);

  function buildByObject() {
    var object = arguments[0] === undefined ? {} : arguments[0];

    if (!object.selector) throw new Error("No selector specified", object);

    return buildBySelector(object.selector, object.regionClass || JaffaMVC.Region);
  }

  function buildBySelector(selector, Klass) {

    var el = JaffaMVC.$(selector);

    if (!el.length) {
      throw new Error("Selector must exists in the dom");
    }

    return new Klass({
      el: el[0]
    });
  }

  var proxyties = ["addRegions", "addRegion", "removeRegion", "removeRegions"];

  JaffaMVC.RegionManager = (function(_JaffaMVC$Object4) {
    function RegionManager() {
      _classCallCheck(this, RegionManager);

      this.regions = {};
      _get(Object.getPrototypeOf(RegionManager.prototype), "constructor", this).call(this);
    }

    _inherits(RegionManager, _JaffaMVC$Object4);

    _prototypeProperties(RegionManager, null, {
      extendObject: {
        value: function extendObject(obj) {
          utils.proxy(obj, this, proxyties);
          obj.regions = this.regions;
        },
        writable: true,
        configurable: true
      },
      unproxyObject: {
        value: function unproxyObject(obj) {
          proxyties.forEach(function(m) {
            if (obj[m]) {
              delete obj[m];
            }
          });
        },
        writable: true,
        configurable: true
      },
      addRegions: {

        /**
         * Add one or more regions to the region manager
         * @param {Object} regions
         * @memberof JaffaMVC.RegionManager#
         */

        value: function addRegions(regions) {
          var def = undefined,
            out = {},
            keys = Object.keys(regions);
          keys.forEach(function(k) {
            def = regions[k];
            out[k] = this.addRegion(k, def);
          }, this);
          return out;
        },
        writable: true,
        configurable: true
      },
      addRegion: {

        /**
         * Add a region to the RegionManager
         * @param {String} name   The name of the regions
         * @param {String|Object|JaffaMVC.Region} def The region to associate with the name and the RegionManager
         * @memberof JaffaMVC.RegionManager#
         */

        value: function addRegion(name, def) {

          var region = JaffaMVC.Region.buildRegion(def);
          this._setRegion(name, region);

          return region;
        },
        writable: true,
        configurable: true
      },
      removeRegion: {

        /**
         * Remove one or more regions from the manager
         * @param {...name} name A array of region names
         * @memberof JaffaMVC.RegionManager#
         */

        value: function removeRegion() {
          var names = __slice.call(arguments);

          names.forEach(function(name) {
            if (__has.call(this.regions, name)) {
              var region = this.regions[name];
              region.destroy();
              this._unsetRegion(name);
            }
          }, this);
        },
        writable: true,
        configurable: true
      },
      destroy: {
        /**
         * Destroy the regionmanager
         * @memberof JaffaMVC.RegionManager#
         */

        value: function destroy() {
          _get(Object.getPrototypeOf(RegionManager.prototype), "destroy", this).call(this);
          this.removeRegions();
        },
        writable: true,
        configurable: true
      },
      removeRegions: {

        /**
         * Remove all regions from the manager
         * @memberof JaffaMVC.RegionManager#
         */

        value: function removeRegions() {
          this.removeRegion.apply(this, Object.keys(this.regions));
        },
        writable: true,
        configurable: true
      },
      _setRegion: {

        /**
         * @private
         */

        value: function _setRegion(name, region) {
          this.regions[name] = region;
        },
        writable: true,
        configurable: true
      },
      _unsetRegion: {

        /**
         * @private
         */

        value: function _unsetRegion(name) {
          delete this.regions[name];
        },
        writable: true,
        configurable: true
      }
    });

    return RegionManager;
  })(JaffaMVC.Object);

  /*! Backbone.NativeView.js 0.3.2
  // ---------------
  /     (c) 2014 Adam Krebs, Jimmy Yuen Ho Wong
       Backbone.NativeView may be freely distributed under the MIT license.
       For all details and documentation:
       https://github.com/akre54/Backbone.NativeView
  */
  // Cached regex to match an opening '<' of an HTML tag, possibly left-padded
  // with whitespace.

  var paddedLt = /^\s*</;

  // Caches a local reference to `Element.prototype` for faster access.
  var ElementProto = typeof Element !== "undefined" && Element.prototype || {};

  // Cross-browser event listener shims
  var elementAddEventListener = ElementProto.addEventListener || function(eventName, listener) {
    return this.attachEvent("on" + eventName, listener);
  };
  var elementRemoveEventListener = ElementProto.removeEventListener || function(eventName, listener) {
    return this.detachEvent("on" + eventName, listener);
  };

  var indexOf = function indexOf(array, item) {
    for (var i = 0, len = array.length; i < len; i++)
      if (array[i] === item) {
        return i;
      }
    return -1;
  };

  // Find the right `Element#matches` for IE>=9 and modern browsers.
  var matchesSelector = ElementProto.matches || ElementProto.webkitMatchesSelector || ElementProto.mozMatchesSelector || ElementProto.msMatchesSelector || ElementProto.oMatchesSelector ||
    // Make our own `Element#matches` for IE8
    function(selector) {
      // Use querySelectorAll to find all elements matching the selector,
      // then check if the given element is included in that list.
      // Executing the query on the parentNode reduces the resulting nodeList,
      // (document doesn't have a parentNode).
      var nodeList = (this.parentNode || document).querySelectorAll(selector) || [];
      return !!~indexOf(nodeList, this);
    };

  // Cache Backbone.View for later access in constructor
  var BBView = Backbone.View;

  // To extend an existing view to use native methods, extend the View prototype
  // with the mixin: _.extend(MyView.prototype, Backbone.NativeViewMixin);
  JaffaMVC.NativeView = (function(BBView) {
    function NativeView() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      _classCallCheck(this, NativeView);

      this._domEvents = [];
      _get(Object.getPrototypeOf(NativeView.prototype), "constructor", this).apply(this, args);
    }

    _inherits(NativeView, BBView);

    _prototypeProperties(NativeView, null, {
      $: {
        value: function $(selector) {
          return JaffaMVC.$(selector, this.el);
        },
        writable: true,
        configurable: true
      },
      _removeElement: {
        value: function _removeElement() {
          this.undelegateEvents();
          if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
        },
        writable: true,
        configurable: true
      },
      _setElement: {

        // Apply the `element` to the view. `element` can be a CSS selector,
        // a string of HTML, or an Element node.

        value: function _setElement(element) {
          if (typeof element === "string") {
            if (paddedLt.test(element)) {
              var el = document.createElement("div");
              el.innerHTML = element;
              this.el = el.firstChild;
            } else {
              this.el = document.querySelector(element);
            }
          } else {
            this.el = element;
          }

          this.$el = JaffaMVC.$(this.el);
        },
        writable: true,
        configurable: true
      },
      _setAttributes: {

        // Set a hash of attributes to the view's `el`. We use the "prop" version
        // if available, falling back to `setAttribute` for the catch-all.

        value: function _setAttributes(attrs) {
          for (var attr in attrs) {
            attr in this.el ? this.el[attr] = attrs[attr] : this.el.setAttribute(attr, attrs[attr]);
          }
        },
        writable: true,
        configurable: true
      },
      delegate: {

        // Make a event delegation handler for the given `eventName` and `selector`
        // and attach it to `this.el`.
        // If selector is empty, the listener will be bound to `this.el`. If not, a
        // new handler that will recursively traverse up the event target's DOM
        // hierarchy looking for a node that matches the selector. If one is found,
        // the event's `delegateTarget` property is set to it and the return the
        // result of calling bound `listener` with the parameters given to the
        // handler.

        value: function delegate(eventName, selector, listener) {
          if (typeof selector === "function") {
            listener = selector;
            selector = null;
          }

          var root = this.el;
          var handler = selector ? function(e) {
            var node = e.target || e.srcElement;
            for (; node && node != root; node = node.parentNode) {
              if (matchesSelector.call(node, selector)) {
                e.delegateTarget = node;
                listener(e);
              }
            }
          } : listener;

          elementAddEventListener.call(this.el, eventName, handler, false);
          this._domEvents.push({
            eventName: eventName,
            handler: handler,
            listener: listener,
            selector: selector
          });
          return handler;
        },
        writable: true,
        configurable: true
      },
      undelegate: {

        // Remove a single delegated event. Either `eventName` or `selector` must
        // be included, `selector` and `listener` are optional.

        value: function undelegate(eventName, selector, listener) {
          if (typeof selector === "function") {
            listener = selector;
            selector = null;
          }

          if (this.el) {
            var handlers = this._domEvents.slice();
            for (var i = 0, len = handlers.length; i < len; i++) {
              var item = handlers[i];

              var match = item.eventName === eventName && (listener ? item.listener === listener : true) && (selector ? item.selector === selector : true);

              if (!match) continue;

              elementRemoveEventListener.call(this.el, item.eventName, item.handler, false);
              this._domEvents.splice(indexOf(handlers, item), 1);
            }
          }
          return this;
        },
        writable: true,
        configurable: true
      },
      undelegateEvents: {

        // Remove all events created with `delegate` from `el`

        value: function undelegateEvents() {
          if (this.el) {
            for (var i = 0, len = this._domEvents.length; i < len; i++) {
              var item = this._domEvents[i];
              elementRemoveEventListener.call(this.el, item.eventName, item.handler, false);
            }
            this._domEvents.length = 0;
          }
          return this;
        },
        writable: true,
        configurable: true
      }
    });

    return NativeView;
  })(BBView);

  JaffaMVC.View = (function(_JaffaMVC$NativeView) {
    /**
     * Base View
     * @param {Object}            [options]           Options See Backbone.View for additonal arguments
     * @param {String|Function}   options.template  A string or a function
     * @param {Object}            options.ui
     * @memberof JaffaMVC
     * @constructor View
     * @augments NativeView
     */

    function View(options) {
      _classCallCheck(this, View);

      /**
       * @var options
       * @memberof JaffaMVC.View#
       */
      this.options = options || {};
      this.isDestroyed = false;

      this.listenTo(this, "show", function() {
        this._isShown = true;
      });

      this.listenTo(this, "render", function() {
        this._isRendered = true;
      });

      _get(Object.getPrototypeOf(View.prototype), "constructor", this).call(this, options);
    }

    _inherits(View, _JaffaMVC$NativeView);

    _prototypeProperties(View, null, {
      destroy: {

        /**
         * Destroy the view and release all resources
         * @memberof JaffaMVC.View#
         * @method destroy
         * @return {JaffaMVC.View}
         */

        value: function destroy() {
          if (this.isDestroyed === true) {
            return this;
          }

          var args = __slice.call(arguments);

          this.triggerMethod("before:destroy", args);

          this.isDestroyed = true;

          this.triggerMethod("destroy", args);
          //_log('view destroy:',this);

          this.remove();

          return this;
        },
        writable: true,
        configurable: true
      },
      render: {

        /**
         * Render the view
         * @memberOf  JaffaMVC.View#
         * @method render
         * @return {JaffaMVC.View}
         */

        value: function render() {
          var _this16 = this;

          this.triggerMethod("before:render", this);

          this.undelegateEvents();

          var template = this.getOption("template");

          if (template) {
            this._renderTemplate(template).then(function(templ) {
              _this16.el.innerHTML = templ;
              _this16.delegateEvents();
              _this16.triggerMethod("render", _this16);
            });
          } else {
            this.delegateEvents();
            this.triggerMethod("render", this);
          }

          return this;
        },
        writable: true,
        configurable: true
      },
      getTemplateData: {

        /**
         * Get template data for template rendering
         * @return {Object} object to render
         * @memberOf JaffaMVC.View#
         * @method getTemplateData
         */

        value: function getTemplateData() {
          return this.model ? this.model.toJSON() : {};
        },
        writable: true,
        configurable: true
      },
      delegateEvents: {

        /**
         * Delegate events
         * @param  {Object} eventArgs Events object
         * @return {View}           this
         * @memberOf JaffaMVC.View#
         * @method delegateEvents
         */

        value: function delegateEvents(eventArgs) {
          this.bindUIElements();

          var events = eventArgs || this.events;

          events = this.normalizeUIKeys(events);

          var triggers = this._configureTriggers();

          var combined = {};

          Object.assign(combined, events, triggers);

          _get(Object.getPrototypeOf(View.prototype), "delegateEvents", this).call(this, combined);
        },
        writable: true,
        configurable: true
      },
      undelegateEvents: {

        /**
         * Undelegate events
         * @return {View} this
         * @memberOf JaffaMVC.View#
         * @method undelegateEvents
         */

        value: function undelegateEvents() {
          this.unbindUIElements();
          _get(Object.getPrototypeOf(View.prototype), "undelegateEvents", this).call(this);
        },
        writable: true,
        configurable: true
      },
      _configureTriggers: {

        /**
         * Configure triggers
         * @return {Object} events object
         * @memberOf JaffaMVC.View#
         * @method _configureTriggers
         * @private
         */

        value: function _configureTriggers() {
          if (!this.triggers) {
            return {};
          }

          // Allow `triggers` to be configured as a function
          var triggers = this.normalizeUIKeys(utils.result(this, "triggers"));

          // Configure the triggers, prevent default
          // action and stop propagation of DOM events
          var events = {},
            val = undefined,
            key = undefined;
          for (key in triggers) {
            val = triggers[key];
            events[key] = this._buildViewTrigger(val);
          }

          return events;
        },
        writable: true,
        configurable: true
      },
      _buildViewTrigger: {

        /**
         * builder trigger function
         * @param  {Object|String} triggerDef Trigger definition
         * @return {Function}
         * @memberOf JaffaMVC.View#
         * @method _buildViewTrigger
         * @private
         */

        value: function _buildViewTrigger(triggerDef) {

          if (typeof triggerDef === "string") triggerDef = {
            event: triggerDef
          };

          var options = Object.assign({
            preventDefault: true,
            stopPropagation: true
          }, triggerDef);

          return function(e) {

            if (e) {
              if (e.preventDefault && options.preventDefault) {
                e.preventDefault();
              }

              if (e.stopPropagation && options.stopPropagation) {
                e.stopPropagation();
              }
            }

            this.triggerMethod(options.event, {
              view: this,
              model: this.model,
              collection: this.collection
            });
          };
        },
        writable: true,
        configurable: true
      },
      bindUIElements: {

        /* UI Elements */

        value: function bindUIElements() {
          var _this16 = this;

          var ui = this.getOption("ui");
          if (!ui) {
            return;
          }
          if (!this._ui) {
            this._ui = ui;
          }

          ui = JaffaMVC.utils.result(this, "_ui");

          this.ui = {};

          Object.keys(ui).forEach(function(k) {
            var elm = _this16.$(ui[k]);
            if (elm && elm.length) {
              // unwrap if it's a nodelist.
              if (elm instanceof NodeList) {
                elm = elm[0];
              }
              _this16.ui[k] = elm;
            }
          });
          this.ui = this.ui;
        },
        writable: true,
        configurable: true
      },
      unbindUIElements: {
        value: function unbindUIElements() {},
        writable: true,
        configurable: true
      },
      _renderTemplate: {

        /**
         * Renders the template
         * @param  {Function|String} template The template to render
         * @return {Promise<String>}
         * @method _renderTemplate
         * @memberOf  JaffaMVC.View#
         */

        value: function _renderTemplate(template) {
          var data = this.getOption("getTemplateData").call(this);

          if (typeof template === "function") {
            return utils.callAsyncFunction(template, this, data);
          } else {
            return Promise.resolve(template);
          }
        },
        writable: true,
        configurable: true
      },
      normalizeUIKeys: {
        value: function normalizeUIKeys(obj) {
          var reg = /@ui.([a-zA-Z_\-\$#]+)/i,
            o = {},
            k = undefined,
            v = undefined,
            ms = undefined,
            sel = undefined,
            ui = undefined;

          for (k in obj) {
            v = obj[k];
            if ((ms = reg.exec(k)) !== null) {
              ui = ms[1], sel = this._ui[ui];
              if (sel != null) {
                k = k.replace(ms[0], sel);
              }
            }
            o[k] = v;
          }

          return o;
        },
        writable: true,
        configurable: true
      }
    });

    return View;
  })(JaffaMVC.NativeView);

  JaffaMVC.View.prototype.getOption = JaffaMVC.utils.getOption;
  JaffaMVC.View.prototype.triggerMethod = JaffaMVC.utils.triggerMethod;

  var LayoutView = JaffaMVC.LayoutView = (function(_JaffaMVC$View) {
    /**
     * LayoutView
     * @param {Object} options options
     * @constructor LayoutView
     * @memberof JaffaMVC
     * @augments JaffaMVC.View
     */

    function LayoutView(options) {
      _classCallCheck(this, LayoutView);

      this.options = options || {};
      var regions = this.getOption("regions");

      // Set region manager
      this._regionManager = new JaffaMVC.RegionManager();
      utils.proxy(this, this._regionManager, ["removeRegion", "removeRegions"]);
      /**
       * Regions
       * @var regions
       * @memberof JaffaMVC.LayoutView#
       */
      this.regions = this._regionManager.regions;

      this.options = options || {};

      this.listenTo(this, "render", function() {
        this.addRegions(regions);
      });

      _get(Object.getPrototypeOf(LayoutView.prototype), "constructor", this).call(this, options);
    }

    _inherits(LayoutView, _JaffaMVC$View);

    _prototypeProperties(LayoutView, null, {
      addRegion: {
        value: function addRegion(name, def) {
          if (typeof def === "string") {
            var elm = this.$(def);
            if (!elm.length) throw new Error("element must exists in dom");

            def = new JaffaMVC.Region({
              el: elm[0]
            });
          }
          this._regionManager.addRegion(name, def);
        },
        writable: true,
        configurable: true
      },
      addRegions: {
        value: function addRegions(regions) {
          for (var k in regions) {
            this.addRegion(k, regions[k]);
          }
        },
        writable: true,
        configurable: true
      },
      destroy: {
        value: function destroy() {
          _get(Object.getPrototypeOf(LayoutView.prototype), "destroy", this).call(this);
          this._regionManager.destroy();
        },
        writable: true,
        configurable: true
      }
    });

    return LayoutView;
  })(JaffaMVC.View);

  var CollectionView = JaffaMVC.CollectionView = (function(_JaffaMVC$View2) {

    /**
     * A CollectionView shows a maintains a collection
     * @param {Object} [options] See {@link JaffaMVC.View} for options
     * @param {JaffaMVC.View} options.childView
     * @param {Object}        options.childViewOptions
     * @extends JaffaMVC.View
     * @constructor CollectionView
     * @memberof JaffaMVC
     * @todo Support for empty collection
     */

    function CollectionView(options) {
      _classCallCheck(this, CollectionView);

      this.children = new JaffaMVC.List();

      this._isBuffering = false;

      utils.bindAll(this, ["render"]);

      _get(Object.getPrototypeOf(CollectionView.prototype), "constructor", this).call(this, options);

      this.sort = true;
      this.once("render", this._initCollectionEvents);

      // when this view is shown, all child views should be shown also.
      this.listenTo(this, "show", function() {
        this.children.forEach(function(child) {
          utils.triggerMethodOn(child, "show");
        });
      });
    }

    _inherits(CollectionView, _JaffaMVC$View2);

    _prototypeProperties(CollectionView, null, {
      render: {

        /**
         * Render the collection view and alle of the children
         * @return {JaffaMVC.CollectionView}
         *
         * @memberOf JaffaMVC.CollectionView#
         * @method render
         */

        value: function render(options) {

          this.destroyChildren();
          this._destroyContainer();

          this.listenToOnce(this, "render", function() {

            this._initContainer();

            if (this.collection) {
              this._renderChildren(this.collection.models);
            }
            if (typeof options === "function") {
              options();
            }
          });

          return _get(Object.getPrototypeOf(CollectionView.prototype), "render", this).call(this);
        },
        writable: true,
        configurable: true
      },
      renderCollection: {

        /**
         *  Renders the entire collection
         */

        value: function renderCollection() {
          var _this16 = this;

          var view = undefined;
          this.trigger("before:render:children");
          this.collection.models.forEach(function(model, index) {
            view = _this16._getChildView(model);
            _this16._addChildView(view, index);
          });
          this.trigger("render:children");
        },
        writable: true,
        configurable: true
      },
      renderChildView: {
        value: function renderChildView(view, index) {
          this.triggerMethod("before:render:child", view);

          view.render();
          this._attachHTML(view, index);

          this.triggerMethod("render:child", view);
        },
        writable: true,
        configurable: true
      },
      removeChildView: {
        value: function removeChildView(view) {
          if (!view) {
            return;
          }
          if (typeof view.destroy === "function") {
            view.destroy();
          } else if (typeof view.remove === "function") {
            view.remove();
          }

          this.stopListening(view);
          this.children.remove(view);

          this._updateIndexes(view, false);
        },
        writable: true,
        configurable: true
      },
      startBuffering: {

        /**
         * When inserting a batch of models, this method should be called first,
         * to optimise perfomance
         * @memberof JaffaMVC.CollectionView#
         */

        value: function startBuffering() {
          this._buffer = document.createDocumentFragment();
          this._isBuffering = true;
          this._bufferedChildren = [];
        },
        writable: true,
        configurable: true
      },
      stopBuffering: {

        /**
         * Should be called when finished inserting a batch of models
         * @memberof JaffaMVC.CollectionView#
         */

        value: function stopBuffering() {
          var _this16 = this;

          this._isBuffering = false;
          this._container.appendChild(this._buffer);

          this._bufferedChildren.forEach(function(item) {
            _this16.children.add(item);
            if (_this16._isShown) utils.triggerMethodOn(item, "show");
          });

          delete this._bufferedChildren;
        },
        writable: true,
        configurable: true
      },
      _getChildView: {

        /**
         * Returns a new instance of this.childView with attached model.
         *
         * @param {JaffaMVC.Model} model
         * @protected
         * @memberof JaffaMVC.CollectionView#
         */

        value: function _getChildView(model) {
          var View = this.getOption("childView") || JaffaMVC.View,
            options = this.getOption("childViewOptions") || {};

          return new View(Object.assign({
            model: model
          }, options));
        },
        writable: true,
        configurable: true
      },
      _attachHTML: {

        /**
         * Attach the childview's element to the CollectionView.
         * When in buffer mode, the view is added to a documentfragment to optimize performance
         * @param {JaffaMVC.View} view  A view
         * @param {Number} index The index in which to insert the view
         * @protected
         * @memberof JaffaMVC.CollectionView#
         */

        value: function _attachHTML(view, index) {
          if (this._isBuffering) {
            if (this._isShown) utils.triggerMethodOn(view, "before:show");
            this._buffer.appendChild(view.el);
            this._bufferedChildren.push(view);
          } else {
            if (this._isShown) {
              utils.triggerMethodOn(view, "before:show");
            }

            if (!this._insertBefore(view, index)) {
              this._insertAfter(view);
            }
            if (this._isShown) utils.triggerMethodOn(view, "show");
          }
        },
        writable: true,
        configurable: true
      },
      _renderChildren: {

        /**
         * Render child
         * @param {Array<JaffaMVC.Model>} models
         */

        value: function _renderChildren(models) {

          this.destroyChildren();

          if (this.collection.length === 0) {} else {
            this.startBuffering();
            this.renderCollection();
            this.stopBuffering();
          }
        },
        writable: true,
        configurable: true
      },
      _addChildView: {
        value: function _addChildView(view, index) {

          this._updateIndexes(view, true, index);

          this.proxyChildViewEvents(view);

          this.children.add(view);

          this.renderChildView(view, index);

          if (this._isShown && !this._isBuffering) {
            utils.triggerMethodOn(view, "show");
          }

          this.triggerMethod("add:child", view);
        },
        writable: true,
        configurable: true
      },
      proxyChildViewEvents: {

        /**
         * Proxy event froms childview to the collectionview
         * @param {JaffaMVC.View} view
         */

        value: function proxyChildViewEvents(view) {
          var prefix = "childview";

          this.listenTo(view, "all", function() {
            var args = __slice.call(arguments);

            args[0] = prefix + ":" + args[0];
            args.splice(1, 0, view);

            this.triggerMethod.apply(this, args);
          });
        },
        writable: true,
        configurable: true
      },
      resortView: {
        /**
         * Resort the view
         * @return {CollectionView} this
         */

        value: function resortView() {
          var _this16 = this;

          this.triggerMethod("before:resort");
          this.render(function() {
            _this16.triggerMethod("resort");
          });
          return this;
        },
        writable: true,
        configurable: true
      },
      destroy: {
        /**
         * Destroy the collection view and all of it's children
         * @see JaffaMVC.View
         * @return {JaffaMVC.View}
         */

        value: function destroy() {
          this.triggerMethod("before:destroy:children");
          this.destroyChildren();
          this.triggerMethod("destroy:children");

          return _get(Object.getPrototypeOf(CollectionView.prototype), "destroy", this).call(this);
        },
        writable: true,
        configurable: true
      },
      destroyChildren: {

        /**
         * Destroy all children of the collection view
         */

        value: function destroyChildren() {
          if (this._container) {
            this._container.innerHtml = "";
          }

          this.children.forEach(this.removeChildView, this);
          this.children.empty();
        },
        writable: true,
        configurable: true
      },
      _insertBefore: {

        // Internal method. Check whether we need to insert the view into
        // the correct position.

        value: function _insertBefore(childView, index) {
          var currentView = undefined;

          var findPosition = this.sort && index < this.children.length - 1;
          if (findPosition) {
            // Find the view after this one
            currentView = this.children.find(function(view) {
              return view._index === index + 1;
            });
          }

          if (currentView) {
            this._container.insertBefore(childView.el, currentView.el);
            return true;
          }

          return false;
        },
        writable: true,
        configurable: true
      },
      _insertAfter: {

        // Internal method. Append a view to the end of the $el

        value: function _insertAfter(childView) {
          this._container.appendChild(childView.el);
        },
        writable: true,
        configurable: true
      },
      _destroyContainer: {
        value: function _destroyContainer() {
          if (this._container) delete this._container;
        },
        writable: true,
        configurable: true
      },
      _initCollectionEvents: {
        value: function _initCollectionEvents() {
          if (this.collection) {

            this.listenTo(this.collection, "add", this._onCollectionAdd);
            this.listenTo(this.collection, "remove", this._onCollectionRemove);
            this.listenTo(this.collection, "reset", this.render);

            if (this.sort) this.listenTo(this.collection, "sort", this._onCollectionSort);
          }
        },
        writable: true,
        configurable: true
      },
      _initContainer: {

        ///
        /// Private methods
        ///

        value: function _initContainer() {
          var container = this.getOption("childViewContainer");
          if (container) {
            container = this.$(container)[0];
          } else {
            container = this.el;
          }
          this._container = container;
        },
        writable: true,
        configurable: true
      },
      _updateIndexes: {
        value: function _updateIndexes(view, increment, index) {
          if (!this.sort) {
            return;
          }
          if (increment) {
            view._index = index;

            this.children.forEach(function(lView, index) {
              if (lView._index >= view._index) {
                lView._index++;
              }
            });
          } else {

            this.children.forEach(function(lView) {
              if (lView._index >= view._index) {
                lView._index--;
              }
            });
          }
        },
        writable: true,
        configurable: true
      },
      _onCollectionAdd: {

        // Event handlers

        /**
         * Called when a model is add to the collection
         * @param {JaffaMVC.Model|Backbone.model} model Model
         * @private
         */

        value: function _onCollectionAdd(model) {
          var view = this._getChildView(model);
          var index = this.collection.models.indexOf(model);

          this._addChildView(view, index);
        },
        writable: true,
        configurable: true
      },
      _onCollectionRemove: {

        /**
         * Called when a model is removed from the collection
         * @param {JaffaMVC.Model|Backbone.model} model Model
         * @private
         */

        value: function _onCollectionRemove(model) {
          var view = this.children.find(function(view) {
            return view.model === model;
          });

          this.removeChildView(view);
        },
        writable: true,
        configurable: true
      },
      _onCollectionSort: {
        value: function _onCollectionSort() {
          var _this16 = this;

          // check for any changes in sort order of views

          var orderChanged = this.collection.find(function(model, index) {
            var view = _this16.children.find(function(view) {
              return view.model === model;
            });
            return !view || view._index !== index;
          });

          if (orderChanged) {
            this.resortView();
          }
        },
        writable: true,
        configurable: true
      }
    });

    return CollectionView;
  })(JaffaMVC.View);

  var Application = JaffaMVC.Application = (function(_JaffaMVC$Module) {
    /**
     * Construct a new application class
     * @param {Object} options
     * @param {Object} options.regions
     * @constructor Application
     * @memberOf JaffaMVC
     */

    function Application() {
      var options = arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, Application);

      this.options = options;

      var regions = this.getOption("regions");

      /** Initialize regions */
      this._regionManager = new JaffaMVC.RegionManager();
      this._regionManager.extendObject(this);

      if (regions) {
        this._regionManager.addRegions(regions);
      }

      /** Initialize channels and global channel */
      this.channels = {};
      this.channel("global").extendObject(this);

      if (typeof this.initialize === "function") {
        this.initialize.apply(this, arguments);
      }
    }

    _inherits(Application, _JaffaMVC$Module);

    _prototypeProperties(Application, null, {
      channel: {

        /**
         * Create a new channel
         * @param  {String} name Name of the module
         * @return {JaffaMVC.Channel}
         *
         * @memberOf JaffaMVC.Application#
         * @method  channel
         */

        value: function channel(name) {
          if (this.channels[name]) {
            return this.channels[name];
          }
          var channel = new JaffaMVC.Channel(name);
          this.channels[name] = channel;

          return channel;
        },
        writable: true,
        configurable: true
      },
      startHistory: {

        /**
         * Start (backbone) history
         * @param {Object} options
         * @param {Boolean} options.pushState
         * @param {String} options.root
         *
         * @memberOf JaffaMVC.Application#
         * @method startHistory
         */

        value: function startHistory(options) {
          if (!this.isRunning) {
            throw new Error("app not started");
          }

          if (Backbone.history) {
            this.trigger("before:history:start", options);
            Backbone.history.start(options);
            this.trigger("history:start", options);
          }
        },
        writable: true,
        configurable: true
      },
      stopHistory: {

        /**
         * Stop history
         * @return {Application}
         *
         * @memberOf JaffaMVC.Application#
         * @method stopHistory
         */

        value: function stopHistory() {
          if (Backbone.history) {
            this.trigger("before:history:stop");
            Backbone.history.stop();
            this.trigger("history:stop");
          }
          return this;
        },
        writable: true,
        configurable: true
      },
      navigate: {

        /**
         * Navigate to url-fragment
         * @param {String} fragment The url path to navigate to
         * @param {Object} options Options
         * @param {Boolean} options.trigger
         *
         * @memberOf JaffaMVC.Application#
         * @method navigate
         */

        value: function navigate(fragment, options) {
          Backbone.history.navigate(fragment, options);
        },
        writable: true,
        configurable: true
      },
      currentFragment: {

        /**
         * Get current url fragment
         * @return {String}
         */

        value: function currentFragment() {
          return Backbone.history.fragment;
        },
        writable: true,
        configurable: true
      },
      destroy: {

        /**
         * Destroy the application (and all attached views and modules)
         *
         * @memberOf JaffaMVC.Application#
         * @method destroy
         */

        value: function destroy() {

          _get(Object.getPrototypeOf(Application.prototype), "destroy", this).call(this);

          this.channels.forEach(function(channel) {
            channel.destroy();
          });

          delete this.channels;
          this._regionManager.unproxyObject(this);
          this._regionManager.destroy();
          delete this._regionManager;
        },
        writable: true,
        configurable: true
      }
    });

    return Application;
  })(JaffaMVC.Module);

  /*if (!this.ui || !this._ui) return;
   this.ui = this._ui;
  delete this._ui;*/

  // TODO: Support for "empty view"

  JaffaMVC.Application.extend = Backbone.extend;
  JaffaMVC.View.extend = Backbone.extend;
  JaffaMVC.CollectionView.extend = Backbone.extend;
  JaffaMVC.LayoutView.extend = Backbone.extend;
  JaffaMVC.Region.extend = Backbone.extend;
  JaffaMVC.RegionManager.extend = Backbone.extend;
  JaffaMVC.Module.extend = Backbone.extend;
  JaffaMVC.Object.extend = Backbone.extend;

  return JaffaMVC;

}));
