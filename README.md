# bounding-box
Implements bounding boxes with usual functions like intersects. Can convert from/to Leaflet bounds and GeoJSON.

# Usage
## Browser
Include dist-file via script src:
```html
<script src='node_module/boundingbox/dist/boundingbox.js'>
```

## NodeJS
```js
var BoundingBox = require('boundingbox')
```

# API
## Constructor: new BoundingBox(data)
Creates a bounding box object.

Data can be one of the following:
* Min/max coordinates: { minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 }
* Lat/lon coordinates: { lat: 48.5, lon: 16.5 }
* A BoundingBox object to create a copy
* A L.latLngBounds object (using Leaflet)
* A L.latLng object (using Leaflet)
* A GeoJSON feature

Example:
```js
var bbox = new BoundingBox({ minlat: 48.123, minlon: 16.23, maxlat: 49.012, maxlon: 16.367 })
```

Find the full documentation in the [jsdoc](https://www.openstreetbrowser.org/docs/boundingbox/BoundingBox.html). You can re-generate the documentation with `npm run doc`.

# Tests
To run tests with nodejs, just call `./run_tests`

To run tests in a browser, call `./run_tests` first, which will create `all_tests.js` and then open the file `test.html` in your favorite browser.
