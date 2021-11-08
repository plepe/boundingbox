(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

const GeoJSONBounds = require('geojson-bounds')
const haversine = require('haversine')

/* global L:false */

/**
 * create bounding box from input
 * @class
 * @param {object|Leaflet.latLngBounds|GeoJSON} bounds Input boundary. Can be an object with { minlat, minlon, maxlat, maxlon } or { lat, lon } or { lat, lng } or [ N (lat), N (lon) ] a GeoJSON object or a Leaflet object (latLng or latLngBounds). The boundary will automatically be wrapped at longitude -180 / 180.
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 */
function BoundingBox (bounds) {
  let k

  if (bounds === null || typeof bounds === 'undefined') {
    this.minlat = -90
    this.minlon = -180
    this.maxlat = +90
    this.maxlon = +180
    return
  }

  // Leaflet.latLngBounds detected!
  if (typeof bounds.getSouthWest === 'function') {
    const sw = bounds.getSouthWest().wrap()
    const ne = bounds.getNorthEast().wrap()

    bounds = {
      minlat: sw.lat,
      minlon: sw.lng,
      maxlat: ne.lat,
      maxlon: ne.lng
    }
  }

  // GeoJSON detected
  if (bounds.type === 'Feature') {
    let boxes

    if (bounds.geometry.type === 'GeometryCollection') {
      boxes = bounds.geometry.geometries.map(
        geometry => {
          const b = new BoundingBox({ type: 'Feature', geometry })
          return [b.minlon, b.minlat, b.maxlon, b.maxlat]
        }
      )
    } else if (['MultiPoint', 'MultiPolygon', 'MultiLineString'].includes(bounds.geometry.type)) {
      boxes = bounds.geometry.coordinates.map(
        geom => GeoJSONBounds.extent({ type: 'Feature', geometry: { type: bounds.geometry.type.substr(5), coordinates: geom } })
      )
    } else {
      boxes = [GeoJSONBounds.extent(bounds)]
    }

    const b = boxes.shift()

    this.minlat = b[1]
    this.minlon = b[0]
    this.maxlat = b[3]
    this.maxlon = b[2]

    boxes.forEach(b => this.extend({
      minlat: b[1],
      minlon: b[0],
      maxlat: b[3],
      maxlon: b[2]
    }))

    this._wrap()

    return
  }

  if ('bounds' in bounds) {
    bounds = bounds.bounds
  }

  if (bounds.lat) {
    this.minlat = bounds.lat
    this.maxlat = bounds.lat
  }

  if (bounds.lon) {
    this.minlon = bounds.lon
    this.maxlon = bounds.lon
  }

  if (bounds.latitude) {
    this.minlat = bounds.latitude
    this.maxlat = bounds.latitude
    this.minlon = bounds.longitude
    this.maxlon = bounds.longitude
  }

  if (Array.isArray(bounds)) {
    this.minlat = bounds[0]
    this.maxlat = bounds[0]
    this.minlon = bounds[1]
    this.maxlon = bounds[1]
  }

  // e.g. L.latLng object
  if (bounds.lng) {
    this.minlon = bounds.lng
    this.maxlon = bounds.lng
  }

  const props = ['minlon', 'minlat', 'maxlon', 'maxlat']
  for (let i = 0; i < props.length; i++) {
    k = props[i]
    if (k in bounds) {
      this[k] = bounds[k]
    }
  }

  this._wrap()
}

BoundingBox.prototype.wrapMaxLon = function () {
  return (this.minlon > this.maxlon) ? this.maxlon + 360 : this.maxlon
}

BoundingBox.prototype.wrapMinLon = function () {
  return (this.minlon > this.maxlon) ? this.minlon - 360 : this.minlon
}

BoundingBox.prototype._wrap = function () {
  if (this.minlon < -180 || this.minlon > 180) {
    this.minlon = (this.minlon + 180) % 360 - 180
  }
  if (this.maxlon < -180 || this.maxlon > 180) {
    this.maxlon = (this.maxlon + 180) % 360 - 180
  }

  return this
}

/**
  * Checks whether the other bounding box intersects (shares any portion of space) the current object.
 * @param {BoundingBox} other Other boundingbox to check for
 * @return {boolean} true if the bounding boxes intersect
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * var bbox2 = new BoundingBox({ lat: 48.5, lon: 16.267 })
 * console.log(bbox.intersects(bbox2)) // true
 */
BoundingBox.prototype.intersects = function (other) {
  if (!(other instanceof BoundingBox)) {
    other = new BoundingBox(other)
  }

  if (other.maxlat < this.minlat) {
    return false
  }

  if (other.minlat > this.maxlat) {
    return false
  }

  if (other.wrapMaxLon() < this.wrapMinLon()) {
    return false
  }

  if (other.wrapMinLon() > this.wrapMaxLon()) {
    return false
  }

  return true
}

/**
 * Checks whether the current object is fully within the other bounding box.
 * @param {BoundingBox} other Other boundingbox to check for
 * @return {boolean} true if the bounding boxes is within other
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * var bbox2 = new BoundingBox({ lat: 48.5, lon: 16.267 })
 * console.log(bbox2.within(bbox)) // true
 */
BoundingBox.prototype.within = function (other) {
  if (!(other instanceof BoundingBox)) {
    other = new BoundingBox(other)
  }

  if (other.maxlat < this.maxlat) {
    return false
  }

  if (other.minlat > this.minlat) {
    return false
  }

  if (other.wrapMaxLon() < this.wrapMaxLon()) {
    return false
  }

  if (other.wrapMinLon() > this.wrapMinLon()) {
    return false
  }

  return true
}

BoundingBox.prototype.toTile = function () {
  return new BoundingBox({
    minlat: Math.floor(this.minlat * 10) / 10,
    minlon: Math.floor(this.minlon * 10) / 10,
    maxlat: Math.ceil(this.maxlat * 10) / 10,
    maxlon: Math.ceil(this.maxlon * 10) / 10
  })
}

/**
 * return the bounding box as lon-lat string, e.g. '179.5,55,-179.5,56'
 * @return {string}
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * console.log(bbox.toLonLatString()) // '16.23,48.123,16.367,49.012'
 */
BoundingBox.prototype.toLonLatString = function () {
  return this.minlon + ',' +
         this.minlat + ',' +
         this.maxlon + ',' +
         this.maxlat
}

/**
 * return the bounding box as lon-lat string, e.g. '179.5,55,-179.5,56'. Useful for sending requests to web services that return geo data.
 * @return {string}
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * console.log(bbox.toBBoxString()) // '16.23,48.123,16.367,49.012'
 */
BoundingBox.prototype.toBBoxString = BoundingBox.prototype.toLonLatString

/**
 * return the bounding box as lon-lat string, e.g. '55,179.5,56,-179.5'. Useful e.g. for Overpass API requests.
 * @return {string}
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * console.log(bbox.toLatLonString()) // '48.123,16.23,49.012,16.367'
 */
BoundingBox.prototype.toLatLonString = function () {
  return this.minlat + ',' +
         this.minlon + ',' +
         this.maxlat + ',' +
         this.maxlon
}

/**
 * return the diagonal length (length of hypothenuse).
 * @return {number}
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * console.log(bbox.diagonalLength()) // 0.8994943023721748
 */
BoundingBox.prototype.diagonalLength = function () {
  const dlat = this.maxlat - this.minlat
  const dlon = this.wrapMaxLon() - this.minlon

  return Math.sqrt(dlat * dlat + dlon * dlon)
}

/**
 * return the diagonal distance (using the haversine function). See https://github.com/njj/haversine for further details.
 * @param {object} [options] Options
 * @param {string} [options.unit=km] Unit of measurement applied to result ('km', 'mile', 'meter', 'nmi')
 * @param {number} [options.threshold] If passed, will result in library returning boolean value of whether or not the start and end points are within that supplied threshold.
 * @return {number}
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * console.log(bbox.diagonalDistance({ unit: 'm' })) // 99.36491328576697
 */
BoundingBox.prototype.diagonalDistance = function (options = {}) {
  return haversine(
    { latitude: this.minlat, longitude: this.minlon },
    { latitude: this.maxlat, longitude: this.maxlon },
    options
  )
}

/**
 * Returns the center point of the bounding box as { lat, lon }
 * @return {object}
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * console.log(bbox.getCenter()) // { lat: 48.567499999999995, lon: 16.2985 }
 */
BoundingBox.prototype.getCenter = function () {
  const dlat = this.maxlat - this.minlat
  const dlon = this.wrapMaxLon() - this.minlon
  let lon = this.minlon + dlon / 2
  if (lon < -180 || lon > 180) {
    lon = (lon + 180) % 360 - 180
  }

  return {
    lat: this.minlat + dlat / 2,
    lon
  }
}

/**
 * get Northern boundary (latitude)
 * @param {number}
 */
BoundingBox.prototype.getNorth = function () {
  return this.maxlat
}

/**
 * get Southern boundary (latitude)
 * @param {number}
 */
BoundingBox.prototype.getSouth = function () {
  return this.minlat
}

/**
 * get Eastern boundary (longitude)
 * @param {number}
 */
BoundingBox.prototype.getEast = function () {
  return this.maxlon
}

/**
 * get Western boundary (longitude)
 * @param {number}
 */
BoundingBox.prototype.getWest = function () {
  return this.minlon
}

/**
 * extends current boundary by the other boundary
 * @param {BoundingBox} other
 * @example
 * var bbox1 = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * var bbox2 = new BoundingBox({ minlat: 48.000, minlon: 16.23, maxlat: 49.012, maxlon: 16.789 })
 * bbox1.extend(bbox2)
 * console.log(bbox1.bounds) // { minlat: 48, minlon: 16.23, maxlat: 49.012, maxlon: 16.789 }
 */
BoundingBox.prototype.extend = function (other) {
  if (!(other instanceof BoundingBox)) {
    other = new BoundingBox(other)
  }

  if (other.minlat < this.minlat) {
    this.minlat = other.minlat
  }

  if (other.maxlat > this.maxlat) {
    this.maxlat = other.maxlat
  }

  // does bounds intersect with other bounds in longitude?
  for (let shift = -360; shift <= 360; shift += 360) {
    if (other.wrapMaxLon() + shift > this.minlon && other.minlon + shift < this.wrapMaxLon()) {
      this.minlon = Math.min(this.minlon, other.minlon + shift)
      this.maxlon = Math.max(this.wrapMaxLon(), other.wrapMaxLon() + shift)

      this._wrap()
      return
    }
  }

  const min1 = Math.min(this.minlon, other.minlon)
  const min2 = Math.max(this.minlon, other.minlon)
  const max1 = Math.max(this.wrapMaxLon(), other.wrapMaxLon())
  const max2 = Math.min(this.wrapMaxLon(), other.wrapMaxLon())

  if (max1 - min1 < max2 - min2 + 360) {
    this.minlon = min1
    this.maxlon = max1
  } else {
    this.minlon = min2
    this.maxlon = max2
  }

  this._wrap()
}

/**
 * Returns the bounding box as GeoJSON feature. In case of bounding boxes crossing the antimeridian, this function will return a multipolygon with the parts on each side of the antimeridian (as specified in RFC 7946, section 3.1.9).
 * @return {object}
 * @example
 * var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
 * bbox.toGeoJSON()
 * // {
 * //   "type": "Feature",
 * //   "properties": {},
 * //   "geometry": {
 * //     "type": "Polygon",
 * //     "coordinates": [
 * //       [
 * //         [ 16.23, 48.123 ],
 * //         [ 16.367, 48.123 ],
 * //         [ 16.367, 49.012 ],
 * //         [ 16.23, 49.012 ],
 * //         [ 16.23, 48.123 ]
 * //       ]
 * //     ]
 * //   }
 * // }
 */
BoundingBox.prototype.toGeoJSON = function () {
  if (this.minlon > this.maxlon) {
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [[
            [this.minlon, this.minlat],
            [180, this.minlat],
            [180, this.maxlat],
            [this.minlon, this.maxlat],
            [this.minlon, this.minlat]
          ]],
          [[
            [-180, this.minlat],
            [this.maxlon, this.minlat],
            [this.maxlon, this.maxlat],
            [-180, this.maxlat],
            [-180, this.minlat]
          ]]
        ]
      }
    }
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [this.minlon, this.minlat],
        [this.maxlon, this.minlat],
        [this.maxlon, this.maxlat],
        [this.minlon, this.maxlat],
        [this.minlon, this.minlat]
      ]]
    }
  }
}

/**
 * Returns the bounding box as L.latLngBounds object. Leaflet must be included separately!
 * @param {object} [options] Options.
 * @param {number[]} [options.shiftWorld=[0, 0]] Shift the world by the first value for the Western hemisphere (lon < 0) or the second value for the Eastern hemisphere (lon >= 0).
 */
BoundingBox.prototype.toLeaflet = function (options = {}) {
  if (!('shiftWorld' in options)) {
    options.shiftWorld = [0, 0]
  }

  return L.latLngBounds(
    L.latLng(this.minlat, this.minlon + (this.minlon < 0 ? options.shiftWorld[0] : options.shiftWorld[1])),
    L.latLng(this.maxlat, this.maxlon + (this.maxlon < 0 ? options.shiftWorld[0] : options.shiftWorld[1]))
  )
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BoundingBox
}
if (typeof window !== 'undefined') {
  window.BoundingBox = BoundingBox
}

},{"geojson-bounds":2,"haversine":3}],2:[function(require,module,exports){
(function (process){(function (){
(function() {
  /*
   Modified version of underscore.js's flatten function
   https://github.com/jashkenas/underscore/blob/master/underscore.js#L501
  */
  function flatten(input, output) {
    output = output || [];
    var idx = output.length;
    for (var i = 0; i < input.length; i++) {
      if (Array.isArray(input[i]) && Array.isArray(input[i][0])) {
        flatten(input[i], output);
        idx = output.length;
      } else {
        output[idx++] = input[i];
      }
    }
    return (Array.isArray(output[0])) ? output : [output];
  };

  function maxLat(coords) {
    return Math.max.apply(null, coords.map(function(d) { return d[1]; }));
  }

  function maxLng(coords) {
    return Math.max.apply(null, coords.map(function(d) { return d[0]; }));
  }

  function minLat(coords) {
    return Math.min.apply(null, coords.map(function(d) { return d[1]; }));
  }

  function minLng(coords) {
    return Math.min.apply(null, coords.map(function(d) { return d[0]; }));
  }

  function fetchEnvelope(coords) {
    var mmc = {
      "minLng": minLng(coords),
      "minLat": minLat(coords),
      "maxLng": maxLng(coords),
      "maxLat": maxLat(coords)
    }

    return {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [mmc.minLng, mmc.minLat],
          [mmc.minLng, mmc.maxLat],
          [mmc.maxLng, mmc.maxLat],
          [mmc.maxLng, mmc.minLat],
          [mmc.minLng, mmc.minLat]
        ]]
      }
    }
  }

  function fetchExtent(coords) {
    return [
      minLng(coords),
      minLat(coords),
      maxLng(coords),
      maxLat(coords)
    ]
  }

  // Adapted from http://stackoverflow.com/questions/2792443/finding-the-centroid-of-a-polygon
  function fetchCentroid(vertices) {
    var centroid = {
      x: 0,
      y: 0
    }
    
    var signedArea = 0;
    var x0 = 0;
    var y0 = 0;
    var x1 = 0;
    var y1 = 0;
    var a = 0;

    for (var i = 0; i < vertices.length - 1; i++) {
      x0 = vertices[i][0];
      y0 = vertices[i][1];
      x1 = vertices[i + 1][0];
      y1 = vertices[i + 1][1];
      a = (x0 * y1) - (x1 * y0);

      signedArea += a;
      centroid.x += (x0 + x1) * a;
      centroid.y += (y0 + y1) * a;
    }

    x0 = vertices[vertices.length - 1][0];
    y0 = vertices[vertices.length - 1][1];
    x1 = vertices[0][0];
    y1 = vertices[0][1];
    a = (x0 * y1) - (x1 * y0);
    signedArea += a;
    centroid.x += (x0 + x1) * a;
    centroid.y += (y0 + y1) * a;

    signedArea = signedArea * 0.5;
    centroid.x = centroid.x / (6.0*signedArea);
    centroid.y = centroid.y / (6.0*signedArea);

    return [centroid.x, centroid.y];
  }

  function feature(obj) {
    return flatten(obj.geometry.coordinates);
  }

  function featureCollection(f) {
    return flatten(f.features.map(feature));
  }

  function geometryCollection(g) {
    return flatten(g.geometries.map(process));
  }

  function process(t) {
    if (!t) {
      return [];
    }

    switch (t.type) {
      case "Feature":
        return feature(t);
      case "GeometryCollection":
        return geometryCollection(t);
      case "FeatureCollection":
        return featureCollection(t);
      case "Point":
      case "LineString":
      case "Polygon":
      case "MultiPoint":
      case "MultiPolygon":
      case "MultiLineString":
        return flatten(t.coordinates);
      default:
        return [];
    }
  }

  function envelope(t) {
    return fetchEnvelope(process(t));
  }

  function extent(t) {
    return fetchExtent(process(t));
  }

  function centroid(t) {
    return fetchCentroid(process(t));
  }

  function xMin(t) {
    return minLng(process(t));
  }
  function xMax(t) {
    return maxLng(process(t));
  }
  function yMin(t) {
    return minLat(process(t));
  }
  function yMax(t) {
    return maxLat(process(t));
  }

  module.exports = {
    "envelope": envelope,
    "extent": extent,
    "centroid": centroid,
    "xMin": xMin,
    "xMax": xMax,
    "yMin": yMin,
    "yMax": yMax
  }

}());

}).call(this)}).call(this,require('_process'))
},{"_process":4}],3:[function(require,module,exports){
var haversine = (function () {
  var RADII = {
    km:    6371,
    mile:  3960,
    meter: 6371000,
    nmi:   3440
  }

  // convert to radians
  var toRad = function (num) {
    return num * Math.PI / 180
  }

  // convert coordinates to standard format based on the passed format option
  var convertCoordinates = function (format, coordinates) {
    switch (format) {
    case '[lat,lon]':
      return { latitude: coordinates[0], longitude: coordinates[1] }
    case '[lon,lat]':
      return { latitude: coordinates[1], longitude: coordinates[0] }
    case '{lon,lat}':
      return { latitude: coordinates.lat, longitude: coordinates.lon }
    case '{lat,lng}':
      return { latitude: coordinates.lat, longitude: coordinates.lng }
    case 'geojson':
      return { latitude: coordinates.geometry.coordinates[1], longitude: coordinates.geometry.coordinates[0] }
    default:
      return coordinates
    }
  }

  return function haversine (startCoordinates, endCoordinates, options) {
    options   = options || {}

    var R = options.unit in RADII
      ? RADII[options.unit]
      : RADII.km

    var start = convertCoordinates(options.format, startCoordinates)
    var end = convertCoordinates(options.format, endCoordinates)

    var dLat = toRad(end.latitude - start.latitude)
    var dLon = toRad(end.longitude - start.longitude)
    var lat1 = toRad(start.latitude)
    var lat2 = toRad(end.latitude)

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    if (options.threshold) {
      return options.threshold > (R * c)
    }

    return R * c
  }

})()

if (typeof module !== 'undefined' && module.exports) {
  module.exports = haversine
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1]);
