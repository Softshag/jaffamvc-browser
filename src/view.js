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

    var template = this.getOption('template');

    if (template != null) {
      this._renderTemplate(template).then((templ) => {
        this.el.innerHTML = templ;
        this.delegateEvents();
        this.triggerMethod('render', this);
      }, (e) => { throw e; });
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



    let {e} = this.filterEvents(events);

    var triggers = this._configureTriggers();

    var combined = {};

    utils.assign(combined, e, triggers);

    super.delegateEvents(combined);
    this.bindDataEvents(events);
  }

  /**
   * Undelegate events
   * @return {View} this
   * @memberOf JaffaMVC.View#
   * @method undelegateEvents
   */
  undelegateEvents() {
    this.unbindUIElements();
    this.unbindDataEvents();
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

    let ui = this.getOption('ui');
    if (!ui) return;

    if (!this._ui) {
      this._ui = ui;
    }

    ui = utils.result(this, '_ui');

    this.ui = {};

    Object.keys(ui).forEach( (k) => {
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

  bindDataEvents (events) {
    let {c,m} = this.filterEvents(events);
    console.log('model',m,this.events)
    this._dataEvents = {};
    let fn = (item, ev) => {

      if (!this[item]) return {};
      let out = {}, k, f;

      for (k in ev) {

        f = utils.bind(ev[k], this);
        this[item].on(k,f);
        //this.listenTo(this[item],k, f);
        out[item+":"+k] = f;
      }

      return out;
    };

    utils.assign(this._dataEvents,
      fn('model',m),
      fn('collection',c));
  }

  unbindDataEvents () {
    if (!this._dataEvents) return;
    let k, v;
    for (k in this._dataEvents) {
      v = this._dataEvents[k];
      let [item, ev] = k.split(':');
      if (!this[item]) continue;
      console.log(item,ev)
      this[item].off(ev, v);
      //this.stopListening(this[item],ev, v);
    }
    delete this._dataEvents;
  }

  unbindUIElements() {
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
  filterEvents (obj) {
    /*jshint -W030 */
    let c = {}, m = {}, e = {}, k, v;
    for (k in obj) {
      let [ev,t] = k.split(' ');
      ev = ev.trim(), t = t.trim(), v = obj[k];
      if (t === 'collection') {
        c[ev] = v;
      } else if (t === 'model') {
        m[ev] = v;
      } else {
        e[ev] = v;
      }
    }
    return {c,m,e};
  }

}

Object.assign(View.prototype, {
  getOption: utils.getOption,
  triggerMethod: utils.triggerMethod
});

