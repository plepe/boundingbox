'use strict'

var GeoJSONBounds = require('geojson-bounds')

// define L, if Leaflet is not available (not not confuse Linter)
if (typeof L === 'undefined') {
  var L
}

function BoundingBox (bounds) {
  var k

  if (bounds instanceof BoundingBox) {
    this.bounds = {}
    for (k in bounds.bounds) {
      this.bounds[k] = bounds.bounds[k]
    }

    return
  }

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

  this.bounds = {}
  for (k in bounds) {
    this.bounds[k] = bounds[k]
  }

  if (this.bounds.lat) {
    this.bounds.minlat = this.bounds.lat
    this.bounds.maxlat = this.bounds.lat
    delete this.bounds.lat
  }

  if (this.bounds.lon) {
    this.bounds.minlon = this.bounds.lon
    this.bounds.maxlon = this.bounds.lon
    delete this.bounds.lon
  }

  // e.g. L.latLng object
  if (this.bounds.lng) {
    this.bounds.minlon = this.bounds.lng
    this.bounds.maxlon = this.bounds.lng
    delete this.bounds.lng
  }

  for (k in this.bounds) {
    if (['minlon', 'minlat', 'maxlon', 'maxlat'].indexOf(k) === -1) {
      delete this.bounds[k]
    }
  }
}

BoundingBox.prototype.intersects = function (other) {
  other = new BoundingBox(other)

  if (other.bounds.maxlat < this.bounds.minlat) {
    return false
  }

  if (other.bounds.minlat > this.bounds.maxlat) {
    return false
  }

  if (other.bounds.maxlon < this.bounds.minlon) {
    return false
  }

  if (other.bounds.minlon > this.bounds.maxlon) {
    return false
  }

  return true
}

BoundingBox.prototype.toTile = function () {
  return new BoundingBox({
    minlat: Math.floor(this.bounds.minlat * 10) / 10,
    minlon: Math.floor(this.bounds.minlon * 10) / 10,
    maxlat: Math.ceil(this.bounds.maxlat * 10) / 10,
    maxlon: Math.ceil(this.bounds.maxlon * 10) / 10
  })
}

BoundingBox.prototype.toBBoxString = function () {
  return this.bounds.minlon + ',' +
         this.bounds.minlat + ',' +
         this.bounds.maxlon + ',' +
         this.bounds.maxlat
}

BoundingBox.prototype.diagonalLength = function () {
  var dlat = this.bounds.maxlat - this.bounds.minlat
  var dlon = this.bounds.maxlon - this.bounds.minlon

  return Math.sqrt(dlat * dlat + dlon * dlon)
}

BoundingBox.prototype.getCenter = function () {
  var dlat = this.bounds.maxlat - this.bounds.minlat
  var dlon = this.bounds.maxlon - this.bounds.minlon

  return {
    lat: this.bounds.minlat + dlat / 2,
    lon: this.bounds.minlon + dlon / 2
  }
}

BoundingBox.prototype.toGeoJSON = function () {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      'type': 'Polygon',
      'coordinates': [[
        [ this.bounds.minlon, this.bounds.minlat ],
        [ this.bounds.maxlon, this.bounds.minlat ],
        [ this.bounds.maxlon, this.bounds.maxlat ],
        [ this.bounds.minlon, this.bounds.maxlat ],
        [ this.bounds.minlon, this.bounds.minlat ]
      ]]
    }
  }
}

BoundingBox.prototype.toLeaflet = function () {
  return L.latLngBounds(
    L.latLng(this.bounds.minlat, this.bounds.minlon),
    L.latLng(this.bounds.maxlat, this.bounds.maxlon)
  )
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BoundingBox
}
if (typeof window !== 'undefined') {
  window.BoundingBox = BoundingBox
}
