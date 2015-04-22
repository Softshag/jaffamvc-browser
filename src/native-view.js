
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
  for (var i = 0, len = array.length; i < len; i++) if (array[i] === item) return i;
  return -1;
}

var unbubblebles = 'focus blur change'.split(' ');

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
  constructor (...args) {
    this._domEvents = [];
    super(...args);
  }

  $ (selector) {
    return JaffaMVC.$(selector, this.el);
  }

  _removeElement() {
    this.undelegateEvents();
    if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }

  // Apply the `element` to the view. `element` can be a CSS selector,
  // a string of HTML, or an Element node.
  _setElement (element) {
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
  _setAttributes (attrs) {
    /*jshint -W030 */
    for (var attr in attrs) {
      attr in this.el ? this.el[attr] = attrs[attr] : this.el.setAttribute(attr, attrs[attr]);
    }
  }

  delegateEvents (events) {
    if (!(events || (events = utils.result(this, 'events')))) return this;
    this.undelegateEvents();

    let dels = []
    for (let key in events) {
      let method = events[key];
      if (typeof method !== 'function') method = this[events[key]];

      let match = key.match(/^(\S+)\s*(.*)$/);
      // Set delegates immediately and defer event on this.el
      let boundFn = utils.bind(method, this);
      if (match[2]) {
        this.delegate(match[1], match[2], boundFn);
      } else {
        dels.push([match[1], boundFn]);
      }
    }

    dels.forEach( d => { this.delegate(d[0],d[1]) });

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
  delegate (eventName, selector, listener) {
    /*jslint eqeq: true*/
    if (typeof selector === 'function') {
      listener = selector;
      selector = null;
    }

    let root = this.el;
    let handler = selector ? function (e) {
      let node = e.target || e.srcElement;

      // Already handled
      if (e.delegateTarget) return;

      for (; node && node != root; node = node.parentNode) {
        if (matchesSelector.call(node, selector)) {

          e.delegateTarget = node;
          listener(e);
        }
      }
    } : function (e) {
      if (e.delegateTarget) return;
      listener(e);
    };
    /*jshint bitwise: false*/
    let useCap = ~unbubblebles.indexOf(eventName);

    elementAddEventListener.call(this.el, eventName, handler, useCap);
    this._domEvents.push({eventName: eventName, handler: handler, listener: listener, selector: selector});
    return handler;
  }

  // Remove a single delegated event. Either `eventName` or `selector` must
  // be included, `selector` and `listener` are optional.
  undelegate (eventName, selector, listener) {
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
