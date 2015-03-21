/* global DEBUG:true */

function log () {
  if (DEBUG !== true) return;

  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}
