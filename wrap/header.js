/*!
* JaffaMVC.js <%= version %>
* (c) <%= year %> Rasmus Kildevæld, Softshag.
* Inspired and based on Backbone.Marionette.js
* (c) 2014 Derick Bailey, Muted Solutions, LLC.
* JaffaMVC may be freely distributed under the MIT license.
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['backbone', 'co'], factory);
  } else if (typeof exports === 'object') {
    var backbone = null, co = null, err;
    try { backbone = require('exoskeleton'); } catch (e) { err = e; }
    try { backbone = require('backbone'); } catch (e) { err = e; }
    try { co = require('co')} catch (e) {}
    if (Backbone === null) throw err;
    module.exports = factory(backbone, co);
  } else {
    root.JaffaMVC = factory(root.Exoskeleton || root.Backbone, co);
  }
}(this, function (Backbone, co) {
