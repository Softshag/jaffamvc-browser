/* global Module, RegionManager */

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
  navigate (fragment, options) {
    Backbone.history.navigate(fragment, options);
  }

  /**
   * Get current url fragment
   * @return {String}
   */
  currentFragment () {
    return Backbone.history.fragment;

  }

  /**
   * Destroy the application (and all attached views and modules)
   *
   * @memberOf JaffaMVC.Application#
   * @method destroy
   */
  destroy () {

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

