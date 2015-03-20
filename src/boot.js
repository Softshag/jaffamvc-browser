

class Boot {
	/**
	 * Constructs a new booter
	 * @constructor Boot
	 * @memberOf JaffaMVC
	 */
	constructor () {
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
	phase (name, fn, ctx) {
		if (typeof name === 'function') {
			fn = name;
			name = fn.name || 'unamed';
		}

		let p = {n:name,fn:fn,ctx:ctx||this};
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
	boot (options, ctx) {
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
	_runPhase (phase, options) {
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
