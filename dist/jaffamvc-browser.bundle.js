/*!
 * JaffaMVC.js 0.2.7
 * (c) 2015 Rasmus Kildevæld, Softshag.
 * Inspired and based on Backbone.Marionette.js
 * (c) 2014 Derick Bailey, Muted Solutions, LLC.
 * (c) 2014 Adam Krebs, Jimmy Yuen Ho Wong
 * JaffaMVC may be freely distributed under the MIT license.
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'co'], factory);
  } else if (typeof exports === 'object') {
    var backbone = null,
      co = null,
      err;
    try {
      backbone = require('exoskeleton');
    } catch (e) {
      try {
        backbone = require('backbone');
      } catch (e) {
        err = e;
      }
    }
    try {
      co = require('co')
    } catch (e) {}
    if (backbone === null) throw err;
    module.exports = factory(backbone, co);
  } else {
    root.JaffaMVC = factory(root.Exoskeleton || root.Backbone, co);
  }
}(this, function(Backbone, co) {

  "use strict";

  var JaffaMVC = {};

  JaffaMVC.version = "0.2.7";
  JaffaMVC.Debug = false;


  var _slicedToArray = function(arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      var _arr = [];
      for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
        _arr.push(_step.value);
        if (i && _arr.length === i) break;
      }
      return _arr;
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };

  var _createClass = (function() {
    function defineProperties(target, props) {
      for (var key in props) {
        var prop = props[key];
        prop.configurable = true;
        if (prop.value) prop.writable = true;
      }
      Object.defineProperties(target, props);
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

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

  /** Error classes */

  var JaffaError = (function(_Error) {
    function JaffaError() {
      _classCallCheck(this, JaffaError);

      if (_Error != null) {
        _Error.apply(this, arguments);
      }
    }

    _inherits(JaffaError, _Error);

    return JaffaError;
  })(Error);

  var InitializerError = (function(_JaffaError) {
    function InitializerError() {
      _classCallCheck(this, InitializerError);

      if (_JaffaError != null) {
        _JaffaError.apply(this, arguments);
      }
    }

    _inherits(InitializerError, _JaffaError);

    return InitializerError;
  })(JaffaError);

  /* domready (c) Dustin Diaz 2014 - License MIT */
  var domReady = (function(f) {
    //
    //
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

  JaffaMVC.$ = function Query(selector, context) {

    if (typeof selector === "function") {
      return domReady(selector);
    }

    context = context || document;
    if (typeof selector !== "string" && "nodeType" in selector) {
      return [selector];
    }

    if (typeof context === "string") {
      context = document.querySelectorAll(context);
      if (!context.length) {
        return context;
      }
      var _ref = context;

      var _ref2 = _slicedToArray(_ref, 1);

      context = _ref2[0];
    }

    return context.querySelectorAll(selector);
  };

  var __camelCase = function __camelCase(input) {
    return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
  };

  var __slice = Array.prototype.slice;
  var __has = Object.prototype.hasOwnProperty;
  var __nativeBind = Function.prototype.bind;

  var utils = {
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
          var _nextWrapper = function next(_x) {
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
    bind: function bind(func, context) {
      if (__nativeBind && func.bind === __nativeBind) {
        return __nativeBind.apply(func, __slice.call(arguments, 1));
      }
      var args = __slice.call(arguments, 2);
      var bound = function bound() {
        return func.apply(context, args.concat(__slice.call(arguments)));
      };
      return bound;
    },
    getOption: function getOption(option) {
      var obj = arguments[1] === undefined ? {} : arguments[1];

      var options = this.options || {};
      return obj[option] || options[option] || this[option];
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
      var e = __camelCase("on-" + event.replace(/:/g, "-")),
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
          from[fn] = utils.bind(to[fn], to);
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
    },
    extend: function extend(obj) {
      var args = __slice.call(arguments, 1),
        i,
        k,
        o;
      for (i = 0; i < args.length; i++) {
        o = Object(args[i]);
        for (k in o) {
          obj[k] = o[k];
        }
      }
      return obj;
    },
    assign: Object.assign || function(obj) {
      return utils.extend.apply(undefined, __slice.call(arguments));
    },
    inherits: function inherits(child, parent) {
      for (var key in parent) {
        if (Object.prototype.hasOwnProperty.call(parent, key)) child[key] = parent[key];
      }

      function Ctor() {
        this.constructor = child;
      }
      Ctor.prototype = parent.prototype;
      child.prototype = new Ctor();
      child.__super__ = parent.prototype;
      return child;
    },

    deferred: function deferred() {
      var resolve = undefined,
        reject = undefined,
        promise = new Promise(function(res, rej) {
          resolve = res;
          reject = rej;
        });
      return {
        resolve: resolve,
        reject: reject,
        done: function done(err, result) {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      };
    }

  };

  function debug() {
    if (JaffaMVC.Debug !== true) {
      return;
    }
    var args = ["MVC: "].concat(__slice.call(arguments));
    return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, args);
  }

  var ajax = function ajax() {

    var xmlrequest = function xmlrequest() {
      var e = undefined;
      if (window.XMLHttpRequest != null) {
        return new XMLHttpRequest();
      }
      try {
        return new ActiveXObject("msxml2.xmlhttp.6.0");
      } catch (_error) {
        e = _error;
      }
      try {
        return new ActiveXObject("msxml2.xmlhttp.3.0");
      } catch (_error) {
        e = _error;
      }
      try {
        return new ActiveXObject("msxml2.xmlhttp");
      } catch (_error) {
        e = _error;
      }
      return e;
    };

    var xmlRe = /^(?:application|text)\/xml/,
      jsonRe = /^application\/json/,
      fileProto = /^file:/;

    var getData = function getData(accepts, xhr) {
      if (accepts == null) accepts = xhr.getResponseHeader("content-type");
      if (xmlRe.test(accepts)) {
        return xhr.responseXML;
      } else if (jsonRe.test(accepts) && xhr.responseText !== "") {
        return JSON.parse(xhr.responseText);
      } else {
        return xhr.responseText;
      }
    };

    var isValid = function isValid(xhr, url) {
      return xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 || xhr.status === 0 && fileProto.test(url);
      //(xhr.status === 0 && window.location.protocol === 'file:')
    };

    var end = function end(xhr, options, resolve, reject) {
      return function() {
        if (xhr.readyState !== 4) return;

        var status = xhr.status;
        var data = getData(options.headers && options.headers.Accept, xhr);

        // Check for validity.
        if (isValid(xhr, options.url)) {
          if (options.success) options.success(data);
          if (resolve) resolve(data);
        } else {
          var error = new Error("Server responded with a status of " + status);
          if (options.error) options.error(xhr, status, error);
          if (reject) reject(xhr);
        }
      };
    };

    return function(opts) {
      if (opts == null || !utils.isObject(opts)) throw new Error("no opts");
      opts.type = (opts.type || "GET").toUpperCase();

      var xhr = xmlrequest();
      if (xhr instanceof Error) throw xhr;

      var resolve = undefined,
        reject = undefined,
        promise = new Promise(function(res, rej) {
          resolve = res;
          reject = rej;
        });

      if (opts.headers == null) opts.headers = {};

      opts.headers["X-Requested-With"] = "XMLHttpRequest";

      if (opts.contentType) {
        opts.headers["Content-Type"] = opts.contentType;
      }

      // Stringify GET query params.
      if (opts.type === "GET" && typeof opts.data === "object") {
        var query = "";
        var stringifyKeyValuePair = function stringifyKeyValuePair(key, value) {
          return value == null ? "" : "&" + encodeURIComponent(key) + "=" + encodeURIComponent(value);
        };
        for (var key in opts.data) {
          query += stringifyKeyValuePair(key, opts.data[key]);
        }

        if (query) {
          var sep = opts.url.indexOf("?") === -1 ? "?" : "&";
          opts.url += sep + query.substring(1);
        }
      }

      xhr.addEventListener("readystatechange", end(xhr, opts, resolve, reject));

      if (typeof opts.progress === "function") {
        xhr.addEventListener("progress", opts.progress);
      }

      xhr.open(opts.type, opts.url, true);

      var allTypes = "*/".concat("*");
      var xhrAccepts = {
        "*": allTypes,
        text: "text/plain",
        html: "text/html",
        xml: "application/xml, text/xml",
        json: "application/json, text/javascript"
      };
      xhr.setRequestHeader("Accept", opts.dataType && xhrAccepts[opts.dataType] ? xhrAccepts[opts.dataType] + (opts.dataType !== "*" ? ", " + allTypes + "; q=0.01" : "") : xhrAccepts["*"]);

      if (opts.headers)
        for (var k in opts.headers) {
          xhr.setRequestHeader(k, opts.headers[k]);
        }
      if (opts.beforeSend) opts.beforeSend(xhr);

      if (opts.withCredentials) {
        xhr.withCredentials = true;
      }

      xhr.send(opts.data);

      return promise;
    };
  };

  var BaseClass = (function() {
    /**
     * The base of things
     * @constructor Object
     * @memberof JaffaMVC
     * @abstract
     * @mixes JaffaMVC.Events
     */

    function BaseClass() {
      _classCallCheck(this, BaseClass);

      if (typeof this.initialize === "function") {
        utils.callFunction(this.initialize, this, arguments);
      }
    }

    BaseClass.prototype.destroy = function destroy() {
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
    };

    _createClass(BaseClass, {
      isDestroyed: {
        get: function() {
          if (this._isDestroyed == null) {
            this._isDestroyed = false;
          }
          return this._isDestroyed;
        }
      }
    });

    return BaseClass;
  })();

  BaseClass.extend = Backbone.extend;
  // Mixin events
  utils.assign(BaseClass.prototype, Backbone.Events, {
    getOption: utils.getOption,
    triggerMethod: utils.triggerMethod
  });

  var List = (function() {
    function List() {
      _classCallCheck(this, List);

      this._items = new Set();
    }

    List.prototype.add = function add(item) {
      this._items.add(item);
      return this;
    };

    List.prototype["delete"] = function _delete(item) {
      this._items["delete"](item);
      return this;
    };

    List.prototype.has = function has(item) {
      return this._items.has(item);
    };

    List.prototype.clear = function clear() {
      this._items.clear();
      return this;
    };

    List.prototype.find = function find(fn, ctx) {
      //
      ctx = ctx || this;
      var item,
        values = this._items.values();

      while (item = values.next()) {
        if (fn.call(ctx, item.value)) {
          return item.value;
        }
      }
      return null;
    };

    List.prototype.onEach = function onEach(fn) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return this.forEach(function(item) {
        if (item[fn] && typeof item[fn] === "function") {
          utils.callFunction(item[fn], item, args);
        }
      });
    };

    List.prototype.forEach = function forEach(fn, ctx) {
      this._items.forEach(fn, ctx);
      return this;
    };

    _createClass(List, {
      size: {
        get: function() {
          return this._items.size;
        }
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

    Boot.prototype.phase = function phase(name, fn, ctx) {
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
    };

    /**
     * Run the booter
     * @param  {Mixed} option
     * @param  {Object} [ctx]
     * @return {Promise}
     * @async
     * @memberOf JaffaMVC.Boot#
     * @method boot
     */

    Boot.prototype.boot = function boot(options, ctx) {
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
    };

    /**
     * Reset the booter
     * @return {JaffaMVC.Boot}
     *
     * @memberOf JaffaMVC.Boot#
     * @method reset
     */

    Boot.prototype.reset = function reset() {
      this._initialized = false;
      return this;
    };

    /**
     * Run phase
     * @private
     * @memberOf JaffaMVC.Boot#
     * @method _runPhase
     */

    Boot.prototype._runPhase = function _runPhase(phase, options) {
      return utils.callAsyncFunction(phase.fn, phase.ctx, options);
    };

    _createClass(Boot, {
      isInitialized: {

        /**
         * @property {Boolean} isInitialized Whether the booter is initialized
         * @memberOf JaffaMVC.Boot#
         */

        get: function() {
          return this._initialized;
        }
      }
    });

    return Boot;
  })();

  //

  var ChannelError = (function(_JaffaError2) {
    function ChannelError() {
      _classCallCheck(this, ChannelError);

      if (_JaffaError2 != null) {
        _JaffaError2.apply(this, arguments);
      }
    }

    _inherits(ChannelError, _JaffaError2);

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
        var ret = fn.apply(ctx, __slice.call(arguments, 1));
        if (ret && utils.isPromise(ret)) {
          return ret;
        } else if (ret instanceof Error) {
          ret = Promise.reject(ret);
        } else {
          ret = Promise.resolve(ret);
        }
        return ret;
      } else {
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

  var Channel = (function(_BaseClass) {
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

    _inherits(Channel, _BaseClass);

    Channel.prototype.extendObject = function extendObject(obj) {
      JaffaMVC.utils.proxy(obj, this, ["comply", "command", "stopComplying", "reply", "request", "stopReplying"]);
    };

    _createClass(Channel, null, {
      Commands: {
        get: function() {
          return Commands;
        }
      },
      Requests: {
        get: function() {
          return Request;
        }
      }
    });

    return Channel;
  })(BaseClass);

  utils.assign(Channel.prototype, Commands, Request);

  //

  var Module = (function(_BaseClass2) {
    function Module(name, options, app) {
      _classCallCheck(this, Module);

      utils.assign(this, {
        options: options,
        name: name,
        app: app
      });
      if (this.options && this.options.hasOwnProperty("startWithParent")) {
        this.startWithParent = this.options.startWithParent;
      }
      _BaseClass2.call(this);
    }

    _inherits(Module, _BaseClass2);

    Module.prototype.addInitializer = function addInitializer(name, fn, ctx) {
      this.initializer.phase(name, fn, ctx || this);
      return this;
    };

    Module.prototype.addFinalizer = function addFinalizer(name, fn, ctx) {
      this.finalizer.phase(name, fn, ctx || this);
      return this;
    };

    Module.prototype.start = function start(options) {
      var _this16 = this;

      debug("starting module: " + this.name || "undefined");
      if (this.initializer.isInitialized) {
        return Promise.resolve();
      }
      this.triggerMethod("before:start", options);
      return this.initializer.boot(options).then(function(ret) {
        debug("starting submodules for: " + _this16.name || "undefined");
        return _this16._startSubmodules();
      }).then(function() {
        debug("started module: " + _this16.name || "undefined");
        _this16.triggerMethod("start", options);
      })["catch"](function(err) {
        _this16.trigger("error", err);
        return Promise.reject(err);
      });
    };

    Module.prototype.stop = function stop(options) {
      var _this16 = this;

      if (!this.isRunning) {
        return Promise.resolve();
      }
      debug("stopping module: " + this.name);
      this.triggerMethod("before:stop", options);
      return this.finalizer.boot(options).then(function(r) {
        debug("stopping submodules for " + _this16.name);
        return _this16._stopSubmodules(options);
      }).then(function() {
        // Reset intializers
        _this16.initializer.reset();
        _this16.finalizer.reset();
        _this16.stopListening();
        debug("stopped module:", _this16.name);
        _this16.triggerMethod("stop", options);
      })["catch"](function(err) {
        _this16.trigger("error", err);
        return Promise.reject(err);
      });
    };

    Module.prototype.module = function module(name, def) {
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
      debug("defining module ", name, "in", this.name);
      var mod = this.modules[name] = new Klass(name, options, this.app || this);

      var b = undefined;
      if (b = options.bind) {
        b = typeof b === "string" ? b : name;
        console.log("B", b);
        this[b] = mod;
      }

      return mod;
    };

    Module.prototype.removeModule = function removeModule(name) {
      var module = this.module(name);
      if (!module) {
        return;
      }
      module.stop().then(function() {
        module.destroy();
      });
    };

    Module.prototype.removeAllModules = function removeAllModules() {
      for (var key in this.modules) {
        this.removeModule(key);
      }
    };

    Module.prototype.destroy = function destroy() {
      this.removeAllModules();
      _BaseClass2.prototype.destroy.call(this);
    };

    // Private API

    Module.prototype._startSubmodules = function _startSubmodules(options) {
      var _this16 = this;

      return utils.eachAsync(Object.keys(this.modules), function(name) {
        var mod = _this16.modules[name];
        if (mod.startWithParent) {
          return mod.start(options);
        }
      });
    };

    Module.prototype._stopSubmodules = function _stopSubmodules() {
      return utils.eachAsync(this.modules, function(mod) {
        return mod.stop();
      });
    };

    _createClass(Module, {
      startWithParent: {
        get: function() {
          if (this._startWithParent == null) {
            this._startWithParent = true;
          }
          return this._startWithParent;
        },
        set: function(val) {
          this._startWithParent = val;
        }
      },
      initializer: {
        get: function() {
          if (!this._initializer) {
            this._initializer = new Boot();
          }
          return this._initializer;
        }
      },
      finalizer: {
        get: function() {
          if (!this._finalizer) {
            this._finalizer = new Boot();
          }
          return this._finalizer;
        }
      },
      modules: {
        get: function() {
          if (this._modules == null) {
            this._modules = [];
          }
          return this._modules;
        }
      },
      isRunning: {
        get: function() {
          return this.initializer.isInitialized && !this.finalizer.isInitialized;
        }
      }
    });

    return Module;
  })(BaseClass);

  //
  //

  var Region = (function(_BaseClass3) {

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
      _BaseClass3.call(this);
    }

    _inherits(Region, _BaseClass3);

    /**
     * Build region from a definition
     * @param {Object|String|JaffaMVC.Region} def The description of the region
     * @return {JaffaMVC.Region}
     * @memberof JaffaMVC.Region
     */

    Region.buildRegion = function buildRegion(def) {
      if (def instanceof Region) {
        return def;
      } else if (typeof def === "string") {
        return buildBySelector(def, Region);
      } else {
        return buildByObject(def);
      }
    };

    /**
     * Show a view in the region.
     * This will destroy or remove any existing views.
     * @param  {View} view    The view to Show
     * @return {Region}       this for chaining.
     * @memberof JaffaMVC.Region#
     */

    Region.prototype.show = function show(view, options) {
      var diff = view !== this.currentView;
      // Remove any containing views
      this.empty();

      if (diff) {
        // If the view is destroyed be others
        view.once("destroy", this.empty, this);

        view.once("render", function() {
          utils.triggerMethodOn(view, "show");
        });

        view.render();

        utils.triggerMethodOn(view, "before:show");

        this._attachHtml(view);

        this.currentView = view;
      }

      return this;
    };

    /**
     * Destroy the region, this will remove any views, but not the containing element
     * @return {Region} this for chaining
     * @memberof JaffaMVC.Region#
     */

    Region.prototype.destroy = function destroy() {
      this.empty();
      this.stopListening();
    };

    /**
     * Empty the region. This will destroy any existing view.
     * @memberof JaffaMVC.Region#
     * @return {Region} this for chaining;
     */

    Region.prototype.empty = function empty() {

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
    };

    Region.prototype._attachHtml = function _attachHtml(view) {
      this.el.innerHtml = "";
      this.el.appendChild(view.el);
    };

    Region.prototype._destroyView = function _destroyView() {
      var view = this.currentView;

      if (view.destroy && typeof view.destroy === "function" && !view.isDestroyed) {
        view.destroy();
      } else if (view.remove && typeof view.remove === "function") {
        view.remove();
      }
    };

    return Region;
  })(BaseClass);

  function buildByObject() {
    var object = arguments[0] === undefined ? {} : arguments[0];

    if (!object.selector) throw new Error("No selector specified", object);

    return buildBySelector(object.selector, object.regionClass || Region);
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

  //

  var proxyties = ["addRegions", "addRegion", "removeRegion", "removeRegions"];

  var RegionManager = (function(_BaseClass4) {
    function RegionManager() {
      _classCallCheck(this, RegionManager);

      this.regions = {};
      _BaseClass4.call(this);
    }

    _inherits(RegionManager, _BaseClass4);

    RegionManager.prototype.extendObject = function extendObject(obj) {
      utils.proxy(obj, this, proxyties);
      obj.regions = this.regions;
    };

    RegionManager.prototype.unproxyObject = function unproxyObject(obj) {
      proxyties.forEach(function(m) {
        if (obj[m]) {
          delete obj[m];
        }
      });
    };

    /**
     * Add one or more regions to the region manager
     * @param {Object} regions
     * @memberof JaffaMVC.RegionManager#
     */

    RegionManager.prototype.addRegions = function addRegions(regions) {
      var def = undefined,
        out = {},
        keys = Object.keys(regions);
      keys.forEach(function(k) {
        def = regions[k];
        out[k] = this.addRegion(k, def);
      }, this);
      return out;
    };

    /**
     * Add a region to the RegionManager
     * @param {String} name   The name of the regions
     * @param {String|Object|JaffaMVC.Region} def The region to associate with the name and the RegionManager
     * @memberof JaffaMVC.RegionManager#
     */

    RegionManager.prototype.addRegion = function addRegion(name, def) {

      var region = JaffaMVC.Region.buildRegion(def);
      this._setRegion(name, region);

      return region;
    };

    /**
     * Remove one or more regions from the manager
     * @param {...name} name A array of region names
     * @memberof JaffaMVC.RegionManager#
     */

    RegionManager.prototype.removeRegion = function removeRegion() {
      var names = __slice.call(arguments);

      names.forEach(function(name) {
        if (__has.call(this.regions, name)) {
          var region = this.regions[name];
          region.destroy();
          this._unsetRegion(name);
        }
      }, this);
    };

    /**
     * Destroy the regionmanager
     * @memberof JaffaMVC.RegionManager#
     */

    RegionManager.prototype.destroy = function destroy() {
      _BaseClass4.prototype.destroy.call(this);
      this.removeRegions();
    };

    /**
     * Remove all regions from the manager
     * @memberof JaffaMVC.RegionManager#
     */

    RegionManager.prototype.removeRegions = function removeRegions() {
      this.removeRegion.apply(this, Object.keys(this.regions));
    };

    /**
     * @private
     */

    RegionManager.prototype._setRegion = function _setRegion(name, region) {
      this.regions[name] = region;
    };

    /**
     * @private
     */

    RegionManager.prototype._unsetRegion = function _unsetRegion(name) {
      delete this.regions[name];
    };

    return RegionManager;
  })(BaseClass);

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

  var unbubblebles = "focus blur change".split(" ");

  // Find the right `Element#matches` for IE>=9 and modern browsers.
  var matchesSelector = ElementProto.matches || ElementProto.webkitMatchesSelector || ElementProto.mozMatchesSelector || ElementProto.msMatchesSelector || ElementProto.oMatchesSelector ||
    // Make our own `Element#matches` for IE8
    function(selector) {
      /*jslint bitwise: true */
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

  var NativeView = (function(_BBView) {
    function NativeView() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      _classCallCheck(this, NativeView);

      this._domEvents = [];
      _BBView.call.apply(_BBView, [this].concat(args));
    }

    _inherits(NativeView, _BBView);

    NativeView.prototype.$ = function $(selector) {
      return JaffaMVC.$(selector, this.el);
    };

    NativeView.prototype._removeElement = function _removeElement() {
      this.undelegateEvents();
      if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
    };

    // Apply the `element` to the view. `element` can be a CSS selector,
    // a string of HTML, or an Element node.

    NativeView.prototype._setElement = function _setElement(element) {
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
    };

    // Set a hash of attributes to the view's `el`. We use the "prop" version
    // if available, falling back to `setAttribute` for the catch-all.

    NativeView.prototype._setAttributes = function _setAttributes(attrs) {
      //
      for (var attr in attrs) {
        attr in this.el ? this.el[attr] = attrs[attr] : this.el.setAttribute(attr, attrs[attr]);
      }
    };

    NativeView.prototype.delegateEvents = function delegateEvents(events) {
      var _this16 = this;

      if (!(events || (events = utils.result(this, "events")))) {
        return this;
      }
      this.undelegateEvents();

      var dels = [];
      for (var key in events) {
        var method = events[key];
        if (typeof method !== "function") method = this[events[key]];

        var match = key.match(/^(\S+)\s*(.*)$/);
        // Set delegates immediately and defer event on this.el
        var boundFn = utils.bind(method, this);
        if (match[2]) {
          this.delegate(match[1], match[2], boundFn);
        } else {
          dels.push([match[1], boundFn]);
        }
      }

      dels.forEach(function(d) {
        _this16.delegate(d[0], d[1]);
      });

      return this;
    };

    // Make a event delegation handler for the given `eventName` and `selector`
    // and attach it to `this.el`.
    // If selector is empty, the listener will be bound to `this.el`. If not, a
    // new handler that will recursively traverse up the event target's DOM
    // hierarchy looking for a node that matches the selector. If one is found,
    // the event's `delegateTarget` property is set to it and the return the
    // result of calling bound `listener` with the parameters given to the
    // handler.

    NativeView.prototype.delegate = function delegate(eventName, selector, listener) {
      /*jslint eqeq: true*/
      if (typeof selector === "function") {
        listener = selector;
        selector = null;
      }

      var root = this.el;
      var handler = selector ? function(e) {
        var node = e.target || e.srcElement;

        // Already handled
        if (e.delegateTarget) return;

        for (; node && node != root; node = node.parentNode) {
          if (matchesSelector.call(node, selector)) {

            e.delegateTarget = node;
            listener(e);
          }
        }
      } : function(e) {
        if (e.delegateTarget) return;
        listener(e);
      };
      /*jshint bitwise: false*/
      var useCap = !!~unbubblebles.indexOf(eventName);

      elementAddEventListener.call(this.el, eventName, handler, useCap);
      this._domEvents.push({
        eventName: eventName,
        handler: handler,
        listener: listener,
        selector: selector
      });
      return handler;
    };

    // Remove a single delegated event. Either `eventName` or `selector` must
    // be included, `selector` and `listener` are optional.

    NativeView.prototype.undelegate = function undelegate(eventName, selector, listener) {
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
    };

    // Remove all events created with `delegate` from `el`

    NativeView.prototype.undelegateEvents = function undelegateEvents() {
      if (this.el) {
        for (var i = 0, len = this._domEvents.length; i < len; i++) {
          var item = this._domEvents[i];
          elementRemoveEventListener.call(this.el, item.eventName, item.handler, false);
        }
        this._domEvents.length = 0;
      }
      return this;
    };

    return NativeView;
  })(BBView);

  //

  var View = (function(_NativeView) {
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

      _NativeView.call(this, options);
    }

    _inherits(View, _NativeView);

    /**
     * Destroy the view and release all resources
     * @memberof JaffaMVC.View#
     * @method destroy
     * @return {JaffaMVC.View}
     */

    View.prototype.destroy = function destroy() {
      if (this.isDestroyed === true) {
        return this;
      }

      var args = __slice.call(arguments);

      this.triggerMethod("before:destroy", args);

      this.isDestroyed = true;

      this.triggerMethod("destroy", args);
      debug("view destroy:", this);

      this.remove();

      return this;
    };

    /**
     * Render the view
     * @memberOf  JaffaMVC.View#
     * @method render
     * @return {JaffaMVC.View}
     */

    View.prototype.render = function render() {
      var _this16 = this;

      this.triggerMethod("before:render", this);

      var template = this.getOption("template");

      if (template != null) {
        this._renderTemplate(template).then(function(templ) {
          _this16.el.innerHTML = templ;
          _this16.delegateEvents();
          _this16.triggerMethod("render", _this16);
        }, function(e) {
          throw e;
        });
      } else {
        this.delegateEvents();
        this.triggerMethod("render", this);
      }

      return this;
    };

    /**
     * Get template data for template rendering
     * @return {Object} object to render
     * @memberOf JaffaMVC.View#
     * @method getTemplateData
     */

    View.prototype.getTemplateData = function getTemplateData() {
      return this.model && typeof this.model.toJSON === "function" ? this.model.toJSON() : {};
    };

    /**
     * Delegate events
     * @param  {Object} eventArgs Events object
     * @return {View}           this
     * @memberOf JaffaMVC.View#
     * @method delegateEvents
     */

    View.prototype.delegateEvents = function delegateEvents(eventArgs) {
      this.bindUIElements();

      var events = eventArgs || this.events;

      events = this.normalizeUIKeys(events);

      var _filterEvents = this.filterEvents(events);

      var e = _filterEvents.e;

      var triggers = this._configureTriggers();

      var combined = {};

      utils.assign(combined, e, triggers);

      _NativeView.prototype.delegateEvents.call(this, combined);
      this.bindDataEvents(events);
    };

    /**
     * Undelegate events
     * @return {View} this
     * @memberOf JaffaMVC.View#
     * @method undelegateEvents
     */

    View.prototype.undelegateEvents = function undelegateEvents() {
      this.unbindUIElements();
      this.unbindDataEvents();
      _NativeView.prototype.undelegateEvents.call(this);
    };

    /**
     * Configure triggers
     * @return {Object} events object
     * @memberOf JaffaMVC.View#
     * @method _configureTriggers
     * @private
     */

    View.prototype._configureTriggers = function _configureTriggers() {
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
    };

    /**
     * builder trigger function
     * @param  {Object|String} triggerDef Trigger definition
     * @return {Function}
     * @memberOf JaffaMVC.View#
     * @method _buildViewTrigger
     * @private
     */

    View.prototype._buildViewTrigger = function _buildViewTrigger(triggerDef) {

      if (typeof triggerDef === "string") triggerDef = {
        event: triggerDef
      };

      var options = utils.assign({
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
    };

    /* UI Elements */

    View.prototype.bindUIElements = function bindUIElements() {
      var _this16 = this;

      var ui = this.getOption("ui");
      if (!ui) {
        return;
      }
      if (!this._ui) {
        this._ui = ui;
      }

      ui = utils.result(this, "_ui");

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
    };

    View.prototype.bindDataEvents = function bindDataEvents(events) {
      var _this16 = this;

      var _filterEvents = this.filterEvents(events);

      var c = _filterEvents.c;
      var m = _filterEvents.m;

      this._dataEvents = {};
      var fn = function(item, ev) {

        if (!_this16[item]) return {};
        var out = {},
          k = undefined,
          f = undefined;

        for (k in ev) {
          f = utils.bind(ev[k], _this16);
          _this16[item].on(k, f);
          out[item + ":" + k] = f;
        }

        return out;
      };

      utils.assign(this._dataEvents, fn("model", m), fn("collection", c));
    };

    View.prototype.unbindDataEvents = function unbindDataEvents() {
      if (!this._dataEvents) {
        return;
      }
      var k = undefined,
        v = undefined;
      for (k in this._dataEvents) {
        v = this._dataEvents[k];

        var _k$split = k.split(":");

        var _k$split2 = _slicedToArray(_k$split, 2);

        var item = _k$split2[0];
        var ev = _k$split2[1];

        if (!this[item]) continue;
        console.log(item, ev);
        this[item].off(ev, v);
        //this.stopListening(this[item],ev, v);
      }
      delete this._dataEvents;
    };

    View.prototype.unbindUIElements = function unbindUIElements() {};

    /**
     * Renders the template
     * @param  {Function|String} template The template to render
     * @return {Promise<String>}
     * @method _renderTemplate
     * @memberOf  JaffaMVC.View#
     */

    View.prototype._renderTemplate = function _renderTemplate(template) {
      var data = this.getOption("getTemplateData").call(this);

      if (typeof template === "function") {
        return utils.callAsyncFunction(template, this, data);
      } else {
        return Promise.resolve(template);
      }
    };

    View.prototype.normalizeUIKeys = function normalizeUIKeys(obj) {
      //
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
    };

    View.prototype.filterEvents = function filterEvents(obj) {
      //
      var c = {},
        m = {},
        e = {},
        k = undefined,
        v = undefined;
      for (k in obj) {
        var _k$split = k.split(" ");

        var _k$split2 = _slicedToArray(_k$split, 2);

        var ev = _k$split2[0];
        var t = _k$split2[1];

        ev = ev.trim(), t = t ? t.trim() : "", v = obj[k];
        if (t === "collection") {
          c[ev] = v;
        } else if (t === "model") {
          m[ev] = v;
        } else {
          e[k] = v;
        }
      }
      return {
        c: c,
        m: m,
        e: e
      };
    };

    _createClass(View, {
      isShown: {
        get: function() {
          return !!this._isShown;
        }
      },
      isRendered: {
        get: function() {
          return !!this._isRendered;
        }
      }
    });

    return View;
  })(NativeView);

  utils.assign(View.prototype, {
    getOption: utils.getOption,
    triggerMethod: utils.triggerMethod
  });

  //

  var LayoutView = (function(_View) {
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
      this._regionManager = new RegionManager();
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

      _View.call(this, options);
    }

    _inherits(LayoutView, _View);

    LayoutView.prototype.addRegion = function addRegion(name, def) {
      if (typeof def === "string") {
        var elm = this.$(def);
        if (!elm.length) throw new Error("element must exists in dom");

        def = new Region({
          el: elm[0]
        });
      }
      this._regionManager.addRegion(name, def);
    };

    LayoutView.prototype.addRegions = function addRegions(regions) {
      for (var k in regions) {
        this.addRegion(k, regions[k]);
      }
    };

    LayoutView.prototype.destroy = function destroy() {
      _View.prototype.destroy.call(this);
      this._regionManager.destroy();
    };

    return LayoutView;
  })(View);

  //

  var CollectionView = (function(_View2) {

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

      this.children = new List();

      this._isBuffering = false;

      utils.bindAll(this, ["render"]);

      _View2.call(this, options);

      this.sort = true;
      this.once("render", this._initCollectionEvents);

      // when this view is shown, all child views should be shown also.
      this.listenTo(this, "before:show", function() {
        this.children.forEach(function(child) {
          if (!child.isShown) utils.triggerMethodOn(child, "before:show");
        });
      });

      this.listenTo(this, "show", function() {
        this.children.forEach(function(child) {
          if (!child.isShown) utils.triggerMethodOn(child, "show");
        });
      });
    }

    _inherits(CollectionView, _View2);

    /**
     * Render the collection view and alle of the children
     * @return {JaffaMVC.CollectionView}
     *
     * @memberOf JaffaMVC.CollectionView#
     * @method render
     */

    CollectionView.prototype.render = function render(options) {

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

      return _View2.prototype.render.call(this);
    };

    /**
     *  Renders the entire collection
     */

    CollectionView.prototype.renderCollection = function renderCollection() {
      var _this16 = this;

      var view = undefined;
      this.trigger("before:render:children");
      this.collection.models.forEach(function(model, index) {
        view = _this16._getChildView(model);
        _this16._addChildView(view, index);
      });
      this.trigger("render:children");
    };

    CollectionView.prototype.renderChildView = function renderChildView(view, index) {
      this.triggerMethod("before:render:child", view);

      view.render();
      this._attachHTML(view, index);

      this.triggerMethod("render:child", view);
    };

    CollectionView.prototype.removeChildView = function removeChildView(view) {

      if (!view) {
        return;
      }
      if (typeof view.destroy === "function") {
        view.destroy();
      } else if (typeof view.remove === "function") {
        view.remove();
      }

      this.stopListening(view);
      this.children["delete"](view);

      if (this.children.size === 0) {
        this.showEmptyView();
      }

      this._updateIndexes(view, false);
    };

    // Buffering
    /**
     * When inserting a batch of models, this method should be called first,
     * to optimise perfomance
     * @memberof JaffaMVC.CollectionView#
     */

    CollectionView.prototype.startBuffering = function startBuffering() {
      this._buffer = document.createDocumentFragment();
      this._isBuffering = true;
      this._bufferedChildren = [];
    };

    /**
     * Should be called when finished inserting a batch of models
     * @memberof JaffaMVC.CollectionView#
     */

    CollectionView.prototype.stopBuffering = function stopBuffering() {
      this._isBuffering = false;

      this._triggerBeforeShowBufferedChildren();

      this._container.appendChild(this._buffer);

      this._triggerShowBufferedChildren();

      delete this._bufferedChildren;
    };

    /**
     * Show empty view
     * Emptyview can be a function or a function
     */

    CollectionView.prototype.showEmptyView = function showEmptyView() {
      var EmptyView = this.getOption("emptyView");

      if (!EmptyView || this._emptyView) {
        return;
      }
      var view = this._emptyView = new EmptyView({
        model: this.model,
        collection: this.collection
      });

      utils.triggerMethodOn(view, "before:show");
      this._container.appendChild(view.render().el);
      utils.triggerMethodOn(view, "show");
    };

    CollectionView.prototype.hideEmptyView = function hideEmptyView() {
      if (!this._emptyView) {
        return;
      }
      if (typeof this._emptyView.destroy === "function") {
        this._emptyView.destroy();
      } else if (typeof this._emptyView.remove === "function") {
        this._emptyView.remove();
      }

      delete this._emptyView;

      this._container.innerHtml = "";
    };

    CollectionView.prototype._triggerBeforeShowBufferedChildren = function _triggerBeforeShowBufferedChildren() {
      if (this._isShown) {
        this._bufferedChildren.forEach(function(item) {
          if (!item._isShown) utils.triggerMethodOn(item, "before:show");
        });
      }
    };

    CollectionView.prototype._triggerShowBufferedChildren = function _triggerShowBufferedChildren() {
      if (this._isShown) {
        this._bufferedChildren.forEach(function(item) {
          if (!item._isShown) utils.triggerMethodOn(item, "show");
        });
      }
    };

    /**
     * Returns a new instance of this.childView with attached model.
     *
     * @param {JaffaMVC.Model} model
     * @protected
     * @memberof JaffaMVC.CollectionView#
     */

    CollectionView.prototype._getChildView = function _getChildView(model) {
      var View = this.getOption("childView") || JaffaMVC.View,
        options = this.getOption("childViewOptions") || {};

      return new View(utils.assign({
        model: model
      }, options));
    };

    /**
     * Attach the childview's element to the CollectionView.
     * When in buffer mode, the view is added to a documentfragment to optimize performance
     * @param {JaffaMVC.View} view  A view
     * @param {Number} index The index in which to insert the view
     * @protected
     * @memberof JaffaMVC.CollectionView#
     */

    CollectionView.prototype._attachHTML = function _attachHTML(view, index) {
      if (this._isBuffering) {
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
    };

    /**
     * Render child
     * @param {Array<JaffaMVC.Model>} models
     */

    CollectionView.prototype._renderChildren = function _renderChildren(models) {

      this.destroyChildren();

      if (this.collection.length !== 0) {
        this.hideEmptyView();
        this.startBuffering();
        this.renderCollection();
        this.stopBuffering();
      } else {
        this.showEmptyView();
      }
      // TODO: What to do on empty collection
    };

    /**
     * Add childview to collection view
     * @private
     * @memberOf JaffaMVC.CollectionView#
     * @method  _addChildView
     * @param {JaffaMVC.View} view  A view
     * @param {Number} index index
     */

    CollectionView.prototype._addChildView = function _addChildView(view, index) {

      this._updateIndexes(view, true, index);

      this.proxyChildViewEvents(view);

      this.children.add(view);

      this.hideEmptyView();

      this.renderChildView(view, index);

      this.triggerMethod("add:child", view);
    };

    /**
     * Proxy event froms childview to the collectionview
     * @param {JaffaMVC.View} view
     * @private
     * @method  _proxyChildViewEvents
     * @memberOf JaffaMVC.CollectionView#
     */

    CollectionView.prototype.proxyChildViewEvents = function proxyChildViewEvents(view) {
      var prefix = this.getOption("prefix") || "childview";

      this.listenTo(view, "all", function() {
        var args = __slice.call(arguments);

        args[0] = prefix + ":" + args[0];
        args.splice(1, 0, view);

        utils.callFunction(this.triggerMethod, this, args);
      });
    };

    /**
     * Resort the view
     * @return {CollectionView} this
     */

    CollectionView.prototype.resortView = function resortView() {
      var _this16 = this;

      this.triggerMethod("before:resort");
      this.render(function() {
        _this16.triggerMethod("resort");
      });
      return this;
    };

    /**
     * Destroy the collection view and all of it's children
     * @see JaffaMVC.View
     * @return {JaffaMVC.View}
     */

    CollectionView.prototype.destroy = function destroy() {
      this.triggerMethod("before:destroy:children");
      this.destroyChildren();
      this.triggerMethod("destroy:children");

      return _View2.prototype.destroy.call(this);
    };

    /**
     * Destroy all children of the collection view
     */

    CollectionView.prototype.destroyChildren = function destroyChildren() {

      if (this._container) {
        this._container.innerHtml = "";
      }
      if (this.children.size === 0) {
        return;
      }
      this.children.forEach(this.removeChildView, this);
      this.children.clear();
    };

    // Internal method. Check whether we need to insert the view into
    // the correct position.

    CollectionView.prototype._insertBefore = function _insertBefore(childView, index) {
      var currentView = undefined;

      var findPosition = this.sort && index < this.children.size - 1;
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
    };

    // Internal method. Append a view to the end of the $el

    CollectionView.prototype._insertAfter = function _insertAfter(childView) {
      this._container.appendChild(childView.el);
    };

    CollectionView.prototype._destroyContainer = function _destroyContainer() {
      if (this._container) delete this._container;
    };

    CollectionView.prototype._initCollectionEvents = function _initCollectionEvents() {
      if (this.collection) {

        this.listenTo(this.collection, "add", this._onCollectionAdd);
        this.listenTo(this.collection, "remove", this._onCollectionRemove);
        this.listenTo(this.collection, "reset", this.render);

        if (this.sort) this.listenTo(this.collection, "sort", this._onCollectionSort);
      }
    };

    ///
    /// Private methods
    ///

    CollectionView.prototype._initContainer = function _initContainer() {
      var container = this.getOption("childViewContainer");
      if (container) {
        container = this.$(container)[0];
      } else {
        container = this.el;
      }
      this._container = container;
    };

    CollectionView.prototype._updateIndexes = function _updateIndexes(view, increment, index) {
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
    };

    // Event handlers

    /**
     * Called when a model is add to the collection
     * @param {JaffaMVC.Model|Backbone.model} model Model
     * @private
     */

    CollectionView.prototype._onCollectionAdd = function _onCollectionAdd(model) {
      var view = this._getChildView(model);
      var index = this.collection.models.indexOf(model);

      this._addChildView(view, index);
    };

    /**
     * Called when a model is removed from the collection
     * @param {JaffaMVC.Model|Backbone.model} model Model
     * @private
     */

    CollectionView.prototype._onCollectionRemove = function _onCollectionRemove(model) {
      var view = this.children.find(function(view) {
        return view.model === model;
      });

      this.removeChildView(view);
    };

    CollectionView.prototype._onCollectionSort = function _onCollectionSort() {
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
    };

    return CollectionView;
  })(View);

  var Collection = (function(__super) {

    utils.inherits(Collection, __super);

    function Collection(models, options) {
      __super.call(this, models, options);
    }

    utils.assign(Collection.prototype, {
      getOption: utils.getOption,
      triggerMethod: utils.triggerMethod
    });

    return Collection;
  })(Backbone.Collection);

  var Model = (function(__super) {

    utils.inherits(Model, __super);

    function Model(models, options) {
      __super.call(this, models, options);
    }

    utils.assign(Model.prototype, {
      getOption: utils.getOption,
      triggerMethod: utils.triggerMethod
    });

    return Model;
  })(Backbone.Model);
  //

  var Application = (function(_Module) {
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
      this._regionManager = new RegionManager();
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

    _inherits(Application, _Module);

    /**
     * Create a or get a channel
     * @param  {String} name Name of the channel
     * @return {JaffaMVC.Channel}
     *
     * @memberOf JaffaMVC.Application#
     * @method  channel
     */

    Application.prototype.channel = function channel(name) {
      if (this.channels[name]) {
        return this.channels[name];
      }
      var channel = new JaffaMVC.Channel(name);
      this.channels[name] = channel;

      return channel;
    };

    /**
     * Start (backbone) history
     * @param {Object} options
     * @param {Boolean} options.pushState
     * @param {String} options.root
     *
     * @memberOf JaffaMVC.Application#
     * @method startHistory
     */

    Application.prototype.startHistory = function startHistory(options) {
      if (!this.isRunning) {
        throw new Error("app not started");
      }

      if (Backbone.history) {
        this.trigger("before:history:start", Backbone.history, options);
        Backbone.history.start(options);
        this.trigger("history:start", options);
      }
    };

    /**
     * Stop history
     * @return {Application}
     *
     * @memberOf JaffaMVC.Application#
     * @method stopHistory
     */

    Application.prototype.stopHistory = function stopHistory() {
      if (Backbone.history) {
        this.trigger("before:history:stop");
        Backbone.history.stop();
        this.trigger("history:stop");
      }
      return this;
    };

    /**
     * Navigate to url-fragment
     * @param {String} fragment The url path to navigate to
     * @param {Object} options Options
     * @param {Boolean} options.trigger
     *
     * @memberOf JaffaMVC.Application#
     * @method navigate
     */

    Application.prototype.navigate = function navigate(fragment, options) {
      Backbone.history.navigate(fragment, options);
    };

    /**
     * Get current url fragment
     * @return {String}
     */

    Application.prototype.currentFragment = function currentFragment() {
      return Backbone.history.fragment;
    };

    /**
     * Destroy the application (and all attached views and modules)
     *
     * @memberOf JaffaMVC.Application#
     * @method destroy
     */

    Application.prototype.destroy = function destroy() {

      _Module.prototype.destroy.call(this);

      this.channels.forEach(function(channel) {
        channel.destroy();
      });

      delete this.channels;
      this._regionManager.unproxyObject(this);
      this._regionManager.destroy();
      this.stopHistory();

      delete this._regionManager;
    };

    return Application;
  })(Module);

  [Application, Module, BaseClass, View, CollectionView, LayoutView,
    Region, RegionManager, Collection, Model, List
  ].forEach(function(elm) {
    elm.extend = Backbone.extend
  });

  JaffaMVC.ajax = ajax();

  utils.assign(JaffaMVC, {
    Application: Application,
    Module: Module,
    RegionManager: RegionManager,
    Region: Region,
    LayoutView: LayoutView,
    View: View,
    CollectionView: CollectionView,
    Channel: Channel,
    List: List,
    Object: BaseClass,
    utils: utils,
    NativeView: NativeView,
    Collection: Collection,
    Model: Model,
    Events: Backbone.Events,
    History: Backbone.History,
    Router: Backbone.Router
  });

  return JaffaMVC;

}));

/*!
 * JaffaMVC.Ext.js 0.2.7
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
          collection = this.getOption("collection", options);

        var opts = {};
        if (template) opts.template = template;
        if (regions) opts.regions = regions;
        if (model) opts.model = model;
        if (collection) opts.collection = collection;

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
