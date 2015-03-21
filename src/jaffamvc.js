
/**
 * JaffaMVC
 * @namespace JaffaMVC
 */
Object.assign(JaffaMVC,{
  Events:Backbone.Events,
  History: Backbone.History,
  Model: Backbone.Model,
  Collection: Backbone.Collection,
  Router: Backbone.Router
});

/** Error classes */
class JaffaError extends Error {}
class InitializerError extends JaffaError {}

/* domready (c) Dustin Diaz 2014 - License MIT */
let domReady = (function (f) {
  /*jshint -W084 */
  /*jshint -W030 */
  let fns = [], listener,
      doc = document,
      hack = doc.documentElement.doScroll,
      domContentLoaded = 'DOMContentLoaded',
      loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState);

  if (!loaded) {
    doc.addEventListener(domContentLoaded, listener = function () {

    	doc.removeEventListener(domContentLoaded, listener);
    	loaded = 1;
    	while (listener = fns.shift()) listener();
  	});

  }

  return function (fn) {
    loaded ? fn() : fns.push(fn);
  }
})();

JaffaMVC.$ = function Query (selector, context) {

  if (typeof selector === 'function') {
    return domReady(selector);
  }

  context = context || document;
  if (typeof selector !== 'string' && 'nodeType' in selector) {
    return [selector];
  }

  if (typeof context === 'string') {
    context = document.querySelectorAll(context);
    if (!context.length) return context;
    [context] = context;
  }

  return context.querySelectorAll(selector);

};

