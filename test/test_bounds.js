var assert = require('assert')
var BoundingBox = require('../BoundingBox')
var bounds1, bounds2, bounds3, bounds4, bounds5

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
      bounds1.bounds
    )

    bounds2 = new BoundingBox({
      minlat: 45.1234,
      minlon: 16,
      maxlat: 47,
      maxlon: 17
    })
    assert.deepEqual(
      {"minlat":45.1234,"minlon":16,"maxlat":47,"maxlon":17},
      bounds2.bounds
    )

    // note: minlat/maxlat interchanged
    bounds3 = new BoundingBox({
      minlat: 48.2,
      minlon: 16,
      maxlat: 47.2,
      maxlon: 17
    })
    assert.deepEqual(
      {"minlat":47.2,"minlon":16,"maxlat":48.2,"maxlon":17},
      bounds3.bounds
    )

    bounds4 = new BoundingBox({
      lat: 48.1,
      lon: 16.1
    })
    assert.deepEqual(
      {"minlat":48.1,"minlon":16.1,"maxlat":48.1,"maxlon":16.1},
      bounds4.bounds
    )

    bounds5 = new BoundingBox({
      lat: 48.2,
      lon: 16.2
    })
    assert.deepEqual(
      {"minlat":48.2,"minlon":16.2,"maxlat":48.2,"maxlon":16.2},
      bounds5.bounds
    )

    done()
  })

  it('create from BoundingBox', function(done) {
    var b = new BoundingBox(bounds1)
    assert.deepEqual(
      {"minlat":48,"minlon":16,"maxlat":49,"maxlon":17},
      b.bounds
    )

    done()
  })

  it('create from Overpass API response node', function(done) {
    var b = new BoundingBox({ type: 'node', id: 3037893168, lat: 48.1984633, lon: 16.3384871 })
    assert.deepEqual(
      {"minlat":48.1984633,"minlon":16.3384871,"maxlat":48.1984633,"maxlon":16.3384871},
      b.bounds
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

    done()
  })

  it('toTile()', function(done) {
    var b = bounds2.toTile()
    assert.deepEqual(
      {"minlat":45.1,"minlon":16,"maxlat":47,"maxlon":17},
      b.bounds
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

})
