var assert = require('assert')
var BoundingBox = require('../BoundingBox')

var bounds1 = new BoundingBox({
  minlat: 48,
  minlon: 16,
  maxlat: 49,
  maxlon: 17
})

var bounds2 = new BoundingBox({
  minlat: 45.1234,
  minlon: 16,
  maxlat: 47,
  maxlon: 17
})

// note: minlat/maxlat interchanged
var bounds3 = new BoundingBox({
  minlat: 47.2,
  minlon: 16,
  maxlat: 48.2,
  maxlon: 17
})

var bounds4 = new BoundingBox({
  lat: 48.1,
  lon: 16.1
})

var bounds5 = new BoundingBox({
  lat: 48.2,
  lon: 16.2
})

var bounds6 = new BoundingBox({
  minlat: 48.2,
  minlon: 16.2,
  maxlat: 48.8,
  maxlon: 16.8
})

var bounds7 = new BoundingBox({
  minlat: 50,
  minlon: 178,
  maxlat: 60,
  maxlon: 180
})

var bounds8 = new BoundingBox({
  minlat: 55,
  minlon: -180,
  maxlat: 65,
  maxlon: -178
})

var bounds9 = new BoundingBox({
  minlat: 55,
  minlon: 179,
  maxlat: 65,
  maxlon: -179
})

var bounds10 = new BoundingBox({
  minlat: 59,
  minlon: 179.5,
  maxlat: 61,
  maxlon: -179.5
})

var bounds11 = new BoundingBox({
  minlat: 55,
  minlon: 179,
  maxlat: 60,
  maxlon: 179.5
})

var bounds12 = new BoundingBox({
  minlat: 55,
  minlon: -179.5,
  maxlat: 60,
  maxlon: -179
})

var bounds13 = new BoundingBox({
  minlat: 55,
  minlon: 179,
  maxlat: 65,
  maxlon: -169
})

describe('BoundingBox', function() {
  it('create', function(done) {
    assert.deepEqual(
      {"minlat":48,"minlon":16,"maxlat":49,"maxlon":17},
      bounds1
    )

    assert.deepEqual(
      {"minlat":45.1234,"minlon":16,"maxlat":47,"maxlon":17},
      bounds2
    )

    assert.deepEqual(
      {"minlat":47.2,"minlon":16,"maxlat":48.2,"maxlon":17},
      bounds3
    )

    assert.deepEqual(
      {"minlat":48.1,"minlon":16.1,"maxlat":48.1,"maxlon":16.1},
      bounds4
    )

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

    bounds11 = new BoundingBox({
      minlat: 55,
      minlon: 179,
      maxlat: 60,
      maxlon: 179.5
    })

    bounds12 = new BoundingBox({
      minlat: 55,
      minlon: -179.5,
      maxlat: 60,
      maxlon: -179
    })

    bounds13 = new BoundingBox({
      minlat: 55,
      minlon: 179,
      maxlat: 65,
      maxlon: -169
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

  it('create from GeoJSON - crossing antimeridian', function(done) {
    var expected = {"minlat":16,"minlon":178,"maxlat":17,"maxlon":-178}
    var input = {"type":"Feature","properties":{},"geometry":{"type":"MultiPolygon","coordinates":[[[[178,16],[179,16],[179,17],[178,17],[178,16]]],[[[-178,16],[-179,16],[-179,17],[-178,17],[-178,16]]]]}}

    assert.deepEqual(
      expected,
      new BoundingBox(input)
    )

    expected = {"minlat":0,"minlon":100,"maxlat":0,"maxlon":-179}
    input = {"type":"Feature","properties":{},"geometry":{"type":"GeometryCollection","geometries":[{"type":"Point","coordinates":[100,0]},{"type":"Point","coordinates":[-179,0]}]}}

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
    assert.equal(true, bounds10.intersects(bounds9))
    assert.equal(true, bounds9.intersects(bounds11))
    assert.equal(true, bounds11.intersects(bounds9))
    assert.equal(true, bounds9.intersects(bounds12))
    assert.equal(true, bounds12.intersects(bounds9))
    assert.equal(true, bounds10.intersects(bounds11))
    assert.equal(true, bounds11.intersects(bounds10))
    assert.equal(true, bounds10.intersects(bounds12))
    assert.equal(true, bounds12.intersects(bounds10))

    done()
  })

  it('within()', function(done) {
    assert.equal(true, bounds1.within(bounds1))
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
    assert.equal(false, bounds9.within(bounds10))
    assert.equal(false, bounds9.within(bounds11))
    assert.equal(true, bounds11.within(bounds9))
    assert.equal(false, bounds9.within(bounds12))
    assert.equal(true, bounds12.within(bounds9))
    assert.equal(false, bounds10.within(bounds11))
    assert.equal(false, bounds11.within(bounds10))
    assert.equal(false, bounds10.within(bounds12))
    assert.equal(false, bounds12.within(bounds10))

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

    var b = bounds10.toBBoxString()
    assert.deepEqual(
      '179.5,59,-179.5,61',
      b
    )

    var b = bounds12.toBBoxString()
    assert.deepEqual(
      '-179.5,55,-179,60',
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

    var b = bounds10.toLonLatString()
    assert.deepEqual(
      '179.5,59,-179.5,61',
      b
    )

    var b = bounds12.toLonLatString()
    assert.deepEqual(
      '-179.5,55,-179,60',
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

    var b = bounds10.toLatLonString()
    assert.deepEqual(
      '59,179.5,61,-179.5',
      b
    )

    var b = bounds12.toLatLonString()
    assert.deepEqual(
      '55,-179.5,60,-179',
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

    assert.equal(
      10.198039027185569,
      bounds8.diagonalLength()
    )

    assert.equal(
      10.198039027185569,
      bounds9.diagonalLength()
    )

    done()
  })

  it('diagonalDistance()', function(done) {
    assert.equal(
      0,
      bounds4.diagonalDistance()
    )

    assert.equal(
      133.38781428054213,
      bounds1.diagonalDistance()
    )

    assert.equal(
      133387.8142805421,
      bounds1.diagonalDistance({ unit: 'meter' })
    )

    assert.equal(
      222.47082144925218,
      bounds2.diagonalDistance()
    )

    assert.equal(
      134.02962454571005,
      bounds3.diagonalDistance()
    )

    assert.equal(
      1117.3539982697293,
      bounds8.diagonalDistance()
    )

    assert.equal(
      1117.3539982697293,
      bounds9.diagonalDistance()
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

    assert.deepEqual({
        lat: 60,
        lon: -179
      },
      bounds8.getCenter()
    )

    assert.deepEqual({
        lat: 60,
        lon: 180
      },
      bounds9.getCenter()
    )

    assert.deepEqual({
        lat: 60,
        lon: -175
      },
      bounds13.getCenter()
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

  describe('extend()', function () {
    it ('1 + 2', function () {
      var test = new BoundingBox(bounds1)
      test.extend(bounds2)

      assert.deepEqual(
        {"minlat":45.1234,"minlon":16,"maxlat":49,"maxlon":17},
        test
      )
    })

    it ('7 + 9', function () {
      var test = new BoundingBox(bounds7)
      test.extend(bounds9)

      assert.deepEqual(
        { minlon: 178, minlat: 50, maxlon: -179, maxlat: 65 },
        test
      )
    })

    it ('11 + 12', function () {
      var test = new BoundingBox(bounds11)
      test.extend(bounds12)

      assert.deepEqual(
        { minlon: 179, minlat: 55, maxlon: -179, maxlat: 60 },
        test
      )
    })

    it ('2 + 9', function () {
      var test = new BoundingBox(bounds2)
      test.extend(bounds9)

      assert.deepEqual(
        { minlon: 16, minlat: 45.1234, maxlon: -179, maxlat: 65 },
        test
      )
    })

    it ('9 + 2', function () {
      var test = new BoundingBox(bounds9)
      test.extend(bounds2)

      assert.deepEqual(
        { minlon: 16, minlat: 45.1234, maxlon: -179, maxlat: 65 },
        test
      )
    })

    it ('special case 1', function () {
      var test = new BoundingBox({minlon: 16.2551852, minlat: 48.1817041, maxlon: -179.9884861, maxlat: 65.8660295})
      test.extend({minlat: 65.8637, maxlat: 65.8637, minlon: -180, maxlon: -180})

      assert.deepEqual(
        {minlon: 16.2551852, minlat: 48.1817041, maxlon: -179.9884861, maxlat: 65.8660295},
        test
      )
    })

    it ('special case 2', function () {
      var test = new BoundingBox({minlon: 16.2551852, minlat: 48.1817041, maxlon: -179.9884861, maxlat: 65.8660295})
      test.extend({minlat: 65.8637, maxlat: 65.8637, minlon: 180, maxlon: 180})

      assert.deepEqual(
        {minlon: 16.2551852, minlat: 48.1817041, maxlon: -179.9884861, maxlat: 65.8660295},
        test
      )
    })
  })

  it('toGeoJSON()', function(done) {

    var expected = {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[16,48],[17,48],[17,49],[16,49],[16,48]]]}}
    assert.deepEqual(expected, bounds1.toGeoJSON())

    var expected = {"type":"Feature","properties":{},"geometry":{"type":"MultiPolygon","coordinates":[[[[179,55],[180,55],[180,65],[179,65],[179,55]]],[[[-180,55],[-169,55],[-169,65],[-180,65],[-180,55]]]]}}
    assert.deepEqual(expected, bounds13.toGeoJSON())

    done()
  })

  if(typeof L != 'undefined')
  it('toLeaflet()', function(done) {

    var leaflet_bounds = L.latLngBounds(L.latLng(48, 16), L.latLng(49, 17))

    assert.deepEqual(leaflet_bounds, bounds1.toLeaflet())

    done()
  })

})
