
var __camelCase = function(input) {
	return input.toLowerCase().replace(/-(.)/g, function(match, group1) {
		return group1.toUpperCase();
	});
};

let __slice = Array.prototype.slice;
let __has = Object.prototype.hasOwnProperty;
var __nativeBind = Function.prototype.bind;


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
	callAsyncFunction: function (fn, ctx, arg) {

		return new Promise(function (resolve, reject) {
			let cb, ret;

			cb = function (err, ret) {
				if (err) return reject(err);
				resolve(ret);
			}

			if (fn.length > 1)  {
				return fn.call(ctx, arg, cb);

			}  else if (utils.isGenerator(fn) || utils.isGeneratorFunction(fn)) {

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
	eachAsync (array, iterator, ctx) {
		let i = 0, len = array.length, next;
		return new Promise(function (resolve, reject) {
			let next = function(e) {

				if (e != null || i === len)
					return e ? reject(e) : resolve()

				utils.callAsyncFunction(iterator, ctx, array[i++])
				.then(function (r) { next(); }, next);

			};
			next(null);
		});

	},
	bindAll (obj, fns) {
		return utils.proxy(obj, obj, fns);
	},
	bind: function (func, context) {
    if (__nativeBind && func.bind === __nativeBind) return __nativeBind.apply(func, __slice.call(arguments, 1));
    let args = __slice.call(arguments, 2);
    let bound = function () {
      return func.apply(context, args.concat(__slice(arguments)));
    };
    return bound;
  },
	getOption (option, obj={}) {
    let options = this.options || {};
		return obj[option] || options[option] || this[option];
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
	triggerMethod (event) {
		let e = __camelCase('on-' + event.replace(/:/g, '-')),
			m = utils.getOption.call(this, e),
			args = __slice.call(arguments, 1);

		utils.callFunction(this.trigger, this, __slice.call(arguments));

		if (typeof m === 'function') {
			utils.callFunction(m, this, args);
		}
	},
	triggerMethodOn (o, ...args) {
		utils.callFunction(utils.triggerMethod, o, args);
	},

	/**
	 * Forward method from one object ot another
	 * @param  {Object} from Source object
	 * @param  {Object} to   Destination object
	 * @param  {Array<Function>} fns  An array of methods
	 * @memberof JaffaMVC.utils
	 */
	proxy (from, to, fns) {
		if (!Array.isArray(fns)) fns = [fns];
		fns.forEach(function(fn) {
			if (typeof to[fn] === 'function') {
				from[fn] =  utils.bind(to[fn],to);
			}
		});
	},

	isGenerator (obj) {
		return 'function' === typeof obj.next && 'function' === typeof obj.throw;
	},
	isGeneratorFunction (obj) {
		let constructor = obj.constructor;
  	if (!constructor) return false;
  	if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  	return utils.isGenerator(constructor.prototype);
	},
	isPromise (obj) {
		return 'function' === typeof obj.then;
	},
	isObject (obj) {
		let type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
	},
	result (obj, prop, ...args) {
		if (typeof obj[prop] === 'function')
			return obj[prop](...args);
		return obj[prop];
	},
	assign: Object.assign || function (obj) {
		var args = __slice.call(arguments, 1),
      i, k, o;
    for (i = 0; i < args.length; i++) {
      o = args[i];
      for (k in o) {
        if (!o.hasOwnProperty(k)) continue;
        obj[k] = o[k];
      }
    }
    return obj;
	},
	inherits: function (child, parent) {
		for (var key in parent) {
        if (Object.prototype.hasOwnProperty.call(parent, key))
          child[key] = parent[key];
    }
    function Ctor() {
        this.constructor = child;
    }
    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    child.__super__ = parent.prototype;
    return child;
	}

}


function debug () {
  if (JaffaMVC.Debug !== true) return;
  var args = ['MVC: '].concat(__slice.call(arguments))
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, args);
}
