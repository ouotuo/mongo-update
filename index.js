var minify = require('mongo-minify');
var is = require('component-type');
var eql = require('mongo-eql');

/**
 * Get object diff as a MongoDB update query
 *
 * @param {Object} a
 * @param {Object} b
 * @param {Object} [filter]
 * @return {Object}
 * @api public
 */

module.exports = function (a, b, filter) {
  var ret = {};
  filter = filter || {};
  diff(a, b, ret);
  return minify(ret, filter);
}

/**
 * Traverse both objects and put ops on the `query` object
 */

function diff (a, b, query, prefix) {
  // find removed keys
  for (var key in a) {
    var path = join(key, prefix);
    if (b[key] == null) unset(query, path);
  }
  
  // find changed keys
  for (var key in b) {
    var path = join(key, prefix);
    
    // removed
    if (b[key] == null) continue;
    
    // no change
    if (eql(a[key], b[key])) continue;
    
    // new type
    if (is(a[key]) != is(b[key])) {
      set(query, path, b[key]);
      continue;
    }
    
    // object
    if (is(a[key]) == 'object') {
      diff(a[key], b[key], query, path);
      continue;
    }
    
    // default
    set(query, path, b[key]);
  }
}

/**
 * $set `field` to `val`
 */

function set (query, field, val) {
  query['$set'] = query['$set'] || {};
  query['$set'][field] = val;
}

/**
 * $unset `field`
 */

function unset (query, field) {
  query['$unset'] = query['$unset'] || {};
  query['$unset'][field] = 1;
};

/**
 * Join `key` with `prefix` using dot-notation
 */

function join (key, prefix) {
  return prefix
    ? prefix + '.' + key
    : key;
}