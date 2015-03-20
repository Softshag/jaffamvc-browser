/* global BaseClass */
/* jshint latedef:nofunc */

class Region extends BaseClass {
	/**
   * Build region from a definition
   * @param {Object|String|JaffaMVC.Region} def The description of the region
   * @return {JaffaMVC.Region}
   * @memberof JaffaMVC.Region
   */
  static buildRegion (def) {
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
	constructor(options={}) {
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
  show (view, options) {
    let diff = view !== this.currentView;
    // Remove any containing views
    this.empty();

    if (diff) {
      // If the view is destroyed be others
      view.once('destroy', this.empty, this);
      view.render();

      utils.triggerMethodOn(view, 'before:show');

      this._attachHtml(view);

      this.currentView = view;

      utils.triggerMethodOn(view, 'show');

    }

    return this;
  }

  /**
   * Destroy the region, this will remove any views, but not the containing element
   * @return {Region} this for chaining
   * @memberof JaffaMVC.Region#
   */
  destroy () {
    this.empty();
    this.stopListening();
  }

  /**
   * Empty the region. This will destroy any existing view.
   * @memberof JaffaMVC.Region#
   * @return {Region} this for chaining;
   */
  empty () {

    if (!this.currentView) return;

    let view = this.currentView;

    view.off('destroy', this.empty, this);
    this.trigger('before:empty', view);
    this._destroyView();
    this.trigger('empty', view);

    delete this.currentView;

    return this;

  }

  _attachHtml (view) {
    this.el.innerHtml = '';
    this.el.appendChild(view.el);
  }

  _destroyView () {
    let view = this.currentView;

    if ((view.destroy && typeof view.destroy === 'function') && !view.isDestroyed) {
      view.destroy();
    } else if (view.remove && typeof view.remove === 'function') {
      view.remove();
    }

  }
}

function buildByObject(object={}) {
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
