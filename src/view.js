/* global NativeView, Backbone, debug */


class View extends NativeView {
  get isShown () { return !!this._isShown; }
  get isRendered () { return !!this._isRendered; }
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

    this.undelegateEvents();

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
    return this.model ? this.model.toJSON() : {};
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
    let events = {}, val, key;
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
      triggerDef = {event: triggerDef}

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

    var ui = this.getOption('ui');
    if (!ui) return;

    if (!this._ui) {
      this._ui = ui;
    }

    ui = JaffaMVC.utils.result(this, '_ui');

    this.ui = {};


    Object.keys(ui).forEach( (k) => {
      var elm = this.$(ui[k]);
      if (elm && elm.length) {
        // unwrap if it's a nodelist.
        if (elm instanceof NodeList) {
          elm = elm[0]
        }
        this.ui[k] = elm;
      }
    });
    this.ui = this.ui;

  }

  unbindUIElements() {

    /*if (!this.ui || !this._ui) return;

    this.ui = this._ui;
    delete this._ui;*/

  }

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

  normalizeUIKeys (obj) {
    /*jshint -W030 */
    let reg = /@ui.([a-zA-Z_\-\$#]+)/i, o = {}, k, v, ms, sel, ui;

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

