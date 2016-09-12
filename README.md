# bounding-box
Implements bounding boxes with usual functions like intersects. Can convert from/to Leaflet bounds and GeoJSON.

# API
## Constructor: new BoundingBox(data)
Creates a bounding box object.

Data can be one of the following:
* Min/max coordinates: { minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 }
* Lat/lon coordinates: { lat: 48.5, lon: 16.5 }
* A BoundingBox object to create a copy
* A L.latLngBounds object (using Leaflet)
* A L.latLng object (using Leaflet)

Example:
```js
var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
```


## Method intersects(bounds)
Checks whether the bounding box 'bounds' intersects (shares any portion of space) the current object.

Example:
```js
var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
var bbox2 = new BoundingBox({ lat: 48.5, lon: 16.5 })
console.log(bbox.intersects(bbox2)) // true
```

## Method toBBoxString()
Returns a string with the bounding box coordinates in a 'sw_lon,sw_lat,ne_lon,ne_lat' format. Useful for sending requests to web services that return geo data.

```js
var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
console.log(bbox.toBBoxString()) // '16.23,48.123,16.367,49.012'
```

## Method diagonalLength()
Returns the length of the diagonal of the bounding box.

```js
var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
console.log(bbox.diagonalLength()) // 0.8994943023721748
```

## Method getCenter()
Returns the center point of the bounding box.

```js
var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
console.log(bbox.getCenter()) // { lat: 48.567499999999995, lon: 16.2985 }
```

## Method toLeaflet()
Returns the bounding box as L.latLngBounds object

## Method toTile()
(This function is still work in progress)

Fit the bounding box into tiles

# Tests
To run tests with nodejs, just call `./run_tests`

To run tests in a browser, call `./run_tests` first, which will create `all_tests.js` and then open the file `test.html` in your favorite browser.
