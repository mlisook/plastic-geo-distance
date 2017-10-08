# plastic-geo-distance
A collection of geographic distance related utility functions.

Provides the following methods:
* Determine the bounding rectangle given a point and distance.
* Distance between two points,
* Midpoint of an array of lat/lng
* Center of minimum distance for an array of lat/lng

## Types
* point:` {lat: number, lng: number}` in degrees
* bounds: `{minLat: number, maxLat: number, minLng: number, maxLng: number}` in degrees

## Constructor(units: string)
Create a new instance by providing the units you are using:
* "Miles"
* "Kilometers"

Only the first character is used.
```js
const plasticGeo = new PlasticGeoDistance('k');
```
## Methods
### bounds(distance, point)
Based on the technique by [Jan Matuschek](http://JanMatuschek.de/LatitudeLongitudeBoundingCoordinates).

Returns an object: 
```js
{minLat: number, maxLat: number, minLng: number, maxLng: number}
```

### distance(point1, point2)
Uses the Haversine formula - [credit](http://www.movable-type.co.uk/scripts/latlong.html)

Returns the distance between two points.

### isInBounds(point, bounds)
Determining if a point is within a bounding rectangle is slightly more complex than it appears initially - bounds may encompass 0 degrees or 180 degrees longitude.  This function handles this slight complexity.

Returns `true` if the point is withing the given bounding rectangle ( {minLat, maxLat, minLng, maxLng}), otherwise, `false`.

### computeMidpoint(points Array<{lat:,lng:}>) 
Returns a point that is the geographic center of an array of lat/lng objects (center of gravity).

### computeMinimumDistancePoint(points Array<{lat:,lng:}>)
Adapted from http://www.geomidpoint.com/calculation.html - B. Center of minimum distance

Returns an object: 
```js
{ point: { lat: number, lng: number}, avgDist: number, totalDist: number }
```

`point` is the lat/lng with the minimum total distance to each point in the `points` array, to within less than 0.1 miles (0.161 kilometers).

## Tests
Run test suite with `npm test`.

## Issues
Please submit issues through github at [mlisook plastic-geo-distance issues](https://github.com/mlisook/plastic-geo-distance/issues).

## Contributions
Contributions are welcome and appreciated.

## License

MIT


