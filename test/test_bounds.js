var assert = require('assert')
var BoundingBox = require('../BoundingBox')
var bounds1, bounds2, bounds3, bounds4, bounds5, bounds6, bounds7, bounds8, bounds9, bounds10

describe('BoundingBox', function() {
  it('create', function(done) {
    bounds1 = new BoundingBox({
      minlat: 48,
      minlon: 16,
      maxlat: 49,
      maxlon: 17
    })
    assert.deepEqual(
      {"minlat":48,"minlon":16,"maxlat":49,"maxlon":17},
      bounds1
    )

    bounds2 = new BoundingBox({
      minlat: 45.1234,
      minlon: 16,
      maxlat: 47,
      maxlon: 17
    })
    assert.deepEqual(
      {"minlat":45.1234,"minlon":16,"maxlat":47,"maxlon":17},
      bounds2
    )

    // note: minlat/maxlat interchanged
    bounds3 = new BoundingBox({
      minlat: 47.2,
      minlon: 16,
      maxlat: 48.2,
      maxlon: 17
    })
    assert.deepEqual(
      {"minlat":47.2,"minlon":16,"maxlat":48.2,"maxlon":17},
      bounds3
    )

    bounds4 = new BoundingBox({
      lat: 48.1,
      lon: 16.1
    })
    assert.deepEqual(
      {"minlat":48.1,"minlon":16.1,"maxlat":48.1,"maxlon":16.1},
      bounds4
    )

    bounds5 = new BoundingBox({
      lat: 48.2,
      lon: 16.2
    })
    assert.deepEqual(
      {"minlat":48.2,"minlon":16.2,"maxlat":48.2,"maxlon":16.2},
      bounds5
    )

    bounds6 = new BoundingBox({
      minlat: 48.2,
      minlon: 16.2,
      maxlat: 48.8,
      maxlon: 16.8
    })
    assert.deepEqual(
      {"minlat":48.2,"minlon":16.2,"maxlat":48.8,"maxlon":16.8},
      bounds6
    )

    bounds7 = new BoundingBox({
      minlat: 50,
      minlon: 178,
      maxlat: 60,
      maxlon: 180
    })
    assert.deepEqual(
      {"minlat":50,"minlon":178,"maxlat":60,"maxlon":180},
      bounds7
    )

    bounds8 = new BoundingBox({
      minlat: 55,
      minlon: -180,
      maxlat: 65,
      maxlon: -178
    })

    bounds9 = new BoundingBox({
      minlat: 55,
      minlon: 179,
      maxlat: 65,
      maxlon: -179
    })

    bounds10 = new BoundingBox({
      minlat: 59,
      minlon: 179.5,
      maxlat: 61,
      maxlon: -179.5
    })

    done()
  })

  it('create from BoundingBox', function(done) {
    var b = new BoundingBox(bounds1)
    assert.deepEqual(
      {"minlat":48,"minlon":16,"maxlat":49,"maxlon":17},
      b
    )

    done()
  })

  it('create from Overpass API response node', function(done) {
    var b = new BoundingBox({ type: 'node', id: 3037893168, lat: 48.1984633, lon: 16.3384871 })
    assert.deepEqual(
      {"minlat":48.1984633,"minlon":16.3384871,"maxlat":48.1984633,"maxlon":16.3384871},
      b
    )

    done()
  })

  it('create from GeoJSON', function(done) {
    var expected = {"minlat":16,"minlon":48,"maxlat":17,"maxlon":49}
    var input = {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[48,16],[49,16],[48.5,16.5],[49,17],[48,17],[48,16]]]}}

    assert.deepEqual(
      expected,
      new BoundingBox(input)
    )

    done()
  })

  if(typeof L != 'undefined')
  it('create from Leaflet L.latLngBounds', function(done) {
    var leaflet_bounds = L.latLngBounds(L.latLng(40.712, -74.227), L.latLng(40.774, -74.125))
    var b = new BoundingBox(leaflet_bounds)

    assert.deepEqual(
      {"minlat":40.712,"minlon":-74.227,"maxlat":40.774,"maxlon":-74.125},
      b
    )

    done()
  })

  if(typeof L != 'undefined')
  it('create from Leaflet L.latLng', function(done) {
    var leaflet_coord = L.latLng(40.712, -74.227)
    var b = new BoundingBox(leaflet_coord)

    assert.deepEqual(
      {"minlat":40.712,"minlon":-74.227,"maxlat":40.712,"maxlon":-74.227},
      b
    )

    done()
  })

  it('create from empty value', function(done) {
    var b = new BoundingBox()

    assert.deepEqual(
      {"minlat":-90,"minlon":-180,"maxlat":90,"maxlon":180},
      b
    )

    done()
  })

  it('intersects()', function(done) {
    assert.equal(false, bounds1.intersects(bounds2))
    assert.equal(true, bounds1.intersects(bounds3))
    assert.equal(true, bounds1.intersects(bounds4))
    assert.equal(true, bounds1.intersects(bounds5))
    assert.equal(false, bounds2.intersects(bounds5))
    assert.equal(true, bounds3.intersects(bounds5))
    assert.equal(true, bounds7.intersects(bounds9))
    assert.equal(true, bounds8.intersects(bounds9))

    done()
  })

  it('within()', function(done) {
    assert.equal(true, bounds4.within(bounds1))
    assert.equal(true, bounds5.within(bounds1))
    assert.equal(true, bounds6.within(bounds1))
    assert.equal(false, bounds1.within(bounds2))
    assert.equal(false, bounds1.within(bounds3))
    assert.equal(false, bounds1.within(bounds4))
    assert.equal(false, bounds1.within(bounds5))
    assert.equal(false, bounds2.within(bounds5))
    assert.equal(false, bounds3.within(bounds5))
    assert.equal(true, bounds5.within(bounds3))
    assert.equal(true, bounds10.within(bounds9))

    done()
  })

  it('toTile()', function(done) {
    var b = bounds2.toTile()
    assert.deepEqual(
      {"minlat":45.1,"minlon":16,"maxlat":47,"maxlon":17},
      b
    )

    done()
  })

  it('toBBoxString()', function(done) {
    var b = bounds2.toBBoxString()
    assert.deepEqual(
      '16,45.1234,17,47',
      b
    )

    var b = bounds4.toBBoxString()
    assert.deepEqual(
      '16.1,48.1,16.1,48.1',
      b
    )

    done()
  })

  it('toLonLatString()', function(done) {
    var b = bounds2.toLonLatString()
    assert.deepEqual(
      '16,45.1234,17,47',
      b
    )

    var b = bounds4.toLonLatString()
    assert.deepEqual(
      '16.1,48.1,16.1,48.1',
      b
    )

    done()
  })

  it('toLatLonString()', function(done) {
    var b = bounds2.toLatLonString()
    assert.deepEqual(
      '45.1234,16,47,17',
      b
    )

    var b = bounds4.toLatLonString()
    assert.deepEqual(
      '48.1,16.1,48.1,16.1',
      b
    )

    done()
  })

  it('diagonalLength()', function(done) {
    assert.equal(
      0,
      bounds4.diagonalLength()
    )

    assert.equal(
      1.4142135623730951,
      bounds1.diagonalLength()
    )

    assert.equal(
      2.126411898010358,
      bounds2.diagonalLength()
    )

    assert.equal(
      1.4142135623730951,
      bounds3.diagonalLength()
    )

    done()
  })

  it('getCenter()', function(done) {
    assert.deepEqual({
        lat: 48.5,
        lon: 16.5
      },
      bounds1.getCenter()
    )

    assert.deepEqual({
        lat: 48.1,
        lon: 16.1
      },
      bounds4.getCenter()
    )

    done()
  })

  it('getNorth()', function(done) {
    assert.equal(49, bounds1.getNorth())
    assert.equal(48.1, bounds4.getNorth())

    done()
  })

  it('getSouth()', function(done) {
    assert.equal(48, bounds1.getSouth())
    assert.equal(48.1, bounds4.getSouth())

    done()
  })

  it('getEast()', function(done) {
    assert.equal(17, bounds1.getEast())
    assert.equal(16.1, bounds4.getEast())

    done()
  })

  it('getWest()', function(done) {
    assert.equal(16, bounds1.getWest())
    assert.equal(16.1, bounds4.getWest())

    done()
  })

  it('extend()', function (done) {
    var test = new BoundingBox(bounds1)
    test.extend(bounds2)

    assert.deepEqual(
      {"minlat":45.1234,"minlon":16,"maxlat":49,"maxlon":17},
      test
    )

    done()
  })

  it('toGeoJSON()', function(done) {

    var expected = {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[16,48],[17,48],[17,49],[16,49],[16,48]]]}}

    assert.deepEqual(expected, bounds1.toGeoJSON())

    done()
  })

  if(typeof L != 'undefined')
  it('toLeaflet()', function(done) {

    var leaflet_bounds = L.latLngBounds(L.latLng(48, 16), L.latLng(49, 17))

    assert.deepEqual(leaflet_bounds, bounds1.toLeaflet())

    done()
  })

})
