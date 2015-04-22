/* global BaseClass */

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
	comply (cmd, fn, ctx) {
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
	command (cmd, ...args) {
		this._cmds = this._cmds || {};

		if (this._cmds.hasOwnProperty(cmd)) {
			let {fn,ctx} = this._cmds[cmd];
			utils.callFunction(fn,ctx,args);
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
	stopComplying (cmd, fn, ctx) {
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
	reply (req, fn, ctx) {
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
			let {fn,ctx} = this._reqs[req];
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
			return Promise.reject(new ChannelError("no handler for request: "+ req))
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
	static get Commands () { return Commands; }
	static get Requests () { return Request; }
}


utils.assign(Channel.prototype, Commands, Request);
