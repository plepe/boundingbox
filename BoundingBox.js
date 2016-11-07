'use strict'

var GeoJSONBounds = require('geojson-bounds')

/* global L:false */

function BoundingBox (bounds) {
  var k

  // Leaflet.latLngBounds detected!
  if (typeof bounds.getSouthWest === 'function') {
    var sw = bounds.getSouthWest()
    var ne = bounds.getNorthEast()

    bounds = {
      minlat: sw.lat,
      minlon: sw.lng,
      maxlat: ne.lat,
      maxlon: ne.lng
    }
  }

  // GeoJSON detected
  if (bounds.type === 'Feature') {
    var b = GeoJSONBounds.extent(bounds)

    bounds = {
      minlat: b[0],
      minlon: b[1],
      maxlat: b[2],
      maxlon: b[3]
    }
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

  // e.g. L.latLng object
  if (bounds.lng) {
    this.minlon = bounds.lng
    this.maxlon = bounds.lng
  }

  var props = ['minlon', 'minlat', 'maxlon', 'maxlat']
  for (var i = 0; i < props.length; i++) {
    var k = props[i]
    if (k in bounds) {
      this[k] = bounds[k]
    }
  }
}

BoundingBox.prototype.intersects = function (other) {
  other = new BoundingBox(other)

  if (other.maxlat < this.minlat) {
    return false
  }

  if (other.minlat > this.maxlat) {
    return false
  }

  if (other.maxlon < this.minlon) {
    return false
  }

  if (other.minlon > this.maxlon) {
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

BoundingBox.prototype.toLonLatString = function () {
  return this.minlon + ',' +
         this.minlat + ',' +
         this.maxlon + ',' +
         this.maxlat
}

BoundingBox.prototype.toBBoxString = BoundingBox.prototype.toLonLatString

BoundingBox.prototype.toLatLonString = function () {
  return this.minlat + ',' +
         this.minlon + ',' +
         this.maxlat + ',' +
         this.maxlon
}

BoundingBox.prototype.diagonalLength = function () {
  var dlat = this.maxlat - this.minlat
  var dlon = this.maxlon - this.minlon

  return Math.sqrt(dlat * dlat + dlon * dlon)
}

BoundingBox.prototype.getCenter = function () {
  var dlat = this.maxlat - this.minlat
  var dlon = this.maxlon - this.minlon

  return {
    lat: this.minlat + dlat / 2,
    lon: this.minlon + dlon / 2
  }
}

BoundingBox.prototype.getNorth = function () {
  return this.maxlat
}

BoundingBox.prototype.getSouth = function () {
  return this.minlat
}

BoundingBox.prototype.getEast = function () {
  return this.maxlon
}

BoundingBox.prototype.getWest = function () {
  return this.minlon
}

BoundingBox.prototype.extend = function (other) {
  other = new BoundingBox(other)

  if (other.minlon < this.minlon) {
    this.minlon = other.minlon
  }

  if (other.minlat < this.minlat) {
    this.minlat = other.minlat
  }

  if (other.maxlon > this.maxlon) {
    this.maxlon = other.maxlon
  }

  if (other.maxlat > this.maxlat) {
    this.maxlat = other.maxlat
  }
}

BoundingBox.prototype.toGeoJSON = function () {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      'type': 'Polygon',
      'coordinates': [[
        [ this.minlon, this.minlat ],
        [ this.maxlon, this.minlat ],
        [ this.maxlon, this.maxlat ],
        [ this.minlon, this.maxlat ],
        [ this.minlon, this.minlat ]
      ]]
    }
  }
}

BoundingBox.prototype.toLeaflet = function () {
  return L.latLngBounds(
    L.latLng(this.minlat, this.minlon),
    L.latLng(this.maxlat, this.maxlon)
  )
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BoundingBox
}
if (typeof window !== 'undefined') {
  window.BoundingBox = BoundingBox
}
