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

  // GeoJSON Feature detected
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
  } else
  // GeoJSON FeatureCollection detected
  if (bounds.type === 'FeatureCollection') {
    if (bounds.features.length === 0) {
      return
    }

    const r = new BoundingBox(bounds.features[0])
    for (let i = 1; i < bounds.features.length; i++) {
      r.extend(bounds.features[i])
    }

    this.minlat = r.minlat
    this.minlon = r.minlon
    this.maxlat = r.maxlat
    this.maxlon = r.maxlon
    return
  }

  if ('bounds' in bounds) {
    bounds = bounds.bounds
  }

  if (bounds.lat) {
    this.minlat = +bounds.lat
    this.maxlat = +bounds.lat
  }

  if (bounds.lon) {
    this.minlon = +bounds.lon
    this.maxlon = +bounds.lon
  }

  if (bounds.latitude) {
    this.minlat = +bounds.latitude
    this.maxlat = +bounds.latitude
    this.minlon = +bounds.longitude
    this.maxlon = +bounds.longitude
  }

  if (Array.isArray(bounds)) {
    this.minlat = +bounds[0]
    this.maxlat = +bounds[0]
    this.minlon = +bounds[1]
    this.maxlon = +bounds[1]
  }

  // e.g. L.latLng object
  if (bounds.lng) {
    this.minlon = +bounds.lng
    this.maxlon = +bounds.lng
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

  if (this.wrapMaxLon() >= other.minlon && this.minlon <= other.wrapMaxLon()) {
    return true
  }

  if (this.maxlon >= other.wrapMinLon() && this.wrapMinLon() <= other.maxlon) {
    return true
  }

  return false
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

  if (this.wrapMinLon() >= other.wrapMinLon() && this.maxlon <= other.maxlon) {
    return true
  }

  if (this.minlon >= other.minlon && this.wrapMaxLon() <= other.wrapMaxLon()) {
    return true
  }

  return false
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
