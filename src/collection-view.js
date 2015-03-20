/* global View, List */

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
  constructor (options) {

    this.children = new List();


    this._isBuffering = false;

    utils.bindAll(this, ['render']);


    super(options);

    this.sort = true;
    this.once('render', this._initCollectionEvents);

    // when this view is shown, all child views should be shown also.
    this.listenTo(this, 'show', function() {
      this.children.forEach(function(child) {
        utils.triggerMethodOn(child, 'show');
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
  render (options) {

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
  renderCollection () {
    let view;
    this.trigger('before:render:children');
    this.collection.models.forEach( (model, index) => {
      view = this._getChildView(model);
      this._addChildView(view, index);
    });
    this.trigger('render:children');
  }

  renderChildView (view, index) {
    this.triggerMethod('before:render:child', view);

    view.render();
    this._attachHTML(view, index);

    this.triggerMethod('render:child', view);

  }

  removeChildView (view) {
    if (!view) return;

    if (typeof view.destroy === 'function') {
      view.destroy();

    } else if (typeof view.remove === 'function') {
      view.remove();
    }

    this.stopListening(view);
    this.children.remove(view);

    this._updateIndexes(view, false)

  }

  /**
   * When inserting a batch of models, this method should be called first,
   * to optimise perfomance
   * @memberof JaffaMVC.CollectionView#
   */
  startBuffering () {
    this._buffer = document.createDocumentFragment();
    this._isBuffering = true;
    this._bufferedChildren = [];
  }

  /**
   * Should be called when finished inserting a batch of models
   * @memberof JaffaMVC.CollectionView#
   */
  stopBuffering () {
    this._isBuffering = false;
    this._container.appendChild(this._buffer);

    this._bufferedChildren.forEach((item) => {
      this.children.add(item);
      if (this._isShown)
        utils.triggerMethodOn(item, 'show');
    });

    delete this._bufferedChildren;
  }

  /**
   * Returns a new instance of this.childView with attached model.
   *
   * @param {JaffaMVC.Model} model
   * @protected
   * @memberof JaffaMVC.CollectionView#
   */
  _getChildView (model) {
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
  _attachHTML (view, index) {
    if (this._isBuffering) {
      if (this._isShown)
        utils.triggerMethodOn(view, 'before:show');
      this._buffer.appendChild(view.el);
      this._bufferedChildren.push(view);
    } else {
      if (this._isShown) {
        utils.triggerMethodOn(view, 'before:show');
      }


      if (!this._insertBefore(view, index)){
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
  _renderChildren (models) {

    this.destroyChildren();

    if (this.collection.length !== 0) {
      this.startBuffering();
      this.renderCollection();
      this.stopBuffering();
    }
    // TODO: What to do on empty collection

  }


  _addChildView (view, index) {

    this._updateIndexes(view, true, index);

    this.proxyChildViewEvents(view);

    this.children.add(view);

    this.renderChildView(view, index);

    if (this._isShown && !this._isBuffering) {
      utils.triggerMethodOn(view, 'show');
    }

    this.triggerMethod('add:child', view);

  }

  /**
   * Proxy event froms childview to the collectionview
   * @param {JaffaMVC.View} view
   */
  proxyChildViewEvents (view) {
    let prefix = 'childview';

    this.listenTo(view, 'all', function() {
      let args = __slice.call(arguments);

      args[0] = prefix + ':' + args[0];
      args.splice(1, 0, view);

      this.triggerMethod.apply(this, args);

    });

  }
  /**
   * Resort the view
   * @return {CollectionView} this
   */
  resortView () {
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
  destroy () {
    this.triggerMethod('before:destroy:children');
    this.destroyChildren();
    this.triggerMethod('destroy:children');

    return super.destroy();

  }

  /**
   * Destroy all children of the collection view
   */
  destroyChildren () {
    if (this._container) {
      this._container.innerHtml = '';
    }

    this.children.forEach(this.removeChildView, this);
    this.children.empty();
  }

  // Internal method. Check whether we need to insert the view into
  // the correct position.
  _insertBefore (childView, index) {
    let currentView;

    let findPosition = this.sort && (index < this.children.length - 1);
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
  _insertAfter (childView) {
    this._container.appendChild(childView.el);
  }


  _destroyContainer () {
    if (this._container)
      delete this._container;
  }

  _initCollectionEvents () {
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
  _initContainer () {
    var container = this.getOption('childViewContainer');
    if (container) {
      container = this.$(container)[0];
    } else {
      container = this.el;
    }
    this._container = container;
  }

   _updateIndexes (view, increment, index) {
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
  _onCollectionAdd (model) {
    let view = this._getChildView(model);
    let index = this.collection.models.indexOf(model);

    this._addChildView(view, index);
  }

  /**
   * Called when a model is removed from the collection
   * @param {JaffaMVC.Model|Backbone.model} model Model
   * @private
   */
  _onCollectionRemove (model) {
    let view = this.children.find(function(view) {
      return view.model === model;
    });

    this.removeChildView(view);
  }

  _onCollectionSort () {
    // check for any changes in sort order of views

    let orderChanged = this.collection.find((model, index) => {
      let view = this.children.find(function (view) {
        return view.model === model;
      });
      return !view || view._index !== index;
    });

    if (orderChanged) {
      this.resortView();
    }
  }

}
