/*!
 * JaffaMVC.js 0.0.13
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

  JaffaMVC.version = "0.0.13";
  JaffaMVC.Debug = false;


  /**
   * JaffaMVC
   * @namespace JaffaMVC
   */
  Object.assign(JaffaMVC, {
    Events: Backbone.Events,
    History: Backbone.History,
    Model: Backbone.Model,
    Collection: Backbone.Collection,
    Router: Backbone.Router
  });

  /** Error classes */
  class JaffaError extends Error {}
  class InitializerError extends JaffaError {}

  /* domready (c) Dustin Diaz 2014 - License MIT */
  let domReady = (function(f) {
    //
    //
    let fns = [],
      listener,
      doc = document,
      hack = doc.documentElement.doScroll,
      domContentLoaded = 'DOMContentLoaded',
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
    }
  })();

  JaffaMVC.$ = function Query(selector, context) {

    if (typeof selector === 'function') {
      return domReady(selector);
    }

    context = context ||  document;
    if (typeof selector !== 'string' && 'nodeType' in selector) {
      return [selector];
    }

    if (typeof context === 'string') {
      context = document.querySelectorAll(context);
      if (!context.length) return context;
      [context] = context;
    }

    return context.querySelectorAll(selector);

  };


  var __camelCase = function(input) {
    return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
  };

  let __slice = Array.prototype.slice;
  let __has = Object.prototype.hasOwnProperty;
  let utils = {
    callFunction: function(fn, ctx, args) {
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
    callAsyncFunction: function(fn, ctx, arg) {

      return new Promise(function(resolve, reject) {
        let cb, ret;

        cb = function(err, ret) {
          if (err) return reject(err);
          resolve(ret);
        }

        if (fn.length > 1) {
          return fn.call(ctx, arg, cb);

        } else if (utils.isGenerator(fn) || utils.isGeneratorFunction(fn)) {

          if (co && typeof co.wrap === 'function') {
            fn = co.wrap(fn);
          } else {
            throw new Error('generators support needs co! - see https://github.com/tj/co');
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
    eachAsync(array, iterator, ctx) {
      let i = 0,
        len = array.length,
        next;
      return new Promise(function(resolve, reject) {
        let next = function(e) {

          if (e != null || i === len)
            return e ? reject(e) : resolve()

          utils.callAsyncFunction(iterator, ctx, array[i++])
            .then(function(r) {
              next();
            }, next);

        };
        next(null);
      });

    },
    bindAll(obj, fns) {
      return utils.proxy(obj, obj, fns);
    },
    getOption(option) {
      let options = this.options || {};
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
    triggerMethod(event) {
      let e = __camelCase('on-' + event.replace(/:/g, '-')),
        m = utils.getOption.call(this, e),
        args = __slice.call(arguments, 1);

      utils.callFunction(this.trigger, this, __slice.call(arguments));

      if (typeof m === 'function') {
        utils.callFunction(m, this, args);
      }
    },
    triggerMethodOn(o, ...args) {
      utils.callFunction(utils.triggerMethod, o, args);
    },

    /**
     * Forward method from one object ot another
     * @param  {Object} from Source object
     * @param  {Object} to   Destination object
     * @param  {Array<Function>} fns  An array of methods
     * @memberof JaffaMVC.utils
     */
    proxy(from, to, fns) {
      if (!Array.isArray(fns)) fns = [fns];
      fns.forEach(function(fn) {
        if (typeof to[fn] === 'function') {
          from[fn] = to[fn].bind(to);
        }
      });
    },

    isGenerator(obj) {
      return 'function' === typeof obj.next && 'function' === typeof obj.throw;
    },
    isGeneratorFunction(obj) {
      let constructor = obj.constructor;
      if (!constructor) return false;
      if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
      return utils.isGenerator(constructor.prototype);
    },
    isPromise(obj) {
      return 'function' === typeof obj.then;
    },
    isObject(obj) {
      let type = typeof obj;
      return type === 'function' || type === 'object' && !!obj;
    },
    result(obj, prop, ...args) {
      if (typeof obj[prop] === 'function')
        return obj[prop](...args);
      return obj[prop];
    }

  }


  function debug() {
    if (JaffaMVC.Debug !== true) return;

    return 'object' === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
  }


  let ajax = function() {

    let xmlrequest = function() {
      let e;
      if (window.XMLHttpRequest != null) {
        return new XMLHttpRequest();
      }
      try {
        return new ActiveXObject('msxml2.xmlhttp.6.0');
      } catch (_error) {
        e = _error;
      }
      try {
        return new ActiveXObject('msxml2.xmlhttp.3.0');
      } catch (_error) {
        e = _error;
      }
      try {
        return new ActiveXObject('msxml2.xmlhttp');
      } catch (_error) {
        e = _error;
      }
      return e;
    };

    let xmlRe = /^(?:application|text)\/xml/;
    let jsonRe = /^application\/json/;

    let getData = function(accepts, xhr) {
      if (accepts == null) accepts = xhr.getResponseHeader('content-type');
      if (xmlRe.test(accepts)) {
        return xhr.responseXML;
      } else if (jsonRe.test(accepts) && xhr.responseText !== '') {
        return JSON.parse(xhr.responseText);
      } else {
        return xhr.responseText;
      }
    };

    var isValid = function(xhr) {
      return (xhr.status >= 200 && xhr.status < 300) ||
        (xhr.status === 304) ||
        (xhr.status === 0 && window.location.protocol === 'file:')
    };

    var end = function(xhr, options, resolve, reject) {
      return function() {
        if (xhr.readyState !== 4) return;

        var status = xhr.status;
        var data = getData(options.headers && options.headers.Accept, xhr);

        // Check for validity.
        if (isValid(xhr)) {
          if (options.success) options.success(data);
          if (resolve) resolve(data);
        } else {
          var error = new Error('Server responded with a status of ' + status);
          if (options.error) options.error(xhr, status, error);
          if (reject) reject(xhr);
        }
      }
    };

    return function(opts) {
      if (opts == null || !utils.isObject(opts)) throw new Error('no opts');
      opts.type = (opts.type || 'GET').toUpperCase()

      let xhr = xmlrequest();
      if (xhr instanceof Error) throw xhr;

      let resolve, reject, promise = new Promise(function(res, rej) {
        resolve = res;
        reject = rej;
      });

      if (opts.headers == null) opts.headers = {};

      opts.headers['X-Requested-With'] = 'XMLHttpRequest';

      if (opts.contentType) {
        opts.headers['Content-Type'] = opts.contentType;
      }

      // Stringify GET query params.
      if (opts.type === 'GET' && typeof opts.data === 'object') {
        let query = '';
        let stringifyKeyValuePair = function(key, value) {
          return value == null ? '' :
            '&' + encodeURIComponent(key) +
            '=' + encodeURIComponent(value);
        };
        for (var key in opts.data) {
          query += stringifyKeyValuePair(key, opts.data[key]);
        }

        if (query) {
          let sep = (opts.url.indexOf('?') === -1) ? '?' : '&';
          opts.url += sep + query.substring(1);
        }
      }

      xhr.addEventListener('readystatechange', end(xhr, opts, resolve, reject));

      if (typeof opts.progress === 'function') {
        xhr.addEventListener('progress', opts.progress)
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
      xhr.setRequestHeader(
        "Accept",
        opts.dataType && xhrAccepts[opts.dataType] ?
        xhrAccepts[opts.dataType] + (opts.dataType !== "*" ? ", " + allTypes + "; q=0.01" : "") :
        xhrAccepts["*"]
      );

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
    }

  };


  class BaseClass {
    /**
     * The base of things
     * @constructor Object
     * @memberof JaffaMVC
     * @abstract
     * @mixes JaffaMVC.Events
     */
    constructor() {
      if (typeof this.initialize === 'function') {
        utils.callFunction(this.initialize, this, arguments);
      }
    }

    destroy(...args) {

      if (this.isDestroyed) return;

      this.triggerMethod('before:destroy', args);

      this._isDestroyed = true;

      this.triggerMethod('destroy', args);

      this.stopListening();

      return this;

    }

    get isDestroyed() {
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


  class List {
    constructor() {
      this._items = new Set();
    }

    add(item) {
      this._items.add(item);
      return this;
    }

    delete(item) {
      this._items.delete(item);
      return this;
    }

    has(item) {
      return this._items.has(item);
    }

    clear() {
      this._items.clear();
      return this;
    }

    find(fn, ctx) {
      ctx = ctx || this;
      let found = null;
      for (let item of this._items) {
        if (fn.call(ctx, item) === true) return item;
      }
      return null;
    }

    get size() {
      return this._items.size;
    }

    onEach(fn, ...args) {
      return this.forEach(item => {
        if (item[fn] && typeof item[fn] === 'function') {
          utils.callFunction(item[fn], item, args);
        }
      });
    }

    forEach(fn, ctx) {
      this._items.forEach(fn, ctx);
      return this;
    }

  }


  class Boot {
    /**
     * Constructs a new booter
     * @constructor Boot
     * @memberOf JaffaMVC
     */
    constructor() {
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
    phase(name, fn, ctx) {
      if (typeof name === 'function') {
        fn = name;
        name = fn.name || 'unamed';
      }

      let p = {
        n: name,
        fn: fn,
        ctx: ctx || this
      };
      this._phases.push(p);

      if (this.isInitialized) {
        this._runPhase(p);
      }

      return this;
    }

    /**
     * Run the booter
     * @param  {Mixed} option
     * @param  {Object} [ctx]
     * @return {Promise}
     * @async
     * @memberOf JaffaMVC.Boot#
     * @method boot
     */
    boot(options, ctx) {
      // If already started throw an error
      if (this.isInitialized) {
        throw new InitializerError('already initalized');
      }

      let phases = this._phases;

      return utils.eachAsync(phases, (p) => {
        return this._runPhase(p, options);
      }).then(() => {
        this._initialized = true;
      });
    }

    /**
     * Reset the booter
     * @return {JaffaMVC.Boot}
     *
     * @memberOf JaffaMVC.Boot#
     * @method reset
     */
    reset() {
      this._initialized = false;
      return this;
    }

    /**
     * Run phase
     * @private
     * @memberOf JaffaMVC.Boot#
     * @method _runPhase
     */
    _runPhase(phase, options) {
      return utils.callAsyncFunction(phase.fn, phase.ctx, options);
    }

    /**
     * @property {Boolean} isInitialized Whether the booter is initialized
     * @memberOf JaffaMVC.Boot#
     */
    get isInitialized() {
      return this._initialized;
    }
  }

  //

  class ChannelError extends JaffaError {}
  /**
   * Commands
   * @mixin
   * @memberof JaffaMVC.Channel
   */
  let Commands = {
    /**
     * Comply to a Commands
     * @param  {String}   cmd The name of the Commands
     * @param  {Function} fn  The function to run
     * @param  {Object}   ctx The context of which to run the function
     */
    comply(cmd, fn, ctx) {
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
      command(cmd, ...args) {
        this._cmds = this._cmds || {};

        if (this._cmds.hasOwnProperty(cmd)) {
          let {
            fn, ctx
          } = this._cmds[cmd];
          utils.callFunction(fn, ctx, args);
        } else {
          throw new ChannelError("no handler for command: ", cmd)
        }
      },
      /**
       * Stop complying to a command
       * @param {String}   cmd The name of the command
       * @param {Function} fn  [description]
       * @param {Object}   ctx [description]
       */
      stopComplying(cmd, fn, ctx) {
        this._cmds = this._cmds || {};
        ctx = ctx || this;
        delete this._cmds[cmd];
      },
  };
  /**
   * Requests
   * @mixin
   * @memberof JaffaMVC.Channel
   */
  let Request = {
    /**
     * Reply to a Request
     * @param  {String}   req The name of the request
     * @param  {Function} fn  replying function
     * @param  {Object}   ctx The context in which the function is called
     */
    reply(req, fn, ctx) {
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
      request: function(req) {
        this._reqs = this._reqs || {};

        if (this._reqs.hasOwnProperty(req)) {
          let {
            fn, ctx
          } = this._reqs[req];
          if (utils.isGenerator(fn) || utils.isGeneratorFunction(fn)) {
            fn = co.wrap(fn);
          }
          let ret = fn.apply(ctx, __slice.call(arguments, 1));
          if (ret && utils.isPromise(ret)) {
            return ret;
          } else if (ret instanceof Error) {
            ret = Promise.reject(ret);
          } else {
            ret = Promise.resolve(ret);
          }
          return ret;
        } else {
          return Promise.reject(new ChannelError("no handler for request: " + req))
        }
      },
      /**
       * Stop replying to a request
       * @param {String}   req The name of the request
       * @param {Function} fn  The function
       * @param {Object}   ctx the context
       */
      stopReplying: function(req, fn, ctx) {
        this._reqs = this._reqs || {};
        ctx = ctx || this;
        delete this._reqs[req];
      }
  };

  class Channel extends BaseClass {
    /**
     * Channel
     * @param {String} name The name of the channel
     * @memberof JaffaMVC
     * @constructor Channel
     * @mixes JaffaMVC.Channel.Request
     * @mixes JaffaMVC.Channel.Commands
     * @extends JaffaMVC.Object
     */
    constructor(name) {
      this._name = name;
    }

    extendObject(obj) {
      JaffaMVC.utils.proxy(obj, this, [
        'comply',
        'command',
        'stopComplying',
        'reply',
        'request',
        'stopReplying'
      ]);
    }
    static get Commands() {
      return Commands;
    }
    static get Requests() {
      return Request;
    }
  }


  Object.assign(Channel.prototype, Commands, Request);

  //

  class Module extends BaseClass {
    get startWithParent() {
      if (this._startWithParent == null) {
        this._startWithParent = true;
      }
      return this._startWithParent;
    }
    set startWithParent(val) {
      this._startWithParent = val;
    }

    constructor(name, options, app) {
      Object.assign(this, {
        options, name, app
      });
      super()
    }

    addInitializer(name, fn, ctx) {
      this.initializer.phase(name, fn, ctx || this);
    }

    addFinalizer(name, fn, ctx) {
      this.finalizer.phase(name, fn, ctx || this)
    }

    start(options) {
      if (this.initializer.isInitialized) {
        return Promise.resolve();
      }
      this.triggerMethod('before:start', options);
      return this.initializer.boot(options)
        .then((ret) => {
          return this._startSubmodules();
        }).then(() => {
          this.triggerMethod('start', options);
        });
    }

    stop(options) {
      if (!this.isRunning) {
        return Promise.resolve();
      }

      this.triggerMethod('before:stop', options);
      return this.finalizer.boot(options).then((r) => {
        return this._stopSubmodules(options);
      }).then(() => {
        // Reset intializers
        this.initializer.reset();
        this.finalizer.reset();

        this.triggerMethod('stop', options);
      });
    }

    module(name, def, options = {}) {
      if (def == null) {
        return this.modules[name];
      }

      if (this.modules.hasOwnProperty(name)) {
        throw new Error('Module already defined ' + name);
      }

      let Klass = def;
      if (typeof def !== 'function') {
        Klass = Module.extend(def);
      }

      this.modules[name] = new Klass(name, options, this.app || this);
      return this.modules[name];
    }

    removeModule(name) {
      let module = this.module(name);
      if (!module) return;

      module.stop().then(() => {
        module.destroy();
      });
    }

    removeAllModules() {
      for (var key in this.modules) {
        this.removeModule(key);
      }
    }

    destroy() {
      this.removeAllModules();
      super.destroy()
    }

    get initializer() {
      if (!this._initializer) {
        this._initializer = new Boot();
      }
      return this._initializer;
    }
    get finalizer() {
      if (!this._finalizer) {
        this._finalizer = new Boot();
      }
      return this._finalizer;
    }
    get modules() {
      if (this._modules == null) {
        this._modules = [];
      }
      return this._modules;
    }
    get isRunning() {
      return this.initializer.isInitialized && !this.finalizer.isInitialized;
    }

    // Private API
    _startSubmodules(options) {
      return utils.eachAsync(Object.keys(this.modules), (name) => {
        let mod = this.modules[name];
        if (mod.startWithParent) {
          return mod.start(options);
        }
      });
    }
    _stopSubmodules() {
      return utils.eachAsync(this.modules, (mod) => {
        return mod.stop();
      });
    }
  }

  //
  //

  class Region extends BaseClass {
    /**
     * Build region from a definition
     * @param {Object|String|JaffaMVC.Region} def The description of the region
     * @return {JaffaMVC.Region}
     * @memberof JaffaMVC.Region
     */
    static buildRegion(def) {
      if (def instanceof Region) {
        return def;
      } else if (typeof def === 'string') {
        return buildBySelector(def, Region);
      } else {
        return buildByObject(def);
      }
    }

    /**
     * Regions manage a view
     * @param {Object} options
     * @param {Element} options.el  A Html element
     * @memberof JaffaMVC
     * @constructor Region
     * @augments Base
     * @inheritdoc
     */
    constructor(options = {}) {
      this.options = options
      this.el = this.getOption('el');
      super();
    }

    /**
     * Show a view in the region.
     * This will destroy or remove any existing views.
     * @param  {View} view    The view to Show
     * @return {Region}       this for chaining.
     * @memberof JaffaMVC.Region#
     */
    show(view, options) {
      let diff = view !== this.currentView;
      // Remove any containing views
      this.empty();

      if (diff) {
        // If the view is destroyed be others
        view.once('destroy', this.empty, this);

        view.once('render', () => {
          utils.triggerMethodOn(view, 'show');
        });

        view.render();

        utils.triggerMethodOn(view, 'before:show');

        this._attachHtml(view);

        this.currentView = view;

      }

      return this;
    }

    /**
     * Destroy the region, this will remove any views, but not the containing element
     * @return {Region} this for chaining
     * @memberof JaffaMVC.Region#
     */
    destroy() {
      this.empty();
      this.stopListening();
    }

    /**
     * Empty the region. This will destroy any existing view.
     * @memberof JaffaMVC.Region#
     * @return {Region} this for chaining;
     */
    empty() {

      if (!this.currentView) return;

      let view = this.currentView;

      view.off('destroy', this.empty, this);
      this.trigger('before:empty', view);
      this._destroyView();
      this.trigger('empty', view);

      delete this.currentView;

      return this;

    }

    _attachHtml(view) {
      this.el.innerHtml = '';
      this.el.appendChild(view.el);
    }

    _destroyView() {
      let view = this.currentView;

      if ((view.destroy && typeof view.destroy === 'function') && !view.isDestroyed) {
        view.destroy();
      } else if (view.remove && typeof view.remove === 'function') {
        view.remove();
      }

    }
  }

  function buildByObject(object = {}) {
    if (!object.selector)
      throw new Error('No selector specified', object);

    return buildBySelector(object.selector, object.regionClass || Region);
  }

  function buildBySelector(selector, Klass) {

    var el = JaffaMVC.$(selector);

    if (!el.length) {
      throw new Error('Selector must exists in the dom');
    }

    return new Klass({
      el: el[0]
    });

  }

  //

  let proxyties = [
    'addRegions',
    'addRegion',
    'removeRegion',
    'removeRegions',
  ]

  class RegionManager extends BaseClass {
    constructor() {
      this.regions = {};
      super();
    }

    extendObject(obj) {
      utils.proxy(obj, this, proxyties);
      obj.regions = this.regions;
    }

    unproxyObject(obj) {
      proxyties.forEach((m) => {
        if (obj[m]) {
          delete obj[m];
        }
      });
    }

    /**
     * Add one or more regions to the region manager
     * @param {Object} regions
     * @memberof JaffaMVC.RegionManager#
     */
    addRegions(regions) {
      let def, out = {},
        keys = Object.keys(regions);
      keys.forEach(function(k) {
        def = regions[k];
        out[k] = this.addRegion(k, def);
      }, this);
      return out;
    }

    /**
     * Add a region to the RegionManager
     * @param {String} name   The name of the regions
     * @param {String|Object|JaffaMVC.Region} def The region to associate with the name and the RegionManager
     * @memberof JaffaMVC.RegionManager#
     */
    addRegion(name, def) {

      let region = JaffaMVC.Region.buildRegion(def);
      this._setRegion(name, region);

      return region;

    }

    /**
     * Remove one or more regions from the manager
     * @param {...name} name A array of region names
     * @memberof JaffaMVC.RegionManager#
     */
    removeRegion() {
        let names = __slice.call(arguments);

        names.forEach(function(name) {
          if (__has.call(this.regions, name)) {
            let region = this.regions[name];
            region.destroy();
            this._unsetRegion(name);

          }
        }, this);

      }
      /**
       * Destroy the regionmanager
       * @memberof JaffaMVC.RegionManager#
       */
    destroy() {
      super.destroy();
      this.removeRegions();
    }

    /**
     * Remove all regions from the manager
     * @memberof JaffaMVC.RegionManager#
     */
    removeRegions() {
      this.removeRegion.apply(this, Object.keys(this.regions));
    }

    /**
     * @private
     */
    _setRegion(name, region) {
      this.regions[name] = region;
    }

    /**
     * @private
     */
    _unsetRegion(name) {
      delete this.regions[name];
    }
  }


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
  var ElementProto = (typeof Element !== 'undefined' && Element.prototype) || {};

  // Cross-browser event listener shims
  var elementAddEventListener = ElementProto.addEventListener || function(eventName, listener) {
    return this.attachEvent('on' + eventName, listener);
  }
  var elementRemoveEventListener = ElementProto.removeEventListener || function(eventName, listener) {
    return this.detachEvent('on' + eventName, listener);
  }

  var indexOf = function(array, item) {
    for (var i = 0, len = array.length; i < len; i++)
      if (array[i] === item) return i;
    return -1;
  }

  // Find the right `Element#matches` for IE>=9 and modern browsers.
  var matchesSelector = ElementProto.matches ||
    ElementProto.webkitMatchesSelector ||
    ElementProto.mozMatchesSelector ||
    ElementProto.msMatchesSelector ||
    ElementProto.oMatchesSelector ||
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
  class NativeView extends BBView {
    constructor(...args) {
      this._domEvents = [];
      super(...args);
    }

    $(selector) {
      return JaffaMVC.$(selector, this.el);
    }

    _removeElement() {
      this.undelegateEvents();
      if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
    }

    // Apply the `element` to the view. `element` can be a CSS selector,
    // a string of HTML, or an Element node.
    _setElement(element) {
      if (typeof element === 'string') {
        if (paddedLt.test(element)) {
          let el = document.createElement('div');
          el.innerHTML = element;
          this.el = el.firstChild;
        } else {
          this.el = document.querySelector(element);
        }
      } else {
        this.el = element;
      }

      this.$el = JaffaMVC.$(this.el);
    }

    // Set a hash of attributes to the view's `el`. We use the "prop" version
    // if available, falling back to `setAttribute` for the catch-all.
    _setAttributes(attrs) {
      //
      for (var attr in attrs) {
        attr in this.el ? this.el[attr] = attrs[attr] : this.el.setAttribute(attr, attrs[attr]);
      }
    }

    delegateEvents(events) {
      if (!(events || (events = utils.result(this, 'events')))) return this;
      this.undelegateEvents();

      let dels = []
      for (let key in events) {
        let method = events[key];
        if (typeof method !== 'function') method = this[events[key]];

        let match = key.match(/^(\S+)\s*(.*)$/);
        // Set delegates immediately and defer event on this.el
        if (match[2]) {
          this.delegate(match[1], match[2], method.bind(this));
        } else {
          dels.push([match[1], method.bind(this)]);
        }
      }

      dels.forEach(d => {
        this.delegate(d[0], d[1])
      });

      return this;
    }

    // Make a event delegation handler for the given `eventName` and `selector`
    // and attach it to `this.el`.
    // If selector is empty, the listener will be bound to `this.el`. If not, a
    // new handler that will recursively traverse up the event target's DOM
    // hierarchy looking for a node that matches the selector. If one is found,
    // the event's `delegateTarget` property is set to it and the return the
    // result of calling bound `listener` with the parameters given to the
    // handler.
    delegate(eventName, selector, listener) {
      /*jslint eqeq: true*/
      if (typeof selector === 'function') {
        listener = selector;
        selector = null;
      }

      let root = this.el;
      let handler = selector ? function(e) {
        let node = e.target || e.srcElement;
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

      elementAddEventListener.call(this.el, eventName, handler, false);
      this._domEvents.push({
        eventName: eventName,
        handler: handler,
        listener: listener,
        selector: selector
      });
      return handler;
    }

    // Remove a single delegated event. Either `eventName` or `selector` must
    // be included, `selector` and `listener` are optional.
    undelegate(eventName, selector, listener) {
      if (typeof selector === 'function') {
        listener = selector;
        selector = null;
      }

      if (this.el) {
        var handlers = this._domEvents.slice();
        for (var i = 0, len = handlers.length; i < len; i++) {
          var item = handlers[i];

          var match = item.eventName === eventName &&
            (listener ? item.listener === listener : true) &&
            (selector ? item.selector === selector : true);

          if (!match) continue;

          elementRemoveEventListener.call(this.el, item.eventName, item.handler, false);
          this._domEvents.splice(indexOf(handlers, item), 1);
        }
      }
      return this;
    }

    // Remove all events created with `delegate` from `el`
    undelegateEvents() {
      if (this.el) {
        for (var i = 0, len = this._domEvents.length; i < len; i++) {
          var item = this._domEvents[i];
          elementRemoveEventListener.call(this.el, item.eventName, item.handler, false);
        }
        this._domEvents.length = 0;
      }
      return this;
    }
  }

  //


  class View extends NativeView {
    get isShown() {
      return !!this._isShown;
    }
    get isRendered() {
      return !!this._isRendered;
    }
    /**
     * Base View
     * @param {Object}            [options]           Options See Backbone.View for additonal arguments
     * @param {String|Function}   options.template  A string or a function
     * @param {Object}            options.ui
     * @memberof JaffaMVC
     * @constructor View
     * @augments NativeView
     */
    constructor(options) {
      /**
       * @var options
       * @memberof JaffaMVC.View#
       */
      this.options = options || {};
      this.isDestroyed = false;


      this.listenTo(this, 'show', function() {
        this._isShown = true;
      });

      this.listenTo(this, 'render', function() {
        this._isRendered = true;
      });

      super(options);
    }

    /**
     * Destroy the view and release all resources
     * @memberof JaffaMVC.View#
     * @method destroy
     * @return {JaffaMVC.View}
     */
    destroy() {
      if (this.isDestroyed === true) {
        return this;
      }

      var args = __slice.call(arguments);

      this.triggerMethod('before:destroy', args);

      this.isDestroyed = true;

      this.triggerMethod('destroy', args);
      debug('view destroy:', this);

      this.remove();

      return this;
    }

    /**
     * Render the view
     * @memberOf  JaffaMVC.View#
     * @method render
     * @return {JaffaMVC.View}
     */
    render() {

      this.triggerMethod('before:render', this);

      var template = this.getOption('template');

      if (template != null) {
        this._renderTemplate(template).then((templ) => {
          this.el.innerHTML = templ;
          this.delegateEvents();
          this.triggerMethod('render', this);
        });
      } else {
        this.delegateEvents();
        this.triggerMethod('render', this);
      }


      return this;
    }

    /**
     * Get template data for template rendering
     * @return {Object} object to render
     * @memberOf JaffaMVC.View#
     * @method getTemplateData
     */
    getTemplateData() {
      return (this.model && typeof this.model.toJSON === 'function') ?
        this.model.toJSON() : {};
    }

    /**
     * Delegate events
     * @param  {Object} eventArgs Events object
     * @return {View}           this
     * @memberOf JaffaMVC.View#
     * @method delegateEvents
     */
    delegateEvents(eventArgs) {
      this.bindUIElements();

      var events = eventArgs || this.events;

      events = this.normalizeUIKeys(events);

      var triggers = this._configureTriggers();

      var combined = {};

      Object.assign(combined, events, triggers);

      super.delegateEvents(combined);

    }

    /**
     * Undelegate events
     * @return {View} this
     * @memberOf JaffaMVC.View#
     * @method undelegateEvents
     */
    undelegateEvents() {
      this.unbindUIElements();
      super.undelegateEvents();
    }

    /**
     * Configure triggers
     * @return {Object} events object
     * @memberOf JaffaMVC.View#
     * @method _configureTriggers
     * @private
     */
    _configureTriggers() {
      if (!this.triggers) {
        return {};
      }

      // Allow `triggers` to be configured as a function
      var triggers = this.normalizeUIKeys(utils.result(this, 'triggers'));

      // Configure the triggers, prevent default
      // action and stop propagation of DOM events
      let events = {},
        val, key;
      for (key in triggers) {
        val = triggers[key];
        events[key] = this._buildViewTrigger(val);
      }

      return events;

    }

    /**
     * builder trigger function
     * @param  {Object|String} triggerDef Trigger definition
     * @return {Function}
     * @memberOf JaffaMVC.View#
     * @method _buildViewTrigger
     * @private
     */
    _buildViewTrigger(triggerDef) {

      if (typeof triggerDef === 'string')
        triggerDef = {
          event: triggerDef
        }

      let options = Object.assign({
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

    }

    /* UI Elements */
    bindUIElements() {

      let ui = this.getOption('ui');
      if (!ui) return;

      if (!this._ui) {
        this._ui = ui;
      }

      ui = utils.result(this, '_ui');

      this.ui = {};

      Object.keys(ui).forEach((k) => {
        let elm = this.$(ui[k]);
        if (elm && elm.length) {
          // unwrap if it's a nodelist.
          if (elm instanceof NodeList) {
            elm = elm[0]
          }
          this.ui[k] = elm;
        }
      });

    }

    unbindUIElements() {}

    /**
     * Renders the template
     * @param  {Function|String} template The template to render
     * @return {Promise<String>}
     * @method _renderTemplate
     * @memberOf  JaffaMVC.View#
     */
    _renderTemplate(template) {
      let data = this.getOption('getTemplateData').call(this);

      if (typeof template === 'function') {
        return utils.callAsyncFunction(template, this, data);
      } else {
        return Promise.resolve(template);
      }
    }

    normalizeUIKeys(obj) {
      //
      let reg = /@ui.([a-zA-Z_\-\$#]+)/i,
        o = {},
        k, v, ms, sel, ui;

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
    }

  }

  Object.assign(View.prototype, {
    getOption: utils.getOption,
    triggerMethod: utils.triggerMethod
  });


  //

  class LayoutView extends View {
    /**
     * LayoutView
     * @param {Object} options options
     * @constructor LayoutView
     * @memberof JaffaMVC
     * @augments JaffaMVC.View
     */
    constructor(options) {
      this.options = options || {};
      let regions = this.getOption('regions');

      // Set region manager
      this._regionManager = new RegionManager();
      utils.proxy(this, this._regionManager, ['removeRegion', 'removeRegions']);
      /**
       * Regions
       * @var regions
       * @memberof JaffaMVC.LayoutView#
       */
      this.regions = this._regionManager.regions;

      this.options = options || {};

      this.listenTo(this, 'render', function() {
        this.addRegions(regions);
      });

      super(options);

    }

    addRegion(name, def) {
      if (typeof def === 'string') {
        let elm = this.$(def);
        if (!elm.length)
          throw new Error('element must exists in dom');

        def = new Region({
          el: elm[0]
        });

      }
      this._regionManager.addRegion(name, def);

    }

    addRegions(regions) {
      for (var k in regions) {
        this.addRegion(k, regions[k]);
      }
    }

    destroy() {
      super.destroy();
      this._regionManager.destroy();
    }


  }

  //

  class CollectionView extends View {

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
    constructor(options) {

      this.children = new List();


      this._isBuffering = false;

      utils.bindAll(this, ['render']);


      super(options);

      this.sort = true;
      this.once('render', this._initCollectionEvents);

      // when this view is shown, all child views should be shown also.
      this.listenTo(this, 'before:show', function() {
        this.children.forEach(function(child) {
          if (!child.isShown) utils.triggerMethodOn(child, 'before:show');
        });
      });

      this.listenTo(this, 'show', function() {
        this.children.forEach(function(child) {
          if (!child.isShown) utils.triggerMethodOn(child, 'show');
        });
      });

    }

    /**
     * Render the collection view and alle of the children
     * @return {JaffaMVC.CollectionView}
     *
     * @memberOf JaffaMVC.CollectionView#
     * @method render
     */
    render(options) {

      this.destroyChildren();
      this._destroyContainer();

      this.listenToOnce(this, 'render', function() {

        this._initContainer();

        if (this.collection) {
          this._renderChildren(this.collection.models);
        }
        if (typeof options === 'function') {
          options();
        }

      });

      return super.render();
    }

    /**
     *  Renders the entire collection
     */
    renderCollection() {
      let view;
      this.trigger('before:render:children');
      this.collection.models.forEach((model, index) => {
        view = this._getChildView(model);
        this._addChildView(view, index);
      });
      this.trigger('render:children');
    }

    renderChildView(view, index) {
      this.triggerMethod('before:render:child', view);

      view.render();
      this._attachHTML(view, index);

      this.triggerMethod('render:child', view);

    }

    removeChildView(view) {

        if (!view) return;

        if (typeof view.destroy === 'function') {
          view.destroy();

        } else if (typeof view.remove === 'function') {
          view.remove();
        }

        this.stopListening(view);
        this.children.delete(view);

        this._updateIndexes(view, false)

      }
      // Buffering
      /**
       * When inserting a batch of models, this method should be called first,
       * to optimise perfomance
       * @memberof JaffaMVC.CollectionView#
       */
    startBuffering() {
      this._buffer = document.createDocumentFragment();
      this._isBuffering = true;
      this._bufferedChildren = [];
    }

    /**
     * Should be called when finished inserting a batch of models
     * @memberof JaffaMVC.CollectionView#
     */
    stopBuffering() {
      this._isBuffering = false;


      this._triggerBeforeShowBufferedChildren();

      this._container.appendChild(this._buffer);

      this._triggerShowBufferedChildren();


      delete this._bufferedChildren;
    }

    _triggerBeforeShowBufferedChildren() {
      if (this._isShown) {
        this._bufferedChildren.forEach((item) => {
          if (!item._isShown)
            utils.triggerMethodOn(item, 'before:show');
        });
      }
    }

    _triggerShowBufferedChildren() {
      if (this._isShown) {
        this._bufferedChildren.forEach((item) => {
          if (!item._isShown)
            utils.triggerMethodOn(item, 'show');
        });
      }
    }

    /**
     * Returns a new instance of this.childView with attached model.
     *
     * @param {JaffaMVC.Model} model
     * @protected
     * @memberof JaffaMVC.CollectionView#
     */
    _getChildView(model) {
      let View = this.getOption('childView') || JaffaMVC.View,
        options = this.getOption('childViewOptions') || {};

      return new View(Object.assign({
        model: model
      }, options));
    }

    /**
     * Attach the childview's element to the CollectionView.
     * When in buffer mode, the view is added to a documentfragment to optimize performance
     * @param {JaffaMVC.View} view  A view
     * @param {Number} index The index in which to insert the view
     * @protected
     * @memberof JaffaMVC.CollectionView#
     */
    _attachHTML(view, index) {
      if (this._isBuffering) {
        this._buffer.appendChild(view.el);
        this._bufferedChildren.push(view);
      } else {
        if (this._isShown) {
          utils.triggerMethodOn(view, 'before:show');
        }


        if (!this._insertBefore(view, index)) {
          this._insertAfter(view);
        }
        if (this._isShown)
          utils.triggerMethodOn(view, 'show')
      }
    }

    /**
     * Render child
     * @param {Array<JaffaMVC.Model>} models
     */
    _renderChildren(models) {

      this.destroyChildren();

      if (this.collection.length !== 0) {
        this.startBuffering();
        this.renderCollection();
        this.stopBuffering();
      }
      // TODO: What to do on empty collection

    }


    /**
     * Add childview to collection view
     * @private
     * @memberOf JaffaMVC.CollectionView#
     * @method  _addChildView
     * @param {JaffaMVC.View} view  A view
     * @param {Number} index index
     */
    _addChildView(view, index) {

      this._updateIndexes(view, true, index);

      this.proxyChildViewEvents(view);

      this.children.add(view);

      this.renderChildView(view, index);

      this.triggerMethod('add:child', view);

    }

    /**
     * Proxy event froms childview to the collectionview
     * @param {JaffaMVC.View} view
     * @private
     * @method  _proxyChildViewEvents
     * @memberOf JaffaMVC.CollectionView#
     */
    proxyChildViewEvents(view) {
        let prefix = this.getOption('prefix') || 'childview';

        this.listenTo(view, 'all', function() {
          let args = __slice.call(arguments);

          args[0] = prefix + ':' + args[0];
          args.splice(1, 0, view);

          utils.callFunction(this.triggerMethod, this, args);
        });

      }
      /**
       * Resort the view
       * @return {CollectionView} this
       */
    resortView() {
        this.triggerMethod('before:resort');
        this.render(() => {
          this.triggerMethod('resort');
        });
        return this;
      }
      /**
       * Destroy the collection view and all of it's children
       * @see JaffaMVC.View
       * @return {JaffaMVC.View}
       */
    destroy() {
      this.triggerMethod('before:destroy:children');
      this.destroyChildren();
      this.triggerMethod('destroy:children');

      return super.destroy();

    }

    /**
     * Destroy all children of the collection view
     */
    destroyChildren() {

      if (this._container) {
        this._container.innerHtml = '';

      }
      if (this.children.size === 0) return;

      this.children.forEach(this.removeChildView, this);
      this.children.clear();

    }

    // Internal method. Check whether we need to insert the view into
    // the correct position.
    _insertBefore(childView, index) {
      let currentView;

      let findPosition = this.sort && (index < this.children.size - 1);
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
    }

    // Internal method. Append a view to the end of the $el
    _insertAfter(childView) {
      this._container.appendChild(childView.el);
    }


    _destroyContainer() {
      if (this._container)
        delete this._container;
    }

    _initCollectionEvents() {
      if (this.collection) {

        this.listenTo(this.collection, 'add', this._onCollectionAdd);
        this.listenTo(this.collection, 'remove', this._onCollectionRemove);
        this.listenTo(this.collection, 'reset', this.render);

        if (this.sort)
          this.listenTo(this.collection, 'sort', this._onCollectionSort);
      }
    }

    ///
    /// Private methods
    ///
    _initContainer() {
      var container = this.getOption('childViewContainer');
      if (container) {
        container = this.$(container)[0];
      } else {
        container = this.el;
      }
      this._container = container;
    }

    _updateIndexes(view, increment, index) {
      if (!this.sort)
        return;

      if (increment) {
        view._index = index;

        this.children.forEach((lView, index) => {
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

    }

    // Event handlers

    /**
     * Called when a model is add to the collection
     * @param {JaffaMVC.Model|Backbone.model} model Model
     * @private
     */
    _onCollectionAdd(model) {
      let view = this._getChildView(model);
      let index = this.collection.models.indexOf(model);

      this._addChildView(view, index);
    }

    /**
     * Called when a model is removed from the collection
     * @param {JaffaMVC.Model|Backbone.model} model Model
     * @private
     */
    _onCollectionRemove(model) {
      let view = this.children.find(function(view) {
        return view.model === model;
      });

      this.removeChildView(view);
    }

    _onCollectionSort() {
      // check for any changes in sort order of views

      let orderChanged = this.collection.find((model, index) => {
        let view = this.children.find(function(view) {
          return view.model === model;
        });
        return !view || view._index !== index;
      });

      if (orderChanged) {
        this.resortView();
      }
    }

  }

  //

  class Application extends Module {
    /**
     * Construct a new application class
     * @param {Object} options
     * @param {Object} options.regions
     * @constructor Application
     * @memberOf JaffaMVC
     */
    constructor(options = {}) {
      this.options = options;

      let regions = this.getOption('regions');

      /** Initialize regions */
      this._regionManager = new RegionManager();
      this._regionManager.extendObject(this);

      if (regions) {
        this._regionManager.addRegions(regions);
      }

      /** Initialize channels and global channel */
      this.channels = {};
      this.channel('global').extendObject(this);

      if (typeof this.initialize === 'function') {
        this.initialize.apply(this, arguments);
      }
    }

    /**
     * Create a new channel
     * @param  {String} name Name of the module
     * @return {JaffaMVC.Channel}
     *
     * @memberOf JaffaMVC.Application#
     * @method  channel
     */
    channel(name) {
      if (this.channels[name]) return this.channels[name];

      let channel = new JaffaMVC.Channel(name);
      this.channels[name] = channel;

      return channel;
    }

    /**
     * Start (backbone) history
     * @param {Object} options
     * @param {Boolean} options.pushState
     * @param {String} options.root
     *
     * @memberOf JaffaMVC.Application#
     * @method startHistory
     */
    startHistory(options) {
      if (!this.isRunning) {
        throw new Error('app not started');
      }

      if (Backbone.history) {
        this.trigger('before:history:start', options);
        Backbone.history.start(options);
        this.trigger('history:start', options);
      }

    }

    /**
     * Stop history
     * @return {Application}
     *
     * @memberOf JaffaMVC.Application#
     * @method stopHistory
     */
    stopHistory() {
      if (Backbone.history) {
        this.trigger('before:history:stop');
        Backbone.history.stop();
        this.trigger('history:stop');
      }
      return this;
    }

    /**
     * Navigate to url-fragment
     * @param {String} fragment The url path to navigate to
     * @param {Object} options Options
     * @param {Boolean} options.trigger
     *
     * @memberOf JaffaMVC.Application#
     * @method navigate
     */
    navigate(fragment, options) {
      Backbone.history.navigate(fragment, options);
    }

    /**
     * Get current url fragment
     * @return {String}
     */
    currentFragment() {
      return Backbone.history.fragment;

    }

    /**
     * Destroy the application (and all attached views and modules)
     *
     * @memberOf JaffaMVC.Application#
     * @method destroy
     */
    destroy() {

      super.destroy();

      this.channels.forEach(function(channel) {
        channel.destroy();
      });

      delete this.channels;
      this._regionManager.unproxyObject(this);
      this._regionManager.destroy();
      delete this._regionManager;

    }

  }


  export default JaffaMVC;
  export {
    Module, View, CollectionView, LayoutView, Region, RegionManager
  };


  /*Application.extend = View.extend = CollectionView.extend = LayoutView.extend = Region.extend = RegionManager.extend = Module.extend = BaseClass.extend = Backbone.extend;*/

  Backbone.ajax = ajax();

  Object.assign(JaffaMVC, {
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
    NativeView: NativeView
  });

  return JaffaMVC;

}));
