/*!
* JaffaMVC.Ext.js <%= version %>
* (c) <%= year %> Rasmus Kildevæld, Softshag.
* Inspired and based on Backbone.Marionette.js
* (c) 2014 Derick Bailey, Muted Solutions, LLC.
* (c) 2014 Adam Krebs, Jimmy Yuen Ho Wong
* JaffaMVC may be freely distributed under the MIT license.
*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jaffamvc'], factory);
  } else if (typeof exports === 'object') {
    var jaffamvc = require('<%= name %>')
    module.exports = factory(jaffamvc);
  } else {
    root.JaffaMVC = factory(root.JaffaMVC);
  }
}(this, function (jaffamvc) {

  "use strict";

  var utils = jaffamvc.utils,
      __slice = Array.prototype.slice;

