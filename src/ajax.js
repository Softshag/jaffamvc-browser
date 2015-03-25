
let ajax = function() {

  let xmlrequest = function() {
    let e;
    if (window.XMLHttpRequest != null) {
      return new XMLHttpRequest();
    }
    try {
      return new ActiveXObject('msxml2.xmlhttp.6.0');
    } catch (_error) {
      e = _error;
    }
    try {
      return new ActiveXObject('msxml2.xmlhttp.3.0');
    } catch (_error) {
      e = _error;
    }
    try {
      return new ActiveXObject('msxml2.xmlhttp');
    } catch (_error) {
      e = _error;
    }
    return e;
  };

  let xmlRe = /^(?:application|text)\/xml/;
  let jsonRe = /^application\/json/;

  let getData = function(accepts, xhr) {
    if (accepts == null) accepts = xhr.getResponseHeader('content-type');
    if (xmlRe.test(accepts)) {
      return xhr.responseXML;
    } else if (jsonRe.test(accepts) && xhr.responseText !== '') {
      return JSON.parse(xhr.responseText);
    } else {
      return xhr.responseText;
    }
  };

  var isValid = function(xhr) {
    return (xhr.status >= 200 && xhr.status < 300) ||
      (xhr.status === 304) ||
      (xhr.status === 0 && window.location.protocol === 'file:')
  };

  var end = function(xhr, options, resolve, reject) {
    return function() {
      if (xhr.readyState !== 4) return;

      var status = xhr.status;
      var data = getData(options.headers && options.headers.Accept, xhr);

      // Check for validity.
      if (isValid(xhr)) {
        if (options.success) options.success(data);
        if (resolve) resolve(data);
      } else {
        var error = new Error('Server responded with a status of ' + status);
        if (options.error) options.error(xhr, status, error);
        if (reject) reject(xhr);
      }
    }
  };

  return function(opts) {
    if (opts == null || !utils.isObject(opts)) throw new Error('no opts');
    opts.type = (opts.type || 'GET').toUpperCase()

    let xhr = xmlrequest();
    if (xhr instanceof Error) throw xhr;

    let resolve, reject, promise = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });

    if (opts.headers == null) opts.headers = {};

    opts.headers['X-Requested-With'] = 'XMLHttpRequest';

    if (opts.contentType) {
      opts.headers['Content-Type'] = opts.contentType;
    }

    // Stringify GET query params.
    if (opts.type === 'GET' && typeof opts.data === 'object') {
      let query = '';
      let stringifyKeyValuePair = function(key, value) {
        return value == null ? '' :
          '&' + encodeURIComponent(key) +
          '=' + encodeURIComponent(value);
      };
      for (var key in opts.data) {
        query += stringifyKeyValuePair(key, opts.data[key]);
      }

      if (query) {
        let sep = (opts.url.indexOf('?') === -1) ? '?' : '&';
        opts.url += sep + query.substring(1);
      }
    }

    xhr.addEventListener('readystatechange', end(xhr, opts, resolve, reject));

    if (typeof opts.progress === 'function') {
      xhr.addEventListener('progress', opts.progress)
    }

    xhr.open(opts.type, opts.url, true);

    var allTypes = "*/".concat("*");
    var xhrAccepts = {
      "*": allTypes,
      text: "text/plain",
      html: "text/html",
      xml: "application/xml, text/xml",
      json: "application/json, text/javascript"
    };
    xhr.setRequestHeader(
      "Accept",
      opts.dataType && xhrAccepts[opts.dataType] ?
      xhrAccepts[opts.dataType] + (opts.dataType !== "*" ? ", " + allTypes + "; q=0.01" : "") :
      xhrAccepts["*"]
    );

    if (opts.headers)
      for (var k in opts.headers) {
        xhr.setRequestHeader(k, opts.headers[k]);
      }
    if (opts.beforeSend) opts.beforeSend(xhr);

    if (opts.withCredentials) {
      xhr.withCredentials = true;
    }

    xhr.send(opts.data);

    return promise;
  }

};
