/*global BaseClass, Boot, debug */

class Module extends BaseClass {
	get startWithParent () {
		if (this._startWithParent == null) {
			this._startWithParent = true;
		}
		return this._startWithParent;
	}
	set startWithParent (val) {
		this._startWithParent = val;
	}

	constructor (name, options, app) {
		Object.assign(this, {options, name, app});
		if (this.options && this.options.hasOwnProperty('startWithParent')) {
			this.startWithParent = this.options.startWithParent;
		}
		super()
	}

	addInitializer(name, fn, ctx) {
		this.initializer.phase(name, fn, ctx||this);
	}

	addFinalizer(name, fn, ctx) {
		this.finalizer.phase(name, fn, ctx||this)
	}

	start (options) {
		debug('starting module: ' + this.name || 'undefined');
		if (this.initializer.isInitialized) {
			return Promise.resolve();
		}
		this.triggerMethod('before:start', options);
		return this.initializer.boot(options)
		.then((ret) => {
			debug('starting submodules for: ' + this.name || 'undefined');
			return this._startSubmodules();
		}).then( () => {
			debug('started module: ' + this.name || 'undefined');
			this.triggerMethod('start', options);
		}).catch((err) => {
			this.trigger('error', err);
			return Promise.reject(err);
		});
	}

	stop (options) {
		if (!this.isRunning) {
			return Promise.resolve();
		}
		debug('stopping module: ' + this.name);
		this.triggerMethod('before:stop',options);
		return this.finalizer.boot(options).then( (r) => {
			debug('stopping submodules for ' + this.name)
			return this._stopSubmodules(options);
		}).then(() => {
			// Reset intializers
			this.initializer.reset();
			this.finalizer.reset();
			this.stopListening();
			debug('stopped module:', this.name)
			this.triggerMethod('stop',options);
		}).catch((err) => {
			this.trigger('error', err)
			return Promise.reject(err);
		});
	}

	module (name, def, options={}) {
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
		debug('defining module ', name, 'in', this.name);
		this.modules[name] = new Klass(name, options, this.app || this);
		return this.modules[name];
	}

	removeModule (name) {
		let module = this.module(name);
		if (!module) return;

		module.stop().then(() => {
			module.destroy();
		});
	}

	removeAllModules () {
		for (var key in this.modules) {
			this.removeModule(key);
		}
	}

	destroy () {
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
	get isRunning () {
		return this.initializer.isInitialized && !this.finalizer.isInitialized;
	}

	// Private API
	_startSubmodules (options) {
		return utils.eachAsync(Object.keys(this.modules), (name) => {
			let mod = this.modules[name];
			if (mod.startWithParent) {
				return mod.start(options);
			}
		});
	}
	_stopSubmodules () {
		return utils.eachAsync(this.modules, (mod) => {
			return mod.stop();
		});
	}
}
